from pydantic import BaseModel


class CampaignRequest(BaseModel):
    target_model: str  # any LiteLLM-compatible model string, e.g. "gpt-4o-mini"
    categories: list[str] | None = None  # None = run every registered attack
    system_prompt: str | None = None  # optional system prompt for the target


class ResultOut(BaseModel):
    payload_id: str
    category: str
    prompt: str
    response: str
    vulnerable: bool
    confidence: float
    evidence: str


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