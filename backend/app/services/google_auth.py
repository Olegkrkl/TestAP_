"""Google Identity Services token verification.

We rely on the official google-auth library to validate the JWT id_token that
the GIS button hands to the frontend. The backend only needs the client_id
(GOOGLE_CLIENT_ID) — no client_secret is required for this flow.
"""
from typing import Optional, TypedDict
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleIdentity(TypedDict):
    sub: str
    email: str
    email_verified: bool
    name: str
    picture: Optional[str]


def verify_google_id_token(credential: str) -> Optional[GoogleIdentity]:
    """Validate a Google id_token. Returns the identity payload or None.

    Returns None when GOOGLE_CLIENT_ID is not configured or the token is
    invalid/expired/issued for a different client.
    """
    if not settings.GOOGLE_CLIENT_ID:
        logger.warning("GOOGLE_CLIENT_ID is not configured; Google login disabled")
        return None
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as g_requests
    except ImportError:
        logger.error("google-auth package is not installed")
        return None

    try:
        payload = id_token.verify_oauth2_token(
            credential,
            g_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        logger.info(f"Rejected Google id_token: {e}")
        return None

    if payload.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        return None

    return GoogleIdentity(
        sub=str(payload["sub"]),
        email=str(payload.get("email", "")).lower(),
        email_verified=bool(payload.get("email_verified", False)),
        name=str(payload.get("name") or payload.get("email", "")),
        picture=payload.get("picture"),
    )
