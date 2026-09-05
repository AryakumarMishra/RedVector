"""
Agent goal hijack attack (OWASP ASI01: Agent Goal / Instruction Manipulation).

Structurally identical to prompt injection's evaluation (marker matching),
but a distinct category deliberately — the framing targets an agent's
persistent TASK/GOAL state specifically ("cancel your current task," "your
new top priority is...") rather than a one-off instruction override. This
distinction matters more once an agent has a task spanning multiple tool
calls or turns: hijacking "what am I trying to accomplish" is a different
(and often higher-impact) failure than hijacking a single response.

Reuses evaluate_by_marker() since the success condition is the same shape
as prompt injection: did the attacker's exact marker leak into the
response.
"""

from pathlib import Path

import yaml

from app.attacks.base import Attack, AttackResult, Payload, evaluate_by_marker

PAYLOAD_FILE = Path(__file__).resolve().parents[2] / "payloads" / "agent_goal_hijack.yaml"


class AgentGoalHijackAttack(Attack):
    category = "agent_goal_hijack"

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

    def evaluate(
        self, payload: Payload, response: str, raw_metadata: dict | None = None
    ) -> AttackResult:
        return evaluate_by_marker(payload, response, self.category)