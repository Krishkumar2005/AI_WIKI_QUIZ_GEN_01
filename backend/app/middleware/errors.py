"""
app/middleware/errors.py
────────────────────────
Centralised error handlers — every failure returns consistent JSON.
Observability: all 5xx log the full traceback.
"""
import logging
import traceback

from flask import Flask, jsonify

logger = logging.getLogger(__name__)


def register_error_handlers(app: Flask) -> None:

    @app.errorhandler(404)
    def not_found(_err):
        return jsonify({"ok": False, "error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_err):
        return jsonify({"ok": False, "error": "Method not allowed"}), 405

    @app.errorhandler(422)
    def unprocessable(_err):
        return jsonify({"ok": False, "error": "Unprocessable entity"}), 422

    @app.errorhandler(429)
    def rate_limited(_err):
        return jsonify({"ok": False, "error": "Too many requests — slow down"}), 429

    @app.errorhandler(500)
    def internal(_err):
        logger.error("Unhandled 500:\n%s", traceback.format_exc())
        return jsonify({"ok": False, "error": "Internal server error"}), 500

    @app.errorhandler(Exception)
    def unhandled(exc: Exception):
        logger.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
        return jsonify({"ok": False, "error": "Unexpected server error"}), 500
