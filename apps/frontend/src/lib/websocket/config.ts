const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/** Build WebSocket URL from HTTP API base URL. */
export function getWebSocketUrl(path = "/ws/session"): string {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}${path}`;
}
