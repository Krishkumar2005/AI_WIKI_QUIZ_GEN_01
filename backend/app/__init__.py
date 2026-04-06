"""
app/__init__.py
───────────────
Application factory.

Pattern benefits:
- Tests can create isolated app instances.
- Config is injected, not global.
- Supabase client is initialised after config validation.
"""
import logging
import logging.config

from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.db import init_db
from app.middleware.errors import register_error_handlers
from app.routes import health as health_bp
from app.routes import quiz as quiz_bp


def _configure_logging() -> None:
    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
            }
        },
        "root": {"level": "INFO", "handlers": ["console"]},
    })


def create_app() -> Flask:
    """Create and configure the Flask application."""
    _configure_logging()

    # Fail fast on missing environment variables
    Config.validate()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["DEBUG"] = Config.DEBUG

    # CORS — only allow configured origins
    CORS(app, origins=Config.ALLOWED_ORIGINS, supports_credentials=False)

    # Initialise Supabase client (module-level singleton)
    init_db()

    # Register blueprints
    app.register_blueprint(health_bp.bp)
    app.register_blueprint(quiz_bp.bp)

    # Centralised error handlers
    register_error_handlers(app)

    return app
