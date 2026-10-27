"""RAG step definitions, defaults, and validation rules."""

from typing import Any

RAG_STEP_DEFINITIONS: dict[str, dict[str, Any]] = {
    "data_ingestion": {
        "label": "Data Ingestion",
        "description": "Upload and store raw documents before indexing",
        "reference": "Upload PDF, DOCX, TXT, CSV. Files are stored locally or in object storage. Validate file types and size limits before processing.",
        "required_fields": ["storage_type", "allowed_extensions"],
        "defaults": {
            "storage_type": "local",
            "allowed_extensions": ["pdf", "docx", "txt", "csv"],
            "max_file_size_mb": 50,
            "auto_parse": True,
        },
    },
    "knowledge_base": {
        "label": "Knowledge Base",
        "description": "Consolidated source of truth linking ingested documents",
        "reference": "A KB groups documents from ingestion. Set scope (project/global), parser, and metadata schema.",
        "required_fields": ["scope", "parser"],
        "defaults": {"scope": "project", "parser": "auto", "language": "en"},
    },
    "chunking": {
        "label": "Chunking",
        "description": "Text splitting strategy for indexing",
        "reference": "Recursive: general purpose. Semantic: splits by meaning. Fixed: uniform token windows.",
        "required_fields": ["strategy", "chunk_size", "chunk_overlap"],
        "defaults": {"strategy": "recursive", "chunk_size": 512, "chunk_overlap": 50},
    },
    "embedding": {
        "label": "Embedding",
        "description": "Vectorization model configuration",
        "reference": "text-embedding-3-small (1536d) for cost-effective. large for higher accuracy.",
        "required_fields": ["model", "dimensions", "provider"],
        "defaults": {"model": "text-embedding-3-small", "dimensions": 1536, "provider": "openai"},
    },
    "vector_store": {
        "label": "Vector Store",
        "description": "Vector database for similarity search",
        "reference": "Qdrant: production scale. pgvector: simpler ops. Hybrid search optional.",
        "required_fields": ["provider", "collection_name", "distance_metric"],
        "defaults": {"provider": "pgvector", "collection_name": "default", "distance_metric": "cosine"},
    },
    "retrieval": {
        "label": "Retrieval",
        "description": "Search strategy and top-k configuration",
        "reference": "Semantic: vector only. Hybrid: vector + BM25. MMR for diversity. top_p filters nucleus sampling for result diversity.",
        "required_fields": ["strategy", "top_k"],
        "defaults": {"strategy": "semantic", "top_k": 5, "top_p": 0.9, "score_threshold": 0.7},
    },
    "reranking": {
        "label": "Reranking",
        "description": "Re-score retrieved chunks for relevance",
        "reference": "Cohere rerank or cross-encoder. Improves precision at latency cost.",
        "required_fields": ["enabled"],
        "defaults": {"enabled": False, "model": "cross-encoder", "top_n": 3},
    },
    "memory": {
        "label": "Memory",
        "description": "Conversation context persistence",
        "reference": "Buffer: last N turns. Summary: compress history. Entity: track facts.",
        "required_fields": ["type"],
        "defaults": {"type": "buffer", "window_size": 10},
    },
    "generation": {
        "label": "Generation",
        "description": "LLM and prompt template",
        "reference": "Configure model, temperature, system prompt with {context} and {query} placeholders.",
        "required_fields": ["model", "temperature", "system_prompt"],
        "defaults": {
            "model": "gpt-4o-mini",
            "temperature": 0.3,
            "top_p": 1.0,
            "system_prompt": "Answer using only the provided context.\n\nContext:\n{context}\n\nQuestion: {query}",
        },
    },
    "guardrails": {
        "label": "Guardrails",
        "description": "Safety and quality filters",
        "reference": "PII detection, topic filters, max tokens, citation requirements.",
        "required_fields": ["enabled"],
        "defaults": {"enabled": True, "require_citations": True, "max_tokens": 1024},
    },
    "connectors": {
        "label": "Connectors",
        "description": "External data source integrations",
        "reference": "Connect S3, SharePoint, Confluence, databases. Store credentials securely; test connection before activate.",
        "required_fields": ["connector_type"],
        "defaults": {"connector_type": "s3", "sync_schedule": "manual", "enabled": False},
    },
}

# Full pipeline execution order (connectors optional, used for ingestion sync)
# Required catalog bindings when creating a pipeline via the builder UI
PIPELINE_REQUIRED_BINDINGS = [
    "data_ingestion",
    "knowledge_base",
    "chunking",
    "embedding",
    "vector_store",
    "retrieval",
    "generation",
]

ORDERED_STEPS = [
    "data_ingestion",
    "knowledge_base",
    "chunking",
    "embedding",
    "vector_store",
    "retrieval",
    "reranking",
    "memory",
    "generation",
    "guardrails",
]

# Step types that can be created as independent catalog entities
CATALOG_STEP_TYPES = ORDERED_STEPS + ["connectors"]

CATALOG_TAB_LABELS: dict[str, str] = {
    "data_ingestion": "Documents",
    "knowledge_base": "Knowledge Bases",
    "chunking": "Chunking",
    "embedding": "Embedding",
    "vector_store": "Vector Store",
    "retrieval": "Search & Test",
    "reranking": "Reranking",
    "memory": "Memory",
    "generation": "Generation",
    "guardrails": "Guardrails",
    "connectors": "Connectors",
}


def validate_step_config(step_type: str, config: dict[str, Any]) -> tuple[str, list[str], list[str]]:
    """Return (status, errors, warnings) for a step configuration."""
    definition = RAG_STEP_DEFINITIONS.get(step_type)
    if not definition:
        return "invalid", [f"Unknown step type: {step_type}"], []

    errors: list[str] = []
    warnings: list[str] = []

    for field in definition["required_fields"]:
        if field not in config or config[field] in (None, ""):
            errors.append(f"Missing required field: {field}")

    if step_type == "data_ingestion":
        max_mb = config.get("max_file_size_mb", 0)
        if isinstance(max_mb, (int, float)) and max_mb > 500:
            warnings.append("max_file_size_mb > 500 may impact upload performance")

    if step_type == "chunking":
        size = config.get("chunk_size", 0)
        overlap = config.get("chunk_overlap", 0)
        if isinstance(size, int) and size < 100:
            warnings.append("chunk_size below 100 may produce poor retrieval quality")
        if isinstance(overlap, int) and isinstance(size, int) and overlap >= size:
            errors.append("chunk_overlap must be less than chunk_size")

    if step_type == "retrieval":
        top_k = config.get("top_k", 0)
        if isinstance(top_k, int) and top_k > 20:
            warnings.append("top_k > 20 may increase latency and noise")

    if step_type == "generation" and "system_prompt" in config:
        prompt = config["system_prompt"]
        if "{context}" not in prompt:
            warnings.append("system_prompt should include {context} placeholder")
        if "{query}" not in prompt:
            warnings.append("system_prompt should include {query} placeholder")

    if step_type == "connectors" and config.get("connector_type") == "s3":
        if not config.get("bucket_name"):
            warnings.append("S3 connector should specify bucket_name")

    status = "valid" if not errors else "invalid"
    return status, errors, warnings
