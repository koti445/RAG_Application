"""WebSocket connection manager — tracks active connections per user."""

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages authenticated WebSocket connections grouped by user ID."""

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if user_id not in self._connections:
                self._connections[user_id] = set()
            self._connections[user_id].add(websocket)
        logger.info("WebSocket connected: user=%s total=%d", user_id, self.connection_count)

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if user_id in self._connections:
                self._connections[user_id].discard(websocket)
                if not self._connections[user_id]:
                    del self._connections[user_id]
        logger.info("WebSocket disconnected: user=%s total=%d", user_id, self.connection_count)

    async def send_to_user(self, user_id: str, message: dict[str, Any]) -> int:
        """Send a JSON message to all connections for a user. Returns delivery count."""
        payload = json.dumps(message)
        delivered = 0
        async with self._lock:
            sockets = list(self._connections.get(user_id, set()))

        for ws in sockets:
            try:
                await ws.send_text(payload)
                delivered += 1
            except Exception:
                await self.disconnect(user_id, ws)
        return delivered

    async def broadcast(self, message: dict[str, Any]) -> int:
        """Broadcast to all connected clients."""
        delivered = 0
        async with self._lock:
            all_sockets = [(uid, ws) for uid, sockets in self._connections.items() for ws in sockets]

        for user_id, ws in all_sockets:
            try:
                await ws.send_text(json.dumps(message))
                delivered += 1
            except Exception:
                await self.disconnect(user_id, ws)
        return delivered

    @property
    def connection_count(self) -> int:
        return sum(len(sockets) for sockets in self._connections.values())

    @property
    def user_count(self) -> int:
        return len(self._connections)


session_manager = ConnectionManager()
