from pydantic import BaseModel


class CampaignRequest(BaseModel):
    target_model: str  # any LiteLLM-compatible model string, e.g. "groq/llama-3.1-8b-instant"
    categories: list[str] | None = None  # None = run every registered attack
    system_prompt: str | None = None  # optional system prompt for the target
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


class CampaignResponse(BaseModel):
    campaign_id: str
    target_model: str
    results: list[ResultOut]
    scores: list[CategoryScore]