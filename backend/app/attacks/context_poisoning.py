"""
Context/memory poisoning attack — previews OWASP ASI06 (Memory & Context
Poisoning), the full version of which belongs to Phase 4's agentic attack
modules once tool-call/memory introspection is available. This is the
simplest testable version with what Phase 3 gives us: plant a false "fact"
under an innocuous frame, change topics, then probe later whether the
target still treats the planted fact as true — proving state actually
carried across turns rather than each turn being handled independently.
"""

from pathlib import Path

import yaml

from app.attacks.multiturn_base import (
    ConversationSequence,
    MultiTurnAttack,
    SequenceResult,
    evaluate_sequence_by_final_marker,
)

PAYLOAD_FILE = Path(__file__).resolve().parents[2] / "payloads" / "context_poisoning.yaml"


class ContextPoisoningAttack(MultiTurnAttack):
    category = "context_poisoning"

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