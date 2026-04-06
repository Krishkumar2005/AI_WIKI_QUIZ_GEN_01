"""
app/routes/health.py
─────────────────────
Observability: /api/health checks Supabase connectivity.
Used by deployment readiness probes and monitoring tools.
"""
import logging

from flask import Blueprint, jsonify

from app.db import get_db

logger = logging.getLogger(__name__)
bp = Blueprint("health", __name__, url_prefix="/api")


@bp.get("/health")
def health():
    """
    Returns service + database status.
    A simple SELECT count is used to probe the Supabase connection.
    """
    db_ok = False
    try:
        get_db().table("quizzes").select("id", count="exact").limit(1).execute()
        db_ok = True
    except Exception as exc:
        logger.warning("Health check DB probe failed: %s", exc)

    status = "ok" if db_ok else "degraded"
    code   = 200  if db_ok else 503

    return jsonify({
        "status": status,
        "database": "connected" if db_ok else "unavailable",
    }), code
