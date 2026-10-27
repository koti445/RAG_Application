"""RAG node executor registry."""

NODE_REGISTRY: dict[str, object] = {}

# Register executors as they are implemented:
# from app.rag_engine.nodes.retriever import RetrieverNode
# NODE_REGISTRY["retriever"] = RetrieverNode()
