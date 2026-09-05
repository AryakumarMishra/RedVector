"""
Remediation suggestions.

This module does exactly one thing: given a confirmed vulnerability
(category, the attack prompt, the target's response, and the evidence that
flagged it), ask an LLM to draft a suggested system-prompt hardening
addition. It NEVER applies anything automatically, and every response
carries an explicit advisory disclaimer as a real field, not just a
comment in this docstring — so a caller can't accidentally drop the
disclaimer while wiring up a UI around this.

Why suggest-only, always: the standard industry posture for security
tooling (Snyk, Semgrep, Dependabot) is propose-a-diff-a-human-reviews,
never silently patch. That's not a compromise here — it's the only
defensible posture. A wrong auto-applied fix to a system prompt could
break legitimate functionality or, worse, give false confidence that a
vulnerability is closed when it isn't. The verification loop this is
designed around is manual by design: a human reads the suggestion, adds
it to their own system prompt themselves, and re-runs the same RedVector
campaign to see whether the vulnerability score actually changed —
empirical evidence of impact, not a claimed accuracy number.
"""

import json
import logging
from dataclasses import dataclass

from app import config
from app.llm_client import get_completion

logger = logging.getLogger("redvector.remediation")

DISCLAIMER = (
    "This is an automated suggestion, not a guaranteed fix. It has not been "
    "tested against your actual system. Review it, adapt it to your own "
    "system prompt, and re-run this campaign afterward to check whether the "
    "vulnerability score actually changed before relying on it."
)

REMEDIATION_PROMPT_TEMPLATE = """You are a security engineer helping harden an LLM application's \
system prompt after an automated red-teaming tool found a vulnerability. You will be shown the \
vulnerability category, the attack prompt that was sent, the target's response, and the evidence \
that flagged it as vulnerable. Suggest a SHORT addition to a system prompt that would help resist \
this specific type of attack. Do not suggest a full rewrite — just the addition.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{{"suggestion": "the exact text to add to a system prompt", "rationale": "one or two sentences on why this helps"}}

VULNERABILITY CATEGORY: {category}

ATTACK PROMPT:
{prompt}

TARGET'S RESPONSE:
{response}

EVIDENCE THIS WAS FLAGGED AS VULNERABLE:
{evidence}
"""


@dataclass
class RemediationSuggestion:
    suggestion: str | None
    rationale: str | None
    disclaimer: str
    error: str | None = None

    @property
    def succeeded(self) -> bool:
        return self.error is None and self.suggestion is not None


def suggest_remediation(
    category: str, prompt: str, response: str, evidence: str
) -> RemediationSuggestion:
    """Draft a suggested system-prompt hardening addition for one
    vulnerability. Never raises — a failed suggestion is reported via
    RemediationSuggestion.error, same pattern as TargetResponse.error,
    so a flaky remediation call can't take down anything calling this.
    """
    remediation_prompt = REMEDIATION_PROMPT_TEMPLATE.format(
        category=category, prompt=prompt, response=response, evidence=evidence
    )

    try:
        raw = get_completion(config.REMEDIATION_MODEL, remediation_prompt)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            cleaned = cleaned.removeprefix("json").strip()
        parsed = json.loads(cleaned)

        return RemediationSuggestion(
            suggestion=parsed.get("suggestion"),
            rationale=parsed.get("rationale"),
            disclaimer=DISCLAIMER,
        )
    except Exception as exc:
        logger.warning("Remediation suggestion failed: %s", exc)
        return RemediationSuggestion(
            suggestion=None,
            rationale=None,
            disclaimer=DISCLAIMER,
            error=f"Could not generate a suggestion: {exc}",
        )