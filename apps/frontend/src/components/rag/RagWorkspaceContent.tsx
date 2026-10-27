"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Play, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LiveExecutionFlow } from "@/components/rag/LiveExecutionFlow";
import { RagDesignerCanvas } from "@/components/rag/RagDesignerCanvas";
import { RagStepConfigPanel } from "@/components/rag/RagStepConfigPanel";
import type { ExecutionTrace, RagPipeline, RagStepDefinition, StepValidation } from "@/lib/api/rag";
import { ragApi } from "@/lib/api/rag";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "designer", label: "Designer" },
  { id: "configure", label: "Configure" },
  { id: "validate", label: "Validate" },
  { id: "playground", label: "Playground" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface RagWorkspaceContentProps {
  pipelineId: string;
}

export function RagWorkspaceContent({ pipelineId }: RagWorkspaceContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) || "designer";

  const [pipeline, setPipeline] = useState<RagPipeline | null>(null);
  const [stepDefs, setStepDefs] = useState<RagStepDefinition[]>([]);
  const [selectedStep, setSelectedStep] = useState<string>("knowledge_base");
  const [validation, setValidation] = useState<StepValidation[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [canActivate, setCanActivate] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [trace, setTrace] = useState<ExecutionTrace[]>([]);
  const [querying, setQuerying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPipeline = useCallback(async () => {
    try {
      const data = await ragApi.get(pipelineId);
      setPipeline(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    loadPipeline();
    ragApi.getStepDefinitions().then((res) => {
      setStepDefs(res.steps);
      if (res.steps.length > 0) setSelectedStep(res.steps[0].type);
    });
  }, [loadPipeline]);

  function setTab(next: TabId) {
    router.replace(`/rag/pipelines/${pipelineId}?tab=${next}`);
  }

  async function handleValidate() {
    setActionLoading(true);
    setError("");
    try {
      const result = await ragApi.validate(pipelineId);
      setValidation(result.steps);
      setIsValid(result.is_valid);
      setCanActivate(result.can_activate);
      await loadPipeline();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleActivate() {
    setActionLoading(true);
    setError("");
    try {
      await ragApi.activate(pipelineId);
      await loadPipeline();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleQuery() {
    if (!query.trim()) return;
    setQuerying(true);
    setAnswer("");
    setTrace([]);
    setError("");
    try {
      const result = await ragApi.query(pipelineId, query.trim());
      setAnswer(result.answer);
      setTrace(result.trace);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setQuerying(false);
    }
  }

  const currentStepDef = stepDefs.find((s) => s.type === selectedStep);
  const stepValidation = validation.find((v) => v.step_type === selectedStep);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-content-muted">
        Loading RAG workspace...
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-400">
        {error || "RAG pipeline not found"}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-border px-6 py-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/rag/pipelines")}>
          <ArrowLeft className="h-4 w-4" />
          All Pipelines
        </Button>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-content-primary">{pipeline.name}</h1>
              <Badge variant={pipeline.status === "active" ? "success" : "default"}>
                {pipeline.status}
              </Badge>
            </div>
            {pipeline.description && (
              <p className="mt-0.5 text-sm text-content-secondary">{pipeline.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleValidate} disabled={actionLoading}>
              <ShieldCheck className="h-4 w-4" />
              Validate
            </Button>
            {canActivate && pipeline.status !== "active" && (
              <Button size="sm" onClick={handleActivate} disabled={actionLoading}>
                Activate
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-1 border-b border-surface-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.id ? "text-accent" : "text-content-secondary hover:text-content-primary"
              )}
            >
              {t.label}
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "designer" && (
          <RagDesignerCanvas
            pipelineId={pipelineId}
            initialGraph={pipeline.graph_definition as { nodes: never[]; edges: never[] }}
            onSaved={loadPipeline}
          />
        )}

        {tab === "configure" && (
          <div className="flex gap-4">
            <div className="w-56 shrink-0 space-y-1">
              {stepDefs.map((step) => {
                const v = validation.find((x) => x.step_type === step.type);
                const configured = Boolean(pipeline.step_configs[step.type]);
                return (
                  <button
                    key={step.type}
                    type="button"
                    onClick={() => setSelectedStep(step.type)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm",
                      selectedStep === step.type
                        ? "bg-accent-muted text-accent"
                        : "text-content-secondary hover:bg-surface-hover"
                    )}
                  >
                    <span>{step.label}</span>
                    {v?.status === "valid" || configured ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {currentStepDef && (
              <div className="flex-1">
                <RagStepConfigPanel
                  pipelineId={pipelineId}
                  step={currentStepDef}
                  config={pipeline.step_configs[currentStepDef.type] || currentStepDef.defaults}
                  validation={stepValidation}
                  onSaved={loadPipeline}
                />
              </div>
            )}
          </div>
        )}

        {tab === "validate" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="enterprise-panel p-5">
              <h3 className="font-semibold text-content-primary">Step Validation</h3>
              <p className="mt-1 text-sm text-content-secondary">
                Validates each RAG step against required fields and reference guidelines.
              </p>
              <Button className="mt-4" onClick={handleValidate} disabled={actionLoading}>
                {actionLoading ? "Validating..." : "Run Validation"}
              </Button>
            </div>
            {validation.length > 0 && (
              <div className="enterprise-panel divide-y divide-surface-border">
                {validation.map((v) => (
                  <div key={v.step_type} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-content-primary">{v.step_type}</span>
                      <Badge variant={v.status === "valid" ? "success" : "warning"}>{v.status}</Badge>
                    </div>
                    {v.reference && (
                      <p className="mt-2 text-xs text-content-muted">Reference: {v.reference}</p>
                    )}
                    {v.errors.length > 0 && (
                      <ul className="mt-2 text-xs text-red-400">
                        {v.errors.map((e) => <li key={e}>• {e}</li>)}
                      </ul>
                    )}
                    {v.warnings.length > 0 && (
                      <ul className="mt-1 text-xs text-amber-400">
                        {v.warnings.map((w) => <li key={w}>• {w}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isValid && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                All steps validated successfully. {canActivate ? "Ready to activate." : ""}
              </div>
            )}
          </div>
        )}

        {tab === "playground" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="enterprise-panel p-4">
                <h3 className="mb-3 text-sm font-semibold text-content-primary">Query RAG</h3>
                <textarea
                  className="enterprise-input mb-3"
                  rows={4}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question to see live execution flow..."
                />
                <Button onClick={handleQuery} disabled={querying || !query.trim()}>
                  <Play className="h-4 w-4" />
                  {querying ? "Running..." : "Run Query"}
                </Button>
              </div>
              {answer && (
                <div className="enterprise-panel p-4">
                  <h3 className="mb-2 text-sm font-semibold text-content-primary">Answer</h3>
                  <p className="text-sm text-content-secondary whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </div>
            <LiveExecutionFlow trace={trace} />
          </div>
        )}
      </div>
    </div>
  );
}
