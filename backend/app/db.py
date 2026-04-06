"""
app/db.py
─────────
Supabase client — created once, shared across the app.

Uses the SERVICE_ROLE key so the backend can bypass RLS and perform
all CRUD operations without per-user auth tokens.

Design: a module-level singleton initialised on first import.
Flask's application factory calls `init_db()` after config validation
to ensure the client is never created with empty credentials.
"""
from __future__ import annotations

import logging

from supabase import Client, create_client

from app.config import Config

logger = logging.getLogger(__name__)

_client: Client | None = None


def init_db() -> None:
    """
    Initialise the Supabase client.
    Must be called after Config.validate() inside the app factory.
    """
    global _client
    _client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
    logger.info("Supabase client initialised for: %s", Config.SUPABASE_URL)


def get_db() -> Client:
    """
    Return the shared Supabase client.

    Raises
    ------
    RuntimeError
        If init_db() was never called (programming error).
    """
    if _client is None:
        raise RuntimeError("Supabase client not initialised. Call init_db() first.")
    return _client
