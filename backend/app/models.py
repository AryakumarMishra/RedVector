from typing import Any

from pydantic import BaseModel


class CampaignRequest(BaseModel):
    # "litellm" (default) — target_model is a LiteLLM model string, e.g.
    # user's own endpoint to test instead (see targets/http_adapter.py).
    target_type: str = "litellm"
    target_model: str | None = None  # required when target_type == "litellm"
    target_config: dict[str, Any] | None = None  # required when target_type == "http"

    categories: list[str] | None = None  # None = run every registered attack
    system_prompt: str | None = None  # optional system prompt; litellm targets only
    use_judge: bool | None = None  # None = use JUDGE_MODEL default from .env


class MultiTurnCampaignRequest(BaseModel):
    """Same shape as CampaignRequest, for the separate multi-turn endpoint
    (see attacks/multiturn_base.py's module docstring for why this is a
    separate request/endpoint rather than a field on CampaignRequest)."""

    target_type: str = "litellm"
    target_model: str | None = None
    target_config: dict[str, Any] | None = None

    categories: list[str] | None = None  # None = run every registered multi-turn attack
    system_prompt: str | None = None
    use_judge: bool | None = None


class ResultOut(BaseModel):
    payload_id: str
    category: str
    prompt: str
    response: str
    vulnerable: bool
    confidence: float
    evidence: str
    relevance_score: float | None = None
    refusal_detected: bool | None = None
    judge_followed_injection: bool | None = None
    judge_reasoning: str | None = None
    multiturn: bool = False
    turns: list[str] | None = None
    responses: list[str] | None = None


class CategoryScore(BaseModel):
    category: str
    total: int
    vulnerable: int
    vulnerability_score: float  # vulnerable / total, 0.0-1.0


class CampaignSummary(BaseModel):
    campaign_id: str
    target_label: str  # a model string (litellm target) or endpoint URL (http target)
    created_at: str
    scores: list[CategoryScore]


class CampaignResponse(BaseModel):
    campaign_id: str
    target_label: str  # a model string (litellm target) or endpoint URL (http target)
    results: list[ResultOut]
    scores: list[CategoryScore]


class RemediationRequest(BaseModel):
    """Takes the vulnerability data directly rather than a campaign/payload
    ID lookup — the frontend already has this data in hand from a
    displayed result row, so no extra round-trip to re-fetch it is needed."""

    category: str
    prompt: str
    response: str
    evidence: str


class RemediationResponse(BaseModel):
    suggestion: str | None
    rationale: str | None
    disclaimer: str
    error: str | None = None