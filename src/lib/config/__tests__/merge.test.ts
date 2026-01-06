import { describe, it, expect } from 'vitest';
import { deepMerge } from '../merge';

describe('deepMerge', () => {
  it('merges primitive values (later wins)', () => {
    const base = { a: 1, b: 2 };
    const override = { b: 3 };
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 3 });
  });

  it('replaces arrays entirely (no concat)', () => {
    const base = { items: [1, 2, 3] };
    const override = { items: [4, 5] };
    const result = deepMerge(base, override);
    expect(result.items).toEqual([4, 5]);
  });

  it('recursively merges nested objects', () => {
    const base = { nested: { a: 1, b: 2 } } as Record<string, unknown>;
    const override = { nested: { b: 3, c: 4 } } as Partial<Record<string, unknown>>;
    const result = deepMerge(base, override);
    expect(result.nested).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('keeps base value when override is null', () => {
    const base = { a: 'keep' };
    const override = { a: null };
    const result = deepMerge(base, override as any);
    expect(result.a).toBe('keep');
  });

  it('keeps base value when override is undefined', () => {
    const base = { a: 'keep' };
    const override = { a: undefined };
    const result = deepMerge(base, override as any);
    expect(result.a).toBe('keep');
  });

  it('handles deeply nested structures', () => {
    const base = {
      level1: {
        level2: {
          level3: { value: 'base' },
        },
      },
    };
    const override = {
      level1: {
        level2: {
          level3: { value: 'override' },
        },
      },
    };
    const result = deepMerge(base, override);
    expect(result.level1.level2.level3.value).toBe('override');
  });
});
