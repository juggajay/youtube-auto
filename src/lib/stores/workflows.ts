import { create } from 'zustand';

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config: Record<string, unknown>;
  is_template: boolean;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  // Actions
  setWorkflows: (workflows: Workflow[]) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  updateCurrentWorkflow: (updates: Partial<Workflow>) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDirty: (dirty: boolean) => void;

  // Async actions
  fetchWorkflows: () => Promise<void>;
  fetchWorkflow: (workflowId: string) => Promise<void>;
  createWorkflow: (name: string, description?: string) => Promise<Workflow | null>;
  saveWorkflow: () => Promise<boolean>;
  deleteWorkflow: (workflowId: string) => Promise<boolean>;
}

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,
  isDirty: false,

  setWorkflows: (workflows) => set({ workflows }),

  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow, isDirty: false }),

  updateCurrentWorkflow: (updates) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? { ...state.currentWorkflow, ...updates }
      : null,
    isDirty: true,
  })),

  setNodes: (nodes) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? { ...state.currentWorkflow, nodes }
      : null,
    isDirty: true,
  })),

  setEdges: (edges) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? { ...state.currentWorkflow, edges }
      : null,
    isDirty: true,
  })),

  addNode: (node) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? { ...state.currentWorkflow, nodes: [...state.currentWorkflow.nodes, node] }
      : null,
    isDirty: true,
  })),

  removeNode: (nodeId) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? {
          ...state.currentWorkflow,
          nodes: state.currentWorkflow.nodes.filter((n) => n.id !== nodeId),
          edges: state.currentWorkflow.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        }
      : null,
    isDirty: true,
  })),

  updateNode: (nodeId, updates) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? {
          ...state.currentWorkflow,
          nodes: state.currentWorkflow.nodes.map((n) =>
            n.id === nodeId ? { ...n, ...updates } : n
          ),
        }
      : null,
    isDirty: true,
  })),

  addEdge: (edge) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? { ...state.currentWorkflow, edges: [...state.currentWorkflow.edges, edge] }
      : null,
    isDirty: true,
  })),

  removeEdge: (edgeId) => set((state) => ({
    currentWorkflow: state.currentWorkflow
      ? {
          ...state.currentWorkflow,
          edges: state.currentWorkflow.edges.filter((e) => e.id !== edgeId),
        }
      : null,
    isDirty: true,
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDirty: (isDirty) => set({ isDirty }),

  fetchWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      set({ workflows: data.workflows || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch workflows' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (!response.ok) throw new Error('Failed to fetch workflow');
      const data = await response.json();
      set({ currentWorkflow: data.workflow, isDirty: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch workflow' });
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkflow: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error('Failed to create workflow');
      const data = await response.json();
      const workflow = data.workflow as Workflow;
      set((state) => ({
        workflows: [workflow, ...state.workflows],
        currentWorkflow: workflow,
        isDirty: false,
      }));
      return workflow;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create workflow' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  saveWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return false;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentWorkflow.name,
          description: currentWorkflow.description,
          nodes: currentWorkflow.nodes,
          edges: currentWorkflow.edges,
          config: currentWorkflow.config,
        }),
      });
      if (!response.ok) throw new Error('Failed to save workflow');
      const data = await response.json();
      set((state) => ({
        currentWorkflow: data.workflow,
        workflows: state.workflows.map((w) =>
          w.id === currentWorkflow.id ? data.workflow : w
        ),
        isDirty: false,
      }));
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save workflow' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete workflow');
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== workflowId),
        currentWorkflow: state.currentWorkflow?.id === workflowId
          ? null
          : state.currentWorkflow,
      }));
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete workflow' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
