"""
app/services/scraper.py
───────────────────────
Responsibility: fetch & parse a Wikipedia article into plain text.

Raises domain-specific ScraperError so callers can handle cleanly.
Hard limit on content size prevents bloating the AI prompt.
"""
import logging

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": "WikiQuiz/1.0 (educational project)"}
_MAX_CHARS = 15_000
_TIMEOUT_SECS = 10


class ScraperError(Exception):
    """Raised when the article cannot be fetched or parsed."""


def fetch_article(url: str) -> tuple[str, str]:
    """
    Fetch a Wikipedia article and return (title, body_text).

    Returns
    -------
    tuple[str, str]
        (article_title, truncated_body_text)

    Raises
    ------
    ScraperError
    """
    logger.info("Fetching article: %s", url)

    try:
        response = requests.get(url, headers=_HEADERS, timeout=_TIMEOUT_SECS)
    except requests.RequestException as exc:
        raise ScraperError(f"Network error fetching article: {exc}") from exc

    if response.status_code != 200:
        raise ScraperError(
            f"Wikipedia returned HTTP {response.status_code}"
        )

    soup = BeautifulSoup(response.text, "html.parser")

    title_tag = soup.find(id="firstHeading")
    title = title_tag.get_text(strip=True) if title_tag else "Unknown"

    content_div = soup.find(id="mw-content-text")
    if not content_div:
        raise ScraperError("Could not locate article content on the page.")

    paragraphs = content_div.find_all("p")
    text = "\n".join(
        p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)
    )

    if not text:
        raise ScraperError("Article appears to have no readable text.")

    truncated = text[:_MAX_CHARS]
    logger.info(
        "Fetched '%s' — %d chars (capped at %d)", title, len(text), len(truncated)
    )
    return title, truncated
