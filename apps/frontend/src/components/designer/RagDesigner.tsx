"use client";

/**
 * Visual RAG pipeline designer — draw.io-style canvas using React Flow.
 *
 * Usage: mount in /projects/[projectId]/designer/page.tsx
 * Requires: npm install @xyflow/react
 */

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

import { useCallback } from "react";
import { useDesignerStore } from "@/stores/designer-store";

const initialNodes: Node[] = [
  {
    id: "input-1",
    type: "default",
    position: { x: 100, y: 100 },
    data: { label: "Document Loader" },
  },
  {
    id: "chunk-1",
    type: "default",
    position: { x: 300, y: 100 },
    data: { label: "Text Chunker" },
  },
  {
    id: "embed-1",
    type: "default",
    position: { x: 500, y: 100 },
    data: { label: "Embedder" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "input-1", target: "chunk-1" },
  { id: "e2", source: "chunk-1", target: "embed-1" },
];

export function RagDesigner() {
  const selectNode = useDesignerStore((s) => s.selectNode);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => selectNode(node.id),
    [selectNode]
  );

  return (
    <div className="h-[calc(100vh-14rem)] w-full bg-surface-overlay">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
