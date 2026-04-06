"""
app/routes/quiz.py
──────────────────
Thin Flask Blueprint for /api/quiz endpoints.

Routes only: validate input → call service/repository → return JSON.
No business logic here.
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.db import get_db
from app.models.quiz_repository import (
    RepositoryError,
    delete_quiz,
    get_quiz,
    list_quizzes,
    save_quiz,
)
from app.schemas.quiz import GenerateRequest
from app.services.ai_generator import GenerationError, generate_quiz
from app.services.scraper import ScraperError, fetch_article

logger = logging.getLogger(__name__)
bp = Blueprint("quiz", __name__, url_prefix="/api/quiz")


# ── POST /api/quiz/generate ───────────────────────────────────────────────────

@bp.post("/generate")
def generate():
    """
    Body: { "url": "https://en.wikipedia.org/wiki/..." }
    Scrapes the article, generates quiz via AI, persists, returns quiz.
    """
    body = request.get_json(silent=True) or {}

    # 1. Validate at boundary
    try:
        payload = GenerateRequest(**body)
    except ValidationError as exc:
        return jsonify({"ok": False, "error": "Invalid request", "detail": exc.errors()}), 422

    # 2. Scrape
    try:
        topic, article_text = fetch_article(payload.url)
    except ScraperError as exc:
        logger.warning("Scrape failed for %s: %s", payload.url, exc)
        return jsonify({"ok": False, "error": str(exc)}), 422

    # 3. AI generation
    try:
        generated = generate_quiz(article_text)
    except GenerationError as exc:
        logger.error("AI generation failed: %s", exc)
        print(exc)
        return jsonify({"ok": False, "error": str(exc)}), 502

    # 4. Persist
    try:
        quiz = save_quiz(get_db(), payload.url, topic, generated)
    except RepositoryError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500

    return jsonify({"ok": True, "data": quiz}), 201


# ── GET /api/quiz/history ─────────────────────────────────────────────────────

@bp.get("/history")
def history():
    """
    Query params: page (int, default 1), per_page (int, default 20, max 50)
    """
    try:
        page     = max(1, int(request.args.get("page", 1)))
        per_page = min(50, max(1, int(request.args.get("per_page", 20))))
    except ValueError:
        return jsonify({"ok": False, "error": "page and per_page must be integers"}), 422

    try:
        quizzes, total = list_quizzes(get_db(), page=page, per_page=per_page)
    except RepositoryError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500

    return jsonify({
        "ok": True,
        "data": quizzes,
        "total": total,
        "page": page,
        "per_page": per_page,
    })


# ── GET /api/quiz/<id> ────────────────────────────────────────────────────────

@bp.get("/<quiz_id>")
def get_one(quiz_id: str):
    """Return a single quiz with all questions."""
    try:
        quiz = get_quiz(get_db(), quiz_id)
    except RepositoryError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500

    if quiz is None:
        return jsonify({"ok": False, "error": "Quiz not found"}), 404

    return jsonify({"ok": True, "data": quiz})


# ── DELETE /api/quiz/<id> ─────────────────────────────────────────────────────

@bp.delete("/<quiz_id>")
def remove(quiz_id: str):
    """Delete a quiz from history."""
    try:
        deleted = delete_quiz(get_db(), quiz_id)
    except RepositoryError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500

    if not deleted:
        return jsonify({"ok": False, "error": "Quiz not found"}), 404

    return jsonify({"ok": True, "message": "Quiz deleted"}), 200
