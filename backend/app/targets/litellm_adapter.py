"""
LiteLLMAdapter — targets a raw model via LiteLLM. This is exactly v1's
behavior (get_completion(model, prompt, system=...)), just wrapped behind
the TargetAdapter interface so the orchestrator no longer needs to know
whether it's talking to a bare model or a user's own application.
"""

import logging

from app.llm_client import get_completion, get_conversation_completion
from app.targets.base import TargetAdapter, TargetResponse

logger = logging.getLogger("redvector.targets.litellm")


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


    def send_conversation(self, turns: list[str]) -> list[TargetResponse]:
        """Replays `turns` as one real conversation: each attacker turn is
        appended as a "user" message, the target's actual reply is appended
        back as an "assistant" message before the next turn is sent — this
        is what lets a later turn's response genuinely depend on what the
        target said (or was told) earlier, which is the whole point of
        testing memory/context poisoning rather than just firing isolated
        prompts.
        """
        messages: list[dict] = []
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})

        responses: list[TargetResponse] = []
        for turn in turns:
            messages.append({"role": "user", "content": turn})
            try:
                text = get_conversation_completion(self.model, messages)
                responses.append(TargetResponse(text=text))
                messages.append({"role": "assistant", "content": text})
            except Exception as exc:  # noqa: BLE001 — one bad turn shouldn't kill the sequence
                logger.warning("LiteLLM conversation call failed for model %s: %s", self.model, exc)
                responses.append(TargetResponse(text="", error=str(exc)))
                break

        return responses