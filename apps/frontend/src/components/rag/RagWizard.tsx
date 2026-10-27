"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RagDesignerCanvas } from "@/components/rag/RagDesignerCanvas";
import { RagPipelineConfigurator } from "@/components/rag/RagPipelineConfigurator";
import type { RagPipeline, StepValidation } from "@/lib/api/rag";
import { ragApi } from "@/lib/api/rag";
import { cn } from "@/lib/utils";

type WizardPhase = "info" | "configure" | "design" | "review";

export function RagWizard() {
  const router = useRouter();
  const [phase, setPhase] = useState<WizardPhase>("info");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pipeline, setPipeline] = useState<RagPipeline | null>(null);
  const [validation, setValidation] = useState<StepValidation[]>([]);
  const [canActivate, setCanActivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await ragApi.create(name.trim(), description.trim() || undefined);
      setPipeline(created);
      setPhase("configure");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create RAG");
    } finally {
      setLoading(false);
    }
  }

  async function handleReview() {
    if (!pipeline) return;
    setLoading(true);
    try {
      const result = await ragApi.validate(pipeline.id);
      setValidation(result.steps);
      setCanActivate(result.can_activate);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    if (!pipeline) return;
    setLoading(true);
    try {
      await ragApi.activate(pipeline.id);
      router.push(`/rag/pipelines/${pipeline.id}?tab=playground`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation failed");
    } finally {
      setLoading(false);
    }
  }

  const phases: { id: WizardPhase; label: string }[] = [
    { id: "info", label: "Basic Info" },
    { id: "configure", label: "Configure Steps" },
    { id: "design", label: "Design" },
    { id: "review", label: "Review" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-border px-6 py-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/rag/pipelines")}>
          <ArrowLeft className="h-4 w-4" />
          Back to RAG list
        </Button>
        <h1 className="mt-2 text-lg font-semibold text-content-primary">Create RAG Pipeline</h1>
        <p className="text-sm text-content-secondary">
          Bind catalog entities per step, validate each one, design architecture, then activate
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {phases.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                phase === p.id ? "bg-accent-muted text-accent" : "bg-surface-overlay text-content-muted"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised text-[10px]">
                {i + 1}
              </span>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {phase === "info" && (
          <div className="mx-auto max-w-lg space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">RAG Name *</label>
              <input
                className="enterprise-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Product Docs RAG"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">Description</label>
              <textarea
                className="enterprise-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will this RAG be used for?"
              />
            </div>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create & Configure Steps"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {phase === "configure" && pipeline && (
          <RagPipelineConfigurator
            pipeline={pipeline}
            onSaved={setPipeline}
            onContinue={() => setPhase("design")}
          />
        )}

        {phase === "design" && pipeline && (
          <div>
            <RagDesignerCanvas
              pipelineId={pipeline.id}
              initialGraph={pipeline.graph_definition as { nodes: never[]; edges: never[] }}
            />
            <div className="mx-auto mt-4 flex max-w-3xl justify-between">
              <Button variant="outline" onClick={() => setPhase("configure")}>Back to Configure</Button>
              <Button onClick={handleReview} disabled={loading}>
                {loading ? "Validating..." : "Validate & Review"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {phase === "review" && pipeline && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="enterprise-panel p-5">
              <h3 className="font-semibold text-content-primary">Validation Summary</h3>
              <ul className="mt-4 space-y-2">
                {validation.map((v) => (
                  <li key={v.step_type} className="flex items-start gap-2 text-sm">
                    {v.status === "valid" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className="mt-0.5 h-4 w-4 rounded-full bg-red-500/20 text-center text-[10px] leading-4 text-red-400">!</span>
                    )}
                    <div>
                      <span className="font-medium text-content-primary">{v.step_type}</span>
                      {v.errors.length > 0 && (
                        <ul className="mt-1 text-xs text-red-400">
                          {v.errors.map((e) => <li key={e}>• {e}</li>)}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setPhase("design")}>Back to Design</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(`/rag/pipelines/${pipeline.id}`)}>
                  Open Workspace
                </Button>
                <Button onClick={handleActivate} disabled={!canActivate || loading}>
                  {loading ? "Activating..." : "Activate RAG"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
