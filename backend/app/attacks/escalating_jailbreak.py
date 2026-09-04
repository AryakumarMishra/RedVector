"""
Escalating jailbreak attack — multi-turn version of the single-turn
jailbreak module. Real jailbreaks often don't ask for the risky thing cold;
they build innocuous rapport or framing across several turns first, then
use that established context to make the final ask land more easily than
it would in isolation. This tests whether that escalation pattern actually
works against a given target, which a single-turn test structurally can't
measure at all.
"""

from pathlib import Path

import yaml

from app.attacks.multiturn_base import (
    ConversationSequence,
    MultiTurnAttack,
    SequenceResult,
    evaluate_sequence_by_final_marker,
)

PAYLOAD_FILE = Path(__file__).resolve().parents[2] / "payloads" / "escalating_jailbreak.yaml"


class EscalatingJailbreakAttack(MultiTurnAttack):
    category = "escalating_jailbreak"

    def __init__(self, payload_file: Path = PAYLOAD_FILE):
        self.payload_file = payload_file

    def generate_sequences(self) -> list[ConversationSequence]:
        with open(self.payload_file) as f:
            raw = yaml.safe_load(f)

        return [
            ConversationSequence(
                id=item["id"],
                category=self.category,
                turns=[turn.strip() for turn in item["turns"]],
                target_behavior=item["target_behavior"],
            )
            for item in raw
        ]

    def evaluate(self, sequence: ConversationSequence, responses: list[str]) -> SequenceResult:
        return evaluate_sequence_by_final_marker(sequence, responses, self.category)