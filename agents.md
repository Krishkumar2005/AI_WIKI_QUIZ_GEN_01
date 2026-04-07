# agents.md — Coding Standards for AI-Assisted Development

This file documents the coding standards I enforced while using
Claude to build WikiQuiz — both backend and frontend.
Every piece of generated code was required to follow these
rules before being accepted.

---

## Backend standards enforced

### 1. Type hints are mandatory

```python
# Required
def fetch_article(url: str) -> tuple[str, str]: ...

# Rejected
def fetch_article(url): ...
```

### 2. Logging over printing

```python
# Required
logger.info("Quiz saved: %s", quiz_id)

# Rejected
print(f"Saved {quiz_id}")
```

### 3. Domain-specific exceptions

```python
# Required
raise ScraperError("Wikipedia returned 404")
raise GenerationError("Model returned invalid JSON")
raise RepositoryError("Failed to save quiz")

# Rejected
raise Exception("something went wrong")
```

### 4. No silent exception swallowing

```python
# Required
except Exception as exc:
    logger.error("Failed: %s", exc)
    raise RepositoryError("DB error") from exc

# Rejected
except Exception:
    pass
```

### 5. Input validated at boundary only

```python
# Required — schema validates before any processing
payload = GenerateRequest(**body)

# Rejected — trusting raw input
url = body.get("url")
```

### 6. One responsibility per file

- Routes: HTTP only
- Schemas: validation only
- Services: business logic only
- Repository: DB access only
- Config: env reads only

---

## Frontend standards enforced

### 1. No any types

```typescript
// Required
const [quizzes, setQuizzes] = useState<QuizSummary[]>([])

// Rejected
const [quizzes, setQuizzes] = useState<any>([])
```

### 2. All types in one place

```typescript
// Required — import from types/index.ts
import type { Quiz, QuizSummary } from '../types/index'

// Rejected — inline type definitions in components
```

### 3. All API calls through lib/api.ts only

```typescript
// Required
const quiz = await api.generateQuiz(url)

// Rejected — direct axios/fetch in component
const res = await axios.post('/api/quiz/generate', { url })
```

### 4. Error states always handled

```typescript
// Required
} catch (err: unknown) {
  setError(err instanceof Error ? err.message : 'Something went wrong.')
}

// Rejected — silent failure, no user feedback
} catch { }
```

### 5. Relative imports only

```typescript
// Required
import { api } from '../lib/api'
import type { Quiz } from '../types/index'

// Rejected — alias imports that cause build errors
import { api } from '@/lib/api'
```

---

## Review checklist — applied to every generated file

### Backend
- [ ] Layer boundaries respected
- [ ] All functions typed
- [ ] Logging used instead of print
- [ ] Domain exception raised
- [ ] No silent catch blocks
- [ ] No hardcoded secrets or URLs
- [ ] Test written alongside

### Frontend
- [ ] No any types
- [ ] Relative imports only
- [ ] Error state handled and shown to user
- [ ] No direct API calls in components — goes through lib/api.ts
- [ ] Builds without error — npm run build passes

---

## How AI output was verified

### Backend
- Ran `pytest tests/ -v` after every generated file
- Tests mock Supabase and Gemini — run fully offline
- Any test failure = file rejected and re-prompted

### Frontend
- Ran `npm run build` to catch TypeScript errors after every file
- Manually tested each page: Generate → Quiz → Results → History
- Checked all error states: bad URL, network error, empty history

### AI output specifically
- `_parse_and_validate()` in `ai_generator.py` was written by me
  not generated — validating AI output is a trust boundary
  that must not itself be AI-generated without careful review

---

## Prompting approach that worked

1. Give full layer context first
2. State explicitly what must NOT happen
3. One file at a time — never multiple files in one prompt
4. After generation — ask "what assumptions did you make?"
5. Run tests immediately — don't accumulate unverified files

## Prompting approach that did NOT work

- Multiple files in one prompt — caused boundary violations
- Not specifying exception types — got generic Exception
- Not specifying logging — got print() statements
- Not specifying response shape — got inconsistent JSON
- Not specifying relative imports — got @ alias imports that broke build