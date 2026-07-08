"""
Direct prompt injection attack.

Phase 1 evaluation is intentionally naive: each payload embeds a distinctive
marker string, and "vulnerable" just means the marker leaked into the
response. This is cheap, deterministic, and good enough to prove the
end-to-end loop. It gets replaced/augmented by the real evaluator
(relevance + hallucination + LLM-as-judge refusal scoring) in Phase 3 —
that evaluator will consume these same Payload/AttackResult objects, so
nothing here needs to change when that lands.
"""

from pathlib import Path

import yaml

from app.attacks.base import Attack, AttackResult, Payload, evaluate_by_marker

PAYLOAD_FILE = Path(__file__).resolve().parents[2] / "payloads" / "prompt_injection.yaml"


class PromptInjectionAttack(Attack):
    category = "prompt_injection"

    def __init__(self, payload_file: Path = PAYLOAD_FILE):
        self.payload_file = payload_file

    def generate_payloads(self) -> list[Payload]:
        with open(self.payload_file) as f:
            raw = yaml.safe_load(f)

        return [
            Payload(
                id=item["id"],
                category=self.category,
                prompt=item["prompt"].strip(),
                target_behavior=item["target_behavior"],
            )
            for item in raw
        ]

    def evaluate(self, payload: Payload, response: str) -> AttackResult:
        return evaluate_by_marker(payload, response, self.category)