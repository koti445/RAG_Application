/**
 * Shared API contracts between frontend and backend.
 * Pipeline graph types align with React Flow (@xyflow/react).
 */

export type NodeCategory =
  | "input"
  | "transform"
  | "index"
  | "retrieve"
  | "memory"
  | "generate"
  | "output"
  | "utility";

export interface PipelineNodeData {
  label: string;
  config: Record<string, unknown>;
  category: NodeCategory;
}

export interface PipelineGraph {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: PipelineNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

export interface PlaygroundResponse {
  answer: string;
  sources: Array<{ document_id: string; chunk_text: string; score: number }>;
  trace: Array<{ node_id: string; type: string; latency_ms: number }>;
  conversation_id?: string;
}

export interface CompareResponse {
  query: string;
  variant_a: PlaygroundResponse & { latency_ms: number };
  variant_b: PlaygroundResponse & { latency_ms: number };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
}
