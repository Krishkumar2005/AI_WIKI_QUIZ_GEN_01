"""
tests/test_quiz_routes.py
─────────────────────────
Automated tests proving system behaviour is correct after changes.

Mocks Supabase client and external services — runs fully offline.
"""
from __future__ import annotations

import sys
from unittest.mock import MagicMock, patch

import pytest

# Patch supabase before importing the app
sys.modules.setdefault("supabase", MagicMock())


@pytest.fixture()
def app():
    with (
        patch("app.config.Config.GEMINI_API_KEY", "test-key"),
        patch("app.config.Config.SUPABASE_URL", "https://test.supabase.co"),
        patch("app.config.Config.SUPABASE_SERVICE_ROLE_KEY", "test-role-key"),
        patch("app.config.Config.validate"),
        patch("app.db.init_db"),
        patch("app.db.get_db", return_value=MagicMock()),
    ):
        from app import create_app
        application = create_app()
        application.config["TESTING"] = True
        yield application


@pytest.fixture()
def client(app):
    return app.test_client()


# ── /api/health ───────────────────────────────────────────────────────────────

def test_health_returns_json(client):
    resp = client.get("/api/health")
    assert resp.status_code in (200, 503)
    data = resp.get_json()
    assert "status" in data
    assert "database" in data


# ── POST /api/quiz/generate — input validation ────────────────────────────────

def test_generate_rejects_missing_url(client):
    resp = client.post("/api/quiz/generate", json={})
    assert resp.status_code == 422
    assert resp.get_json()["ok"] is False


def test_generate_rejects_non_wikipedia_url(client):
    resp = client.post("/api/quiz/generate", json={"url": "https://example.com/page"})
    assert resp.status_code == 422
    assert resp.get_json()["ok"] is False


def test_generate_rejects_non_english_wikipedia(client):
    resp = client.post(
        "/api/quiz/generate",
        json={"url": "https://fr.wikipedia.org/wiki/Paris"},
    )
    assert resp.status_code == 422


def test_generate_rejects_empty_body(client):
    resp = client.post("/api/quiz/generate", content_type="application/json", data="")
    assert resp.status_code == 422


# ── GET /api/quiz/history ─────────────────────────────────────────────────────

def test_history_bad_page_param(client):
    with patch("app.routes.quiz.list_quizzes", return_value=([], 0)):
        resp = client.get("/api/quiz/history?page=abc")
    assert resp.status_code == 422


def test_history_defaults(client):
    with patch("app.routes.quiz.list_quizzes", return_value=([], 0)):
        resp = client.get("/api/quiz/history")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["ok"] is True
    assert data["total"] == 0


def test_history_per_page_capped_at_50(client):
    captured = {}
    def fake_list(db, page, per_page):
        captured["per_page"] = per_page
        return [], 0
    with patch("app.routes.quiz.list_quizzes", side_effect=fake_list):
        client.get("/api/quiz/history?per_page=999")
    assert captured["per_page"] <= 50


# ── GET /api/quiz/<id> ────────────────────────────────────────────────────────

def test_get_quiz_not_found(client):
    with patch("app.routes.quiz.get_quiz", return_value=None):
        resp = client.get("/api/quiz/nonexistent-id")
    assert resp.status_code == 404
    assert resp.get_json()["ok"] is False


def test_get_quiz_found(client):
    fake_quiz = {
        "id": "abc123",
        "url": "https://en.wikipedia.org/wiki/Python",
        "topic": "Python",
        "summary": "A programming language.",
        "created_at": "2024-01-01T00:00:00+00:00",
        "questions": [],
    }
    with patch("app.routes.quiz.get_quiz", return_value=fake_quiz):
        resp = client.get("/api/quiz/abc123")
    assert resp.status_code == 200
    assert resp.get_json()["data"]["id"] == "abc123"


# ── DELETE /api/quiz/<id> ─────────────────────────────────────────────────────

def test_delete_quiz_not_found(client):
    with patch("app.routes.quiz.delete_quiz", return_value=False):
        resp = client.delete("/api/quiz/ghost")
    assert resp.status_code == 404


def test_delete_quiz_success(client):
    with patch("app.routes.quiz.delete_quiz", return_value=True):
        resp = client.delete("/api/quiz/abc123")
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True


# ── Schema validation ─────────────────────────────────────────────────────────

def test_generate_request_valid():
    from app.schemas.quiz import GenerateRequest
    req = GenerateRequest(url="https://en.wikipedia.org/wiki/Python_(programming_language)")
    assert "wikipedia" in req.url


def test_generate_request_invalid():
    from app.schemas.quiz import GenerateRequest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        GenerateRequest(url="https://google.com")


def test_question_out_correct_answer_not_in_options():
    from app.schemas.quiz import QuestionOut
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        QuestionOut(
            id="1", text="Q?",
            options=["A", "B", "C", "D"],
            correct_answer="E",  # not in options
            position=0,
        )


# ── AI generator unit tests ───────────────────────────────────────────────────

def test_parse_valid_json():
    from app.services.ai_generator import _parse_and_validate
    payload = {
        "summary": "A test summary about stuff.",
        "questions": [
            {"text": f"Q{i}?", "options": ["A","B","C","D"], "correct_answer": "A"}
            for i in range(5)
        ]
    }
    import json
    result = _parse_and_validate(json.dumps(payload))
    assert result.summary == "A test summary about stuff."
    assert len(result.questions) == 5


def test_parse_strips_markdown_fences():
    from app.services.ai_generator import _parse_and_validate
    import json
    payload = {
        "summary": "Summary here.",
        "questions": [
            {"text": f"Q{i}?", "options": ["A","B","C","D"], "correct_answer": "B"}
            for i in range(5)
        ]
    }
    raw = f"```json\n{json.dumps(payload)}\n```"
    result = _parse_and_validate(raw)
    assert len(result.questions) == 5


def test_parse_rejects_too_few_questions():
    from app.services.ai_generator import _parse_and_validate, GenerationError
    import json
    payload = {
        "summary": "Summary.",
        "questions": [
            {"text": "Q?", "options": ["A","B","C","D"], "correct_answer": "A"}
        ]
    }
    with pytest.raises(GenerationError):
        _parse_and_validate(json.dumps(payload))


def test_parse_rejects_bad_correct_answer():
    from app.services.ai_generator import _parse_and_validate, GenerationError
    import json
    payload = {
        "summary": "Summary.",
        "questions": [
            {"text": f"Q{i}?", "options": ["A","B","C","D"], "correct_answer": "Z"}
            for i in range(5)
        ]
    }
    with pytest.raises(GenerationError):
        _parse_and_validate(json.dumps(payload))
