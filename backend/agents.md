# agents.md — Coding Standards for AI Agents

## Before Writing Any Code

Answer these questions first:
1. Which layer does this belong to? (Route / Service / Repository / Schema)
2. What can go wrong? Write error handling for each failure mode.
3. Is there a test? Write the test first.
4. Does this make the system harder to understand? If yes, simplify.

---

## Required Patterns

### Input validation at the boundary
```python
# ✅ Correct
try:
    payload = GenerateRequest(**body)
except ValidationError as exc:
    return jsonify({"ok": False, "error": "Invalid request", "detail": exc.errors()}), 422

# ❌ Wrong — trusting raw input
url = body.get("url")
```

### Domain exceptions in services
```python
# ✅ Correct
raise ScraperError("Wikipedia returned 404")

# ❌ Wrong
raise Exception("error")
```

### Logging over printing
```python
# ✅
logger.info("Quiz saved: %s", quiz_id)

# ❌
print(f"Saved {quiz_id}")
```

### Type hints on all functions
```python
# ✅
def fetch_article(url: str) -> tuple[str, str]: ...

# ❌
def fetch_article(url): ...
```

---

## AI Prompt Rules (ai_generator.py)

- Always validate the JSON schema in `_parse_and_validate()` in code — never rely on the model.
- If you add a field to the output schema, add validation for it too.
- Document what the model is and is not allowed to produce.

---

## Never Do These

- `try: ... except: pass` — swallowed errors break observability.
- Direct Supabase calls from routes — use the repository layer.
- `print()` statements — use `logging`.
- Hardcoded secrets or URLs.
- Accepting unvalidated data into the DB.

---

## Review Checklist (before accepting AI-generated code)

- [ ] Read every line — no blind acceptance.
- [ ] Layer boundaries respected.
- [ ] No swallowed exceptions.
- [ ] `pytest tests/ -v` passes.
- [ ] New functionality has a test.
