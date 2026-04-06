"""
main.py
───────
Entry point for the WikiQuiz Flask backend.

Run locally:
    python main.py

Production (gunicorn):
    gunicorn "main:app" --workers 2 --bind 0.0.0.0:5000
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
