export interface RagPipeline {
  id: string;
  name: string;
  description: string | null;
  status: string;
  graph_definition: { nodes: unknown[]; edges: unknown[] };
  step_configs: Record<string, Record<string, unknown>>;
  step_bindings: Record<string, string>;
  validation_results: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RagStepDefinition {
  type: string;
  label: string;
  description: string;
  reference: string;
  defaults: Record<string, unknown>;
  required_fields: string[];
}

export interface StepValidation {
  step_type: string;
  status: string;
  errors: string[];
  warnings: string[];
  reference: string | null;
}

export interface ExecutionTrace {
  node_id: string;
  step_type: string;
  step_label: string | null;
  status: string;
  config_snapshot: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  reference_docs: Record<string, unknown>[];
  latency_ms: number | null;
}

async function ragFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/rag/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || "Request failed");
  }
  return res.json() as Promise<T>;
}

export const ragApi = {
  list: () => ragFetch<{ items: RagPipeline[]; total: number }>(""),
  get: (id: string) => ragFetch<RagPipeline>(id),
  create: (name: string, description?: string) =>
    ragFetch<RagPipeline>("", { method: "POST", body: JSON.stringify({ name, description }) }),
  createWithConfig: (payload: {
    name: string;
    description?: string;
    template_id?: string;
    configuration: Record<string, unknown>;
    activate?: boolean;
  }) =>
    ragFetch<RagPipeline>("", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  testConnection: (database_store: string, store_type: string) =>
    ragFetch<{ success: boolean; message: string; latency_ms: number | null }>("test-connection", {
      method: "POST",
      body: JSON.stringify({ database_store, store_type }),
    }),
  saveGraph: (id: string, graph: { nodes: unknown[]; edges: unknown[] }) =>
    ragFetch<RagPipeline>(`${id}/graph`, { method: "PUT", body: JSON.stringify({ graph_definition: graph }) }),
  updateStep: (id: string, stepType: string, config: Record<string, unknown>) =>
    ragFetch<RagPipeline>(`${id}/steps/${stepType}`, {
      method: "PUT",
      body: JSON.stringify({ step_type: stepType, config }),
    }),
  validate: (id: string) =>
    ragFetch<{ is_valid: boolean; steps: StepValidation[]; can_activate: boolean }>(`${id}/validate`, {
      method: "POST",
    }),
  activate: (id: string) => ragFetch<RagPipeline>(`${id}/activate`, { method: "POST" }),
  query: (id: string, query: string) =>
    ragFetch<{ execution_id: string; answer: string; sources: unknown[]; trace: ExecutionTrace[] }>(
      `${id}/query`,
      { method: "POST", body: JSON.stringify({ query }) }
    ),
  getStepDefinitions: () => ragFetch<{ steps: RagStepDefinition[] }>("steps"),
  getBuilderSteps: () =>
    ragFetch<{ steps: { step_type: string; label: string; description: string; reference: string; required: boolean; runtime_fields: string[] }[] }>(
      "builder/required-steps"
    ),
  updateBindings: (
    id: string,
    bindings: Record<string, string>,
    runtimeOverrides?: Record<string, Record<string, unknown>>
  ) =>
    ragFetch<RagPipeline>(`${id}/bindings`, {
      method: "PUT",
      body: JSON.stringify({ bindings, runtime_overrides: runtimeOverrides ?? {} }),
    }),
};
