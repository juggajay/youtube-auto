import { EventEmitter } from 'events';
import type { NodeResult, NodeError, RunStatus } from '@/lib/nodes/base';
import { isSuccessResult } from '@/lib/nodes/base';
import { createInitialRunContext, type RunContext } from '@/lib/nodes/context';
import { NodeRegistry, nodeRegistry } from '@/lib/nodes/registry';
import { resolveConfig, type ConfigSource } from '@/lib/config/resolve';
import type { PipelineDefinition, PipelineNodeConfig } from '@/lib/pipelines/types';
import type { InterventionLevel } from '@/lib/config/types';
import type { RunOptions, RunProgressUpdate, InterventionResponse } from './types';

export class PipelineOrchestrator extends EventEmitter {
  private context: RunContext;
  private pipeline: PipelineDefinition;
  private options: RunOptions;
  private registry: NodeRegistry;

  // Intervention handling (race-safe)
  private interventionQueue: InterventionResponse[] = [];
  private pendingIntervention: {
    nodeId: string;
    output: unknown;
    resolve: (response: InterventionResponse) => void;
  } | null = null;

  constructor(
    pipeline: PipelineDefinition,
    configSources: ConfigSource[],
    userId: string,
    projectId: string,
    options: RunOptions = {},
    registry: NodeRegistry = nodeRegistry
  ) {
    super();
    this.pipeline = pipeline;
    this.options = options;
    this.registry = registry;

    const resolvedConfig = resolveConfig(configSources);

    this.context = createInitialRunContext({
      userId,
      projectId,
      config: resolvedConfig,
    });
  }

  // === Getters ===

  get runId(): string {
    return this.context.runId;
  }

  get status(): RunStatus {
    return this.context.status;
  }

  get currentOutput(): RunContext['previousOutputs'] {
    return this.context.previousOutputs;
  }

  // === Main Execution ===

  async run(): Promise<RunContext> {
    this.context.status = 'running';
    this.emitProgress();

    try {
      const executionOrder = this.resolveExecutionOrder();

      for (const nodeConfig of executionOrder) {
        if (this.options.signal?.aborted) {
          this.context.status = 'cancelled';
          break;
        }

        if (this.context.completedNodes.includes(nodeConfig.id)) {
          continue;
        }

        if (nodeConfig.condition && !nodeConfig.condition(this.context)) {
          this.context.skippedNodes.push(nodeConfig.id);
          continue;
        }

        if (this.context.runOverrides.skipNodes?.includes(nodeConfig.id)) {
          this.context.skippedNodes.push(nodeConfig.id);
          continue;
        }

        await this.executeNode(nodeConfig);

        // Status may have changed during node execution - check current state
        const currentStatus = this.context.status as RunStatus;
        if (currentStatus === 'awaiting_review') {
          return this.context;
        }
      }

      // Only mark completed if still in running state (not cancelled)
      const finalStatus = this.context.status;
      if (finalStatus === 'running') {
        this.context.status = 'completed';
      }

    } catch (error) {
      this.context.status = 'failed';
      throw error;
    }

    return this.context;
  }

  // === Node Execution (Loop-Based) ===

  private async executeNode(nodeConfig: PipelineNodeConfig): Promise<void> {
    const node = this.registry.get(nodeConfig.nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeConfig.nodeId}`);
    }

    this.context.currentNode = nodeConfig.id;
    this.emitProgress();

    let shouldContinue = true;

    while (shouldContinue) {
      this.context.retry = { attemptNumber: 1, maxAttempts: 3, lastError: undefined };

      const result = await this.executeWithRetries(node, nodeConfig);

      if (!isSuccessResult(result)) {
        if (this.context.config.intervention.defaults.pauseOnError) {
          this.context.status = 'awaiting_review';

          const response = await this.waitForIntervention(nodeConfig.id, result);

          if (response.action === 'regenerate' || response.action === 'regenerate_with_feedback') {
            if (response.action === 'regenerate_with_feedback') {
              this.appendInstructions(response.feedback);
            }
            continue;
          } else if (response.action === 'skip') {
            this.handleSkip(nodeConfig, response.manualInput);
            shouldContinue = false;
          } else if (response.action === 'cancel') {
            this.context.status = 'cancelled';
            shouldContinue = false;
          }
        } else {
          throw new NodeExecutionError(nodeConfig.id, result.error);
        }
        continue;
      }

      // Success
      this.context.previousOutputs[nodeConfig.id] = result.output;

      const interventionLevel = this.getInterventionLevel(nodeConfig.nodeId);

      if (interventionLevel === 'auto') {
        this.context.completedNodes.push(nodeConfig.id);
        this.options.onNodeComplete?.(nodeConfig.id, result);
        shouldContinue = false;
      } else {
        this.context.status = 'awaiting_review';

        const response = await this.waitForIntervention(nodeConfig.id, result.output);

        switch (response.action) {
          case 'approve':
            this.context.completedNodes.push(nodeConfig.id);
            this.context.status = 'running';
            shouldContinue = false;
            break;
          case 'approve_with_edits':
            this.context.previousOutputs[nodeConfig.id] = response.edits;
            this.context.completedNodes.push(nodeConfig.id);
            this.context.status = 'running';
            shouldContinue = false;
            break;
          case 'regenerate':
            this.context.status = 'running';
            break;
          case 'regenerate_with_feedback':
            this.appendInstructions(response.feedback);
            this.context.status = 'running';
            break;
          case 'skip':
            this.handleSkip(nodeConfig, response.manualInput);
            shouldContinue = false;
            break;
          case 'cancel':
            this.context.status = 'cancelled';
            shouldContinue = false;
            break;
        }
      }
    }

    this.context.currentNode = null;
  }

  // === Retry Logic ===

  private async executeWithRetries(
    node: any,
    nodeConfig: PipelineNodeConfig
  ): Promise<NodeResult<unknown>> {
    const input = this.buildNodeInput(node, nodeConfig);
    const config = this.getNodeConfig(nodeConfig);

    let result: NodeResult<unknown> = {
      success: false,
      error: { code: 'NO_ATTEMPTS', message: 'No execution attempts made', retryable: false },
    };

    while (this.context.retry.attemptNumber <= this.context.retry.maxAttempts) {
      result = await node.execute(input, config, this.context, {
        signal: this.options.signal,
        onProgress: (progress: any) => this.emitProgress(progress),
        onLog: (entry: any) => this.context.services.logger.log(entry.level, entry.message, entry.data),
      });

      if (isSuccessResult(result)) break;
      if (!result.error.retryable) break;
      if (this.context.retry.attemptNumber >= this.context.retry.maxAttempts) break;

      this.context.retry.attemptNumber++;
      this.context.retry.lastError = result.error;
    }

    return result;
  }

  // === Intervention (Race-Safe) ===

  async respondToIntervention(response: InterventionResponse): Promise<void> {
    if (this.pendingIntervention) {
      this.pendingIntervention.resolve(response);
      this.pendingIntervention = null;
    } else {
      this.interventionQueue.push(response);
    }
  }

  private async waitForIntervention(nodeId: string, output: unknown): Promise<InterventionResponse> {
    if (this.interventionQueue.length > 0) {
      return this.interventionQueue.shift()!;
    }

    return new Promise((resolve) => {
      this.pendingIntervention = { nodeId, output, resolve };
      this.options.onIntervention?.(nodeId, output);
      this.emit('intervention', { nodeId, output });
    });
  }

  // === Helpers ===

  private resolveExecutionOrder(): PipelineNodeConfig[] {
    const order: PipelineNodeConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeConfig: PipelineNodeConfig) => {
      if (visited.has(nodeConfig.id)) return;
      if (visiting.has(nodeConfig.id)) {
        throw new Error(`Circular dependency: ${nodeConfig.id}`);
      }

      visiting.add(nodeConfig.id);
      for (const depId of nodeConfig.dependsOn || []) {
        const dep = this.pipeline.nodes.find(n => n.id === depId);
        if (dep) visit(dep);
      }
      visiting.delete(nodeConfig.id);
      visited.add(nodeConfig.id);
      order.push(nodeConfig);
    };

    for (const nodeConfig of this.pipeline.nodes) {
      visit(nodeConfig);
    }
    return order;
  }

  private buildNodeInput(node: any, nodeConfig: PipelineNodeConfig): unknown {
    if (node.getInputFromContext) {
      return node.getInputFromContext(this.context);
    }
    return {
      ...this.context.previousOutputs,
      runOverrides: this.context.runOverrides,
    };
  }

  private getNodeConfig(nodeConfig: PipelineNodeConfig): unknown {
    const baseConfig = (this.context.config as any)[nodeConfig.nodeId];
    const overrides = this.context.runOverrides.nodeOverrides?.[nodeConfig.id];
    return overrides ? { ...baseConfig, ...overrides } : baseConfig ?? {};
  }

  private getInterventionLevel(nodeId: string): InterventionLevel {
    return this.context.config.intervention.nodes[nodeId] || 'auto';
  }

  private appendInstructions(feedback: string): void {
    this.context.runOverrides.instructions =
      (this.context.runOverrides.instructions || '') + '\n\nUser feedback: ' + feedback;
  }

  private handleSkip(nodeConfig: PipelineNodeConfig, manualInput?: unknown): void {
    if (manualInput) {
      this.context.previousOutputs[nodeConfig.id] = manualInput;
    }
    this.context.skippedNodes.push(nodeConfig.id);
    this.context.status = 'running';
  }

  private emitProgress(nodeProgress?: { percent: number; message: string }): void {
    const completedCount = this.context.completedNodes.length;
    const totalCount = this.pipeline.nodes.length;

    const update: RunProgressUpdate = {
      runId: this.context.runId,
      status: this.context.status,
      currentNode: this.context.currentNode,
      completedNodes: this.context.completedNodes,
      overallPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      nodeProgress,
    };

    this.options.onProgress?.(update);
    this.emit('progress', update);
  }
}

// === Errors ===

export class NodeExecutionError extends Error {
  constructor(
    public nodeId: string,
    public nodeError: NodeError
  ) {
    super(`Execution failed for ${nodeId}: ${nodeError.message}`);
    this.name = 'NodeExecutionError';
  }
}

export class NodeValidationError extends Error {
  constructor(
    public nodeId: string,
    public errors: { field: string; message: string }[]
  ) {
    super(`Validation failed for ${nodeId}: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'NodeValidationError';
  }
}

// Re-export types
export type { RunOptions, RunProgressUpdate, InterventionResponse, SavedRunState } from './types';
