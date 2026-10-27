import type { TabItem } from "@/components/ui/TabBar";

/** URL slug → backend step_type */
export const RAG_STEP_SLUGS: Record<string, string> = {
  documents: "data_ingestion",
  "knowledge-bases": "knowledge_base",
  chunking: "chunking",
  embedding: "embedding",
  "vector-store": "vector_store",
  search: "retrieval",
  reranking: "reranking",
  memory: "memory",
  generation: "generation",
  guardrails: "guardrails",
  connectors: "connectors",
};

export const RAG_CATALOG_TABS: TabItem[] = [
  { id: "knowledge-bases", label: "Knowledge Bases", href: "/rag/knowledge-bases" },
  { id: "documents", label: "Documents", href: "/rag/documents" },
  { id: "chunking", label: "Chunking", href: "/rag/chunking" },
  { id: "embedding", label: "Embedding", href: "/rag/embedding" },
  { id: "vector-store", label: "Vector Store", href: "/rag/vector-store" },
  { id: "search", label: "Search & Test", href: "/rag/search" },
  { id: "reranking", label: "Reranking", href: "/rag/reranking" },
  { id: "memory", label: "Memory", href: "/rag/memory" },
  { id: "generation", label: "Generation", href: "/rag/generation" },
  { id: "guardrails", label: "Guardrails", href: "/rag/guardrails" },
  { id: "pipelines", label: "RAG Pipelines", href: "/rag/pipelines" },
  { id: "connectors", label: "Connectors", href: "/rag/connectors" },
];

export function slugToStepType(slug: string): string | undefined {
  return RAG_STEP_SLUGS[slug];
}

export function getCatalogTab(slug: string) {
  return RAG_CATALOG_TABS.find((t) => t.id === slug);
}
