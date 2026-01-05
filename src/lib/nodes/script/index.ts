import type {
  NodeContract,
  NodeMeta,
  NodeResult,
  ExecutionOptions,
  ValidationResult,
  CostEstimate,
  ApiCallLog,
} from '../base';
import type { RunContext } from '../context';
import {
  ScriptInputSchema,
  ScriptOutputSchema,
  ScriptConfigSchema,
  ScriptInput,
  ScriptOutput,
  ScriptConfig,
} from './types';
import { buildScriptPrompt } from './prompt';
import { parseScriptResponse } from './parser';

export class ScriptGeneratorNode implements NodeContract<
  typeof ScriptInputSchema,
  typeof ScriptOutputSchema,
  typeof ScriptConfigSchema
> {
  meta: NodeMeta = {
    id: 'script',
    name: 'Script Generator',
    description: 'Generates video scripts from structure, rules, and context',
    icon: 'FileText',
    category: 'content',
    requiredCredentials: ['anthropic'],
    estimatedDuration: '30s - 2min',
  };

  inputSchema = ScriptInputSchema;
  outputSchema = ScriptOutputSchema;
  configSchema = ScriptConfigSchema;

  // === Get Input from Context ===

  getInputFromContext(context: RunContext): ScriptInput {
    const trigger = context.previousOutputs.trigger;
    const research = context.previousOutputs.research;

    // Structure must come from trigger or run overrides
    // This is set by UI before run starts
    const nodeOverrides = context.runOverrides.nodeOverrides?.script as
      | { structure?: ScriptInput['structure']; rules?: ScriptInput['rules'] }
      | undefined;

    const structure = nodeOverrides?.structure ?? (trigger as { structure?: ScriptInput['structure'] })?.structure;

    if (!structure) {
      throw new Error('Script structure not provided');
    }

    return {
      topic: trigger?.topic ?? '',
      structure,
      rules: nodeOverrides?.rules,
      research: research as ScriptInput['research'],
      examples: context.config.channelBible?.example_scripts?.map(ex => ({
        name: ex.name,
        topic: ex.name, // Use name as topic for examples
        script: ex.script,
        notes: ex.notes,
      })),
      instructions: context.runOverrides.instructions,
    };
  }

  // === Validation ===

  validate(
    input: ScriptInput,
    config: ScriptConfig,
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

    // Structure validation
    if (input.structure.sections.length === 0) {
      errors.push({
        field: 'structure.sections',
        message: 'At least one section required',
      });
    }

    // Duration sanity check
    const { min, max } = input.structure.totalDuration;
    if (min > max) {
      errors.push({
        field: 'structure.totalDuration',
        message: 'Min duration cannot exceed max duration',
      });
    }

    if (max > 3600) {
      warnings.push({
        field: 'structure.totalDuration',
        message: 'Videos over 60 minutes may have quality issues',
      });
    }

    // Channel bible check
    if (!context.config.channelBible?.target_audience?.demographics) {
      warnings.push({
        field: 'channelBible',
        message: 'No target audience defined — script tone may not match viewers',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===

  estimateCost(input: ScriptInput, config: ScriptConfig): CostEstimate {
    // Estimate based on structure complexity
    const sectionCount = input.structure.sections.length;
    const hasResearch = !!input.research;
    const hasExamples = (input.examples?.length ?? 0) > 0;

    // Rough token estimates
    const basePromptTokens = 1500;
    const perSectionTokens = 200;
    const researchTokens = hasResearch ? 800 : 0;
    const examplesTokens = hasExamples ? 1000 : 0;

    const promptTokens = basePromptTokens +
      (sectionCount * perSectionTokens) +
      researchTokens +
      examplesTokens;

    // Output: ~150 words per minute of video
    const targetMinutes = input.structure.totalDuration.max / 60;
    const outputTokens = Math.round(targetMinutes * 150 * 1.5);  // 1.5 for JSON overhead

    const costs: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
      'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
      'gpt-4o': { input: 0.005, output: 0.015 },
    };

    const modelCosts = costs[config.model];
    const total =
      (promptTokens / 1000) * modelCosts.input +
      (outputTokens / 1000) * modelCosts.output;

    return {
      estimated: true,
      breakdown: [{
        service: config.model.includes('claude') ? 'anthropic' : 'openai',
        units: promptTokens + outputTokens,
        unitType: 'tokens',
        cost: total,
      }],
      total,
      confidence: 'medium',
    };
  }

  // === Execution ===

  async execute(
    input: ScriptInput,
    config: ScriptConfig,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<ScriptOutput>> {
    const startedAt = new Date();
    const apiCalls: ApiCallLog[] = [];

    try {
      // Check cancellation
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      options?.onProgress?.({ percent: 10, message: 'Building prompt...', stage: 'prompt' });

      // Build prompt with all context
      const prompt = buildScriptPrompt({
        input,
        channelBible: context.config.channelBible,
        includeVisualNotes: config.includeVisualNotes,
        includeMetadata: config.includeMetadata,
        retryContext: context.retry.attemptNumber > 1
          ? { attemptNumber: context.retry.attemptNumber, lastError: context.retry.lastError }
          : undefined,
      });

      // Check cancellation before API call
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      options?.onProgress?.({ percent: 30, message: 'Generating script...', stage: 'generation' });

      // Call LLM
      const requestedAt = new Date();
      const response = await this.callLLM(prompt, config, context, options?.signal);
      const respondedAt = new Date();

      apiCalls.push({
        service: config.model.includes('claude') ? 'anthropic' : 'openai',
        endpoint: '/v1/messages',
        method: 'POST',
        requestedAt,
        respondedAt,
        durationMs: respondedAt.getTime() - requestedAt.getTime(),
        status: 200,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      });

      options?.onProgress?.({ percent: 80, message: 'Parsing response...', stage: 'parsing' });

      // Parse response
      const parsed = parseScriptResponse(response.content, input.structure);

      // Validate all required sections are present
      this.validateSections(parsed, input.structure);

      options?.onProgress?.({ percent: 100, message: 'Complete', stage: 'done' });

      const completedAt = new Date();
      return {
        success: true,
        output: parsed,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.calculateActualCost(apiCalls, config),
          apiCalls,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: this.mapError(error),
      };
    }
  }

  // === Private Helpers ===

  private async callLLM(
    prompt: string,
    config: ScriptConfig,
    context: RunContext,
    signal?: AbortSignal
  ): Promise<{ content: string; usage?: { input_tokens: number; output_tokens: number } }> {
    // Get API key from credential manager
    const apiKey = await context.services.credentials.get('anthropic');

    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // TODO: Implement actual API call using Anthropic SDK
    // For now, this is a placeholder that should be replaced with:
    // - Anthropic SDK call for Claude models
    // - OpenAI SDK call for GPT models

    throw new Error('LLM integration not implemented - use Anthropic SDK');
  }

  private validateSections(output: ScriptOutput, structure: ScriptInput['structure']): void {
    const requiredSections = structure.sections.filter(s => s.required);
    const outputSectionIds = new Set(output.sections.map(s => s.id));

    for (const required of requiredSections) {
      if (!outputSectionIds.has(required.id)) {
        throw new Error(`Missing required section: ${required.name}`);
      }
    }
  }

  private mapError(error: unknown): { code: string; message: string; retryable: boolean } {
    if (error instanceof Error) {
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        return { code: 'RATE_LIMIT', message: 'API rate limit hit', retryable: true };
      }
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return { code: 'CONTEXT_TOO_LONG', message: 'Input too long for model', retryable: false };
      }
      if (error.message.includes('invalid_api_key') || error.message.includes('401')) {
        return { code: 'INVALID_CREDENTIALS', message: 'Invalid API key', retryable: false };
      }
      return { code: 'LLM_ERROR', message: error.message, retryable: true };
    }
    return { code: 'UNKNOWN', message: String(error), retryable: true };
  }

  private calculateActualCost(
    apiCalls: ApiCallLog[],
    config: ScriptConfig
  ): CostEstimate {
    const costs: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
      'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
      'gpt-4o': { input: 0.005, output: 0.015 },
    };

    const modelCosts = costs[config.model];
    let totalTokens = 0;
    let totalCost = 0;

    for (const call of apiCalls) {
      const inputTokens = call.inputTokens ?? 0;
      const outputTokens = call.outputTokens ?? 0;
      totalTokens += inputTokens + outputTokens;
      totalCost +=
        (inputTokens / 1000) * modelCosts.input +
        (outputTokens / 1000) * modelCosts.output;
    }

    return {
      estimated: false,
      breakdown: [{
        service: config.model.includes('claude') ? 'anthropic' : 'openai',
        units: totalTokens,
        unitType: 'tokens',
        cost: totalCost,
      }],
      total: totalCost,
      confidence: 'high',
    };
  }
}

// Export types and node
export type { ScriptInput, ScriptOutput, ScriptConfig } from './types';
export { buildScriptPrompt } from './prompt';
export { parseScriptResponse } from './parser';
