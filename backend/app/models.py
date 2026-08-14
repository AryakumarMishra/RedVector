from typing import Any

from pydantic import BaseModel


class CampaignRequest(BaseModel):
    # "litellm" (default) — target_model is a LiteLLM model string, e.g.
    # "groq/llama-3.1-8b-instant". "http" — target_config describes a
    # user's own endpoint to test instead (see targets/http_adapter.py).
    target_type: str = "litellm"
    target_model: str | None = None  # required when target_type == "litellm"
    target_config: dict[str, Any] | None = None  # required when target_type == "http"

    categories: list[str] | None = None  # None = run every registered attack
    system_prompt: str | None = None  # optional system prompt; litellm targets only
    use_judge: bool | None = None  # None = use JUDGE_MODEL default from .env


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