import { describe, it, expect, beforeEach } from 'vitest';
import { NodeRegistry, nodeRegistry } from '../registry';
import type { NodeContract } from '../base';
import { z } from 'zod';

// Mock node for testing
const mockNode: NodeContract<any, any, any> = {
  meta: {
    id: 'test-node',
    name: 'Test Node',
    description: 'A test node',
    icon: 'TestIcon',
    category: 'content',
    requiredCredentials: [],
    estimatedDuration: '1s',
  },
  inputSchema: z.object({ value: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  configSchema: z.object({}),
  validate: () => ({ valid: true, errors: [], warnings: [] }),
  estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
  execute: async () => ({
    success: true,
    output: { result: 'test' },
    metadata: {
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
      actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
      apiCalls: [],
    },
  }),
};

describe('NodeRegistry', () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    registry = new NodeRegistry();
  });

  it('registers a node', () => {
    registry.register(mockNode);
    expect(registry.has('test-node')).toBe(true);
  });

  it('retrieves a registered node', () => {
    registry.register(mockNode);
    const node = registry.get('test-node');
    expect(node).toBe(mockNode);
  });

  it('returns undefined for unregistered node', () => {
    const node = registry.get('nonexistent');
    expect(node).toBeUndefined();
  });

  it('lists all registered nodes', () => {
    registry.register(mockNode);
    const nodes = registry.list();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].meta.id).toBe('test-node');
  });

  it('prevents duplicate registration', () => {
    registry.register(mockNode);
    expect(() => registry.register(mockNode)).toThrow('already registered');
  });
});
