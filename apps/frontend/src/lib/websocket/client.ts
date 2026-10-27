import { getWebSocketUrl } from "./config";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (status: WebSocketStatus) => void;

export class AuthenticatedWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private path: string;
  private messageHandlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelayMs = 2000;
  private shouldReconnect = true;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(token: string, path = "/ws/session") {
    this.token = token;
    this.path = path;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.setStatus("connecting");
    const url = `${getWebSocketUrl(this.path)}?token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus("connected");
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        this.messageHandlers.forEach((handler) => handler(data));
      } catch {
        // ignore non-JSON messages
      }
    };

    this.ws.onerror = () => {
      this.setStatus("error");
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.setStatus("disconnected");
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts += 1;
        const delay = this.reconnectDelayMs * this.reconnectAttempts;
        void this.reconnectWithFreshToken(delay);
      }
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPing();
    this.ws?.close();
    this.ws = null;
    this.setStatus("disconnected");
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  ping(): void {
    this.send({ type: "ping" });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }

  getStatus(): WebSocketStatus {
    if (!this.ws) return "disconnected";
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      default:
        return "disconnected";
    }
  }

  private setStatus(status: WebSocketStatus): void {
    this.statusHandlers.forEach((handler) => handler(status));
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => this.ping(), 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async reconnectWithFreshToken(delayMs: number): Promise<void> {
    try {
      this.token = await fetchWsToken();
    } catch {
      // Keep existing token; connect may still fail and retry again.
    }
    setTimeout(() => this.connect(), delayMs);
  }
}

/** Fetch JWT access token from BFF (reads httpOnly cookie server-side). */
export async function fetchWsToken(): Promise<string> {
  const res = await fetch("/api/auth/ws-token");
  if (!res.ok) {
    throw new Error("Failed to obtain WebSocket token");
  }
  const data = await res.json();
  return data.access_token as string;
}
