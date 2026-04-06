# WikiQuiz Backend — Flask + Supabase

> AI-powered quiz generator backend. Python · Flask · Supabase (PostgreSQL) · Google Gemini

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set up Supabase

1. Go to [https://app.supabase.com](https://app.supabase.com) → create a project
2. Open **SQL Editor → New Query**
3. Paste and run the contents of `supabase_schema.sql`
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role (secret)** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure environment

```bash
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
```

### 4. Run

```bash
python main.py
# → http://localhost:5000
```

---

## Architecture

```
Routes  (thin: validate → call → respond)
  ↓
Schemas (Pydantic v2 — boundary validation)
  ↓
Services (scraper, ai_generator — no Flask)
  ↓
Repository (quiz_repository — all DB access)
  ↓
Supabase Client (app/db.py — singleton)
  ↓
Supabase PostgreSQL
```

---

## API Endpoints

| Method   | Path                    | Description                        |
|----------|-------------------------|------------------------------------|
| `GET`    | `/api/health`           | DB connectivity check              |
| `POST`   | `/api/quiz/generate`    | Scrape URL, generate + save quiz   |
| `GET`    | `/api/quiz/history`     | Paginated quiz history             |
| `GET`    | `/api/quiz/<id>`        | Full quiz with questions           |
| `DELETE` | `/api/quiz/<id>`        | Remove quiz from history           |

All responses: `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`

### POST /api/quiz/generate

```json
{ "url": "https://en.wikipedia.org/wiki/Photosynthesis" }
```

---

## Running Tests

```bash
pytest tests/ -v
```

Tests run fully offline — Supabase and Gemini are mocked.

---

## Key Technical Decisions

| Decision | Reason |
|---|---|
| **Flask over FastAPI** | Assessment required Flask; simpler for this sync, low-concurrency scope |
| **Supabase Python client v2** | Typed, ergonomic client for Supabase's REST + PostgREST API |
| **Repository pattern** | Isolates all DB logic — routes never touch Supabase directly |
| **Pydantic v2 validation** | Rejects invalid data at the boundary before any processing |
| **Service-role key** | Bypasses RLS for server-side operations; safe when key is never exposed client-side |
| **Gemini output validation** | Model output verified in `_parse_and_validate()` — never trusted blindly |

## Known Tradeoffs

- No auth — service-role key must stay server-side only
- No rate-limiting middleware (config exists, enforcement needs Flask-Limiter)
- Same URL generates a new quiz every time (no caching/dedup)

---

## Project Structure

```
backend/
├── main.py                          # Entry point
├── requirements.txt
├── pytest.ini
├── supabase_schema.sql              # Run this in Supabase SQL editor
├── .env.example                     # Copy to .env and fill in
├── claude.md                        # AI guidance constraints
├── agents.md                        # AI coding standards
└── app/
    ├── __init__.py                  # App factory
    ├── config.py                    # All env reads + fail-fast validation
    ├── db.py                        # Supabase client singleton
    ├── schemas/quiz.py              # Pydantic v2 schemas
    ├── services/
    │   ├── scraper.py               # Wikipedia fetcher
    │   └── ai_generator.py          # Gemini + prompt + output validation
    ├── models/
    │   └── quiz_repository.py       # All Supabase DB operations
    ├── routes/
    │   ├── quiz.py                  # Quiz CRUD endpoints
    │   └── health.py                # Observability endpoint
    └── middleware/
        └── errors.py                # Centralised error handlers
```
