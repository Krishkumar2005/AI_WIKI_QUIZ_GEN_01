"""
app/schemas/quiz.py
───────────────────
Pydantic v2 models define the API contract between client ↔ backend.
Invalid data is rejected at the boundary — never inside business logic.
"""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, field_validator, model_validator


# ── Inbound ───────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    url: Annotated[str, ...]

    @field_validator("url")
    @classmethod
    def must_be_wikipedia(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("https://en.wikipedia.org/wiki/"):
            raise ValueError(
                "URL must be a valid English Wikipedia article "
                "(https://en.wikipedia.org/wiki/...)"
            )
        return v


# ── Domain objects ─────────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: str
    text: str
    options: list[str]
    correct_answer: str
    position: int

    @model_validator(mode="after")
    def correct_answer_in_options(self) -> "QuestionOut":
        if self.correct_answer not in self.options:
            raise ValueError("correct_answer must be one of the options")
        return self


class QuizOut(BaseModel):
    id: str
    url: str
    topic: str
    summary: str
    questions: list[QuestionOut]
    created_at: datetime


class QuizSummaryOut(BaseModel):
    id: str
    url: str
    topic: str
    summary: str
    question_count: int
    created_at: datetime


# ── Response envelopes ─────────────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    ok: bool = True
    data: QuizOut


class HistoryResponse(BaseModel):
    ok: bool = True
    data: list[QuizSummaryOut]
    total: int


class ErrorResponse(BaseModel):
    ok: bool = False
    error: str
    detail: str | None = None
