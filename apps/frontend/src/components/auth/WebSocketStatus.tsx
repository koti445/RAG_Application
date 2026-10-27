"use client";

import { useAuthenticatedWebSocket } from "@/hooks/useAuthenticatedWebSocket";

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  connected: { dot: "bg-emerald-400", label: "Live" },
  connecting: { dot: "bg-amber-400 animate-pulse", label: "Connecting" },
  disconnected: { dot: "bg-content-muted", label: "Offline" },
  error: { dot: "bg-red-400", label: "Error" },
};

export function WebSocketStatus() {
  const { status, error } = useAuthenticatedWebSocket();
  const style = STATUS_STYLES[status] || STATUS_STYLES.disconnected;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-overlay px-2.5 py-1 text-xs text-content-secondary"
      title={error || undefined}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
    </div>
  );
}
