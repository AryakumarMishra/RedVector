"""
FastAPI entrypoint.

Exposes POST /campaigns, which runs every registered attack against a
target model and returns the scored + evaluator-enriched results.
"""

import logging

from app import config
from fastapi import FastAPI, HTTPException

from app import db, orchestrator
from app.attacks.jailbreak import JailbreakAttack
from app.attacks.prompt_injection import PromptInjectionAttack
from app.attacks.rag_poisoning import RagPoisoningAttack
from app.models import CampaignRequest, CampaignResponse, CategoryScore, ResultOut

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AgentProbe", version="0.1.0")

# Register attack modules here as they're built.
ATTACK_REGISTRY = {
    "prompt_injection": PromptInjectionAttack(),
    "jailbreak": JailbreakAttack(),
    "rag_poisoning": RagPoisoningAttack(),
}


@app.on_event("startup")
def on_startup() -> None:
    db.init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "registered_attacks": list(ATTACK_REGISTRY.keys())}


@app.post("/campaigns", response_model=CampaignResponse)
def create_campaign(req: CampaignRequest) -> CampaignResponse:
    categories = req.categories or list(ATTACK_REGISTRY.keys())
    attacks = []
    for category in categories:
        if category not in ATTACK_REGISTRY:
            raise HTTPException(400, f"Unknown attack category: {category}")
        attacks.append(ATTACK_REGISTRY[category])

    campaign_id, results = orchestrator.run_campaign(
        target_model=req.target_model,
        attacks=attacks,
        system_prompt=req.system_prompt,
        use_judge=req.use_judge,
    )
    scores = orchestrator.score_by_category(results)

    return CampaignResponse(
        campaign_id=campaign_id,
        target_model=req.target_model,
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