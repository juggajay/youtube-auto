import { describe, it, expect } from 'vitest';
import { createInitialRunContext, type RunContext } from '../context';

describe('RunContext', () => {
  it('creates initial context with required fields', () => {
    const context = createInitialRunContext({
      userId: 'user-123',
      projectId: 'project-456',
    });

    expect(context.runId).toBeDefined();
    expect(context.userId).toBe('user-123');
    expect(context.projectId).toBe('project-456');
    expect(context.status).toBe('pending');
    expect(context.completedNodes).toEqual([]);
    expect(context.skippedNodes).toEqual([]);
    expect(context.previousOutputs).toEqual({});
  });

  it('initializes retry state correctly', () => {
    const context = createInitialRunContext({
      userId: 'user-123',
      projectId: 'project-456',
    });

    expect(context.retry.attemptNumber).toBe(1);
    expect(context.retry.maxAttempts).toBe(3);
    expect(context.retry.lastError).toBeUndefined();
  });
});
