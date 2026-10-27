"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Cloud,
  Code2,
  Cpu,
  Database,
  FileText,
  Globe,
  Grid3X3,
  Info,
  Layers,
  Lightbulb,
  Network,
  PlayCircle,
  Repeat,
  Search,
  Share2,
  Shield,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  CHUNKING_STRATEGIES,
  DATABASE_STORES,
  DEFAULT_FORM_STATE,
  EMBEDDING_MODELS,
  formStateToApiConfig,
  getTemplateById,
  RAG_PROVIDERS,
  RERANKING_MODELS,
  STORE_TYPES,
  type PipelineFormState,
} from "@/config/rag-pipeline-create";
import { ragApi } from "@/lib/api/rag";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  cloud: Cloud,
  globe: Globe,
  database: Database,
  network: Network,
  search: Search,
  layers: Layers,
  share: Share2,
  file: FileText,
  lightbulb: Lightbulb,
  grid: Grid3X3,
  repeat: Repeat,
  code: Code2,
};

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 flex justify-between text-xs font-medium text-content-muted">
        <span>{label}</span>
        <span className="text-accent">{display}</span>
      </label>
      <input
        type="range"
        className="rag-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between text-[10px] text-content-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && <p className="mt-1 text-xs text-content-muted">{hint}</p>}
    </div>
  );
}

export function RagPipelineCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const appliedTemplate = getTemplateById(templateId);

  const [form, setForm] = useState<PipelineFormState>(() =>
    appliedTemplate ? { ...appliedTemplate.config } : { ...DEFAULT_FORM_STATE }
  );
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(appliedTemplate ? { ...appliedTemplate.config } : { ...DEFAULT_FORM_STATE });
  }, [templateId]);

  const embedding = EMBEDDING_MODELS.find((m) => m.id === form.embedding_model);
  const providerName = RAG_PROVIDERS.find((p) => p.id === form.provider)?.name ?? form.provider;
  const storeLabel = STORE_TYPES.find((s) => s.id === form.store_type)?.title ?? form.store_type;
  const dbLabel = DATABASE_STORES.find((d) => d.id === form.database_store)?.label ?? form.database_store;
  const chunkingLabel = CHUNKING_STRATEGIES.find((s) => s.id === form.chunking_strategy)?.name ?? form.chunking_strategy;

  const summary = useMemo(
    () => [
      { label: "Provider", value: providerName },
      { label: "Store Type", value: storeLabel },
      { label: "Database Store", value: dbLabel },
      { label: "Chunking", value: `${chunkingLabel.toLowerCase()} (${form.chunk_size} tokens)` },
      { label: "Embedding", value: form.embedding_model },
      { label: "Retrieval", value: `Top ${form.retrieval_top_k} @ ${Math.round(form.retrieval_similarity_threshold * 100)}%` },
      { label: "Reranking", value: form.reranking_enabled ? `Yes (${form.reranking_model})` : "No" },
    ],
    [form, providerName, storeLabel, dbLabel, chunkingLabel]
  );

  function update<K extends keyof PipelineFormState>(key: K, value: PipelineFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await ragApi.testConnection(form.database_store, form.store_type);
      setTestResult(res);
    } catch (e) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : "Connection test failed" });
    } finally {
      setTesting(false);
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setError("Pipeline name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const configuration = formStateToApiConfig(form);
      const pipeline = await ragApi.createWithConfig({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        template_id: form.template_id ?? undefined,
        configuration,
        activate: form.status_intent === "active",
      });
      router.push(`/rag/pipelines/${pipeline.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create pipeline");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold text-content-primary">Create RAG Pipeline</h1>
        </div>
        <button type="button" onClick={() => router.push("/rag/pipelines")} className="text-content-muted hover:text-content-primary">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <button
          type="button"
          onClick={() => router.push("/rag/pipelines/new")}
          className="mb-4 flex items-center gap-1 text-sm text-content-secondary hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </button>

        {appliedTemplate && (
          <div className="rag-info-box">
            <Info className="h-4 w-4 shrink-0 text-blue-400" />
            <div>
              <strong className="text-content-primary">Template Applied:</strong> {appliedTemplate.name}. You can customize all settings below.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* RAG Provider */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title"><Cloud className="h-4 w-4 text-accent" /> RAG Provider</h3>
          <p className="mb-3 text-xs text-content-secondary">Use the built-in PHTN.ai RAG engine or connect to your own external RAG service.</p>
          <div className="rag-card-grid">
            {RAG_PROVIDERS.map((p) => {
              const Icon = ICON_MAP[p.icon] ?? Cpu;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!p.enabled}
                  onClick={() => update("provider", p.id)}
                  className={cn("rag-select-card", form.provider === p.id && "selected", !p.enabled && "opacity-40")}
                >
                  <Icon className="mb-2 h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-content-primary">{p.name}</span>
                  <span className="mt-1 text-xs text-content-muted">{p.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Database Store Type */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Database Store Type</h3>
          <p className="mb-3 text-xs text-content-secondary">Choose how knowledge bases using this pipeline store and retrieve content.</p>
          <div className="rag-card-grid">
            {STORE_TYPES.map((s) => {
              const Icon = ICON_MAP[s.icon] ?? Layers;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.enabled}
                  onClick={() => update("store_type", s.id)}
                  className={cn("rag-select-card", form.store_type === s.id && "selected", !s.enabled && "opacity-40")}
                >
                  <Icon className="mb-2 h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-content-primary">{s.title}</span>
                  <span className="mt-1 text-xs text-content-muted">{s.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Database Store */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Database Store</h3>
          <p className="mb-3 text-xs text-content-secondary">Select the database store used for retrieval.</p>
          <div className="flex flex-wrap gap-2">
            {DATABASE_STORES.map((db) => (
              <button
                key={db.id}
                type="button"
                disabled={!db.enabled}
                onClick={() => update("database_store", db.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                  form.database_store === db.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-surface-border bg-surface-overlay text-content-secondary hover:border-accent/30"
                )}
              >
                <Database className="h-4 w-4" />
                {db.label}
              </button>
            ))}
          </div>
        </section>

        {/* Identity & Verification */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title"><Shield className="h-4 w-4 text-accent" /> Identity &amp; Verification</h3>
          <p className="mb-3 text-xs text-content-secondary">Bind credentials and verify configuration before creating.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-1 text-xs font-medium text-content-muted">
                <Shield className="h-3.5 w-3.5" /> Identity Federation
              </label>
              <div className="rounded-md border border-surface-border bg-surface-overlay px-3 py-3 text-xs text-content-muted">
                <Info className="mb-1 inline h-3.5 w-3.5" /> No identity bindings configured yet. Connect credentials in Settings when available.
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-content-muted">Test Configuration</label>
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testing}>
                <PlayCircle className="h-4 w-4" />
                {testing ? "Testing..." : "Test Database Store Connection"}
              </Button>
              {testResult && (
                <p className={cn("mt-2 text-xs", testResult.success ? "text-emerald-400" : "text-red-400")}>
                  {testResult.message}
                </p>
              )}
              <p className="mt-1 text-xs text-content-muted">Verify database store is accessible before creating</p>
            </div>
          </div>
        </section>

        {/* Basic Information */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">Pipeline Name *</label>
              <input className="enterprise-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g., Technical Documentation Pipeline" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">Description</label>
              <textarea className="enterprise-input" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the purpose and use case..." />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-content-muted">Status</label>
              <div className="flex gap-2">
                {(["draft", "active"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update("status_intent", s)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm capitalize",
                      form.status_intent === s ? "border-accent bg-accent/10 text-accent" : "border-surface-border text-content-secondary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-content-muted">Draft pipelines can be tested but not used in Knowledge Bases</p>
            </div>
          </div>
        </section>

        {/* Chunking Strategy */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Chunking Strategy</h3>
          <div className="rag-card-grid lg:grid-cols-4">
            {CHUNKING_STRATEGIES.map((s) => {
              const Icon = ICON_MAP[s.icon] ?? Lightbulb;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => update("chunking_strategy", s.id)}
                  className={cn("rag-select-card", form.chunking_strategy === s.id && "selected")}
                >
                  <Icon className="mb-2 h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="mt-1 text-xs text-content-muted">{s.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Chunking Parameters */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Chunking Parameters</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <SliderField label="Chunk Size" value={form.chunk_size} min={200} max={2000} step={100} display={`${form.chunk_size} tokens`} onChange={(v) => update("chunk_size", v)} />
            <SliderField label="Chunk Overlap" value={form.chunk_overlap} min={0} max={500} step={25} display={`${form.chunk_overlap} tokens`} onChange={(v) => update("chunk_overlap", v)} />
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm text-content-secondary">
              <input type="checkbox" checked={form.respect_sentence_boundaries} onChange={(e) => update("respect_sentence_boundaries", e.target.checked)} />
              Respect sentence boundaries
            </label>
            <label className="flex items-center gap-2 text-sm text-content-secondary">
              <input type="checkbox" checked={form.respect_paragraph_boundaries} onChange={(e) => update("respect_paragraph_boundaries", e.target.checked)} />
              Respect paragraph boundaries
            </label>
          </div>
        </section>

        {/* Embedding */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Embedding Configuration</h3>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-content-muted">Embedding Model *</label>
            <select className="enterprise-input" value={form.embedding_model} onChange={(e) => update("embedding_model", e.target.value)}>
              {EMBEDDING_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-surface-border bg-surface-overlay p-3">
              <span className="text-xs text-content-muted">Provider</span>
              <p className="text-sm font-medium text-content-primary">{embedding?.provider}</p>
            </div>
            <div className="rounded-md border border-surface-border bg-surface-overlay p-3">
              <span className="text-xs text-content-muted">Dimensions</span>
              <p className="text-sm font-medium text-content-primary">{embedding?.dimensions}</p>
            </div>
            <div className="rounded-md border border-surface-border bg-surface-overlay p-3">
              <span className="text-xs text-content-muted">Batch Size</span>
              <input type="number" className="enterprise-input mt-1" min={1} max={500} value={form.embedding_batch_size} onChange={(e) => update("embedding_batch_size", Number(e.target.value))} />
            </div>
          </div>
        </section>

        {/* Retrieval */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title"><Search className="h-4 w-4 text-accent" /> Retrieval Configuration</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <SliderField label="Top K Results" value={form.retrieval_top_k} min={1} max={50} step={1} display={String(form.retrieval_top_k)} hint="Number of chunks to retrieve before reranking" onChange={(v) => update("retrieval_top_k", v)} />
            <SliderField label="Similarity Threshold" value={form.retrieval_similarity_threshold} min={0.5} max={0.95} step={0.05} display={`${Math.round(form.retrieval_similarity_threshold * 100)}%`} hint="Minimum similarity score to include results" onChange={(v) => update("retrieval_similarity_threshold", v)} />
          </div>
        </section>

        {/* Reranking */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Reranking (Optional)</h3>
          <label className="mb-3 flex items-center gap-2 text-sm text-content-secondary">
            <input type="checkbox" checked={form.reranking_enabled} onChange={(e) => update("reranking_enabled", e.target.checked)} />
            Enable Reranking
          </label>
          <p className="mb-4 text-xs text-content-muted">Reranking improves result quality by re-scoring retrieved chunks with a specialized model</p>
          {form.reranking_enabled && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-content-muted">Reranking Model</label>
                <select className="enterprise-input" value={form.reranking_model} onChange={(e) => update("reranking_model", e.target.value)}>
                  {RERANKING_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <SliderField label="Rerank Top N" value={form.rerank_top_n} min={1} max={5} step={1} display={String(form.rerank_top_n)} hint="Final number of results after reranking" onChange={(v) => update("rerank_top_n", v)} />
            </div>
          )}
        </section>

        {/* Advanced */}
        <section className="rag-create-section">
          <h3 className="rag-create-section-title"><SlidersHorizontal className="h-4 w-4 text-accent" /> Advanced Options</h3>
          <div className="space-y-3">
            <label className="flex items-start gap-2 text-sm text-content-secondary">
              <input type="checkbox" checked={form.metadata_filtering} onChange={(e) => update("metadata_filtering", e.target.checked)} className="mt-1" />
              <span><strong className="text-content-primary">Enable Metadata Filtering</strong><br /><span className="text-xs text-content-muted">Filter results by document metadata (source, date, author, tags)</span></span>
            </label>
            <label className="flex items-start gap-2 text-sm text-content-secondary">
              <input type="checkbox" checked={form.hybrid_search} onChange={(e) => update("hybrid_search", e.target.checked)} className="mt-1" />
              <span><strong className="text-content-primary">Enable Hybrid Search</strong><br /><span className="text-xs text-content-muted">Combine semantic search with keyword search for better recall</span></span>
            </label>
          </div>
        </section>

        {/* Summary */}
        <div className="rag-summary-box">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content-primary">
            <Check className="h-4 w-4 text-accent" /> Pipeline Summary
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {summary.map((item) => (
              <div key={item.label} className="flex gap-2 text-xs">
                <span className="text-content-muted">{item.label}:</span>
                <span className="font-medium text-content-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-surface-border px-6 py-4">
        <Button variant="outline" onClick={() => router.push("/rag/pipelines")}>Cancel</Button>
        <Button onClick={handleCreate} disabled={saving}>
          <Check className="h-4 w-4" />
          {saving ? "Creating..." : "Create Pipeline"}
        </Button>
      </div>
    </div>
  );
}
