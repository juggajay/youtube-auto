import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelineOrchestrator } from '../index';
import { NodeRegistry } from '@/lib/nodes/registry';
import type { NodeContract } from '@/lib/nodes/base';
import type { ResolvedConfig } from '@/lib/config/types';
import type { ConfigSource } from '@/lib/config/resolve';
import { z } from 'zod';

// Helper to create test config sources with proper typing
const testConfigSource: ConfigSource = {
  level: 'project',
  config: { voice: { voiceId: 'test' }, publish: { channel_id: 'test' } } as Partial<ResolvedConfig>,
};

// Create a fresh registry for tests
const testRegistry = new NodeRegistry();

// Create a minimal mock trigger node
const createMockTriggerNode = (): NodeContract<any, any, any> => ({
  meta: {
    id: 'trigger',
    name: 'Trigger',
    description: 'Test trigger',
    icon: 'Play',
    category: 'trigger',
    requiredCredentials: [],
    estimatedDuration: '1s',
  },
  inputSchema: z.object({}),
  outputSchema: z.object({ topic: z.string(), archetypeId: z.string() }),
  configSchema: z.object({}),
  validate: () => ({ valid: true, errors: [], warnings: [] }),
  estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
  execute: async () => ({
    success: true,
    output: { topic: 'Test Topic', archetypeId: 'explainer' },
    metadata: {
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 10,
      actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
      apiCalls: [],
    },
  }),
  getInputFromContext: () => ({}),
});

describe('PipelineOrchestrator', () => {
  beforeEach(() => {
    // Clear and re-register mock nodes
    (testRegistry as any).nodes = new Map();
    testRegistry.register(createMockTriggerNode());
  });

  it('creates orchestrator with valid params', () => {
    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    expect(orchestrator.runId).toBeDefined();
    expect(orchestrator.status).toBe('pending');
  });

  it('executes single-node pipeline successfully', async () => {
    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    const result = await orchestrator.run();
    expect(result.status).toBe('completed');
    expect(result.previousOutputs.trigger).toBeDefined();
  });

  it('reports progress during execution', async () => {
    const progressUpdates: any[] = [];

    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      { onProgress: (update) => progressUpdates.push(update) },
      testRegistry
    );

    await orchestrator.run();
    expect(progressUpdates.length).toBeGreaterThan(0);
  });

  it('handles node not found error', async () => {
    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'nonexistent', id: 'test-node' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    await expect(orchestrator.run()).rejects.toThrow('Node not found: nonexistent');
  });

  it('respects abort signal', async () => {
    const controller = new AbortController();
    controller.abort();

    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      { signal: controller.signal },
      testRegistry
    );

    const result = await orchestrator.run();
    expect(result.status).toBe('cancelled');
  });

  it('skips nodes in skipNodes list', async () => {
    // Create a two-node pipeline
    const mockSecondNode = (): NodeContract<any, any, any> => ({
      meta: {
        id: 'second',
        name: 'Second',
        description: 'Second node',
        icon: 'Box',
        category: 'content',
        requiredCredentials: [],
        estimatedDuration: '1s',
      },
      inputSchema: z.object({}),
      outputSchema: z.object({ result: z.string() }),
      configSchema: z.object({}),
      validate: () => ({ valid: true, errors: [], warnings: [] }),
      estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
      execute: async () => ({
        success: true,
        output: { result: 'done' },
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 10,
          actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
          apiCalls: [],
        },
      }),
      getInputFromContext: () => ({}),
    });

    testRegistry.register(mockSecondNode());

    const orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test',
        nodes: [
          { nodeId: 'trigger', id: 'trigger' },
          { nodeId: 'second', id: 'second', dependsOn: ['trigger'] },
        ],
      },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    // Access context to set skipNodes
    (orchestrator as any).context.runOverrides.skipNodes = ['second'];

    const result = await orchestrator.run();
    expect(result.status).toBe('completed');
    expect(result.skippedNodes).toContain('second');
    expect(result.previousOutputs.second).toBeUndefined();
  });

  it('executes nodes respecting dependency order', async () => {
    const executionOrder: string[] = [];

    const createOrderedNode = (id: string): NodeContract<any, any, any> => ({
      meta: {
        id,
        name: id,
        description: `Node ${id}`,
        icon: 'Box',
        category: 'content',
        requiredCredentials: [],
        estimatedDuration: '1s',
      },
      inputSchema: z.object({}),
      outputSchema: z.object({ id: z.string() }),
      configSchema: z.object({}),
      validate: () => ({ valid: true, errors: [], warnings: [] }),
      estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
      execute: async () => {
        executionOrder.push(id);
        return {
          success: true,
          output: { id },
          metadata: {
            startedAt: new Date(),
            completedAt: new Date(),
            durationMs: 10,
            actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
            apiCalls: [],
          },
        };
      },
      getInputFromContext: () => ({}),
    });

    // Clear and register ordered nodes
    (testRegistry as any).nodes = new Map();
    testRegistry.register(createOrderedNode('A'));
    testRegistry.register(createOrderedNode('B'));
    testRegistry.register(createOrderedNode('C'));

    const orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test',
        nodes: [
          { nodeId: 'C', id: 'C', dependsOn: ['B'] },
          { nodeId: 'A', id: 'A' },
          { nodeId: 'B', id: 'B', dependsOn: ['A'] },
        ],
      },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    await orchestrator.run();
    expect(executionOrder).toEqual(['A', 'B', 'C']);
  });

  it('detects circular dependencies', async () => {
    const orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test',
        nodes: [
          { nodeId: 'trigger', id: 'A', dependsOn: ['B'] },
          { nodeId: 'trigger', id: 'B', dependsOn: ['A'] },
        ],
      },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    await expect(orchestrator.run()).rejects.toThrow('Circular dependency');
  });

  it('skips nodes when condition returns false', async () => {
    const mockSecondNode = (): NodeContract<any, any, any> => ({
      meta: {
        id: 'conditional',
        name: 'Conditional',
        description: 'Conditional node',
        icon: 'Box',
        category: 'content',
        requiredCredentials: [],
        estimatedDuration: '1s',
      },
      inputSchema: z.object({}),
      outputSchema: z.object({ result: z.string() }),
      configSchema: z.object({}),
      validate: () => ({ valid: true, errors: [], warnings: [] }),
      estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
      execute: async () => ({
        success: true,
        output: { result: 'should not run' },
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 10,
          actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
          apiCalls: [],
        },
      }),
      getInputFromContext: () => ({}),
    });

    (testRegistry as any).nodes = new Map();
    testRegistry.register(createMockTriggerNode());
    testRegistry.register(mockSecondNode());

    const orchestrator = new PipelineOrchestrator(
      {
        id: 'test',
        name: 'Test',
        nodes: [
          { nodeId: 'trigger', id: 'trigger' },
          {
            nodeId: 'conditional',
            id: 'conditional',
            dependsOn: ['trigger'],
            condition: () => false, // Always skip
          },
        ],
      },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    const result = await orchestrator.run();
    expect(result.status).toBe('completed');
    expect(result.skippedNodes).toContain('conditional');
  });

  it('calls onNodeComplete callback', async () => {
    const nodeCompleteResults: { nodeId: string; result: any }[] = [];

    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      {
        onNodeComplete: (nodeId, result) => {
          nodeCompleteResults.push({ nodeId, result });
        },
      },
      testRegistry
    );

    await orchestrator.run();
    expect(nodeCompleteResults.length).toBe(1);
    expect(nodeCompleteResults[0].nodeId).toBe('trigger');
  });

  it('provides currentOutput getter', () => {
    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    expect(orchestrator.currentOutput).toEqual({});
  });

  it('handles retryable errors with retry logic', async () => {
    let attemptCount = 0;

    const retryableNode = (): NodeContract<any, any, any> => ({
      meta: {
        id: 'retryable',
        name: 'Retryable',
        description: 'Retryable node',
        icon: 'Box',
        category: 'content',
        requiredCredentials: [],
        estimatedDuration: '1s',
      },
      inputSchema: z.object({}),
      outputSchema: z.object({ result: z.string() }),
      configSchema: z.object({}),
      validate: () => ({ valid: true, errors: [], warnings: [] }),
      estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
      execute: async () => {
        attemptCount++;
        if (attemptCount < 3) {
          return {
            success: false,
            error: { code: 'RETRY', message: 'Retry me', retryable: true },
          };
        }
        return {
          success: true,
          output: { result: 'success after retries' },
          metadata: {
            startedAt: new Date(),
            completedAt: new Date(),
            durationMs: 10,
            actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
            apiCalls: [],
          },
        };
      },
      getInputFromContext: () => ({}),
    });

    (testRegistry as any).nodes = new Map();
    testRegistry.register(retryableNode());

    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'retryable', id: 'retryable' }] },
      [testConfigSource],
      'user-123',
      'project-456',
      {},
      testRegistry
    );

    // Disable pauseOnError for this test
    (orchestrator as any).context.config.intervention.defaults.pauseOnError = false;

    const result = await orchestrator.run();
    expect(result.status).toBe('completed');
    expect(attemptCount).toBe(3);
  });
});
