"""
Storage layer. Plain sqlite3 on purpose — an ORM adds nothing at this
scale and would just be more code to read through. If the schema grows
past a couple of tables, swap this for SQLAlchemy without touching
callers (they only see the functions below).
"""

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.attacks.base import AttackResult

DB_PATH = Path(__file__).resolve().parent.parent / "redvector.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    target_model TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    payload_id TEXT NOT NULL,
    category TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    vulnerable INTEGER NOT NULL,
    confidence REAL NOT NULL,
    evidence TEXT NOT NULL,
    metadata TEXT NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
"""


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def create_campaign(target_model: str) -> str:
    campaign_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO campaigns (id, target_model, created_at) VALUES (?, ?, ?)",
            (campaign_id, target_model, datetime.now(timezone.utc).isoformat()),
        )
    return campaign_id


def save_result(campaign_id: str, result: AttackResult) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO results
                (id, campaign_id, payload_id, category, prompt, response,
                 vulnerable, confidence, evidence, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                campaign_id,
                result.payload_id,
                result.category,
                result.prompt,
                result.response,
                int(result.vulnerable),
                result.confidence,
                result.evidence,
                json.dumps(result.metadata),
            ),
        )


def get_campaign_results(campaign_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM results WHERE campaign_id = ?", (campaign_id,)
        ).fetchall()
    return [dict(row) for row in rows]


def get_campaign(campaign_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM campaigns WHERE id = ?", (campaign_id,)
        ).fetchone()
    return dict(row) if row else None


def list_campaigns() -> list[dict]:
    """Campaign history for the dashboard's landing view, most recent first."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM campaigns ORDER BY created_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]