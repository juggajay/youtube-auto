import { createClient } from '@supabase/supabase-js';
import { Logger } from '@/lib/logger';

export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface Run {
  id: string;
  user_id: string;
  workflow_id: string | null;
  status: RunStatus;
  current_node: string | null;
  config: Record<string, unknown>;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NodeOutput {
  id: string;
  run_id: string;
  node_type: string;
  node_id: string;
  status: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  duration_ms: number | null;
  cost_cents: number | null;
  created_at: string;
}

export interface CreateRunInput {
  userId: string;
  workflowId?: string;
  config?: Record<string, unknown>;
}

export interface UpdateRunInput {
  status?: RunStatus;
  currentNode?: string | null;
  error?: string | null;
  config?: Record<string, unknown>;
}

export interface CreateNodeOutputInput {
  runId: string;
  nodeType: string;
  nodeId: string;
  input?: Record<string, unknown>;
}

export interface UpdateNodeOutputInput {
  status?: string;
  output?: Record<string, unknown>;
  error?: string | null;
  durationMs?: number;
  costCents?: number;
}

export class RunManager {
  private supabase;
  private logger: Logger;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.logger = new Logger({ nodeType: 'RunManager' });
  }

  // Run operations
  async createRun(input: CreateRunInput): Promise<Run | null> {
    const { data, error } = await this.supabase
      .from('runs')
      .insert({
        user_id: input.userId,
        workflow_id: input.workflowId || null,
        status: 'pending',
        config: input.config || {},
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create run', { error: error.message });
      return null;
    }

    return data as Run;
  }

  async getRun(runId: string): Promise<Run | null> {
    const { data, error } = await this.supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error) {
      this.logger.error('Failed to get run', { runId, error: error.message });
      return null;
    }

    return data as Run;
  }

  async updateRun(runId: string, input: UpdateRunInput): Promise<Run | null> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 'running' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (['completed', 'failed', 'cancelled'].includes(input.status)) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (input.currentNode !== undefined) {
      updateData.current_node = input.currentNode;
    }

    if (input.error !== undefined) {
      updateData.error = input.error;
    }

    if (input.config !== undefined) {
      updateData.config = input.config;
    }

    const { data, error } = await this.supabase
      .from('runs')
      .update(updateData)
      .eq('id', runId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update run', { runId, error: error.message });
      return null;
    }

    return data as Run;
  }

  async listRuns(userId: string, limit = 20): Promise<Run[]> {
    const { data, error } = await this.supabase
      .from('runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to list runs', { userId, error: error.message });
      return [];
    }

    return data as Run[];
  }

  async deleteRun(runId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('runs')
      .delete()
      .eq('id', runId);

    if (error) {
      this.logger.error('Failed to delete run', { runId, error: error.message });
      return false;
    }

    return true;
  }

  // Node output operations
  async createNodeOutput(input: CreateNodeOutputInput): Promise<NodeOutput | null> {
    const { data, error } = await this.supabase
      .from('node_outputs')
      .insert({
        run_id: input.runId,
        node_type: input.nodeType,
        node_id: input.nodeId,
        status: 'running',
        input: input.input || null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create node output', { error: error.message });
      return null;
    }

    return data as NodeOutput;
  }

  async updateNodeOutput(outputId: string, input: UpdateNodeOutputInput): Promise<NodeOutput | null> {
    const updateData: Record<string, unknown> = {};

    if (input.status !== undefined) updateData.status = input.status;
    if (input.output !== undefined) updateData.output = input.output;
    if (input.error !== undefined) updateData.error = input.error;
    if (input.durationMs !== undefined) updateData.duration_ms = input.durationMs;
    if (input.costCents !== undefined) updateData.cost_cents = input.costCents;

    const { data, error } = await this.supabase
      .from('node_outputs')
      .update(updateData)
      .eq('id', outputId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update node output', { outputId, error: error.message });
      return null;
    }

    return data as NodeOutput;
  }

  async getNodeOutputs(runId: string): Promise<NodeOutput[]> {
    const { data, error } = await this.supabase
      .from('node_outputs')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to get node outputs', { runId, error: error.message });
      return [];
    }

    return data as NodeOutput[];
  }

  async getLatestNodeOutput(runId: string, nodeType: string): Promise<NodeOutput | null> {
    const { data, error } = await this.supabase
      .from('node_outputs')
      .select('*')
      .eq('run_id', runId)
      .eq('node_type', nodeType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data as NodeOutput;
  }

  // Workflow operations
  async getWorkflow(workflowId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
      this.logger.error('Failed to get workflow', { workflowId, error: error.message });
      return null;
    }

    return data;
  }

  async listWorkflows(userId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to list workflows', { userId, error: error.message });
      return [];
    }

    return data;
  }

  async createWorkflow(userId: string, name: string, description?: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase
      .from('workflows')
      .insert({
        user_id: userId,
        name,
        description: description || null,
        nodes: [],
        edges: [],
        config: {},
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create workflow', { error: error.message });
      return null;
    }

    return data;
  }

  async updateWorkflow(
    workflowId: string,
    updates: { name?: string; description?: string; nodes?: unknown[]; edges?: unknown[]; config?: Record<string, unknown> }
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase
      .from('workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update workflow', { workflowId, error: error.message });
      return null;
    }

    return data;
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
      this.logger.error('Failed to delete workflow', { workflowId, error: error.message });
      return false;
    }

    return true;
  }
}

// Singleton instance
export const runManager = new RunManager();
