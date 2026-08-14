"""
Base contract for what RedVector can point an attack at.

v1 only ever tested raw LLM APIs via LiteLLM. Phase 1 of v2 generalizes
"target" into a TargetAdapter interface, so the exact same attack modules
and orchestrator can run against either a bare model (LiteLLMAdapter) or a
user's own application endpoint (HTTPAdapter) — a RAG pipeline, an agent,
anything that accepts a prompt and returns text over HTTP.

This mirrors the Attack base class deliberately: same plugin shape, same
reason for existing (isolate the *what varies* — which target — from the
*what stays the same* — how a campaign runs).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class TargetResponse:
    """What comes back from sending a prompt to a target."""

    text: str
    raw_metadata: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


class TargetAdapter(ABC):
    """Base class every target type implements."""

    # A short label identifying this target for campaign storage/display —
    # e.g. the model string, or the endpoint URL. Only used for human-readable campaign history.
    label: str

    @abstractmethod
    def send(self, prompt: str) -> TargetResponse:
        """Send one prompt to the target and return its response.

        Must never raise for ordinary failure modes (network error, bad
        status code, malformed response) — callers rely on TargetResponse
        .error being set instead, so one bad call doesn't take down a
        whole campaign. Only raise for programmer errors (e.g. malformed
        adapter configuration caught at construction time, not at send time).
        """
        raise NotImplementedError