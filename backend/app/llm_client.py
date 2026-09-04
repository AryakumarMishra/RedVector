"""
Thin wrapper around LiteLLM so the rest of RedVector depends on one function, not the litellm SDK directly.
"""

from app import config
import litellm


def get_conversation_completion(model: str, messages: list[dict]) -> str:
    """Send a full message list (system/user/assistant roles) to `model`
    via LiteLLM and return the text of the next reply. This is the
    lower-level function get_completion() builds on — use this one
    directly when you need to maintain real conversation state across
    multiple turns (see targets/litellm_adapter.py's send_conversation()),
    since re-deriving a message list from scratch each call would lose the
    target's own prior replies, which is exactly the state multi-turn
    attacks need to test against.
    """
    response = litellm.completion(model=model, messages=messages)
    return response.choices[0].message.content or ""


def get_completion(model: str, prompt: str, system: str | None = None) -> str:
    """Send a single-turn prompt to `model` via LiteLLM and return the text.

    `model` follows LiteLLM's provider-prefixed naming, e.g.:
      - "gpt-4o-mini"
      - "claude-sonnet-4-6"
      - "ollama/llama3"
    """
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    return get_conversation_completion(model, messages)