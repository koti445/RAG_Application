"""WebSocket endpoints with JWT authentication."""

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.websocket.auth import (
    WS_CLOSE_UNAUTHORIZED,
    authenticate_websocket,
    extract_token_from_websocket,
    get_user_from_jwt,
)
from app.websocket.manager import session_manager

router = APIRouter()
logger = logging.getLogger(__name__)

AUTH_MESSAGE_TIMEOUT_SECONDS = 10


@router.websocket("/session")
async def websocket_session(websocket: WebSocket):
    """
    Authenticated session WebSocket.

    Auth methods (in order):
    1. Query param:  ws://host/api/v1/ws/session?token=<JWT>
    2. Header:       Authorization: Bearer <JWT>
    3. First message: {"type": "authenticate", "token": "<JWT>"}
    """
    token = extract_token_from_websocket(websocket)

    async with AsyncSessionLocal() as db:
        if token:
            try:
                user = await authenticate_websocket(websocket, db, accept=True)
            except (ValueError, PermissionError):
                return
        else:
            await websocket.accept()
            try:
                raw = await asyncio_wait_for_message(websocket, AUTH_MESSAGE_TIMEOUT_SECONDS)
                data = json.loads(raw)
                if data.get("type") != "authenticate" or not data.get("token"):
                    await websocket.close(code=WS_CLOSE_UNAUTHORIZED, reason="Expected authenticate message")
                    return
                user = await get_user_from_jwt(db, data["token"])
            except TimeoutError:
                await websocket.close(code=WS_CLOSE_UNAUTHORIZED, reason="Authentication timeout")
                return
            except (ValueError, PermissionError, json.JSONDecodeError) as exc:
                await websocket.close(code=WS_CLOSE_UNAUTHORIZED, reason=str(exc))
                return

        user_id = str(user.id)
        await session_manager.connect(user_id, websocket)

        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "email": user.email,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        try:
            while True:
                raw = await websocket.receive_text()
                response = await handle_client_message(raw, user_id, user.email)
                if response:
                    await websocket.send_json(response)
        except WebSocketDisconnect:
            pass
        finally:
            await session_manager.disconnect(user_id, websocket)


async def asyncio_wait_for_message(websocket: WebSocket, timeout: float) -> str:
    return await asyncio.wait_for(websocket.receive_text(), timeout=timeout)


async def handle_client_message(raw: str, user_id: str, email: str) -> dict | None:
    """Handle incoming WebSocket messages from authenticated clients."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"type": "error", "message": "Invalid JSON"}

    msg_type = data.get("type")

    if msg_type == "ping":
        return {"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()}

    if msg_type == "presence":
        return {
            "type": "presence",
            "user_id": user_id,
            "email": email,
            "active_connections": session_manager.connection_count,
        }

    return {"type": "error", "message": f"Unknown message type: {msg_type}"}
