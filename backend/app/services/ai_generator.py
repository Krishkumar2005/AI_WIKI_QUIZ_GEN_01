"""
app/services/ai_generator.py
────────────────────────────
Responsibility: call Gemini and return a validated GeneratedQuiz.

The prompt is the AI Guidance layer — it constrains model output.
_parse_and_validate() enforces structure in code — we never trust
the model blindly.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

from google import genai  # ✅ FIXED IMPORT

from app.config import Config

logger = logging.getLogger(__name__)


# ── Domain types ─────────────────────────────────────────────

@dataclass(frozen=True)
class GeneratedQuestion:
    text: str
    options: list[str]
    correct_answer: str


@dataclass(frozen=True)
class GeneratedQuiz:
    summary: str
    questions: list[GeneratedQuestion] = field(default_factory=list)


# ── Custom exception ─────────────────────────────────────────

class GenerationError(Exception):
    pass


# ── System prompt ────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are WikiQuiz-AI, an educational quiz generator. Your ONLY job is to output
valid JSON — no preamble, no markdown fences, no explanation.

CONSTRAINTS (you MUST follow all of them):
1. Output exactly one JSON object matching the schema below.
2. "summary" must be 2–4 sentences, factual, based solely on the article.
3. "questions" must contain 5 to 8 items.
4. Each question must have exactly 4 options (strings).
5. "correct_answer" must be one of the 4 options verbatim.
6. Do NOT invent facts not present in the article.
7. Do NOT include markdown, backticks, or any text outside the JSON.
8. If a question text cannot be generated, use "Placeholder question text" instead of leaving it empty.
9. All options must be non-empty; if unsure, use "Option A/B/C/D placeholder".

SCHEMA:
{
  "summary": "<string>",
  "questions": [
    {
      "text": "<question string>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct_answer": "<one of the options verbatim>"
    }
  ]
}
""".strip()


# ── Generator ────────────────────────────────────────────────

def generate_quiz(article_text: str) -> GeneratedQuiz:

    client = genai.Client(api_key=Config.GEMINI_API_KEY)  # ✅ NEW SDK

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=f"{_SYSTEM_PROMPT}\n\nARTICLE:\n\n{article_text}\n\nGenerate the quiz JSON now."
        )
        raw = response.text or ""
    except Exception as exc:
        raise GenerationError(f"Gemini API call failed: {exc}") from exc

    return _parse_and_validate(raw)


# ── Parser ───────────────────────────────────────────────────

def _parse_and_validate(raw: str) -> GeneratedQuiz:
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON: %.300s", cleaned)
        raise GenerationError("Model did not return valid JSON.") from exc

    summary = data.get("summary", "").strip()
    if not summary:
        raise GenerationError("Empty summary.")

    raw_questions = data.get("questions", [])
    if not (5 <= len(raw_questions) <= 8):
        raise GenerationError(f"Expected 5–8 questions, got {len(raw_questions)}.")

    questions: list[GeneratedQuestion] = []

    for idx, q in enumerate(raw_questions):
        text = q.get("text", "").strip()
        options = q.get("options", [])
        correct = q.get("correct_answer", "").strip()

        if not text:
            raise GenerationError(f"Question {idx} empty.")
        if len(options) != 4:
            raise GenerationError(f"Question {idx} must have 4 options.")
        if correct not in options:
            raise GenerationError(f"Question {idx} invalid correct_answer.")

        questions.append(
            GeneratedQuestion(text=text, options=options, correct_answer=correct)
        )

    return GeneratedQuiz(summary=summary, questions=questions)