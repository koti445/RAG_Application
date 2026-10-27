"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { ExecutionTrace } from "@/lib/api/rag";
import { cn } from "@/lib/utils";

const STATUS_ICON = {
  completed: CheckCircle2,
  running: Loader2,
  failed: XCircle,
  pending: Circle,
};

const STATUS_COLOR = {
  completed: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  running: "text-accent border-accent/30 bg-accent/10 animate-pulse",
  failed: "text-red-400 border-red-500/30 bg-red-500/10",
  pending: "text-content-muted border-surface-border bg-surface-overlay",
};

interface LiveExecutionFlowProps {
  trace: ExecutionTrace[];
  activeStep?: string;
}

export function LiveExecutionFlow({ trace, activeStep }: LiveExecutionFlowProps) {
  if (trace.length === 0) {
    return (
      <div className="enterprise-panel flex h-full items-center justify-center p-8 text-sm text-content-muted">
        Run a query to see the live execution flow
      </div>
    );
  }

  return (
    <div className="enterprise-panel p-4">
      <h3 className="mb-4 text-sm font-semibold text-content-primary">Live Execution Flow</h3>
      <div className="space-y-2">
        {trace.map((step, i) => {
          const Icon = STATUS_ICON[step.status as keyof typeof STATUS_ICON] || Circle;
          const isActive = activeStep === step.step_type || step.status === "running";
          return (
            <div key={step.node_id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border",
                    STATUS_COLOR[step.status as keyof typeof STATUS_COLOR] || STATUS_COLOR.pending,
                    isActive && "ring-2 ring-accent/40"
                  )}
                >
                  <Icon className={cn("h-4 w-4", step.status === "running" && "animate-spin")} />
                </div>
                {i < trace.length - 1 && <div className="my-1 h-6 w-px bg-surface-border" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-content-primary">{step.step_label}</p>
                  {step.latency_ms != null && (
                    <span className="text-xs text-content-muted">{step.latency_ms}ms</span>
                  )}
                </div>
                <p className="text-xs text-content-muted">{step.step_type}</p>
                {Object.keys(step.config_snapshot).length > 0 && (
                  <div className="mt-2 rounded-md bg-surface-overlay p-2 text-xs text-content-secondary">
                    {Object.entries(step.config_snapshot)
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="text-content-muted">{k}:</span> {String(v)}
                        </span>
                      ))}
                  </div>
                )}
                {Object.keys(step.output_summary).length > 0 && (
                  <div className="mt-1 text-xs text-emerald-400/80">
                    {Object.entries(step.output_summary)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(" · ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
