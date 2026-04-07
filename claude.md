# claude.md — AI Guidance File

This file contains the instructions and constraints I gave to Claude
while building WikiQuiz — both backend and frontend.

---

## Project context given to AI

I told Claude:

- Build a Wikipedia quiz generator — full stack project
- Backend: Python + Flask + Supabase (PostgreSQL) + Google Gemini
- Frontend: React 19 + TypeScript + Tailwind CSS + Vite 6
- State management: Zustand
- HTTP client: Axios
- The codebase must be small, well-structured, and easy to understand
- Evaluation criteria: structure, simplicity, correctness, interface safety,
  change resilience, verification, observability

---

## Architecture constraints I imposed

### Backend

I explicitly instructed Claude to follow a layered architecture:

```
Routes → Schemas → Services → Repository → Database
```

- Routes must be thin — only validate input, call service/repo, return JSON
- All input validation must happen in Pydantic schemas at the boundary
- Services (scraper, AI generator) must not import Flask or touch the DB
- Repository must be the only place that calls Supabase
- Config must be the only place that reads environment variables
- App must fail fast at startup if required env vars are missing

### Frontend

I explicitly instructed Claude to follow a clean separation:

```
Pages → Store (Zustand) → API client (Axios) → Backend
```

- Pages must only read from store and dispatch actions — no business logic
- All HTTP calls must go through lib/api.ts — never fetch directly in components
- All TypeScript types must be defined in types/index.ts — one source of truth
- Components must be reusable and have no direct API knowledge

---

## Prompting rules I followed

1. Always give Claude the full context of the layer it was building
2. Tell Claude what the layer must NOT do, not just what it must do
3. After each file was generated, ask Claude to explain its decisions
4. Never accept a file without reading every line myself
5. If Claude violated a boundary rule, reject and re-prompt with the rule stated explicitly
6. One file at a time — never asked for multiple files in one prompt

---

## Constraints on AI-generated code

### Backend
- Every function must have type hints
- Use logging, never print()
- Raise domain-specific exceptions (ScraperError, GenerationError, RepositoryError)
- Never swallow exceptions silently
- No business logic inside route handlers
- No hardcoded secrets or URLs

### Frontend
- All imports must be relative — no path alias issues
- All types must be explicit — no any
- All API errors must be caught and shown to user
- No inline styles — use Tailwind classes only

---

## AI prompt for Gemini system instruction

I gave Claude this requirement for the AI generator:

> "The Gemini system prompt must explicitly tell the model:
> - Output JSON only — no markdown, no preamble, no explanation
> - Exactly 5 to 8 questions
> - Each question must have exactly 4 options
> - correct_answer must be one of the 4 options verbatim
> - Do not invent facts not present in the article
>
> After generation, validate every field in Python code.
> Never trust the model output without verification."

---

## How I reviewed AI-generated code

### Backend checklist
- [ ] Layer boundaries respected
- [ ] All functions typed
- [ ] Exceptions handled and logged
- [ ] No business logic in wrong layer
- [ ] Test written alongside

### Frontend checklist
- [ ] Relative imports only
- [ ] No any types
- [ ] Error states handled in UI
- [ ] Store used correctly — no direct API calls in components
- [ ] Builds without TypeScript errors (npm run build)

---

## What I did NOT let the AI decide

- Architecture — I defined the layers before asking Claude to write any code
- Library choices — Flask, Supabase, Pydantic, Gemini, React, Zustand, Axios were decided by me
- Error response shape — { ok, error } format was specified by me
- Validation rules — Wikipedia URL check, 5-8 questions, 4 options per question
- Database schema — table names, column types, FK cascade were my decisions
- Folder structure — both backend and frontend structure defined by me upfront