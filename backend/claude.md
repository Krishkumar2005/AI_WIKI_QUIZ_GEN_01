# claude.md — AI Guidance for WikiQuiz Backend

Read this file before making any changes to the codebase.

---

## Architecture Boundaries (never cross them)

```
Routes  →  Services / Repository  →  Supabase DB
         ↑
      Schemas (Pydantic v2 validation)
```

| Layer | Location | Rule |
|---|---|---|
| Routes | `app/routes/` | HTTP only — parse, validate, delegate, respond |
| Schemas | `app/schemas/` | API contract — no logic beyond validation |
| Services | `app/services/` | Business logic — no Flask imports |
| Repository | `app/models/quiz_repository.py` | All DB access — no AI or Flask imports |
| DB client | `app/db.py` | Supabase singleton — never re-create elsewhere |
| Config | `app/config.py` | All env reads — nowhere else |

---

## Hard Rules for AI Agents

1. **Never call Supabase directly from a route** — use the repository.
2. **Never add a route without a test** in `tests/test_quiz_routes.py`.
3. **Never parse AI output without validation** — `_parse_and_validate()` must check every field.
4. **Never import Flask inside services or models** — keep them framework-agnostic.
5. **Never skip `Config.validate()`** — required env vars must be checked at startup.
6. **Never swallow exceptions silently** — always log before raising.
7. **Never store raw user input in the DB** — always validate with Pydantic first.
8. **Never hardcode secrets** — all credentials come from `.env` via `app/config.py`.

## Allowed Changes

- Adding fields to `schemas/quiz.py` with backward-compatible defaults.
- Adding new routes following the thin-route pattern.
- Improving the Gemini prompt in `services/ai_generator.py` — update `_parse_and_validate` too.
- Adding new services that raise domain-specific exceptions.

## Forbidden Changes

- Weakening Pydantic validators.
- Bypassing the repository with raw Supabase calls from routes.
- Removing or reducing logging.
- Disabling CORS restrictions.
- Adding business logic inside route handlers.

## Running Tests

```bash
pytest tests/ -v
```

All tests must pass before any change is accepted.
