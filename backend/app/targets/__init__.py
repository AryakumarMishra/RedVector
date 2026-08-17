"""
Initialization of a TargetAdapter from API request config. This is the
one place that knows how to turn "target_type: http, config: {...}" into
an actual adapter instance — main.py and orchestrator.py never construct
adapters directly, so adding a third target type later only means
registering it here.
"""

from app.targets.base import TargetAdapter, TargetResponse
from app.targets.http_adapter import HTTPAdapter
from app.targets.litellm_adapter import LiteLLMAdapter

__all__ = ["TargetAdapter", "TargetResponse", "build_target_adapter"]

TARGET_TYPES = {"litellm", "http"}


def build_target_adapter(
    target_type: str,
    target_model: str | None = None,
    target_config: dict | None = None,
    system_prompt: str | None = None,
) -> TargetAdapter:
    """Build the right adapter for the requested target type.

    - target_type="litellm": target_model is a LiteLLM model string, e.g.
      "groq/openai/gpt-oss-20b". system_prompt (if given) is sent as the
      LLM's system message.
    - target_type="http": target_config must contain "url",
      "request_template", and "response_path" (see HTTPAdapter's docstring
      for the exact shape). system_prompt is ignored here — the target
      application owns its own system prompt, which is the whole point of
      testing it this way instead of a bare model.
    """
    if target_type == "litellm":
        if not target_model:
            raise ValueError("target_model is required when target_type is 'litellm'")
        return LiteLLMAdapter(model=target_model, system_prompt=system_prompt)

    if target_type == "http":
        config = target_config or {}
        missing = [k for k in ("url", "request_template", "response_path") if k not in config]
        if missing:
            raise ValueError(f"target_config missing required key(s): {', '.join(missing)}")
        return HTTPAdapter(
            url=config["url"],
            request_template=config["request_template"],
            response_path=config["response_path"],
            headers=config.get("headers"),
            timeout=config.get("timeout", 30),
        )

    raise ValueError(f"Unknown target_type: {target_type!r}. Must be one of {TARGET_TYPES}")