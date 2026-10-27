"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ragApi } from "@/lib/api/rag";

const NODE_PALETTE = [
  { type: "data_ingestion", label: "Data Ingestion", color: "#64748b" },
  { type: "knowledge_base", label: "Knowledge Base", color: "#3b82f6" },
  { type: "chunking", label: "Chunking", color: "#8b5cf6" },
  { type: "embedding", label: "Embedding", color: "#06b6d4" },
  { type: "vector_store", label: "Vector Store", color: "#10b981" },
  { type: "retrieval", label: "Retrieval", color: "#f59e0b" },
  { type: "reranking", label: "Reranking", color: "#ec4899" },
  { type: "memory", label: "Memory", color: "#6366f1" },
  { type: "generation", label: "Generation", color: "#f97316" },
  { type: "guardrails", label: "Guardrails", color: "#ef4444" },
];

interface RagDesignerCanvasProps {
  pipelineId: string;
  initialGraph?: { nodes: Node[]; edges: Edge[] };
  onSaved?: () => void;
}

export function RagDesignerCanvas({ pipelineId, initialGraph, onSaved }: RagDesignerCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph?.edges || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialGraph) {
      setNodes(initialGraph.nodes);
      setEdges(initialGraph.edges);
    }
  }, [initialGraph, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  function addNode(stepType: string, label: string) {
    const id = `${stepType}-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "default",
        position: { x: 100 + nds.length * 40, y: 100 + nds.length * 30 },
        data: { label, stepType },
        style: { background: "#1c2030", color: "#f1f5f9", border: "1px solid #2a3042", borderRadius: 8 },
      },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await ragApi.saveGraph(pipelineId, { nodes, edges });
      setMessage("Design saved successfully");
      onSaved?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-3">
      <div className="w-48 shrink-0 space-y-1 overflow-y-auto rounded-lg border border-surface-border bg-surface-raised p-2">
        <p className="px-2 py-1 text-xs font-semibold uppercase text-content-muted">Components</p>
        {NODE_PALETTE.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => addNode(item.type, item.label)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-content-secondary hover:bg-surface-hover hover:text-content-primary"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-content-secondary">Drag components, connect nodes, then save your architecture</p>
          <div className="flex items-center gap-2">
            {message && <span className="text-xs text-emerald-400">{message}</span>}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Design"}
            </Button>
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-surface-border bg-surface-overlay">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            colorMode="dark"
          >
            <Background gap={16} color="#2a3042" />
            <Controls />
            <MiniMap nodeColor="#f97316" maskColor="rgba(0,0,0,0.6)" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
