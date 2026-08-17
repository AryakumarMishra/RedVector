"""
FastAPI entrypoint.

Exposes:
  POST /campaigns          — run every registered attack against a target
                              (a model via LiteLLM, or a user's own HTTP
                              endpoint), return scored + evaluator-enriched
                              results
  GET  /campaigns          — list past campaigns with their scores (dashboard history)
  GET  /campaigns/{id}     — full result detail for one campaign (dashboard drill-down)
  GET  /health             — which attack categories are registered
"""

import json
import logging
from contextlib import asynccontextmanager

from app import config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import db, orchestrator
from app.attacks.jailbreak import JailbreakAttack
from app.attacks.prompt_injection import PromptInjectionAttack
from app.attacks.rag_poisoning import RagPoisoningAttack
from app.models import (
    CampaignRequest,
    CampaignResponse,
    CampaignSummary,
    CategoryScore,
    ResultOut,
)
from app.targets import build_target_adapter

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="RedVector", version="0.2.0", lifespan=lifespan)

# React dev server (Vite default) needs CORS to call this API directly.
# Wide open for local dev only — tighten this before deploying anywhere public.
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register attack modules here as they're built.
ATTACK_REGISTRY = {
    "prompt_injection": PromptInjectionAttack(),
    "jailbreak": JailbreakAttack(),
    "rag_poisoning": RagPoisoningAttack(),
}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "registered_attacks": list(ATTACK_REGISTRY.keys())}


def _row_to_result_out(row: dict) -> ResultOut:
    """Convert a raw SQLite results row (metadata stored as JSON text) into
    the same ResultOut shape POST /campaigns returns, so the frontend
    doesn't need two different response shapes for "fresh" vs. "historical"
    campaigns."""
    metadata = json.loads(row["metadata"]) if row.get("metadata") else {}
    return ResultOut(
        payload_id=row["payload_id"],
        category=row["category"],
        prompt=row["prompt"],
        response=row["response"],
        vulnerable=bool(row["vulnerable"]),
        confidence=row["confidence"],
        evidence=row["evidence"],
        relevance_score=metadata.get("relevance_score"),
        refusal_detected=metadata.get("refusal_detected"),
        judge_followed_injection=metadata.get("judge_followed_injection"),
        judge_reasoning=metadata.get("judge_reasoning"),
    )


def _score_rows_by_category(rows: list[dict]) -> list[CategoryScore]:
    by_category: dict[str, list[dict]] = {}
    for row in rows:
        by_category.setdefault(row["category"], []).append(row)

    scores = []
    for category, cat_rows in by_category.items():
        total = len(cat_rows)
        vulnerable = sum(1 for r in cat_rows if r["vulnerable"])
        scores.append(
            CategoryScore(
                category=category,
                total=total,
                vulnerable=vulnerable,
                vulnerability_score=round(vulnerable / total, 3) if total else 0.0,
            )
        )
    return scores


@app.post("/campaigns", response_model=CampaignResponse)
def create_campaign(req: CampaignRequest) -> CampaignResponse:
    categories = req.categories or list(ATTACK_REGISTRY.keys())
    attacks = []
    for category in categories:
        if category not in ATTACK_REGISTRY:
            raise HTTPException(400, f"Unknown attack category: {category}")
        attacks.append(ATTACK_REGISTRY[category])

    try:
        target = build_target_adapter(
            target_type=req.target_type,
            target_model=req.target_model,
            target_config=req.target_config,
            system_prompt=req.system_prompt,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    campaign_id, results = orchestrator.run_campaign(
        target=target,
        attacks=attacks,
        use_judge=req.use_judge,
    )
    scores = orchestrator.score_by_category(results)

    return CampaignResponse(
        campaign_id=campaign_id,
        target_label=target.label,
        results=[
            ResultOut(
                payload_id=r.payload_id,
                category=r.category,
                prompt=r.prompt,
                response=r.response,
                vulnerable=r.vulnerable,
                confidence=r.confidence,
                evidence=r.evidence,
                relevance_score=r.metadata.get("relevance_score"),
                refusal_detected=r.metadata.get("refusal_detected"),
                judge_followed_injection=r.metadata.get("judge_followed_injection"),
                judge_reasoning=r.metadata.get("judge_reasoning"),
            )
            for r in results
        ],
        scores=[CategoryScore(**s) for s in scores],
    )


@app.get("/campaigns", response_model=list[CampaignSummary])
def list_campaigns() -> list[CampaignSummary]:
    """Campaign history for the dashboard's landing page, most recent first."""
    summaries = []
    for campaign in db.list_campaigns():
        rows = db.get_campaign_results(campaign["id"])
        summaries.append(
            CampaignSummary(
                campaign_id=campaign["id"],
                target_label=campaign["target_model"],
                created_at=campaign["created_at"],
                scores=_score_rows_by_category(rows),
            )
        )
    return summaries


@app.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: str) -> CampaignResponse:
    """Full result detail for one campaign — dashboard drill-down view."""
    campaign = db.get_campaign(campaign_id)
    if campaign is None:
        raise HTTPException(404, f"Campaign not found: {campaign_id}")

    rows = db.get_campaign_results(campaign_id)
    return CampaignResponse(
        campaign_id=campaign_id,
        target_label=campaign["target_model"],
        results=[_row_to_result_out(row) for row in rows],
        scores=_score_rows_by_category(rows),
    )