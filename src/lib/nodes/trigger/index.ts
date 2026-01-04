import type { z } from 'zod';
import type { NodeContract, NodeMeta, ValidationResult, CostEstimate, NodeResult, ExecutionOptions } from '../base';
import type { RunContext } from '../context';
import { TriggerInputSchema, TriggerOutputSchema, TriggerConfigSchema } from './types';

export class TriggerNode implements NodeContract<
  typeof TriggerInputSchema,
  typeof TriggerOutputSchema,
  typeof TriggerConfigSchema
> {
  meta: NodeMeta = {
    id: 'trigger',
    name: 'Trigger',
    description: 'Initiates a pipeline run with a topic and archetype',
    icon: 'Play',
    category: 'trigger',
    requiredCredentials: [],
    estimatedDuration: '<1s',
  };

  inputSchema = TriggerInputSchema;
  outputSchema = TriggerOutputSchema;
  configSchema = TriggerConfigSchema;

  validate(
    input: z.infer<typeof TriggerInputSchema>,
    config: z.infer<typeof TriggerConfigSchema>,
    context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Topic validation
    if (input.topic.length < 10) {
      warnings.push({
        field: 'topic',
        message: 'Topic is very short — script may lack specificity',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  estimateCost(
    input: z.infer<typeof TriggerInputSchema>,
    config: z.infer<typeof TriggerConfigSchema>
  ): CostEstimate {
    return {
      estimated: true,
      breakdown: [],
      total: 0,
      confidence: 'high',
    };
  }

  async execute(
    input: z.infer<typeof TriggerInputSchema>,
    config: z.infer<typeof TriggerConfigSchema>,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<z.infer<typeof TriggerOutputSchema>>> {
    const startedAt = new Date();

    options?.onProgress?.({ percent: 50, message: 'Processing trigger...' });

    const output = {
      topic: input.topic.trim(),
      archetypeId: input.archetypeId || config.defaultArchetype || 'explainer',
      sourceType: input.sourceType,
      sourceData: input.sourceData,
    };

    const completedAt = new Date();

    options?.onProgress?.({ percent: 100, message: 'Trigger complete' });

    return {
      success: true,
      output,
      metadata: {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        actualCost: { estimated: true, breakdown: [], total: 0, confidence: 'high' },
        apiCalls: [],
      },
    };
  }

  getInputFromContext(context: RunContext): z.infer<typeof TriggerInputSchema> {
    // Trigger is first node, so input comes from runOverrides or defaults
    return {
      topic: (context.runOverrides as any).topic || '',
      archetypeId: (context.runOverrides as any).archetypeId || 'explainer',
      sourceType: 'manual',
    };
  }
}

// Export for registration
export { TriggerInputSchema, TriggerOutputSchema, TriggerConfigSchema } from './types';
