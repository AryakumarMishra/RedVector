"""
The orchestrator ties everything together: for each registered attack,
generate its payloads, fire each one at the target through a TargetAdapter,
evaluate the response, and persist the result.
"""

import logging

from app import config, db, evaluator
from app.attacks.base import Attack, AttackResult
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