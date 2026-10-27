export interface RagComponent {
  id: string;
  step_type: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  status: string;
  validation_errors: string[];
  validation_warnings: string[];
  created_at: string;
  updated_at: string;
}

export interface CatalogStepDefinition {
  step_type: string;
  label: string;
  tab_label: string;
  description: string;
  reference: string;
  defaults: Record<string, unknown>;
  required_fields: string[];
}

export interface RagComponentDocument {
  id: string;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
  created_at: string;
}

export interface ComponentValidation {
  id: string;
  step_type: string;
  status: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  reference: string | null;
}

async function componentFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/rag/components/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const ragComponentApi = {
  getCatalog: () => componentFetch<{ items: CatalogStepDefinition[] }>("catalog"),
  list: (stepType: string) =>
    componentFetch<{ items: RagComponent[]; total: number }>(stepType),
  create: (stepType: string, name: string, description?: string, config?: Record<string, unknown>) =>
    componentFetch<RagComponent>(stepType, {
      method: "POST",
      body: JSON.stringify({ name, description, config }),
    }),
  update: (stepType: string, id: string, data: { name?: string; description?: string; config?: Record<string, unknown> }) =>
    componentFetch<RagComponent>(`${stepType}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  validate: (stepType: string, id: string) =>
    componentFetch<ComponentValidation>(`${stepType}/${id}/validate`, { method: "POST" }),
  activate: (stepType: string, id: string) =>
    componentFetch<RagComponent>(`${stepType}/${id}/activate`, { method: "POST" }),
  delete: (stepType: string, id: string) =>
    componentFetch<void>(`${stepType}/${id}`, { method: "DELETE" }),
  listDocuments: (componentId: string) =>
    componentFetch<{ items: RagComponentDocument[]; total: number }>(
      `data_ingestion/${componentId}/documents`
    ),
  uploadDocuments: async (componentId: string, files: File[]) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    const res = await fetch(`/api/rag/components/data_ingestion/${componentId}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || "Upload failed");
    }
    return res.json() as Promise<{ items: RagComponentDocument[]; total: number }>;
  },
};
