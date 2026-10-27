/**
 * Zustand store for React Flow designer canvas state.
 * Syncs with backend on save; selected node drives config tab panel.
 */

import { create } from "zustand";
import type { Edge, Node } from "@xyflow/react";

interface DesignerState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (nodeId: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  markSaved: () => void;
}

export const useDesignerStore = create<DesignerState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  updateNodeConfig: (nodeId, config) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
      ),
      isDirty: true,
    })),

  markSaved: () => set({ isDirty: false }),
}));
