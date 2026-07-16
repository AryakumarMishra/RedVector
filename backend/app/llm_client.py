"""
Thin wrapper around LiteLLM so the rest of RedVector depends on one
function, not the litellm SDK directly. If you swap in a custom HTTP
client later, this is the only file that changes.
"""

from app import config
import litellm


def get_completion(model: str, prompt: str, system: str | None = None) -> str:
    """Send a single-turn prompt to `model` via LiteLLM and return the text.

    `model` follows LiteLLM's provider-prefixed naming, e.g.:
      - "gpt-4o-mini"
      - "claude-sonnet-4-6"
      - "ollama/llama3"
    Set the relevant provider API key as an env var (OPENAI_API_KEY, etc).
    """
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = litellm.completion(model=model, messages=messages)
    return response.choices[0].message.content or ""