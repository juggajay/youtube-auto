import { create } from 'zustand';

// =============================================================================
// NODE PROGRESS TYPES
// =============================================================================

export type NodeStatus =
  | 'pending'
  | 'running'
  | 'intervention'
  | 'completed'
  | 'failed'
  | 'skipped';

export type NodeId =
  | 'trigger'
  | 'script'
  | 'voice'
  | 'thumbnail'
  | 'assembly'
  | 'publish';

export interface NodeProgress {
  nodeId: NodeId;
  status: NodeStatus;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
  durationMs?: number;
  costCents?: number;
}

// =============================================================================
// LOG TYPES
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  nodeId?: NodeId;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// INTERVENTION TYPES
// =============================================================================

export type InterventionType =
  | 'script_review'
  | 'thumbnail_selection'
  | 'publish_review'
  | 'error_resolution';

export interface Intervention {
  id: string;
  nodeType: NodeId;
  type: InterventionType;
  generatedContent: unknown;
  options?: unknown[];
  message?: string;
  createdAt: string;
}

export interface InterventionResponse {
  interventionId: string;
  action: 'approve' | 'reject' | 'edit' | 'select' | 'retry' | 'skip';
  data?: unknown;
}

// =============================================================================
// COST TRACKING TYPES
// =============================================================================

export interface CostBreakdown {
  script: number;
  voice: number;
  thumbnail: number;
  assembly: number;
  publish: number;
  total: number;
}

// =============================================================================
// RUN STATUS
// =============================================================================

export type RunStatus =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'paused'
  | 'intervention'
  | 'completed'
  | 'failed'
  | 'cancelled';

// =============================================================================
// RUN STATE
// =============================================================================

export interface RunState {
  // Run identification
  runId: string | null;
  workflowId: string | null;
  projectId: string | null;

  // Overall status
  status: RunStatus;

  // Node progress tracking
  nodeProgress: Record<NodeId, NodeProgress>;
  currentNodeId: NodeId | null;

  // Logs
  logs: LogEntry[];
  maxLogs: number;

  // Intervention handling
  currentIntervention: Intervention | null;
  interventionHistory: Array<{
    intervention: Intervention;
    response: InterventionResponse;
    respondedAt: string;
  }>;

  // Cost tracking
  estimatedCost: CostBreakdown;
  actualCost: CostBreakdown;

  // Timing
  startedAt: string | null;
  completedAt: string | null;
  elapsedSeconds: number;

  // Error handling
  lastError: string | null;
  retryCount: number;
  maxRetries: number;

  // SSE connection state
  isConnected: boolean;
  connectionError: string | null;

  // Actions - Run lifecycle
  startRun: (runId: string, workflowId?: string, projectId?: string) => void;
  pauseRun: () => void;
  resumeRun: () => void;
  abortRun: () => Promise<void>;
  completeRun: () => void;
  failRun: (error: string) => void;
  reset: () => void;

  // Actions - Node progress
  updateNodeProgress: (nodeId: NodeId, progress: Partial<NodeProgress>) => void;
  startNode: (nodeId: NodeId) => void;
  completeNode: (nodeId: NodeId, output?: unknown, costCents?: number) => void;
  failNode: (nodeId: NodeId, error: string) => void;
  skipNode: (nodeId: NodeId) => void;
  setCurrentNode: (nodeId: NodeId | null) => void;

  // Actions - Logs
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // Actions - Interventions
  setIntervention: (intervention: Intervention | null) => void;
  respondToIntervention: (response: InterventionResponse) => Promise<void>;
  dismissIntervention: () => void;

  // Actions - Cost tracking
  setEstimatedCost: (cost: Partial<CostBreakdown>) => void;
  updateActualCost: (nodeId: NodeId, costCents: number) => void;

  // Actions - Timing
  updateElapsedTime: () => void;

  // Actions - Connection
  setConnected: (isConnected: boolean) => void;
  setConnectionError: (error: string | null) => void;

  // Getters
  getNodeProgress: (nodeId: NodeId) => NodeProgress;
  getTotalProgress: () => number;
  getActiveNodes: () => NodeId[];
  getCompletedNodes: () => NodeId[];
  getFailedNodes: () => NodeId[];
}

// =============================================================================
// INITIAL VALUES
// =============================================================================

const initialNodeProgress: Record<NodeId, NodeProgress> = {
  trigger: { nodeId: 'trigger', status: 'pending', progress: 0 },
  script: { nodeId: 'script', status: 'pending', progress: 0 },
  voice: { nodeId: 'voice', status: 'pending', progress: 0 },
  thumbnail: { nodeId: 'thumbnail', status: 'pending', progress: 0 },
  assembly: { nodeId: 'assembly', status: 'pending', progress: 0 },
  publish: { nodeId: 'publish', status: 'pending', progress: 0 },
};

const initialCostBreakdown: CostBreakdown = {
  script: 0,
  voice: 0,
  thumbnail: 0,
  assembly: 0,
  publish: 0,
  total: 0,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function calculateTotalCost(breakdown: CostBreakdown): number {
  return breakdown.script + breakdown.voice + breakdown.thumbnail + breakdown.assembly + breakdown.publish;
}

// =============================================================================
// STORE
// =============================================================================

export const useRunStore = create<RunState>((set, get) => ({
  // Initial state
  runId: null,
  workflowId: null,
  projectId: null,
  status: 'idle',
  nodeProgress: { ...initialNodeProgress },
  currentNodeId: null,
  logs: [],
  maxLogs: 500,
  currentIntervention: null,
  interventionHistory: [],
  estimatedCost: { ...initialCostBreakdown },
  actualCost: { ...initialCostBreakdown },
  startedAt: null,
  completedAt: null,
  elapsedSeconds: 0,
  lastError: null,
  retryCount: 0,
  maxRetries: 3,
  isConnected: false,
  connectionError: null,

  // Run lifecycle actions
  startRun: (runId, workflowId, projectId) => {
    const now = new Date().toISOString();
    set({
      runId,
      workflowId: workflowId || null,
      projectId: projectId || null,
      status: 'running',
      startedAt: now,
      completedAt: null,
      elapsedSeconds: 0,
      lastError: null,
      retryCount: 0,
      nodeProgress: {
        trigger: { nodeId: 'trigger', status: 'completed', progress: 100, completedAt: now },
        script: { nodeId: 'script', status: 'pending', progress: 0 },
        voice: { nodeId: 'voice', status: 'pending', progress: 0 },
        thumbnail: { nodeId: 'thumbnail', status: 'pending', progress: 0 },
        assembly: { nodeId: 'assembly', status: 'pending', progress: 0 },
        publish: { nodeId: 'publish', status: 'pending', progress: 0 },
      },
      logs: [],
      currentIntervention: null,
      actualCost: { ...initialCostBreakdown },
    });

    // Add initial log
    get().addLog({
      level: 'info',
      message: `Run started: ${runId}`,
    });
  },

  pauseRun: () => {
    set({ status: 'paused' });
    get().addLog({
      level: 'info',
      message: 'Run paused by user',
    });
  },

  resumeRun: () => {
    const { currentIntervention } = get();
    set({ status: currentIntervention ? 'intervention' : 'running' });
    get().addLog({
      level: 'info',
      message: 'Run resumed',
    });
  },

  abortRun: async () => {
    const { runId } = get();
    if (runId) {
      try {
        await fetch(`/api/runs/${runId}/abort`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to abort run:', error);
      }
    }
    set({
      status: 'cancelled',
      completedAt: new Date().toISOString(),
    });
    get().addLog({
      level: 'warn',
      message: 'Run aborted by user',
    });
  },

  completeRun: () => {
    set({
      status: 'completed',
      completedAt: new Date().toISOString(),
      currentNodeId: null,
    });
    get().addLog({
      level: 'info',
      message: 'Run completed successfully',
    });
  },

  failRun: (error) => {
    set({
      status: 'failed',
      completedAt: new Date().toISOString(),
      lastError: error,
    });
    get().addLog({
      level: 'error',
      message: `Run failed: ${error}`,
    });
  },

  reset: () =>
    set({
      runId: null,
      workflowId: null,
      projectId: null,
      status: 'idle',
      nodeProgress: { ...initialNodeProgress },
      currentNodeId: null,
      logs: [],
      currentIntervention: null,
      interventionHistory: [],
      estimatedCost: { ...initialCostBreakdown },
      actualCost: { ...initialCostBreakdown },
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      lastError: null,
      retryCount: 0,
      isConnected: false,
      connectionError: null,
    }),

  // Node progress actions
  updateNodeProgress: (nodeId, progress) =>
    set((state) => ({
      nodeProgress: {
        ...state.nodeProgress,
        [nodeId]: { ...state.nodeProgress[nodeId], ...progress },
      },
    })),

  startNode: (nodeId) => {
    const now = new Date().toISOString();
    set((state) => ({
      currentNodeId: nodeId,
      nodeProgress: {
        ...state.nodeProgress,
        [nodeId]: {
          ...state.nodeProgress[nodeId],
          status: 'running',
          progress: 0,
          startedAt: now,
          error: undefined,
        },
      },
    }));
    get().addLog({
      level: 'info',
      message: `Started node: ${nodeId}`,
      nodeId,
    });
  },

  completeNode: (nodeId, output, costCents) => {
    const now = new Date().toISOString();
    const { nodeProgress } = get();
    const startedAt = nodeProgress[nodeId]?.startedAt;
    const durationMs = startedAt
      ? new Date(now).getTime() - new Date(startedAt).getTime()
      : undefined;

    set((state) => ({
      nodeProgress: {
        ...state.nodeProgress,
        [nodeId]: {
          ...state.nodeProgress[nodeId],
          status: 'completed',
          progress: 100,
          completedAt: now,
          output,
          durationMs,
          costCents,
        },
      },
    }));

    if (costCents !== undefined) {
      get().updateActualCost(nodeId, costCents);
    }

    get().addLog({
      level: 'info',
      message: `Completed node: ${nodeId}${durationMs ? ` (${(durationMs / 1000).toFixed(1)}s)` : ''}`,
      nodeId,
    });
  },

  failNode: (nodeId, error) => {
    set((state) => ({
      nodeProgress: {
        ...state.nodeProgress,
        [nodeId]: {
          ...state.nodeProgress[nodeId],
          status: 'failed',
          error,
          completedAt: new Date().toISOString(),
        },
      },
    }));
    get().addLog({
      level: 'error',
      message: `Node ${nodeId} failed: ${error}`,
      nodeId,
    });
  },

  skipNode: (nodeId) => {
    set((state) => ({
      nodeProgress: {
        ...state.nodeProgress,
        [nodeId]: {
          ...state.nodeProgress[nodeId],
          status: 'skipped',
          progress: 100,
          completedAt: new Date().toISOString(),
        },
      },
    }));
    get().addLog({
      level: 'info',
      message: `Skipped node: ${nodeId}`,
      nodeId,
    });
  },

  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),

  // Log actions
  addLog: (entry) =>
    set((state) => {
      const newLog: LogEntry = {
        ...entry,
        id: generateLogId(),
        timestamp: new Date().toISOString(),
      };

      // Keep only the most recent logs up to maxLogs
      const newLogs = [newLog, ...state.logs].slice(0, state.maxLogs);

      return { logs: newLogs };
    }),

  clearLogs: () => set({ logs: [] }),

  // Intervention actions
  setIntervention: (intervention) => {
    if (intervention) {
      set({
        currentIntervention: intervention,
        status: 'intervention',
      });
      get().addLog({
        level: 'info',
        message: `Intervention required: ${intervention.type}`,
        nodeId: intervention.nodeType,
      });
    } else {
      const { status } = get();
      set({
        currentIntervention: null,
        status: status === 'intervention' ? 'running' : status,
      });
    }
  },

  respondToIntervention: async (response) => {
    const { runId, currentIntervention } = get();
    if (!runId || !currentIntervention) return;

    try {
      await fetch(`/api/runs/${runId}/intervene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interventionId: currentIntervention.id,
          response,
        }),
      });

      set((state) => ({
        currentIntervention: null,
        status: 'running',
        interventionHistory: [
          ...state.interventionHistory,
          {
            intervention: currentIntervention,
            response,
            respondedAt: new Date().toISOString(),
          },
        ],
      }));

      get().addLog({
        level: 'info',
        message: `Intervention resolved: ${response.action}`,
        nodeId: currentIntervention.nodeType,
      });
    } catch (error) {
      get().addLog({
        level: 'error',
        message: `Failed to respond to intervention: ${error}`,
        nodeId: currentIntervention.nodeType,
      });
      throw error;
    }
  },

  dismissIntervention: () =>
    set((state) => ({
      currentIntervention: null,
      status: state.status === 'intervention' ? 'running' : state.status,
    })),

  // Cost tracking actions
  setEstimatedCost: (cost) =>
    set((state) => {
      const newEstimatedCost = {
        ...state.estimatedCost,
        ...cost,
      };
      return {
        estimatedCost: {
          ...newEstimatedCost,
          total: calculateTotalCost(newEstimatedCost),
        },
      };
    }),

  updateActualCost: (nodeId, costCents) =>
    set((state) => {
      // Trigger node has no cost
      if (nodeId === 'trigger') return state;

      // Map nodeId to cost breakdown key
      const costKey = nodeId as keyof Omit<CostBreakdown, 'total'>;

      const newActualCost = {
        ...state.actualCost,
        [costKey]: state.actualCost[costKey] + costCents,
      };

      return {
        actualCost: {
          ...newActualCost,
          total: calculateTotalCost(newActualCost),
        },
      };
    }),

  // Timing actions
  updateElapsedTime: () => {
    const { startedAt, status } = get();
    if (!startedAt || status === 'completed' || status === 'failed' || status === 'cancelled') {
      return;
    }

    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    );
    set({ elapsedSeconds: elapsed });
  },

  // Connection actions
  setConnected: (isConnected) =>
    set({ isConnected, connectionError: isConnected ? null : get().connectionError }),

  setConnectionError: (error) => set({ connectionError: error }),

  // Getters
  getNodeProgress: (nodeId) => {
    return get().nodeProgress[nodeId];
  },

  getTotalProgress: () => {
    const { nodeProgress } = get();
    const nodes = Object.values(nodeProgress);
    const totalProgress = nodes.reduce((sum, node) => sum + node.progress, 0);
    return Math.round(totalProgress / nodes.length);
  },

  getActiveNodes: () => {
    const { nodeProgress } = get();
    return (Object.keys(nodeProgress) as NodeId[]).filter(
      (id) => nodeProgress[id].status === 'running'
    );
  },

  getCompletedNodes: () => {
    const { nodeProgress } = get();
    return (Object.keys(nodeProgress) as NodeId[]).filter(
      (id) => nodeProgress[id].status === 'completed'
    );
  },

  getFailedNodes: () => {
    const { nodeProgress } = get();
    return (Object.keys(nodeProgress) as NodeId[]).filter(
      (id) => nodeProgress[id].status === 'failed'
    );
  },
}));
