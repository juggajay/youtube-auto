import { describe, it, expect } from 'vitest';
import { TriggerNode, TriggerConfigSchema } from '../index';
import { createInitialRunContext } from '@/lib/nodes/context';

describe('TriggerNode', () => {
  const node = new TriggerNode();
  const defaultConfig = TriggerConfigSchema.parse({});

  it('has correct metadata', () => {
    expect(node.meta.id).toBe('trigger');
    expect(node.meta.category).toBe('trigger');
  });

  it('validates valid input', () => {
    const context = createInitialRunContext({ userId: 'user', projectId: 'project' });
    const result = node.validate(
      { topic: 'Test Topic', archetypeId: 'explainer', sourceType: 'manual' },
      defaultConfig,
      context
    );
    expect(result.valid).toBe(true);
  });

  it('returns warning for short topic', () => {
    const context = createInitialRunContext({ userId: 'user', projectId: 'project' });
    const result = node.validate(
      { topic: 'Hi', archetypeId: 'explainer', sourceType: 'manual' },
      defaultConfig,
      context
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('executes and returns output', async () => {
    const context = createInitialRunContext({ userId: 'user', projectId: 'project' });
    const result = await node.execute(
      { topic: 'Test Topic', archetypeId: 'explainer', sourceType: 'manual' },
      defaultConfig,
      context
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.topic).toBe('Test Topic');
      expect(result.output.archetypeId).toBe('explainer');
    }
  });

  it('estimates zero cost (no API calls)', () => {
    const estimate = node.estimateCost(
      { topic: 'Test', archetypeId: 'explainer', sourceType: 'manual' },
      defaultConfig
    );
    expect(estimate.total).toBe(0);
  });
});
