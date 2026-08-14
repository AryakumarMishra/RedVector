
"""
LiteLLMAdapter — targets a raw model via LiteLLM. This is exactly v1's
behavior (get_completion(model, prompt, system=...)), just wrapped behind
the TargetAdapter interface so the orchestrator no longer needs to know
whether it's talking to a bare model or a user's own application.
"""

import logging

from app.llm_client import get_completion
from app.targets.base import TargetAdapter, TargetResponse

logger = logging.getLogger("agentprobe.targets.litellm")


class LiteLLMAdapter(TargetAdapter):
    def __init__(self, model: str, system_prompt: str | None = None):
        self.model = model
        self.system_prompt = system_prompt
        self.label = model

    def send(self, prompt: str) -> TargetResponse:
        try:
            text = get_completion(self.model, prompt, system=self.system_prompt)
            return TargetResponse(text=text)
        except Exception as exc:  # noqa: BLE001 — one bad call shouldn't kill a campaign
            logger.warning("LiteLLM call failed for model %s: %s", self.model, exc)
            return TargetResponse(text="", error=str(exc))