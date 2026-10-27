"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileUploadZone } from "@/components/rag/FileUploadZone";
import type { CatalogStepDefinition } from "@/lib/api/rag-components";
import { ragComponentApi } from "@/lib/api/rag-components";

interface RagComponentCreateModalProps {
  stepType: string;
  definition: CatalogStepDefinition;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function RagComponentCreateModal({
  stepType,
  definition,
  onClose,
  onCreated,
}: RagComponentCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>(definition.defaults);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDataIngestion = stepType === "data_ingestion";
  const allowedExtensions = (config.allowed_extensions as string[]) ?? ["pdf", "docx", "txt", "csv"];
  const maxFileSizeMb = Number(config.max_file_size_mb ?? 50);

  async function handleSave() {
    if (!name.trim()) return;
    if (isDataIngestion && files.length === 0) {
      setError("Please upload at least one document");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await ragComponentApi.create(stepType, name.trim(), description.trim() || undefined, config);
      if (isDataIngestion && files.length > 0) {
        await ragComponentApi.uploadDocuments(created.id, files);
      }
      onCreated(created.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="enterprise-panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-content-primary">Create {definition.label}</h3>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 text-xs text-content-secondary">{definition.reference}</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">Name *</label>
            <input className="enterprise-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-content-muted">Description</label>
            <textarea className="enterprise-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {isDataIngestion && (
            <FileUploadZone
              files={files}
              onChange={setFiles}
              allowedExtensions={allowedExtensions}
              maxSizeMb={maxFileSizeMb}
            />
          )}

          {Object.entries(definition.defaults).map(([key, defaultVal]) => (
            <ConfigField
              key={key}
              keyName={key}
              defaultVal={defaultVal}
              required={definition.required_fields.includes(key)}
              value={config[key]}
              onChange={(v) => setConfig({ ...config, [key]: v })}
            />
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Creating..." : isDataIngestion ? "Create & Upload" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfigField({
  keyName,
  defaultVal,
  required,
  value,
  onChange,
}: {
  keyName: string;
  defaultVal: unknown;
  required: boolean;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = keyName.replace(/_/g, " ");
  if (typeof defaultVal === "boolean") {
    return (
      <div>
        <label className="mb-1 flex items-center gap-2 text-xs font-medium text-content-muted">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {label}{required && <span className="text-accent">*</span>}
        </label>
      </div>
    );
  }
  if (typeof defaultVal === "number") {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-content-muted">{label}{required && <span className="text-accent"> *</span>}</label>
        <input type="number" className="enterprise-input" value={Number(value ?? defaultVal)} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    );
  }
  if (Array.isArray(defaultVal)) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-content-muted">{label}{required && <span className="text-accent"> *</span>}</label>
        <input
          className="enterprise-input"
          value={Array.isArray(value) ? (value as string[]).join(", ") : String(value ?? "")}
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Comma-separated"
        />
      </div>
    );
  }
  if (keyName === "system_prompt") {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-content-muted">{label}{required && <span className="text-accent"> *</span>}</label>
        <textarea className="enterprise-input font-mono text-xs" rows={3} value={String(value ?? defaultVal)} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-content-muted">{label}{required && <span className="text-accent"> *</span>}</label>
      <input className="enterprise-input" value={String(value ?? defaultVal)} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
