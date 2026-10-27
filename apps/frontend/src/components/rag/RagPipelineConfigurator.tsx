"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RagComponentSelector, type StepValidationState } from "@/components/rag/RagComponentSelector";
import type { RagPipeline, StepValidation } from "@/lib/api/rag";
import { ragApi } from "@/lib/api/rag";

export interface BuilderStepDef {
  step_type: string;
  label: string;
  description: string;
  reference: string;
  required: boolean;
  runtime_fields: string[];
}

interface RagPipelineConfiguratorProps {
  pipeline: RagPipeline;
  onSaved: (pipeline: RagPipeline) => void;
  onContinue: () => void;
}

export function RagPipelineConfigurator({ pipeline, onSaved, onContinue }: RagPipelineConfiguratorProps) {
  const [steps, setSteps] = useState<BuilderStepDef[]>([]);
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [runtimeOverrides, setRuntimeOverrides] = useState<Record<string, Record<string, unknown>>>({});
  const [stepValidation, setStepValidation] = useState<Record<string, StepValidationState>>({});
  const [pipelineValidation, setPipelineValidation] = useState<StepValidation[]>([]);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ragApi.getBuilderSteps().then((res) => setSteps(res.steps)).catch(() => {});
    const existing = pipeline.step_bindings as Record<string, string> | undefined;
    if (existing) setBindings(existing);
    const configs = pipeline.step_configs || {};
    const overrides: Record<string, Record<string, unknown>> = {};
    for (const step of Object.keys(configs)) {
      const cfg = configs[step];
      if (cfg.temperature !== undefined || cfg.top_k !== undefined || cfg.top_p !== undefined) {
        overrides[step] = {
          ...(cfg.strategy !== undefined && { strategy: cfg.strategy }),
          ...(cfg.temperature !== undefined && { temperature: cfg.temperature }),
          ...(cfg.top_k !== undefined && { top_k: cfg.top_k }),
          ...(cfg.top_p !== undefined && { top_p: cfg.top_p }),
          ...(cfg.chunk_size !== undefined && { chunk_size: cfg.chunk_size }),
          ...(cfg.chunk_overlap !== undefined && { chunk_overlap: cfg.chunk_overlap }),
          ...(cfg.score_threshold !== undefined && { score_threshold: cfg.score_threshold }),
        };
      }
    }
    setRuntimeOverrides(overrides);
  }, [pipeline]);

  function setBinding(stepType: string, id: string | null) {
    setBindings((prev) => {
      const next = { ...prev };
      if (id) next[stepType] = id;
      else delete next[stepType];
      return next;
    });
    setStepValidation((prev) => ({ ...prev, [stepType]: "idle" }));
  }

  function setRuntime(stepType: string, field: string, value: unknown) {
    setRuntimeOverrides((prev) => ({
      ...prev,
      [stepType]: { ...prev[stepType], [field]: value },
    }));
  }

  const allBound = steps.every((s) => !s.required || bindings[s.step_type]);

  async function handleSaveBindings() {
    if (!allBound) {
      setError("Please select all required components before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await ragApi.updateBindings(pipeline.id, bindings, runtimeOverrides);
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save bindings");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidateAll() {
    if (!allBound) {
      setError("Select all required components first.");
      return;
    }
    setValidating(true);
    setError("");
    try {
      await ragApi.updateBindings(pipeline.id, bindings, runtimeOverrides);
      const result = await ragApi.validate(pipeline.id);
      setPipelineValidation(result.steps);
      const states: Record<string, StepValidationState> = {};
      for (const s of result.steps) {
        states[s.step_type] = s.status === "valid" ? "valid" : "invalid";
      }
      setStepValidation(states);
      if (result.is_valid) {
        const updated = await ragApi.get(pipeline.id);
        onSaved(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  }

  const requiredTypes = steps.filter((s) => s.required).map((s) => s.step_type);
  const allValid =
    (pipelineValidation.length > 0 &&
      requiredTypes.every((t) => pipelineValidation.find((v) => v.step_type === t)?.status === "valid")) ||
    pipeline.status === "validated" ||
    pipeline.status === "active";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="enterprise-panel border-accent/20 bg-accent/5 p-4">
        <h3 className="text-sm font-semibold text-content-primary">Configure RAG Pipeline Steps</h3>
        <p className="mt-1 text-xs text-content-secondary">
          Select a validated catalog entity for each step. Use <strong>Create</strong> if none exists,
          then <strong>Validate</strong> each step before continuing.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-4">
        {steps.map((step) => (
          <RagComponentSelector
            key={step.step_type}
            stepType={step.step_type}
            label={step.label}
            description={step.description}
            reference={step.reference}
            required={step.required}
            value={bindings[step.step_type] ?? null}
            onChange={(id, comp) => {
              setBinding(step.step_type, id);
              if (comp && step.runtime_fields.length) {
                const runtime: Record<string, unknown> = {};
                for (const field of step.runtime_fields) {
                  if (comp.config[field] !== undefined) runtime[field] = comp.config[field];
                }
                setRuntimeOverrides((prev) => ({
                  ...prev,
                  [step.step_type]: { ...prev[step.step_type], ...runtime },
                }));
              }
            }}
            runtimeFields={step.runtime_fields}
            runtimeValues={runtimeOverrides[step.step_type] ?? {}}
            onRuntimeChange={(field, value) => setRuntime(step.step_type, field, value)}
            validationState={stepValidation[step.step_type] ?? "idle"}
            validationMessages={pipelineValidation.find((v) => v.step_type === step.step_type)?.errors ?? []}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveBindings} disabled={saving || !allBound}>
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
          <Button onClick={handleValidateAll} disabled={validating || !allBound}>
            <ShieldCheck className="h-4 w-4" />
            {validating ? "Validating..." : "Validate All Steps"}
          </Button>
        </div>
        <Button onClick={onContinue} disabled={!allValid}>
          Continue to Design
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {pipelineValidation.length > 0 && (
        <div className="enterprise-panel p-4">
          <h4 className="mb-2 text-sm font-semibold text-content-primary">Validation Summary</h4>
          <ul className="space-y-1 text-xs">
            {pipelineValidation.map((v) => (
              <li key={v.step_type} className={v.status === "valid" ? "text-emerald-400" : "text-red-400"}>
                {v.status === "valid" ? "✓" : "✗"} {v.step_type}
                {v.errors.length > 0 && ` — ${v.errors.join(", ")}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
