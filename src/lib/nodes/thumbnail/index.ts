import type {
  NodeContract,
  NodeMeta,
  NodeResult,
  ExecutionOptions,
  ValidationResult,
  CostEstimate,
  ApiCallLog,
} from '../base';
import type { RunContext, StorageClient } from '../context';
import {
  ThumbnailInputSchema,
  ThumbnailOutputSchema,
  ThumbnailConfigSchema,
  type ThumbnailInput,
  type ThumbnailOutput,
  type ThumbnailConfig,
  type ThumbnailOption,
  type ThumbnailStyleGuide,
} from './types';
import { buildThumbnailPrompt, extractOverlayText } from './prompt-builder';
import { createGenerator, type GeneratorType, type ThumbnailGenerator } from './generators';

export class ThumbnailGeneratorNode implements NodeContract<
  typeof ThumbnailInputSchema,
  typeof ThumbnailOutputSchema,
  typeof ThumbnailConfigSchema
> {
  meta: NodeMeta = {
    id: 'thumbnail',
    name: 'Thumbnail Generator',
    description: 'Generates YouTube thumbnail options using AI image generation',
    icon: 'Image',
    category: 'production',
    requiredCredentials: ['gemini'],  // or openai/replicate based on config
    estimatedDuration: '30s - 2min',
  };

  inputSchema = ThumbnailInputSchema;
  outputSchema = ThumbnailOutputSchema;
  configSchema = ThumbnailConfigSchema;

  // === Get Input from Context ===

  getInputFromContext(context: RunContext): ThumbnailInput {
    const script = context.previousOutputs.script;
    const trigger = context.previousOutputs.trigger;

    if (!script) {
      throw new Error('Script output not found');
    }

    // Get maxWords from config or default
    const maxWords = context.config.thumbnail?.typography?.max_words ?? 4;

    return {
      title: script.title,
      topic: trigger?.topic ?? script.title,
      keyPoints: script.sections.map((s: { name: string }) => s.name),
      overlayText: extractOverlayText(script.title, maxWords),
      count: context.config.thumbnail?.defaultCount ?? 3,
      styleOverride: (context.runOverrides.nodeOverrides?.['thumbnail'] as { styleOverride?: ThumbnailInput['styleOverride'] } | undefined)?.styleOverride,
    };
  }

  // === Validation ===

  validate(
    input: ThumbnailInput,
    config: ThumbnailConfig,
    _context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Title required
    if (!input.title || input.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required for thumbnail generation',
      });
    }

    // Overlay text length check
    if (input.overlayText && input.overlayText.split(/\s+/).length > 6) {
      warnings.push({
        field: 'overlayText',
        message: 'Overlay text is long - thumbnails work best with 3-4 words',
      });
    }

    // Count validation
    if (input.count > 5) {
      warnings.push({
        field: 'count',
        message: 'Generating many thumbnails will increase cost and time',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===

  estimateCost(input: ThumbnailInput, config: ThumbnailConfig): CostEstimate {
    const count = input.count ?? config.defaultCount ?? 3;

    // Approximate costs per image
    const costs: Record<GeneratorType, number> = {
      gemini: 0.04,      // Imagen pricing
      dalle: 0.08,       // DALL-E 3 HD
      flux: 0.03,        // Replicate Flux
    };

    const costPerImage = costs[config.generator];
    const total = count * costPerImage;

    return {
      estimated: true,
      breakdown: [{
        service: config.generator,
        units: count,
        unitType: 'images',
        cost: total,
      }],
      total,
      confidence: 'high',
    };
  }

  // === Execution ===

  async execute(
    input: ThumbnailInput,
    config: ThumbnailConfig,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<ThumbnailOutput>> {
    const startedAt = new Date();
    const apiCalls: ApiCallLog[] = [];
    const generatedOptions: ThumbnailOption[] = [];

    try {
      // Check cancellation
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      // Get API key based on generator type
      const credentialType = this.getCredentialType(config.generator);
      const apiKey = await context.services.credentials.get(credentialType);

      if (!apiKey) {
        return {
          success: false,
          error: {
            code: 'MISSING_CREDENTIALS',
            message: `${config.generator} API key not configured`,
            retryable: false,
          },
        };
      }

      // Create generator
      const generator = createGenerator(config.generator, apiKey, {
        model: config.generator === 'gemini' ? config.geminiModel : config.dalleModel,
        quality: config.dalleQuality,
      });

      // Merge style guide with overrides
      const styleGuide = this.mergeStyleGuide(config.styleGuide, input.styleOverride);

      const count = input.count ?? config.defaultCount;

      options?.onProgress?.({
        percent: 5,
        message: `Generating ${count} thumbnail options...`,
        stage: 'init',
      });

      // Generate each variation
      for (let i = 0; i < count; i++) {
        // Check cancellation
        if (options?.signal?.aborted) {
          return {
            success: false,
            error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
            partialOutput: { options: generatedOptions, styleGuideUsed: styleGuide },
          };
        }

        const progress = Math.round(((i + 1) / count) * 90) + 5;
        options?.onProgress?.({
          percent: progress,
          message: `Generating option ${i + 1}/${count}...`,
          stage: 'generation',
        });

        try {
          // Build prompt for this variation
          const prompt = buildThumbnailPrompt({
            input,
            styleGuide,
            variationIndex: i,
            includeText: config.addTextOverlay && config.textOverlayMethod === 'ai',
          });

          const requestedAt = new Date();

          const result = await this.generateWithRetry(
            generator,
            {
              prompt,
              width: styleGuide.dimensions.width,
              height: styleGuide.dimensions.height,
            },
            config.maxRetries
          );

          const respondedAt = new Date();

          apiCalls.push({
            service: config.generator,
            endpoint: '/generate',
            method: 'POST',
            requestedAt,
            respondedAt,
            durationMs: respondedAt.getTime() - requestedAt.getTime(),
            status: 200,
          });

          // Upload to storage
          const optionId = `option_${i + 1}`;
          const storagePath = `runs/${context.runId}/thumbnails/${optionId}.png`;

          const imageUrl = await this.uploadImage(
            context.services.storage,
            storagePath,
            result.imageBuffer,
            result.contentType
          );

          generatedOptions.push({
            id: optionId,
            imageUrl,
            imagePath: storagePath,
            prompt: result.revisedPrompt ?? prompt,
            metadata: {
              generator: config.generator,
              dimensions: styleGuide.dimensions,
              hasTextOverlay: config.addTextOverlay && config.textOverlayMethod === 'ai',
            },
          });

        } catch (genError) {
          options?.onLog?.({
            level: 'error',
            message: `Failed to generate option ${i + 1}: ${genError}`,
            timestamp: new Date(),
            data: { variationIndex: i, error: String(genError) },
          });

          // Continue with other variations unless it's a fatal error
          if (String(genError).includes('INVALID_API_KEY') ||
              String(genError).includes('QUOTA')) {
            throw genError;
          }
        }
      }

      // Check if we got any thumbnails
      if (generatedOptions.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_THUMBNAILS',
            message: 'Failed to generate any thumbnails',
            retryable: true,
          },
        };
      }

      options?.onProgress?.({
        percent: 100,
        message: `Generated ${generatedOptions.length} thumbnail options`,
        stage: 'done',
      });

      const completedAt = new Date();
      const output: ThumbnailOutput = {
        options: generatedOptions,
        styleGuideUsed: styleGuide,
      };

      return {
        success: true,
        output,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.calculateActualCost(generatedOptions.length, config.generator),
          apiCalls,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: this.mapError(error),
        partialOutput: generatedOptions.length > 0
          ? { options: generatedOptions, styleGuideUsed: config.styleGuide }
          : undefined,
      };
    }
  }

  // === Private Helpers ===

  private getCredentialType(generator: GeneratorType): string {
    switch (generator) {
      case 'gemini': return 'gemini';
      case 'dalle': return 'openai';
      case 'flux': return 'replicate';
    }
  }

  private mergeStyleGuide(
    base: ThumbnailStyleGuide,
    override?: Partial<ThumbnailStyleGuide>
  ): ThumbnailStyleGuide {
    if (!override) return base;

    return {
      dimensions: { ...base.dimensions, ...override.dimensions },
      colors: { ...base.colors, ...override.colors },
      typography: { ...base.typography, ...override.typography },
      style: { ...base.style, ...override.style },
      elements: { ...base.elements, ...override.elements },
    };
  }

  private async generateWithRetry(
    generator: ThumbnailGenerator,
    params: Parameters<ThumbnailGenerator['generate']>[0],
    maxRetries: number
  ): Promise<Awaited<ReturnType<ThumbnailGenerator['generate']>>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await generator.generate(params);
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-retryable errors
        if (
          lastError.message.includes('INVALID_API_KEY') ||
          lastError.message.includes('content_policy') ||
          lastError.message.includes('safety')
        ) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  private async uploadImage(
    storage: StorageClient,
    path: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const { error } = await storage.upload(path, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: urlData } = storage.getPublicUrl(path);
    return urlData.publicUrl;
  }

  private calculateActualCost(count: number, generator: GeneratorType): CostEstimate {
    const costs: Record<GeneratorType, number> = {
      gemini: 0.04,
      dalle: 0.08,
      flux: 0.03,
    };

    const total = count * costs[generator];

    return {
      estimated: false,
      breakdown: [{
        service: generator,
        units: count,
        unitType: 'images',
        cost: total,
      }],
      total,
      confidence: 'high',
    };
  }

  private mapError(error: unknown): { code: string; message: string; retryable: boolean } {
    const message = String(error);

    if (message.includes('INVALID_API_KEY') || message.includes('401')) {
      return { code: 'INVALID_CREDENTIALS', message: 'Invalid API key', retryable: false };
    }
    if (message.includes('content_policy') || message.includes('safety')) {
      return { code: 'CONTENT_POLICY', message: 'Content blocked by safety filter', retryable: false };
    }
    if (message.includes('rate') || message.includes('429')) {
      return { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true };
    }
    if (message.includes('quota')) {
      return { code: 'QUOTA_EXCEEDED', message: 'API quota exceeded', retryable: false };
    }

    return { code: 'THUMBNAIL_ERROR', message: String(error), retryable: true };
  }
}

// Export types and functions
export type { ThumbnailInput, ThumbnailOutput, ThumbnailConfig, ThumbnailStyleGuide, ThumbnailOption } from './types';
export { buildThumbnailPrompt, extractOverlayText } from './prompt-builder';
export { createGenerator, type ThumbnailGenerator, type GeneratorType } from './generators';
