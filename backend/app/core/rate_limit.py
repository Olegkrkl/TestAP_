"""Shared slowapi Limiter instance.

Imported by both `main.py` (to mount the middleware + error handler) and route
modules (to attach `@limiter.limit(...)` decorators). Keeping a single instance
here avoids the "limiter created in multiple places" footgun.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    # Must stay False: our auth routes don't take a `Response` parameter, and
    # with header injection enabled slowapi fails on the success path (200/201),
    # turning valid logins/registrations into 500 errors.
    headers_enabled=False,
)

# Helpful named limits the routes can reference if we want to centralize tuning.
LOGIN_LIMIT = f"{settings.LOGIN_RATE_LIMIT_PER_MINUTE}/minute"
