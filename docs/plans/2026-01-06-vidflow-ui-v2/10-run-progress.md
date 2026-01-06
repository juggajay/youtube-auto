# Run Progress View

## Components

```
src/components/run/
├── RunProgressView.tsx         # Main container
├── PipelineProgress.tsx        # Visual pipeline with active node
├── NodeProgressCard.tsx        # Per-node status card
├── LogStream.tsx               # Live log output
├── CostTracker.tsx             # Running cost total
└── RunControls.tsx             # Pause, abort, retry
```

## Task 1: Zustand Store for Run State

```typescript
// src/stores/runStore.ts
import { create } from 'zustand';

interface NodeProgress {
  nodeId: string;
  status: 'pending' | 'running' | 'intervention' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  output?: any;
  error?: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
}

interface Intervention {
  id: string;
  nodeType: string;
  generated_content: any;
}

interface RunState {
  runId: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  nodeProgress: Record<string, NodeProgress>;
  logs: LogEntry[];
  currentIntervention: Intervention | null;
  estimatedCost: number;
  actualCost: number;
  startedAt: string | null;
  elapsedSeconds: number;

  // Actions
  startRun: (runId: string) => void;
  updateNodeProgress: (nodeId: string, progress: Partial<NodeProgress>) => void;
  addLog: (entry: LogEntry) => void;
  setIntervention: (intervention: Intervention | null) => void;
  respondToIntervention: (response: any) => Promise<void>;
  dismissIntervention: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  abortRun: () => void;
  updateCost: (cost: number) => void;
  completeRun: () => void;
  failRun: (error: string) => void;
  reset: () => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  runId: null,
  status: 'idle',
  nodeProgress: {},
  logs: [],
  currentIntervention: null,
  estimatedCost: 0,
  actualCost: 0,
  startedAt: null,
  elapsedSeconds: 0,

  startRun: (runId) => set({
    runId,
    status: 'running',
    startedAt: new Date().toISOString(),
    nodeProgress: {
      trigger: { nodeId: 'trigger', status: 'completed', progress: 100 },
      script: { nodeId: 'script', status: 'pending', progress: 0 },
      voice: { nodeId: 'voice', status: 'pending', progress: 0 },
      thumbnail: { nodeId: 'thumbnail', status: 'pending', progress: 0 },
      assembly: { nodeId: 'assembly', status: 'pending', progress: 0 },
      publish: { nodeId: 'publish', status: 'pending', progress: 0 },
    },
    logs: [],
  }),

  updateNodeProgress: (nodeId, progress) => set((state) => ({
    nodeProgress: {
      ...state.nodeProgress,
      [nodeId]: { ...state.nodeProgress[nodeId], ...progress },
    },
  })),

  addLog: (entry) => set((state) => ({
    logs: [...state.logs, entry],
  })),

  setIntervention: (intervention) => set({
    currentIntervention: intervention,
    status: intervention ? 'paused' : 'running',
  }),

  respondToIntervention: async (response) => {
    const { runId, currentIntervention } = get();
    if (!runId || !currentIntervention) return;

    await fetch(`/api/runs/${runId}/intervene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interventionId: currentIntervention.id,
        response,
      }),
    });

    set({ currentIntervention: null, status: 'running' });
  },

  dismissIntervention: () => set({ currentIntervention: null }),

  pauseRun: () => set({ status: 'paused' }),

  resumeRun: () => set({ status: 'running' }),

  abortRun: async () => {
    const { runId } = get();
    if (runId) {
      await fetch(`/api/runs/${runId}/abort`, { method: 'POST' });
    }
    set({ status: 'failed' });
  },

  updateCost: (cost) => set({ actualCost: cost }),

  completeRun: () => set({ status: 'completed' }),

  failRun: (error) => set((state) => ({
    status: 'failed',
    logs: [...state.logs, { timestamp: new Date().toISOString(), level: 'error', message: error }],
  })),

  reset: () => set({
    runId: null,
    status: 'idle',
    nodeProgress: {},
    logs: [],
    currentIntervention: null,
    actualCost: 0,
    startedAt: null,
    elapsedSeconds: 0,
  }),
}));
```

## Task 2: SSE Hook for Real-Time Updates

```typescript
// src/hooks/useRunStream.ts
import { useEffect, useRef } from 'react';
import { useRunStore } from '@/stores/runStore';

export function useRunStream(runId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const {
    updateNodeProgress,
    addLog,
    setIntervention,
    updateCost,
    completeRun,
    failRun,
  } = useRunStore();

  useEffect(() => {
    if (!runId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new SSE connection
    const es = new EventSource(`/api/runs/${runId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'progress':
          updateNodeProgress(data.nodeId, {
            status: 'running',
            progress: data.percent,
          });
          break;

        case 'node_start':
          updateNodeProgress(data.nodeId, {
            status: 'running',
            progress: 0,
            startedAt: new Date().toISOString(),
          });
          break;

        case 'node_complete':
          updateNodeProgress(data.nodeId, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: data.output,
          });
          break;

        case 'node_error':
          updateNodeProgress(data.nodeId, {
            status: 'failed',
            error: data.error,
          });
          break;

        case 'log':
          addLog({
            timestamp: new Date().toISOString(),
            level: data.level,
            message: data.message,
            nodeId: data.nodeId,
          });
          break;

        case 'intervention':
          setIntervention({
            id: data.interventionId,
            nodeType: data.nodeType,
            generated_content: data.content,
          });
          break;

        case 'cost_update':
          updateCost(data.totalCents);
          break;

        case 'complete':
          completeRun();
          es.close();
          break;

        case 'error':
          failRun(data.error);
          es.close();
          break;
      }
    };

    es.onerror = () => {
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          // Reconnect
        }
      }, 3000);
    };

    return () => {
      es.close();
    };
  }, [runId]);
}
```

## Task 3: RunProgressView

```tsx
// src/components/run/RunProgressView.tsx
'use client';

import { useEffect } from 'react';
import { useRunStore } from '@/stores/runStore';
import { useRunStream } from '@/hooks/useRunStream';
import { PipelineProgress } from './PipelineProgress';
import { NodeProgressCard } from './NodeProgressCard';
import { LogStream } from './LogStream';
import { CostTracker } from './CostTracker';
import { RunControls } from './RunControls';
import { InterventionContainer } from '@/components/intervention';

interface Props {
  runId: string;
}

export function RunProgressView({ runId }: Props) {
  const { status, nodeProgress, startedAt, elapsedSeconds } = useRunStore();

  // Connect to SSE stream
  useRunStream(runId);

  // Elapsed time ticker
  useEffect(() => {
    if (status !== 'running' || !startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      // Update elapsed (would need to add to store)
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="run-progress-view">
      {/* Header */}
      <div className="progress-header">
        <div className="run-status">
          <span className={`status-badge ${status}`}>
            {status === 'running' && '🔄 Running'}
            {status === 'paused' && '⏸️ Paused'}
            {status === 'completed' && '✅ Completed'}
            {status === 'failed' && '❌ Failed'}
          </span>
          <span className="elapsed-time">{formatTime(elapsedSeconds)}</span>
        </div>
        <RunControls />
      </div>

      {/* Pipeline Visualization */}
      <PipelineProgress nodeProgress={nodeProgress} />

      {/* Main Content */}
      <div className="progress-content">
        {/* Node Cards */}
        <div className="node-cards">
          {Object.values(nodeProgress).map((node) => (
            <NodeProgressCard key={node.nodeId} node={node} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="progress-sidebar">
          <CostTracker />
          <LogStream />
        </div>
      </div>

      {/* Intervention Modal */}
      <InterventionContainer />
    </div>
  );
}
```

## Task 4: PipelineProgress Visualization

```tsx
// src/components/run/PipelineProgress.tsx
'use client';

interface NodeProgress {
  nodeId: string;
  status: string;
  progress: number;
}

interface Props {
  nodeProgress: Record<string, NodeProgress>;
}

const PIPELINE_ORDER = ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish'];

const NODE_LABELS: Record<string, string> = {
  trigger: 'Trigger',
  script: 'Script',
  voice: 'Voice',
  thumbnail: 'Thumbnail',
  assembly: 'Assembly',
  publish: 'Publish',
};

export function PipelineProgress({ nodeProgress }: Props) {
  return (
    <div className="pipeline-progress">
      <div className="pipeline-line" />

      {PIPELINE_ORDER.map((nodeId, index) => {
        const node = nodeProgress[nodeId];
        const status = node?.status || 'pending';

        return (
          <div key={nodeId} className="pipeline-node-wrapper">
            {/* Connector Line */}
            {index > 0 && (
              <div className={`connector ${status === 'completed' ? 'active' : ''}`} />
            )}

            {/* Node */}
            <div className={`pipeline-node-icon ${status}`}>
              {status === 'pending' && <span className="icon">○</span>}
              {status === 'running' && <span className="icon spinning">◐</span>}
              {status === 'intervention' && <span className="icon pulse">⚠</span>}
              {status === 'completed' && <span className="icon">✓</span>}
              {status === 'failed' && <span className="icon">✗</span>}
              {status === 'skipped' && <span className="icon">−</span>}

              {/* Progress Ring for Running */}
              {status === 'running' && node && (
                <svg className="progress-ring">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${node.progress * 1.13} 113`}
                    transform="rotate(-90 20 20)"
                  />
                </svg>
              )}
            </div>

            <span className="node-label">{NODE_LABELS[nodeId]}</span>
          </div>
        );
      })}
    </div>
  );
}
```

## Task 5: NodeProgressCard

```tsx
// src/components/run/NodeProgressCard.tsx
'use client';

interface Props {
  node: {
    nodeId: string;
    status: string;
    progress: number;
    startedAt?: string;
    completedAt?: string;
    output?: any;
    error?: string;
  };
}

const NODE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  trigger: { label: 'Trigger', icon: '⚡', color: 'var(--node-trigger)' },
  script: { label: 'Script Generator', icon: '📜', color: 'var(--node-script)' },
  voice: { label: 'Voice Synthesis', icon: '🎙️', color: 'var(--node-voice)' },
  thumbnail: { label: 'Thumbnail Creator', icon: '🖼️', color: 'var(--node-thumbnail)' },
  assembly: { label: 'Video Assembly', icon: '🎬', color: 'var(--node-assembly)' },
  publish: { label: 'YouTube Publish', icon: '🚀', color: 'var(--node-publish)' },
};

export function NodeProgressCard({ node }: Props) {
  const info = NODE_INFO[node.nodeId] || { label: node.nodeId, icon: '📦', color: 'gray' };

  const getDuration = () => {
    if (!node.startedAt) return null;
    const start = new Date(node.startedAt).getTime();
    const end = node.completedAt ? new Date(node.completedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    return `${seconds}s`;
  };

  return (
    <div className={`node-progress-card ${node.status}`}>
      <div className="card-header" style={{ borderLeftColor: info.color }}>
        <span className="node-icon">{info.icon}</span>
        <span className="node-label">{info.label}</span>
        <span className={`status-indicator ${node.status}`}>
          {node.status === 'pending' && '⏳'}
          {node.status === 'running' && '🔄'}
          {node.status === 'intervention' && '⚠️'}
          {node.status === 'completed' && '✅'}
          {node.status === 'failed' && '❌'}
          {node.status === 'skipped' && '⏭️'}
        </span>
      </div>

      {/* Progress Bar */}
      {node.status === 'running' && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${node.progress}%` }} />
          <span className="progress-text">{node.progress}%</span>
        </div>
      )}

      {/* Duration */}
      {(node.status === 'running' || node.status === 'completed') && (
        <div className="duration">
          {getDuration()}
        </div>
      )}

      {/* Error */}
      {node.status === 'failed' && node.error && (
        <div className="error-message">
          {node.error}
        </div>
      )}

      {/* Output Preview */}
      {node.status === 'completed' && node.output && (
        <div className="output-preview">
          {node.nodeId === 'script' && (
            <span>{node.output.wordCount} words</span>
          )}
          {node.nodeId === 'voice' && (
            <span>{node.output.duration}</span>
          )}
          {node.nodeId === 'thumbnail' && (
            <img src={node.output.thumbnailUrl} alt="Thumbnail" className="mini-preview" />
          )}
        </div>
      )}
    </div>
  );
}
```

## Task 6: LogStream

```tsx
// src/components/run/LogStream.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRunStore } from '@/stores/runStore';

export function LogStream() {
  const { logs } = useRunStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="log-stream">
      <h4>Activity Log</h4>
      <div className="log-container" ref={containerRef}>
        {logs.map((log, i) => (
          <div key={i} className={`log-entry ${log.level}`}>
            <span className="log-time">{formatTime(log.timestamp)}</span>
            {log.nodeId && <span className="log-node">[{log.nodeId}]</span>}
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Task 7: CostTracker

```tsx
// src/components/run/CostTracker.tsx
'use client';

import { useRunStore } from '@/stores/runStore';

export function CostTracker() {
  const { estimatedCost, actualCost } = useRunStore();

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="cost-tracker">
      <h4>Cost</h4>
      <div className="cost-display">
        <div className="cost-actual">
          <span className="cost-label">Current</span>
          <span className="cost-value">{formatCost(actualCost)}</span>
        </div>
        <div className="cost-estimated">
          <span className="cost-label">Estimated</span>
          <span className="cost-value">{formatCost(estimatedCost)}</span>
        </div>
      </div>
      <div className="cost-bar">
        <div
          className="cost-fill"
          style={{ width: `${Math.min((actualCost / estimatedCost) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
```
