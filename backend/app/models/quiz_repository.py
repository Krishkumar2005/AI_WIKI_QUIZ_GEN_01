"""
app/models/quiz_repository.py
──────────────────────────────
Responsibility: all Supabase DB interactions for quizzes.

Uses supabase-py v2 client. All DB calls are isolated here —
routes and services never touch the DB directly.

Raises RepositoryError on failure so callers don't leak Supabase internals.
"""
from __future__ import annotations

import json
import logging

from supabase import Client

from app.services.ai_generator import GeneratedQuiz

logger = logging.getLogger(__name__)


class RepositoryError(Exception):
    """Raised on unrecoverable database errors."""


# ── Write ─────────────────────────────────────────────────────────────────────

def save_quiz(db: Client, url: str, topic: str, quiz: GeneratedQuiz) -> dict:
    """
    Persist a quiz and its questions. Returns the full quiz dict.

    Uses two sequential inserts (quiz → questions) inside the same
    Supabase project — no distributed transaction needed at this scale.
    """
    try:
        # 1. Insert quiz row
        quiz_res = (
            db.table("quizzes")
            .insert({"url": url, "topic": topic, "summary": quiz.summary})
            .execute()
        )
        quiz_row = quiz_res.data[0]
        quiz_id: str = quiz_row["id"]

        # 2. Insert all questions in a single bulk call
        question_rows = [
            {
                "quiz_id": quiz_id,
                "text": q.text,
                "options": json.dumps(q.options),   # store as JSON string → Supabase jsonb
                "correct_answer": q.correct_answer,
                "position": i,
            }
            for i, q in enumerate(quiz.questions)
        ]
        q_res = db.table("questions").insert(question_rows).execute()

        logger.info("Saved quiz id=%s topic=%s", quiz_id, topic)

        return _build_quiz_dict(quiz_row, q_res.data)

    except Exception as exc:
        logger.error("DB error saving quiz: %s", exc)
        raise RepositoryError("Failed to save quiz to database.") from exc


# ── Read ──────────────────────────────────────────────────────────────────────

def get_quiz(db: Client, quiz_id: str) -> dict | None:
    """Return a single quiz with questions, or None if not found."""
    try:
        quiz_res = (
            db.table("quizzes")
            .select("*")
            .eq("id", quiz_id)
            .execute()
        )
        if not quiz_res.data:
            return None

        quiz_row = quiz_res.data[0]

        q_res = (
            db.table("questions")
            .select("*")
            .eq("quiz_id", quiz_id)
            .order("position")
            .execute()
        )
        return _build_quiz_dict(quiz_row, q_res.data)

    except Exception as exc:
        logger.error("DB error fetching quiz %s: %s", quiz_id, exc)
        raise RepositoryError("Failed to retrieve quiz.") from exc


def list_quizzes(db: Client, page: int = 1, per_page: int = 20) -> tuple[list[dict], int]:
    """
    Return (summaries, total_count) — paginated, newest first.
    Summaries do not include question details.
    """
    if page < 1:
        page = 1
    offset = (page - 1) * per_page

    try:
        # Count
        count_res = (
            db.table("quizzes")
            .select("id", count="exact")
            .execute()
        )
        total: int = count_res.count or 0

        # Fetch quiz rows
        quiz_res = (
            db.table("quizzes")
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + per_page - 1)
            .execute()
        )

        # Fetch question counts for those quiz IDs
        quiz_ids = [r["id"] for r in quiz_res.data]
        summaries: list[dict] = []

        if quiz_ids:
            q_res = (
                db.table("questions")
                .select("quiz_id")
                .in_("quiz_id", quiz_ids)
                .execute()
            )
            counts: dict[str, int] = {}
            for row in q_res.data:
                counts[row["quiz_id"]] = counts.get(row["quiz_id"], 0) + 1

            for row in quiz_res.data:
                summaries.append({
                    "id": row["id"],
                    "url": row["url"],
                    "topic": row["topic"],
                    "summary": row["summary"],
                    "question_count": counts.get(row["id"], 0),
                    "created_at": row["created_at"],
                })

        return summaries, total

    except Exception as exc:
        logger.error("DB error listing quizzes: %s", exc)
        raise RepositoryError("Failed to list quizzes.") from exc


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_quiz(db: Client, quiz_id: str) -> bool:
    """
    Delete a quiz (cascade deletes questions via FK).
    Returns True if deleted, False if not found.
    """
    try:
        check = (
            db.table("quizzes")
            .select("id")
            .eq("id", quiz_id)
            .execute()
        )
        if not check.data:
            return False

        db.table("quizzes").delete().eq("id", quiz_id).execute()
        logger.info("Deleted quiz id=%s", quiz_id)
        return True

    except Exception as exc:
        logger.error("DB error deleting quiz %s: %s", quiz_id, exc)
        raise RepositoryError("Failed to delete quiz.") from exc


# ── Private helpers ───────────────────────────────────────────────────────────

def _parse_options(raw) -> list[str]:
    """Options stored as jsonb — handle both str and list from Supabase."""
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        return json.loads(raw)
    return []


def _build_quiz_dict(quiz_row: dict, question_rows: list[dict]) -> dict:
    sorted_qs = sorted(question_rows, key=lambda q: q.get("position", 0))
    return {
        "id": quiz_row["id"],
        "url": quiz_row["url"],
        "topic": quiz_row["topic"],
        "summary": quiz_row["summary"],
        "created_at": quiz_row["created_at"],
        "questions": [
            {
                "id": q["id"],
                "text": q["text"],
                "options": _parse_options(q["options"]),
                "correct_answer": q["correct_answer"],
                "position": q["position"],
            }
            for q in sorted_qs
        ],
    }
