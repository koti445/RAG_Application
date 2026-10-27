"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AuthenticatedWebSocket,
  fetchWsToken,
  type WebSocketMessage,
  type WebSocketStatus,
} from "@/lib/websocket/client";

interface UseAuthenticatedWebSocketOptions {
  path?: string;
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useAuthenticatedWebSocket({
  path = "/ws/session",
  enabled = true,
  onMessage,
}: UseAuthenticatedWebSocketOptions = {}) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<AuthenticatedWebSocket | null>(null);

  const send = useCallback((message: WebSocketMessage) => {
    clientRef.current?.send(message);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function connect() {
      try {
        const token = await fetchWsToken();
        if (cancelled) return;

        const client = new AuthenticatedWebSocket(token, path);
        clientRef.current = client;

        client.onStatus(setStatus);
        client.onMessage((msg) => {
          setLastMessage(msg);
          onMessage?.(msg);
        });
        client.connect();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "WebSocket connection failed");
        setStatus("error");
      }
    }

    connect();

    return () => {
      cancelled = true;
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [enabled, path, onMessage]);

  return { status, lastMessage, error, send, disconnect };
}
