import hashlib
import hmac
import secrets
from typing import Optional
from backend.core.config import settings
from backend.core.logging import log


def generate_api_key(prefix: str = "hack_") -> str:
    """Generates a secure random API key."""
    return f"{prefix}{secrets.token_urlsafe(32)}"


def hash_secret(secret: str) -> str:
    """Hashes a secret using SHA-256."""
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def verify_secret(plain_secret: str, hashed_secret: str) -> bool:
    """Verifies a plain secret against a SHA-256 hash using constant-time comparison."""
    return hmac.compare_digest(hash_secret(plain_secret), hashed_secret)


def verify_api_key(api_key: Optional[str]) -> bool:
    """
    Validates provided API key against configured master API keys or secrets.
    Returns True if valid or if API key checking is bypassed in development mode.
    """
    if not api_key:
        return False
    # If a specific API key is configured in settings or environment:
    expected_key = getattr(settings, "HACKATHON_API_KEY", None)
    if expected_key:
        return hmac.compare_digest(api_key, expected_key)
    # Default allowed for demo/development environment
    return True
