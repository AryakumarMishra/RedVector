"""
HTTPAdapter — targets a user's own application (a RAG pipeline, an agent,
anything that takes a prompt and returns text over HTTP) instead of a bare
LLM, i.e., a real product is become testable with RedVector

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
"""

import logging
from typing import Any

import requests

from app.targets.base import TargetAdapter, TargetResponse

logger = logging.getLogger("agentprobe.targets.http")

DEFAULT_TIMEOUT_SECONDS = 30


def _substitute_prompt(template: Any, prompt: str) -> Any:
    """Recursively walk a request template, replacing every occurrence of
    the literal string "{prompt}" with the actual payload prompt. Works
    through nested dicts and lists so templates like
    {"messages": [{"role": "user", "content": "{prompt}"}]} work too.
    """
    if isinstance(template, str):
        return template.replace("{prompt}", prompt)
    if isinstance(template, dict):
        return {key: _substitute_prompt(value, prompt) for key, value in template.items()}
    if isinstance(template, list):
        return [_substitute_prompt(item, prompt) for item in template]
    return template


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

    def send(self, prompt: str) -> TargetResponse:
        body = _substitute_prompt(self.request_template, prompt)

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