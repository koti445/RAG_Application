export interface RagProviderOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface StoreTypeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface DatabaseStoreOption {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ChunkingStrategyOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface EmbeddingModelOption {
  id: string;
  label: string;
  provider: string;
  dimensions: number;
}

export interface RagPipelineTemplate {
  id: string;
  name: string;
  description: string;
  config: PipelineFormState;
}

export interface PipelineFormState {
  provider: string;
  store_type: string;
  database_store: string;
  template_id: string | null;
  status_intent: "draft" | "active";
  name: string;
  description: string;
  chunking_strategy: string;
  chunk_size: number;
  chunk_overlap: number;
  respect_sentence_boundaries: boolean;
  respect_paragraph_boundaries: boolean;
  embedding_model: string;
  embedding_batch_size: number;
  retrieval_top_k: number;
  retrieval_similarity_threshold: number;
  retrieval_top_p: number;
  reranking_enabled: boolean;
  reranking_model: string;
  rerank_top_n: number;
  metadata_filtering: boolean;
  hybrid_search: boolean;
}

export const RAG_PROVIDERS: RagProviderOption[] = [
  { id: "internal", name: "PHTN.ai Internal", description: "Built-in LlamaIndex pipeline", icon: "cpu", enabled: true },
  { id: "azure", name: "Azure AI Search", description: "Azure Cognitive Search", icon: "cloud", enabled: false },
  { id: "custom_http", name: "Custom HTTP", description: "Any REST-based RAG API", icon: "globe", enabled: false },
  { id: "pinecone", name: "Pinecone", description: "Pinecone vector database", icon: "database", enabled: false },
  { id: "weaviate", name: "Weaviate", description: "Weaviate vector search", icon: "network", enabled: false },
  { id: "elasticsearch", name: "Elasticsearch", description: "Elastic vector search", icon: "search", enabled: false },
];

export const STORE_TYPES: StoreTypeOption[] = [
  { id: "vector", title: "Vector", description: "Dense vector embeddings for semantic search", icon: "layers", enabled: true },
  { id: "graph", title: "Graph", description: "Knowledge graph with entity relationships", icon: "share", enabled: true },
  { id: "hybrid", title: "Hybrid", description: "Combines vector + keyword search (BM25)", icon: "intersect", enabled: false },
  { id: "document", title: "Document", description: "Full-text search without embeddings", icon: "file", enabled: false },
];

export const DATABASE_STORES: DatabaseStoreOption[] = [
  { id: "pgvector", label: "PGvector", enabled: true },
  { id: "pinecone", label: "Pinecone", enabled: true },
  { id: "chromadb", label: "ChromaDB", enabled: true },
  { id: "azure_ai_search", label: "Azure AI Search", enabled: true },
];

export const CHUNKING_STRATEGIES: ChunkingStrategyOption[] = [
  { id: "semantic", name: "Semantic", description: "Intelligent chunking based on meaning and context", icon: "lightbulb" },
  { id: "fixed", name: "Fixed Size", description: "Uniform chunks of fixed token length", icon: "grid" },
  { id: "recursive", name: "Recursive", description: "Hierarchical splitting with multiple separators", icon: "repeat" },
  { id: "document_aware", name: "Document-Aware", description: "Respects document structure (headings, sections, code blocks)", icon: "code" },
];

export const EMBEDDING_MODELS: EmbeddingModelOption[] = [
  { id: "text-embedding-3-large", label: "text-embedding-3-large (OpenAI)", provider: "OpenAI", dimensions: 3072 },
  { id: "text-embedding-3-small", label: "text-embedding-3-small (OpenAI)", provider: "OpenAI", dimensions: 1536 },
  { id: "text-embedding-ada-002", label: "text-embedding-ada-002 (OpenAI)", provider: "OpenAI", dimensions: 1536 },
  { id: "voyage-large-2", label: "voyage-large-2 (Voyage AI)", provider: "Voyage AI", dimensions: 1536 },
  { id: "voyage-code-2", label: "voyage-code-2 (Voyage AI)", provider: "Voyage AI", dimensions: 1536 },
  { id: "embed-english-v3.0", label: "embed-english-v3.0 (Cohere)", provider: "Cohere", dimensions: 1024 },
];

export const RERANKING_MODELS = [
  { id: "cohere-rerank-v3", label: "Cohere Rerank v3" },
  { id: "cohere-rerank-v2", label: "Cohere Rerank v2" },
  { id: "bge-reranker-large", label: "BGE Reranker Large" },
  { id: "cross-encoder-ms-marco", label: "Cross-Encoder MS MARCO" },
];

export const TECHNICAL_DOCS_TEMPLATE: RagPipelineTemplate = {
  id: "technical_docs",
  name: "Technical Documentation",
  description: "Optimized for API docs, developer guides, and long-form technical content",
  config: {
    provider: "internal",
    store_type: "vector",
    database_store: "pgvector",
    template_id: "technical_docs",
    status_intent: "draft",
    name: "Technical Documentation Pipeline",
    description: "Optimized for API docs, developer guides, and long-form technical content",
    chunking_strategy: "document_aware",
    chunk_size: 800,
    chunk_overlap: 100,
    respect_sentence_boundaries: true,
    respect_paragraph_boundaries: true,
    embedding_model: "text-embedding-3-large",
    embedding_batch_size: 64,
    retrieval_top_k: 8,
    retrieval_similarity_threshold: 0.65,
    retrieval_top_p: 0.9,
    reranking_enabled: true,
    reranking_model: "cohere-rerank-v3",
    rerank_top_n: 5,
    metadata_filtering: true,
    hybrid_search: true,
  },
};

export const CODE_SEARCH_TEMPLATE: RagPipelineTemplate = {
  id: "code_search",
  name: "Code Search",
  description: "Optimized for repositories, code snippets, and developer Q&A",
  config: {
    provider: "internal",
    store_type: "vector",
    database_store: "pgvector",
    template_id: "code_search",
    status_intent: "draft",
    name: "Code Search Pipeline",
    description: "Optimized for repositories, code snippets, and developer Q&A",
    chunking_strategy: "recursive",
    chunk_size: 600,
    chunk_overlap: 80,
    respect_sentence_boundaries: false,
    respect_paragraph_boundaries: true,
    embedding_model: "voyage-code-2",
    embedding_batch_size: 100,
    retrieval_top_k: 10,
    retrieval_similarity_threshold: 0.6,
    retrieval_top_p: 0.95,
    reranking_enabled: true,
    reranking_model: "bge-reranker-large",
    rerank_top_n: 5,
    metadata_filtering: true,
    hybrid_search: false,
  },
};

export const QUICK_SERVICE_TEMPLATE: RagPipelineTemplate = {
  id: "quick_service",
  name: "Quick Service",
  description: "Optimized for Customer Support, Chatbots, FAQ Systems, Quick Answers",
  config: {
    provider: "internal",
    store_type: "vector",
    database_store: "pgvector",
    template_id: "quick_service",
    status_intent: "draft",
    name: "Quick Service Pipeline",
    description: "Optimized for Customer Support, Chatbots, FAQ Systems, Quick Answers",
    chunking_strategy: "semantic",
    chunk_size: 400,
    chunk_overlap: 50,
    respect_sentence_boundaries: true,
    respect_paragraph_boundaries: true,
    embedding_model: "voyage-large-2",
    embedding_batch_size: 100,
    retrieval_top_k: 5,
    retrieval_similarity_threshold: 0.7,
    retrieval_top_p: 0.9,
    reranking_enabled: true,
    reranking_model: "bge-reranker-large",
    rerank_top_n: 3,
    metadata_filtering: true,
    hybrid_search: false,
  },
};

export const RAG_PIPELINE_TEMPLATES: RagPipelineTemplate[] = [
  QUICK_SERVICE_TEMPLATE,
  TECHNICAL_DOCS_TEMPLATE,
  CODE_SEARCH_TEMPLATE,
];

export const DEFAULT_FORM_STATE: PipelineFormState = { ...QUICK_SERVICE_TEMPLATE.config, name: "", description: "", template_id: null };

export function getTemplateById(templateId: string | null | undefined): RagPipelineTemplate | null {
  if (!templateId) return null;
  return RAG_PIPELINE_TEMPLATES.find((t) => t.id === templateId) ?? null;
}

export function formStateToApiConfig(form: PipelineFormState) {
  const embedding = EMBEDDING_MODELS.find((m) => m.id === form.embedding_model);
  return {
    pipeline_meta: {
      provider: form.provider,
      store_type: form.store_type,
      database_store: form.database_store,
      template_id: form.template_id,
      status_intent: form.status_intent,
      metadata_filtering: form.metadata_filtering,
      hybrid_search: form.hybrid_search,
    },
    data_ingestion: { storage_type: "local", allowed_extensions: ["pdf", "docx", "txt", "csv"], max_file_size_mb: 50 },
    knowledge_base: { scope: "project", parser: "auto", language: "en" },
    chunking: {
      strategy: form.chunking_strategy,
      chunk_size: form.chunk_size,
      chunk_overlap: form.chunk_overlap,
      respect_sentence_boundaries: form.respect_sentence_boundaries,
      respect_paragraph_boundaries: form.respect_paragraph_boundaries,
    },
    embedding: {
      model: form.embedding_model,
      provider: embedding?.provider.toLowerCase().replace(" ", "_") ?? "openai",
      dimensions: embedding?.dimensions ?? 1536,
      batch_size: form.embedding_batch_size,
    },
    vector_store: {
      provider: form.database_store,
      collection_name: form.name.toLowerCase().replace(/\s+/g, "_") || "default",
      distance_metric: "cosine",
      store_type: form.store_type,
    },
    retrieval: {
      strategy: form.hybrid_search ? "hybrid" : "semantic",
      top_k: form.retrieval_top_k,
      top_p: form.retrieval_top_p,
      score_threshold: form.retrieval_similarity_threshold,
      metadata_filtering: form.metadata_filtering,
    },
    reranking: {
      enabled: form.reranking_enabled,
      model: form.reranking_model,
      top_n: form.rerank_top_n,
    },
    memory: { type: "buffer", window_size: 10 },
    generation: {
      model: "gpt-4o-mini",
      temperature: 0.3,
      top_p: 1.0,
      system_prompt: "Answer using only the provided context.\n\nContext:\n{context}\n\nQuestion: {query}",
    },
    guardrails: { enabled: true, require_citations: true, max_tokens: 1024 },
  };
}
