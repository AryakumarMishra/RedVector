"""
HTTPAdapter — targets a user's own application (a RAG pipeline, an agent,
anything that takes a prompt and returns text over HTTP) instead of a bare
LLM. This is the core Phase 1 capability: RedVector can now test real
system prompts, real guardrails, real retrieval wrapping — not just the
base model underneath them.

Configuration is deliberately minimal — a URL, a request template with a
{prompt} placeholder, and a dotted path to the response text — so it works
against a wide range of existing endpoints without requiring the user to
change their app to fit RedVector, only to describe its shape.

Example config:
    {
        "url": "http://localhost:8001/chat",
        "request_template": {"message": "{prompt}"},
        "response_path": "data.reply",
        "headers": {"Authorization": "Bearer ..."}   # optional
    }

Phase 3 adds an optional {history} placeholder for multi-turn testing (see
send_conversation()) — include it in request_template anywhere you'd want
prior turns injected, e.g. {"message": "{history}{prompt}"}.
"""

import logging
from typing import Any

import requests

from app.targets.base import TargetAdapter, TargetResponse

logger = logging.getLogger("agentprobe.targets.http")

DEFAULT_TIMEOUT_SECONDS = 30


def _substitute_placeholders(template: Any, values: dict[str, str]) -> Any:
    """Recursively walk a request template, replacing every occurrence of
    each "{key}" placeholder in `values` with its string value. Works
    through nested dicts and lists so templates like
    {"messages": [{"role": "user", "content": "{prompt}"}]} work too.
    """
    if isinstance(template, str):
        result = template
        for key, value in values.items():
            result = result.replace("{" + key + "}", value)
        return result
    if isinstance(template, dict):
        return {key: _substitute_placeholders(value, values) for key, value in template.items()}
    if isinstance(template, list):
        return [_substitute_placeholders(item, values) for item in template]
    return template


def _substitute_prompt(template: Any, prompt: str) -> Any:
    """Single-turn convenience wrapper — unchanged behavior from Phase 1,
    still used by send(). {history} is simply left untouched if a
    single-turn template happens to contain it.
    """
    return _substitute_placeholders(template, {"prompt": prompt})


def _extract_path(data: Any, path: str) -> Any:
    """Pull a value out of a nested response using a dotted path, e.g.
    "data.reply" or "choices.0.message.content" (numeric segments index
    into lists). Raises KeyError/IndexError/TypeError on a bad path —
    callers are expected to catch and turn that into a TargetResponse.error.
    """
    current = data
    for segment in path.split("."):
        if isinstance(current, list):
            current = current[int(segment)]
        else:
            current = current[segment]
    return current


class HTTPAdapter(TargetAdapter):
    def __init__(
        self,
        url: str,
        request_template: dict,
        response_path: str,
        headers: dict | None = None,
        timeout: int = DEFAULT_TIMEOUT_SECONDS,
    ):
        self.url = url
        self.request_template = request_template
        self.response_path = response_path
        self.headers = headers or {}
        self.timeout = timeout
        self.label = url

    def _post(self, body: dict) -> TargetResponse:
        """Shared request/response handling for both send() and
        send_conversation() — one place that knows how to talk to the
        target and parse its reply.
        """
        try:
            resp = requests.post(
                self.url, json=body, headers=self.headers, timeout=self.timeout
            )
        except requests.RequestException as exc:
            logger.warning("HTTP request to %s failed: %s", self.url, exc)
            return TargetResponse(text="", error=f"Request failed: {exc}")

        if resp.status_code >= 400:
            logger.warning("Target %s returned HTTP %d", self.url, resp.status_code)
            return TargetResponse(
                text="",
                error=f"Target returned HTTP {resp.status_code}: {resp.text[:200]}",
            )

        try:
            response_json = resp.json()
        except ValueError:
            return TargetResponse(
                text="", error=f"Target response was not valid JSON: {resp.text[:200]}"
            )

        try:
            extracted = _extract_path(response_json, self.response_path)
        except (KeyError, IndexError, TypeError) as exc:
            return TargetResponse(
                text="",
                error=(
                    f"response_path '{self.response_path}' did not match the "
                    f"target's response shape: {exc}"
                ),
            )

        return TargetResponse(text=str(extracted), raw_metadata={"raw_response": response_json})


    def send(self, prompt: str) -> TargetResponse:
        body = _substitute_prompt(self.request_template, prompt)
        return self._post(body)


    def send_conversation(self, turns: list[str]) -> list[TargetResponse]:
        """Replays `turns` against the endpoint, injecting a flattened
        text transcript of prior turns into any {history} placeholder in
        request_template. If request_template has no {history} placeholder
        at all, this degrades honestly to independent send() calls with no
        injected memory — most real chat endpoints maintain their own
        server-side session state via cookies/session IDs anyway, in which
        case that's the correct behavior; endpoints that are genuinely
        stateless per-call need {history} configured to get meaningful
        multi-turn testing at all.
        """
        responses: list[TargetResponse] = []
        history_transcript = ""

        for turn in turns:
            body = _substitute_placeholders(
                self.request_template, {"prompt": turn, "history": history_transcript}
            )
            response = self._post(body)
            responses.append(response)

            if response.error:
                break

            history_transcript += f"User: {turn}\nAssistant: {response.text}\n\n"

        return responses