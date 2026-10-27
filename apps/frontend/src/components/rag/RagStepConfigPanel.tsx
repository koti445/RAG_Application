"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { RagStepDefinition, StepValidation } from "@/lib/api/rag";
import { ragApi } from "@/lib/api/rag";

interface RagStepConfigPanelProps {
  pipelineId: string;
  step: RagStepDefinition;
  config: Record<string, unknown>;
  validation?: StepValidation;
  onSaved: () => void;
}

export function RagStepConfigPanel({ pipelineId, step, config, validation, onSaved }: RagStepConfigPanelProps) {
  const [form, setForm] = useState<Record<string, unknown>>(config);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(config);
  }, [config]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await ragApi.updateStep(pipelineId, step.type, form);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="enterprise-panel p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-content-primary">{step.label}</h3>
          <p className="mt-1 text-sm text-content-secondary">{step.description}</p>
        </div>
        {validation?.status === "valid" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        {validation?.status === "invalid" && <AlertCircle className="h-5 w-5 text-red-400" />}
      </div>

      <div className="mb-4 flex gap-2 rounded-md border border-accent/20 bg-accent/5 p-3 text-xs text-content-secondary">
        <BookOpen className="h-4 w-4 shrink-0 text-accent" />
        <span><strong className="text-content-primary">Reference:</strong> {step.reference}</span>
      </div>

      <div className="space-y-3">
        {Object.entries(step.defaults).map(([key, defaultVal]) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-content-muted">
              {key.replace(/_/g, " ")}
              {step.required_fields.includes(key) && <span className="text-accent"> *</span>}
            </label>
            {typeof defaultVal === "boolean" ? (
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="rounded border-surface-border"
              />
            ) : typeof defaultVal === "number" ? (
              <input
                type="number"
                value={Number(form[key] ?? defaultVal)}
                onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                className="enterprise-input"
              />
            ) : Array.isArray(defaultVal) ? (
              <input
                type="text"
                value={Array.isArray(form[key]) ? (form[key] as string[]).join(", ") : String(form[key] ?? defaultVal)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="enterprise-input"
                placeholder="Comma-separated values"
              />
            ) : key === "system_prompt" ? (
              <textarea
                rows={4}
                value={String(form[key] ?? defaultVal)}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="enterprise-input font-mono text-xs"
              />
            ) : (
              <input
                type="text"
                value={String(form[key] ?? defaultVal)}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="enterprise-input"
              />
            )}
          </div>
        ))}
      </div>

      {validation?.errors?.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-red-400">
          {validation.errors.map((e) => <li key={e}>• {e}</li>)}
        </ul>
      )}
      {validation?.warnings?.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-amber-400">
          {validation.warnings.map((w) => <li key={w}>• {w}</li>)}
        </ul>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <Button className="mt-4" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Step Configuration"}
      </Button>
    </div>
  );
}
