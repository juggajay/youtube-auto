import type { NodeResult, RunStatus } from '@/lib/nodes/base';
import type { RunContext } from '@/lib/nodes/context';
import type { PipelineDefinition } from '@/lib/pipelines/types';

export interface RunOptions {
  signal?: AbortSignal;
  onProgress?: (update: RunProgressUpdate) => void;
  onNodeComplete?: (nodeId: string, result: NodeResult<unknown>) => void;
  onIntervention?: (nodeId: string, output: unknown) => void;
}

export interface RunProgressUpdate {
  runId: string;
  status: RunStatus;
  currentNode: string | null;
  completedNodes: string[];
  overallPercent: number;
  nodeProgress?: { percent: number; message: string };
}

export type InterventionResponse =
  | { action: 'approve' }
  | { action: 'approve_with_edits'; edits: unknown }
  | { action: 'regenerate' }
  | { action: 'regenerate_with_feedback'; feedback: string }
  | { action: 'skip'; manualInput?: unknown }
  | { action: 'cancel' };

export interface SavedRunState {
  context: RunContext;
  pipeline: PipelineDefinition;
}
