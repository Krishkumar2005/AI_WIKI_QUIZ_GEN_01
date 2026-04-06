"""
app/config.py
─────────────
Central configuration loaded once at startup.
All env reads happen here — never scattered across the codebase.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-insecure-key")
    DEBUG: bool = os.environ.get("FLASK_DEBUG", "false").lower() == "true"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        o.strip()
        for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]

    # Supabase
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    # Gemini
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")

    # Rate limiting
    RATE_LIMIT: int = int(os.environ.get("RATE_LIMIT", "10"))

    @classmethod
    def validate(cls) -> None:
        """Fail fast at startup if required config is missing."""
        missing = []
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_SERVICE_ROLE_KEY:
            missing.append("SUPABASE_SERVICE_ROLE_KEY")
        if not cls.GEMINI_API_KEY:
            missing.append("GEMINI_API_KEY")
        if missing:
            raise EnvironmentError(
                f"Missing required environment variables: {', '.join(missing)}"
            )
