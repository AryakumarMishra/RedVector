"""
The orchestrator ties everything together: for each registered attack,
generate its payloads, fire each one at the target through a TargetAdapter,
evaluate the response (both the attack's own verdict and the response-quality evaluator), 
and persist the result.
"""

import logging

from app import config, db, evaluator
from app.attacks.base import Attack, AttackResult, Payload
from app.attacks.multiturn_base import MultiTurnAttack, sequence_result_to_attack_result
from app.targets.base import TargetAdapter

logger = logging.getLogger("redvector.orchestrator")


def run_campaign(
    target: TargetAdapter,
    attacks: list[Attack],
    use_judge: bool | None = None,
) -> tuple[str, list[AttackResult]]:
    """Run every payload from every given attack against `target`.

    Returns the campaign_id and the flat list of AttackResults (already
    persisted to SQLite). Each result's metadata is enriched with
    relevance_score, refusal_detected, and judge_followed_injection from
    the Phase 3 evaluator.
    """
    if use_judge is None:
        use_judge = config.USE_JUDGE_DEFAULT

    campaign_id = db.create_campaign(target.label)
    all_results: list[AttackResult] = []

    for attack in attacks:
        payloads = attack.generate_payloads()
        logger.info("Running %d payloads for category=%s", len(payloads), attack.category)

        for payload in payloads:
            target_response = target.send(payload.prompt)
            if target_response.error:
                logger.warning(
                    "Target call failed for payload %s: %s", payload.id, target_response.error
                )
                response = f"[ERROR calling target: {target_response.error}]"
            else:
                response = target_response.text

            result = attack.evaluate(payload, response)

            metrics = evaluator.evaluate(payload, response, use_judge=use_judge)
            result.metadata.update(metrics.as_dict())

            db.save_result(campaign_id, result)
            all_results.append(result)

    return campaign_id, all_results


def run_multiturn_campaign(
    target: TargetAdapter,
    attacks: list[MultiTurnAttack],
    use_judge: bool | None = None,
) -> tuple[str, list[AttackResult]]:
    """Run every sequence from every given multi-turn attack against
    `target`, via target.send_conversation() rather than target.send().

    Returns the campaign_id and a flat list of AttackResults — each
    SequenceResult is converted via sequence_result_to_attack_result() so
    it persists through the exact same db.save_result() path as single-turn
    results, and so callers (main.py, the dashboard) don't need a second
    result shape to handle. The full turn-by-turn transcript survives in
    each result's metadata for anything that wants to render it specially.
    """
    if use_judge is None:
        use_judge = config.USE_JUDGE_DEFAULT

    campaign_id = db.create_campaign(target.label)
    all_results: list[AttackResult] = []

    for attack in attacks:
        sequences = attack.generate_sequences()
        logger.info(
            "Running %d sequences for category=%s", len(sequences), attack.category
        )

        for sequence in sequences:
            target_responses = target.send_conversation(sequence.turns)
            response_texts = [r.text for r in target_responses]

            if not response_texts or target_responses[-1].error:
                logger.warning(
                    "Sequence %s ended early or failed: %s",
                    sequence.id,
                    target_responses[-1].error if target_responses else "no responses",
                )

            seq_result = attack.evaluate(sequence, response_texts)
            result = sequence_result_to_attack_result(seq_result)

            # Evaluate the final exchange as a proxy for the whole sequence
            # — see docstring above for why this is turn-level, not
            # sequence-level, cost.
            if response_texts:
                final_payload = Payload(
                    id=sequence.id,
                    category=sequence.category,
                    prompt=sequence.turns[len(response_texts) - 1],
                    target_behavior=sequence.target_behavior,
                )
                metrics = evaluator.evaluate(final_payload, response_texts[-1], use_judge=use_judge)
                result.metadata.update(metrics.as_dict())

            db.save_result(campaign_id, result)
            all_results.append(result)

    return campaign_id, all_results


def score_by_category(results: list[AttackResult]) -> list[dict]:
    """Aggregate vulnerability rate per attack category."""
    by_category: dict[str, list[AttackResult]] = {}
    for r in results:
        by_category.setdefault(r.category, []).append(r)

    scores = []
    for category, cat_results in by_category.items():
        total = len(cat_results)
        vulnerable = sum(1 for r in cat_results if r.vulnerable)
        scores.append(
            {
                "category": category,
                "total": total,
                "vulnerable": vulnerable,
                "vulnerability_score": round(vulnerable / total, 3) if total else 0.0,
            }
        )
    return scores