# WikiQuiz — AI-Powered Wikipedia Quiz Generator

> Turn any English Wikipedia article into a multiple-choice quiz using Google Gemini AI.

**Stack:** Python · Flask · Supabase (PostgreSQL) · React 19 · TypeScript · Tailwind CSS

---

## What It Does

1. User pastes any English Wikipedia URL
2. Backend scrapes the article text
3. Google Gemini AI reads it and generates 5–8 multiple-choice questions with a summary
4. Quiz is saved to Supabase (PostgreSQL)
5. User takes the quiz, submits, and sees their score with answer review
6. All past quizzes stored in History — can be retaken or deleted

---

## Project Structure

```
wikiquiz/
├── README.md
├── claude.md                          ← AI guidance — how AI was used to build this project
├── agents.md                          ← AI coding standards enforced during development
├── backend/
│   ├── main.py                        ← Entry point
│   ├── requirements.txt
│   ├── supabase_schema.sql            ← Run this in Supabase SQL Editor
│   ├── .env.example                   ← Copy to .env
│   └── app/
│       ├── config.py                  ← All env reads + fail-fast validation
│       ├── db.py                      ← Supabase client singleton
│       ├── schemas/quiz.py            ← Pydantic v2 validation
│       ├── services/scraper.py        ← Wikipedia fetcher
│       ├── services/ai_generator.py   ← Gemini AI + output validation
│       ├── models/quiz_repository.py  ← All DB operations
│       ├── routes/quiz.py             ← Quiz CRUD endpoints
│       ├── routes/health.py           ← Observability health check
│       ├── middleware/errors.py       ← Centralised error handlers
│       └── tests/test_quiz_routes.py  ← pytest suite
└── frontend/
    ├── src/
    │   ├── pages/                     ← Generate, Quiz, Results, History
    │   ├── components/                ← Layout + UI primitives
    │   ├── store/quizStore.ts         ← Zustand global state
    │   ├── lib/api.ts                 ← Axios API client
    │   └── types/index.ts             ← TypeScript types
    └── ...config files
```

---

## Quick Start

### Step 1 — Supabase Setup

1. Go to https://app.supabase.com → create a new project
2. Open **SQL Editor → New Query**
3. Paste contents of `backend/supabase_schema.sql` and run it
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2 — Gemini API Key

Go to https://aistudio.google.com/app/apikey → create a key → `GEMINI_API_KEY`

### Step 3 — Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
python main.py
# → http://localhost:5000
```

### Step 4 — Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:5000
npm run dev
# → http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | DB connectivity check |
| `POST` | `/api/quiz/generate` | Scrape URL, generate + save quiz |
| `GET` | `/api/quiz/history` | Paginated quiz history |
| `GET` | `/api/quiz/<id>` | Full quiz with questions |
| `DELETE` | `/api/quiz/<id>` | Delete a quiz |

All responses: `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`

---

## Architecture

```
React 19 + TypeScript + Tailwind (Vite 6)
           ↓ HTTP/JSON
Flask 3.1 API
  Routes     → validate → call → respond
  Schemas    → Pydantic v2 boundary validation
  Services   → scraper + AI generator
  Repository → all DB access
  db.py      → Supabase client singleton
           ↓ supabase-py v2
Supabase PostgreSQL
  Tables: quizzes, questions (FK + cascade)
```

---

## Key Technical Decisions

**Flask over FastAPI** — Assessment required Flask. Simpler for sync, low-concurrency scope.

**Supabase** — Hosted PostgreSQL with clean Python client. Service-role key used server-side only, never exposed to frontend.

**Repository pattern** — All DB code in `quiz_repository.py`. Routes never touch Supabase directly. Swap the database without touching route or service code.

**Pydantic v2 validation** — Invalid data rejected at HTTP boundary before any scraping or AI call. Non-Wikipedia URLs rejected immediately.

**AI output validation** — Gemini constrained via system prompt AND every output field verified in `_parse_and_validate()`. Model never trusted blindly.

**Zustand over Redux** — Lighter, typed global state with minimal boilerplate for this scope.

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Runs fully offline — Supabase and Gemini are mocked. Covers input validation, route behaviour, schema contracts, and AI parser edge cases.

---

## AI Guidance Files

| File | Purpose |
|---|---|
| `claude.md` | How AI was used to build this project — context given, constraints imposed, decisions kept by me |
| `agents.md` | Coding standards enforced on AI-generated code — backend + frontend, review checklist, verification approach |

Both frontend and backend were built using Claude. These files document how AI was guided and how its output was verified.

---

## Known Weaknesses & Tradeoffs

| Weakness | Why accepted | How to fix |
|---|---|---|
| No user auth | Out of scope | Add Supabase Auth + `user_id` FK on quizzes |
| No rate limiting enforcement | Config exists, not wired | Add `flask-limiter` |
| No URL deduplication | Simplicity | Check existing URL before generating |
| Gemini latency (10–20s) | Inherent to LLM | Background job or streaming |
| No frontend tests | Time tradeoff | Add Vitest + React Testing Library |

---

## Extending the System

**Example — add "difficulty" to questions:**
1. Add `difficulty` column in Supabase SQL Editor
2. Update AI prompt + `_parse_and_validate()` in `ai_generator.py`
3. Add `difficulty` to `QuestionOut` schema in `schemas/quiz.py`
4. Update `_build_quiz_dict()` in `quiz_repository.py`

Zero route code changes needed — that is the value of the layered architecture.