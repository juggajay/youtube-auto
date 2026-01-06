'use client';

import { useEffect, useRef } from 'react';
import { useRunStore, NodeId } from '@/stores/runStore';
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

const PIPELINE_ORDER: NodeId[] = ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish'];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getStatusInfo(status: string): { text: string; colorClass: string; bgClass: string } {
  switch (status) {
    case 'initializing':
      return {
        text: 'Initializing',
        colorClass: 'text-[var(--text-secondary)]',
        bgClass: 'bg-[var(--bg-elevated)]',
      };
    case 'running':
      return {
        text: 'Running',
        colorClass: 'text-[var(--status-running)]',
        bgClass: 'bg-blue-500/10',
      };
    case 'paused':
      return {
        text: 'Paused',
        colorClass: 'text-[var(--status-warning)]',
        bgClass: 'bg-amber-500/10',
      };
    case 'intervention':
      return {
        text: 'Needs Review',
        colorClass: 'text-[var(--status-warning)]',
        bgClass: 'bg-amber-500/10 animate-pulse',
      };
    case 'completed':
      return {
        text: 'Completed',
        colorClass: 'text-[var(--status-success)]',
        bgClass: 'bg-green-500/10',
      };
    case 'failed':
      return {
        text: 'Failed',
        colorClass: 'text-[var(--status-error)]',
        bgClass: 'bg-red-500/10',
      };
    case 'cancelled':
      return {
        text: 'Cancelled',
        colorClass: 'text-[var(--text-muted)]',
        bgClass: 'bg-zinc-500/10',
      };
    default:
      return {
        text: 'Idle',
        colorClass: 'text-[var(--text-muted)]',
        bgClass: 'bg-[var(--bg-elevated)]',
      };
  }
}

export function RunProgressView({ runId }: Props) {
  const {
    status,
    nodeProgress,
    logs,
    estimatedCost,
    actualCost,
    elapsedSeconds,
    currentIntervention,
    isConnected,
    connectionError,
    startRun,
    pauseRun,
    resumeRun,
    abortRun,
    updateElapsedTime,
    setConnected,
    setConnectionError,
  } = useRunStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connect to SSE stream
  useRunStream(runId, {
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
    onReconnect: (attempt) => setConnectionError(`Reconnecting... (attempt ${attempt})`),
  });

  // Initialize run if needed
  useEffect(() => {
    const currentRunId = useRunStore.getState().runId;
    if (runId && runId !== currentRunId) {
      startRun(runId);
    }
  }, [runId, startRun]);

  // Elapsed time ticker
  useEffect(() => {
    if (status === 'running' || status === 'intervention') {
      timerRef.current = setInterval(() => {
        updateElapsedTime();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, updateElapsedTime]);

  const statusInfo = getStatusInfo(status);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[var(--bg-deep)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium ${statusInfo.bgClass} ${statusInfo.colorClass}`}>
            <StatusIcon status={status} />
            <span>{statusInfo.text}</span>
          </div>

          {/* Elapsed Time */}
          <div className="flex items-center gap-1.5 text-sm font-mono text-[var(--text-secondary)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--text-muted)]">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Connection Status */}
          {connectionError && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 text-[var(--status-error)] text-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M1 1l22 22 M16.72 11.06A10.94 10.94 0 0 1 19 12.55 M5 12.55a10.94 10.94 0 0 1 5.17-2.39 M10.71 5.05A16 16 0 0 1 22.58 9 M1.42 9a15.91 15.91 0 0 1 4.7-2.88 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01" />
              </svg>
              <span>{connectionError}</span>
            </div>
          )}
          {!connectionError && isConnected && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-500/10 text-[var(--status-success)] text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
              <span>Live</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <RunControls
          status={status}
          onPause={pauseRun}
          onResume={resumeRun}
          onAbort={abortRun}
        />
      </div>

      {/* Pipeline Visualization */}
      <PipelineProgress nodeProgress={nodeProgress} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Node Cards */}
        <div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 content-start overflow-y-auto">
          {PIPELINE_ORDER.map((nodeId) => (
            <NodeProgressCard key={nodeId} node={nodeProgress[nodeId]} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="w-[360px] flex flex-col gap-4 flex-shrink-0 overflow-y-auto">
          <CostTracker
            estimatedCost={estimatedCost}
            actualCost={actualCost}
            showBreakdown={true}
          />
          <LogStream
            logs={logs}
            maxHeight={350}
            showLevelFilter={false}
            showNodeFilter={false}
          />
        </div>
      </div>

      {/* Intervention Modal */}
      {currentIntervention && <InterventionContainer />}
    </div>
  );
}

// Status Icon Component
function StatusIcon({ status }: { status: string }) {
  const className = 'w-4 h-4';

  switch (status) {
    case 'initializing':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${className} animate-spin`}>
          <circle cx="12" cy="12" r="10" strokeDasharray="31 31" />
        </svg>
      );
    case 'running':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case 'paused':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      );
    case 'intervention':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'completed':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'failed':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'cancelled':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
