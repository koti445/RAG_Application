"""JWT authentication for WebSocket connections."""

import logging
import uuid

from fastapi import WebSocket
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.models.user import User

logger = logging.getLogger(__name__)

WS_CLOSE_UNAUTHORIZED = 4001
WS_CLOSE_FORBIDDEN = 4003


async def get_user_from_jwt(db: AsyncSession, token: str) -> User:
    """Validate JWT access token and return the authenticated user."""
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise ValueError("Invalid or expired access token")

    user = await db.get(User, user_id)
    if not user:
        raise ValueError("User not found")
    if not user.is_active:
        raise PermissionError("Account is deactivated")
    return user


def extract_token_from_websocket(websocket: WebSocket) -> str | None:
    """Extract JWT from query param `token` or `Authorization` header."""
    token = websocket.query_params.get("token")
    if token:
        return token

    auth_header = websocket.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return None


async def authenticate_websocket(
    websocket: WebSocket,
    db: AsyncSession,
    *,
    accept: bool = True,
) -> User:
    """
    Authenticate a WebSocket using JWT from query param or Authorization header.
    Closes the connection with code 4001 if authentication fails.
    """
    token = extract_token_from_websocket(websocket)
    if not token:
        if accept:
            await websocket.close(code=WS_CLOSE_UNAUTHORIZED, reason="Missing JWT token")
        raise ValueError("Missing JWT token")

    try:
        user = await get_user_from_jwt(db, token)
    except ValueError as exc:
        logger.warning("WebSocket auth failed: %s", exc)
        if accept:
            await websocket.close(code=WS_CLOSE_UNAUTHORIZED, reason=str(exc))
        raise
    except PermissionError as exc:
        logger.warning("WebSocket auth forbidden: %s", exc)
        if accept:
            await websocket.close(code=WS_CLOSE_FORBIDDEN, reason=str(exc))
        raise

    if accept:
        await websocket.accept()
    return user
