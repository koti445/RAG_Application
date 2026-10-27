"""
RAG pipeline graph executor.

Loads a React Flow graph (nodes + edges), topologically sorts nodes,
and executes each node's handler from the node registry.
"""

from typing import Any


class PipelineExecutor:
    """Executes a RAG pipeline defined as a directed acyclic graph."""

    def __init__(self, graph: dict[str, Any], node_registry: dict[str, Any]) -> None:
        self.graph = graph
        self.node_registry = node_registry

    def _topological_sort(self) -> list[dict]:
        """Return nodes in execution order based on edges."""
        nodes = self.graph.get("nodes", [])
        edges = self.graph.get("edges", [])
        # TODO: implement Kahn's algorithm or networkx
        return nodes

    async def run(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute pipeline for a user query."""
        context = context or {}
        trace: list[dict] = []

        for node in self._topological_sort():
            node_type = node.get("type", "")
            handler = self.node_registry.get(node_type)
            if not handler:
                continue
            result = await handler.execute(node.get("data", {}), query, context)
            context[node["id"]] = result
            trace.append({"node_id": node["id"], "type": node_type, "output_keys": list(result.keys())})

        return {
            "answer": context.get("final_answer", ""),
            "sources": context.get("sources", []),
            "trace": trace,
        }
