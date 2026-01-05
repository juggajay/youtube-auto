import { create } from 'zustand';
import type { Run, NodeOutput, RunStatus } from '@/lib/runs';

export interface RunState {
  runs: Run[];
  currentRun: Run | null;
  nodeOutputs: NodeOutput[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setRuns: (runs: Run[]) => void;
  addRun: (run: Run) => void;
  updateRun: (runId: string, updates: Partial<Run>) => void;
  removeRun: (runId: string) => void;
  setCurrentRun: (run: Run | null) => void;
  setNodeOutputs: (outputs: NodeOutput[]) => void;
  addNodeOutput: (output: NodeOutput) => void;
  updateNodeOutput: (outputId: string, updates: Partial<NodeOutput>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions (to be called with API)
  fetchRuns: () => Promise<void>;
  fetchRun: (runId: string) => Promise<void>;
  createRun: (workflowId?: string) => Promise<Run | null>;
}

export const useRunStore = create<RunState>()((set, get) => ({
  runs: [],
  currentRun: null,
  nodeOutputs: [],
  isLoading: false,
  error: null,

  setRuns: (runs) => set({ runs }),

  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),

  updateRun: (runId, updates) => set((state) => ({
    runs: state.runs.map((r) => r.id === runId ? { ...r, ...updates } : r),
    currentRun: state.currentRun?.id === runId
      ? { ...state.currentRun, ...updates }
      : state.currentRun,
  })),

  removeRun: (runId) => set((state) => ({
    runs: state.runs.filter((r) => r.id !== runId),
    currentRun: state.currentRun?.id === runId ? null : state.currentRun,
  })),

  setCurrentRun: (run) => set({ currentRun: run }),

  setNodeOutputs: (outputs) => set({ nodeOutputs: outputs }),

  addNodeOutput: (output) => set((state) => ({
    nodeOutputs: [...state.nodeOutputs, output],
  })),

  updateNodeOutput: (outputId, updates) => set((state) => ({
    nodeOutputs: state.nodeOutputs.map((o) =>
      o.id === outputId ? { ...o, ...updates } : o
    ),
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  fetchRuns: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/runs');
      if (!response.ok) throw new Error('Failed to fetch runs');
      const data = await response.json();
      set({ runs: data.runs || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch runs' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRun: async (runId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to fetch run');
      const data = await response.json();
      set({ currentRun: data.run, nodeOutputs: data.outputs || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch run' });
    } finally {
      set({ isLoading: false });
    }
  },

  createRun: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId }),
      });
      if (!response.ok) throw new Error('Failed to create run');
      const data = await response.json();
      const run = data.run as Run;
      set((state) => ({ runs: [run, ...state.runs], currentRun: run }));
      return run;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create run' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
