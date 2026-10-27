"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SearchInput } from "@/components/ui/SearchInput";
import type { CatalogStepDefinition, RagComponent } from "@/lib/api/rag-components";
import { ragComponentApi } from "@/lib/api/rag-components";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "accent"> = {
  draft: "default",
  validated: "accent",
  active: "success",
  archived: "default",
};

interface RagCatalogPageContentProps {
  stepType: string;
  title: string;
  createLabel: string;
}

export function RagCatalogPageContent({ stepType, title, createLabel }: RagCatalogPageContentProps) {
  const [definition, setDefinition] = useState<CatalogStepDefinition | null>(null);
  const [items, setItems] = useState<RagComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RagComponent | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formConfig, setFormConfig] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catalog, list] = await Promise.all([
        ragComponentApi.getCatalog(),
        ragComponentApi.list(stepType),
      ]);
      const def = catalog.items.find((d) => d.step_type === stepType) ?? null;
      setDefinition(def);
      setItems(list.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [stepType]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setFormConfig(definition?.defaults ?? {});
    setShowCreate(true);
  }

  function openEdit(item: RagComponent) {
    setEditing(item);
    setFormName(item.name);
    setFormDesc(item.description ?? "");
    setFormConfig(item.config);
    setShowCreate(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await ragComponentApi.update(stepType, editing.id, {
          name: formName,
          description: formDesc,
          config: formConfig,
        });
      } else {
        await ragComponentApi.create(stepType, formName, formDesc, formConfig);
      }
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(id: string) {
    try {
      await ragComponentApi.validate(stepType, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
    }
  }

  async function handleActivate(id: string) {
    try {
      await ragComponentApi.activate(stepType, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this component?")) return;
    try {
      await ragComponentApi.delete(stepType, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const validatedCount = items.filter((i) => i.status === "validated" || i.status === "active").length;
  const activeCount = items.filter((i) => i.status === "active").length;

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: RagComponent) => (
        <button type="button" onClick={() => openEdit(row)} className="font-medium text-content-primary hover:text-accent">
          {row.name}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: RagComponent) => (
        <Badge variant={STATUS_VARIANT[row.status] || "default"}>{row.status}</Badge>
      ),
    },
    {
      key: "validation",
      header: "Validation",
      render: (row: RagComponent) =>
        row.validation_errors.length > 0 ? (
          <span className="text-xs text-red-400">{row.validation_errors.length} error(s)</span>
        ) : row.status === "validated" || row.status === "active" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <span className="text-xs text-content-muted">Not validated</span>
        ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (row: RagComponent) => (
        <span className="text-content-muted">{new Date(row.updated_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row: RagComponent) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleValidate(row.id)} title="Validate">
            <ShieldCheck className="h-3.5 w-3.5" />
          </Button>
          {row.status === "validated" && (
            <Button variant="ghost" size="sm" onClick={() => handleActivate(row.id)} title="Activate">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
          {definition && <p className="text-sm text-content-secondary">{definition.description}</p>}
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {createLabel}
        </Button>
      </div>

      {definition && (
        <div className="flex gap-2 rounded-md border border-accent/20 bg-accent/5 p-3 text-xs text-content-secondary">
          <BookOpen className="h-4 w-4 shrink-0 text-accent" />
          <span><strong className="text-content-primary">Reference:</strong> {definition.reference}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total" value={items.length} icon={BookOpen} />
        <MetricCard label="Validated" value={validatedCount} icon={ShieldCheck} />
        <MetricCard label="Active" value={activeCount} icon={CheckCircle2} />
      </div>

      <SearchInput placeholder={`Search ${title.toLowerCase()}...`} className="max-w-md" onChange={setSearch} />

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="enterprise-panel py-16 text-center text-sm text-content-muted">Loading...</div>
      ) : (
        <DataTable<RagComponent>
          columns={columns}
          data={filtered}
          emptyMessage={`No ${title.toLowerCase()} yet`}
          emptyDescription={`Create your first ${title.toLowerCase()} configuration, then validate it against the reference guidelines.`}
        />
      )}

      {showCreate && definition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="enterprise-panel w-full max-w-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-content-primary">
                {editing ? "Edit" : "Create"} {definition.label}
              </h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-content-muted hover:text-content-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-content-muted">Name *</label>
                <input className="enterprise-input" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-content-muted">Description</label>
                <textarea className="enterprise-input" rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
              {Object.entries(definition.defaults).map(([key, defaultVal]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-content-muted">
                    {key.replace(/_/g, " ")}
                    {definition.required_fields.includes(key) && <span className="text-accent"> *</span>}
                  </label>
                  {typeof defaultVal === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(formConfig[key])}
                      onChange={(e) => setFormConfig({ ...formConfig, [key]: e.target.checked })}
                    />
                  ) : typeof defaultVal === "number" ? (
                    <input
                      type="number"
                      className="enterprise-input"
                      value={Number(formConfig[key] ?? defaultVal)}
                      onChange={(e) => setFormConfig({ ...formConfig, [key]: Number(e.target.value) })}
                    />
                  ) : key === "system_prompt" ? (
                    <textarea
                      className="enterprise-input font-mono text-xs"
                      rows={4}
                      value={String(formConfig[key] ?? defaultVal)}
                      onChange={(e) => setFormConfig({ ...formConfig, [key]: e.target.value })}
                    />
                  ) : Array.isArray(defaultVal) ? (
                    <input
                      className="enterprise-input"
                      value={Array.isArray(formConfig[key]) ? (formConfig[key] as string[]).join(", ") : String(formConfig[key] ?? "")}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          [key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Comma-separated"
                    />
                  ) : (
                    <input
                      className="enterprise-input"
                      value={String(formConfig[key] ?? defaultVal)}
                      onChange={(e) => setFormConfig({ ...formConfig, [key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formName.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
