"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RagComponentCreateModal } from "@/components/rag/RagComponentCreateModal";
import type { CatalogStepDefinition, RagComponent } from "@/lib/api/rag-components";
import { ragComponentApi } from "@/lib/api/rag-components";
import { RAG_STEP_SLUGS } from "@/config/rag-catalog";
import { cn } from "@/lib/utils";

export type StepValidationState = "idle" | "valid" | "invalid" | "pending";

interface RagComponentSelectorProps {
  stepType: string;
  label: string;
  description: string;
  reference: string;
  required?: boolean;
  value: string | null;
  onChange: (componentId: string | null, component?: RagComponent) => void;
  runtimeFields?: string[];
  runtimeValues?: Record<string, unknown>;
  onRuntimeChange?: (field: string, value: unknown) => void;
  validationState?: StepValidationState;
  validationMessages?: string[];
  onValidate?: () => void;
}

export function RagComponentSelector({
  stepType,
  label,
  description,
  reference,
  required = true,
  value,
  onChange,
  runtimeFields = [],
  runtimeValues = {},
  onRuntimeChange,
  validationState = "idle",
  validationMessages = [],
  onValidate,
}: RagComponentSelectorProps) {
  const [definition, setDefinition] = useState<CatalogStepDefinition | null>(null);
  const [options, setOptions] = useState<RagComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [validating, setValidating] = useState(false);
  const [localValidation, setLocalValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);

  const catalogSlug = Object.entries(RAG_STEP_SLUGS).find(([, t]) => t === stepType)?.[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, list] = await Promise.all([
        ragComponentApi.getCatalog(),
        ragComponentApi.list(stepType),
      ]);
      setDefinition(catalog.items.find((d) => d.step_type === stepType) ?? null);
      setOptions(list.items);
    } finally {
      setLoading(false);
    }
  }, [stepType]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = options.find((o) => o.id === value);

  async function handleValidate() {
    if (!value) return;
    setValidating(true);
    setLocalValidation(null);
    try {
      const result = await ragComponentApi.validate(stepType, value);
      setLocalValidation({ valid: result.is_valid, errors: result.errors, warnings: result.warnings });
      await load();
      onValidate?.();
    } catch (e) {
      setLocalValidation({ valid: false, errors: [e instanceof Error ? e.message : "Validation failed"], warnings: [] });
    } finally {
      setValidating(false);
    }
  }

  async function handleCreated(id: string) {
    await load();
    const list = await ragComponentApi.list(stepType);
    const comp = list.items.find((o) => o.id === id);
    setOptions(list.items);
    onChange(id, comp);
  }

  const statusIcon =
    validationState === "valid" || localValidation?.valid || selected?.status === "validated" || selected?.status === "active"
      ? "valid"
      : validationState === "invalid" || localValidation?.valid === false
        ? "invalid"
        : "idle";

  return (
    <div className="enterprise-panel p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-content-primary">
              {label}
              {required && <span className="text-accent"> *</span>}
            </h3>
            {statusIcon === "valid" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {statusIcon === "invalid" && <AlertCircle className="h-4 w-4 text-red-400" />}
            {selected && (
              <Badge variant={selected.status === "active" ? "success" : selected.status === "validated" ? "accent" : "default"}>
                {selected.status}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-content-secondary">{description}</p>
        </div>
        {catalogSlug && (
          <Link href={`/rag/${catalogSlug}`} className="flex items-center gap-1 text-xs text-content-muted hover:text-accent">
            Catalog <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      <p className="mb-3 rounded-md border border-accent/15 bg-accent/5 px-3 py-2 text-xs text-content-secondary">
        <span className="font-medium text-content-primary">Reference: </span>{reference}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="enterprise-input flex-1"
          value={value ?? ""}
          onChange={(e) => {
            const id = e.target.value || null;
            onChange(id, options.find((o) => o.id === id));
          }}
          disabled={loading}
        >
          <option value="">{loading ? "Loading..." : `Select ${label}...`}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name} ({opt.status})
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" type="button" onClick={() => setShowCreate(true)} disabled={!definition}>
          <Plus className="h-4 w-4" />
          Create
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={handleValidate}
          disabled={!value || validating}
        >
          <ShieldCheck className={cn("h-4 w-4", validating && "animate-pulse")} />
          {validating ? "Validating..." : "Validate"}
        </Button>
      </div>

      {options.length === 0 && !loading && (
        <p className="mt-2 text-xs text-amber-400">
          No {label.toLowerCase()} found. Click Create to add one.
        </p>
      )}

      {runtimeFields.length > 0 && value && (
        <div className="mt-4 grid gap-3 border-t border-surface-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {runtimeFields.map((field) => (
            <div key={field}>
              <label className="mb-1 block text-xs font-medium text-content-muted">
                {field.replace(/_/g, " ")}
              </label>
              {field === "strategy" ? (
                <select
                  className="enterprise-input"
                  value={String(runtimeValues[field] ?? "")}
                  onChange={(e) => onRuntimeChange?.(field, e.target.value)}
                >
                  {stepType === "retrieval" && (
                    <>
                      <option value="semantic">Semantic</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="mmr">MMR</option>
                    </>
                  )}
                  {stepType === "chunking" && (
                    <>
                      <option value="recursive">Recursive</option>
                      <option value="semantic">Semantic</option>
                      <option value="fixed">Fixed</option>
                    </>
                  )}
                </select>
              ) : (
                <input
                  type="number"
                  step={field === "temperature" || field === "top_p" || field === "score_threshold" ? "0.01" : "1"}
                  className="enterprise-input"
                  value={Number(runtimeValues[field] ?? 0)}
                  onChange={(e) => onRuntimeChange?.(field, Number(e.target.value))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {(localValidation?.errors.length || validationMessages.length) ? (
        <ul className="mt-2 space-y-1 text-xs text-red-400">
          {(localValidation?.errors ?? validationMessages).map((e) => <li key={e}>• {e}</li>)}
        </ul>
      ) : null}
      {localValidation?.warnings.length ? (
        <ul className="mt-1 space-y-1 text-xs text-amber-400">
          {localValidation.warnings.map((w) => <li key={w}>• {w}</li>)}
        </ul>
      ) : null}

      {showCreate && definition && (
        <RagComponentCreateModal
          stepType={stepType}
          definition={definition}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            handleCreated(id);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
