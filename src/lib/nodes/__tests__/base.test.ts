import { describe, it, expect } from 'vitest';
import {
  type CredentialType,
  type NodeCategory,
  type NodeMeta,
  type ValidationResult,
  type CostEstimate,
  type NodeResult,
  type NodeError,
  isSuccessResult,
  isFailureResult,
} from '../base';

describe('Node Base Types', () => {
  describe('NodeResult type guards', () => {
    it('isSuccessResult returns true for success result', () => {
      const result: NodeResult<string> = {
        success: true,
        output: 'test',
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 100,
          actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
          apiCalls: [],
        },
      };
      expect(isSuccessResult(result)).toBe(true);
      expect(isFailureResult(result)).toBe(false);
    });

    it('isFailureResult returns true for failure result', () => {
      const result: NodeResult<string> = {
        success: false,
        error: { code: 'TEST_ERROR', message: 'Test', retryable: false },
      };
      expect(isFailureResult(result)).toBe(true);
      expect(isSuccessResult(result)).toBe(false);
    });
  });

  describe('ValidationResult', () => {
    it('can represent valid result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };
      expect(result.valid).toBe(true);
    });

    it('can represent invalid result with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [{ field: 'topic', message: 'Topic is required' }],
        warnings: [],
      };
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});
