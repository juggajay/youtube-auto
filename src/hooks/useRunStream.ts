'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRunStore } from '@/lib/stores/runs';

/**
 * SSE event types emitted by the run stream
 */
export type RunStreamEventType =
  | 'progress'
  | 'node_start'
  | 'node_complete'
  | 'node_error'
  | 'log'
  | 'intervention'
  | 'cost_update'
  | 'complete'
  | 'error';

export interface ProgressEvent {
  type: 'progress';
  nodeId: string;
  percent: number;
}

export interface NodeStartEvent {
  type: 'node_start';
  nodeId: string;
}

export interface NodeCompleteEvent {
  type: 'node_complete';
  nodeId: string;
  output: Record<string, unknown>;
}

export interface NodeErrorEvent {
  type: 'node_error';
  nodeId: string;
  error: string;
}

export interface LogEvent {
  type: 'log';
  level: 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
}

export interface InterventionEvent {
  type: 'intervention';
  interventionId: string;
  nodeType: string;
  content: unknown;
}

export interface CostUpdateEvent {
  type: 'cost_update';
  totalCents: number;
}

export interface CompleteEvent {
  type: 'complete';
}

export interface ErrorEvent {
  type: 'error';
  error: string;
}

export type RunStreamEvent =
  | ProgressEvent
  | NodeStartEvent
  | NodeCompleteEvent
  | NodeErrorEvent
  | LogEvent
  | InterventionEvent
  | CostUpdateEvent
  | CompleteEvent
  | ErrorEvent;

interface UseRunStreamOptions {
  /** Callback fired when connected to the stream */
  onConnect?: () => void;
  /** Callback fired when disconnected from the stream */
  onDisconnect?: () => void;
  /** Callback fired on reconnection attempt */
  onReconnect?: (attempt: number) => void;
  /** Maximum reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Base delay for reconnection in ms (default: 1000) */
  reconnectBaseDelay?: number;
}

interface UseRunStreamReturn {
  /** Whether the stream is currently connected */
  isConnected: boolean;
  /** Current reconnection attempt number (0 if not reconnecting) */
  reconnectAttempt: number;
  /** Manually disconnect from the stream */
  disconnect: () => void;
  /** Manually reconnect to the stream */
  reconnect: () => void;
}

/**
 * SSE hook for real-time run progress updates
 *
 * Connects to /api/runs/[id]/stream and handles all event types:
 * - progress: Node execution progress (0-100%)
 * - node_start: Node started executing
 * - node_complete: Node finished successfully
 * - node_error: Node failed with error
 * - log: Activity log entry
 * - intervention: User intervention required
 * - cost_update: Running cost updated
 * - complete: Run completed successfully
 * - error: Run failed
 *
 * Features auto-reconnection with exponential backoff on connection errors.
 */
export function useRunStream(
  runId: string | null,
  options: UseRunStreamOptions = {}
): UseRunStreamReturn {
  const {
    onConnect,
    onDisconnect,
    onReconnect,
    maxReconnectAttempts = 5,
    reconnectBaseDelay = 1000,
  } = options;

  // State for values that need to trigger re-renders
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Refs for internal state that doesn't need re-renders
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  // Use a ref for connect function to avoid circular dependency
  const connectRef = useRef<() => void>(() => {});

  const { updateRun, addNodeOutput, updateNodeOutput, setError } = useRunStore();

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected((wasConnected) => {
      if (wasConnected) {
        onDisconnect?.();
      }
      return false;
    });
    setReconnectAttempt(0);
  }, [onDisconnect]);

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as RunStreamEvent;

      switch (data.type) {
        case 'progress':
          // Update node output with progress
          updateNodeOutput(data.nodeId, {
            status: 'running',
            output: { progress: data.percent }
          });
          break;

        case 'node_start':
          // Create a new node output entry
          addNodeOutput({
            id: `${runId}-${data.nodeId}-${Date.now()}`,
            run_id: runId!,
            node_type: data.nodeId,
            node_id: data.nodeId,
            status: 'running',
            input: null,
            output: null,
            error: null,
            duration_ms: null,
            cost_cents: null,
            created_at: new Date().toISOString(),
          });
          // Update run's current node
          updateRun(runId!, { current_node: data.nodeId });
          break;

        case 'node_complete':
          updateNodeOutput(data.nodeId, {
            status: 'completed',
            output: data.output,
          });
          break;

        case 'node_error':
          updateNodeOutput(data.nodeId, {
            status: 'failed',
            error: data.error,
          });
          break;

        case 'log':
          // Log events are informational - could be handled by a separate log store
          console.log(`[${data.level}]${data.nodeId ? ` [${data.nodeId}]` : ''} ${data.message}`);
          break;

        case 'intervention':
          // Pause the run and signal that intervention is needed
          updateRun(runId!, { status: 'paused' });
          // The intervention data should be handled by an intervention store or component
          console.log('Intervention required:', data);
          break;

        case 'cost_update':
          // Update run config with current cost
          // Note: This is a simplified approach - you may want a dedicated cost tracking mechanism
          console.log('Cost update:', data.totalCents);
          break;

        case 'complete':
          updateRun(runId!, {
            status: 'completed',
            completed_at: new Date().toISOString(),
          });
          disconnect();
          break;

        case 'error':
          setError(data.error);
          updateRun(runId!, {
            status: 'failed',
            error: data.error,
            completed_at: new Date().toISOString(),
          });
          disconnect();
          break;
      }
    } catch (parseError) {
      console.error('Failed to parse SSE event:', parseError);
    }
  }, [runId, updateRun, addNodeOutput, updateNodeOutput, setError, disconnect]);

  // Reconnection handler that uses the ref
  const scheduleReconnect = useCallback((attempt: number) => {
    const delay = reconnectBaseDelay * Math.pow(2, attempt - 1);
    onReconnect?.(attempt);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connectRef.current();
      }
    }, delay);
  }, [reconnectBaseDelay, onReconnect]);

  const connect = useCallback(() => {
    if (!runId || !mountedRef.current) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/runs/${runId}/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) {
        es.close();
        return;
      }
      setIsConnected(true);
      setReconnectAttempt(0);
      onConnect?.();
    };

    es.onmessage = handleEvent;

    es.onerror = () => {
      if (!mountedRef.current) {
        es.close();
        return;
      }

      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Attempt reconnection with exponential backoff
      setReconnectAttempt((prev) => {
        const nextAttempt = prev + 1;
        if (nextAttempt <= maxReconnectAttempts) {
          scheduleReconnect(nextAttempt);
          return nextAttempt;
        } else {
          // Max reconnection attempts reached
          onDisconnect?.();
          setError(`Connection lost after ${maxReconnectAttempts} reconnection attempts`);
          return prev;
        }
      });
    };
  }, [runId, handleEvent, maxReconnectAttempts, onConnect, onDisconnect, setError, scheduleReconnect]);

  // Keep the ref updated with the latest connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const reconnect = useCallback(() => {
    setReconnectAttempt(0);
    disconnect();
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    mountedRef.current = true;

    if (runId) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [runId, connect, disconnect]);

  return {
    isConnected,
    reconnectAttempt,
    disconnect,
    reconnect,
  };
}
