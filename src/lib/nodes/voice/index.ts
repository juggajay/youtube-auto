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
  VoiceInputSchema,
  VoiceOutputSchema,
  VoiceConfigSchema,
  VoiceInput,
  VoiceOutput,
  VoiceConfig,
  VoiceSettings,
} from './types';
import { ElevenLabsClient } from './elevenlabs';
import { preprocessTextForTTS, splitTextForTTS } from './pronunciation';

export class VoiceGeneratorNode implements NodeContract<
  typeof VoiceInputSchema,
  typeof VoiceOutputSchema,
  typeof VoiceConfigSchema
> {
  meta: NodeMeta = {
    id: 'voice',
    name: 'Voice Generator',
    description: 'Generates audio from script using ElevenLabs',
    icon: 'Mic',
    category: 'production',
    requiredCredentials: ['elevenlabs'],
    estimatedDuration: '1-5min',
  };

  inputSchema = VoiceInputSchema;
  outputSchema = VoiceOutputSchema;
  configSchema = VoiceConfigSchema;

  // === Get Input from Context ===

  getInputFromContext(context: RunContext): VoiceInput {
    const script = context.previousOutputs.script;

    if (!script) {
      throw new Error('Script output not found');
    }

    // Convert script sections to voice segments
    const segments = [
      // Hook
      {
        id: 'hook',
        name: 'Hook',
        text: script.hook.content,
        order: 0,
      },
      // Main sections
      ...script.sections.map((section: { id: string; name: string; content: string }, index: number) => ({
        id: section.id,
        name: section.name,
        text: section.content,
        order: index + 1,
      })),
      // Outro
      {
        id: 'outro',
        name: 'Outro',
        text: script.outro.content,
        order: script.sections.length + 1,
      },
    ];

    const nodeOverrides = context.runOverrides.nodeOverrides?.voice as
      | { settings?: Partial<VoiceSettings>; speed?: number }
      | undefined;

    return {
      segments,
      settingsOverride: nodeOverrides?.settings,
      speedOverride: nodeOverrides?.speed,
    };
  }

  // === Validation ===

  validate(
    input: VoiceInput,
    config: VoiceConfig,
    context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Voice ID required
    if (!config.voiceId) {
      errors.push({
        field: 'config.voiceId',
        message: 'Voice ID is required',
      });
    }

    // Check total character count
    const totalChars = input.segments.reduce((sum, s) => sum + s.text.length, 0);

    if (totalChars > 100000) {
      warnings.push({
        field: 'segments',
        message: `Very long script (${totalChars} chars) - generation will take a while`,
      });
    }

    // Check for empty segments
    const emptySegments = input.segments.filter(s => !s.text.trim());
    if (emptySegments.length > 0) {
      warnings.push({
        field: 'segments',
        message: `${emptySegments.length} empty segment(s) will be skipped`,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===

  estimateCost(input: VoiceInput, config: VoiceConfig): CostEstimate {
    const totalChars = input.segments.reduce((sum, s) => sum + s.text.length, 0);

    // ElevenLabs pricing (approximate, varies by plan)
    // Creator plan: ~$0.30 per 1000 characters
    const costPer1000Chars = 0.30;
    const estimatedCost = (totalChars / 1000) * costPer1000Chars;

    return {
      estimated: true,
      breakdown: [{
        service: 'elevenlabs',
        units: totalChars,
        unitType: 'characters',
        cost: estimatedCost,
      }],
      total: estimatedCost,
      confidence: 'medium',
    };
  }

  // === Execution ===

  async execute(
    input: VoiceInput,
    config: VoiceConfig,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<VoiceOutput>> {
    const startedAt = new Date();
    const apiCalls: ApiCallLog[] = [];
    const completedSegments: VoiceOutput['segments'] = [];

    try {
      // Check cancellation
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      // Get API key
      const apiKey = await context.services.credentials.get('elevenlabs');
      if (!apiKey) {
        return {
          success: false,
          error: { code: 'MISSING_CREDENTIALS', message: 'ElevenLabs API key not configured', retryable: false },
        };
      }

      const client = new ElevenLabsClient(apiKey);

      // Merge settings with overrides
      const settings = this.mergeSettings(config.settings, input.settingsOverride);

      // Filter out empty segments
      const validSegments = input.segments.filter(s => s.text.trim());
      const totalSegments = validSegments.length;

      options?.onProgress?.({
        percent: 5,
        message: `Generating audio for ${totalSegments} segments...`,
        stage: 'init',
      });

      // Process each segment
      for (let i = 0; i < validSegments.length; i++) {
        const segment = validSegments[i];

        // Check cancellation
        if (options?.signal?.aborted) {
          // Return partial output
          return {
            success: false,
            error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
            partialOutput: this.buildPartialOutput(completedSegments),
          };
        }

        const progress = Math.round(((i + 1) / totalSegments) * 90) + 5;
        options?.onProgress?.({
          percent: progress,
          message: `Generating: ${segment.name} (${i + 1}/${totalSegments})`,
          stage: 'generation',
        });

        try {
          // Preprocess text
          const processedText = preprocessTextForTTS(
            segment.text,
            config.pronunciationGuide
          );

          // Split if too long
          const textChunks = splitTextForTTS(processedText);
          const audioBuffers: Buffer[] = [];

          for (const chunk of textChunks) {
            const requestedAt = new Date();

            const result = await this.generateWithRetry(
              client,
              {
                voiceId: config.voiceId,
                text: chunk,
                modelId: config.modelId,
                settings,
                outputFormat: config.outputFormat,
              },
              config.maxRetries,
              config.retryDelayMs
            );

            const respondedAt = new Date();

            apiCalls.push({
              service: 'elevenlabs',
              endpoint: `/v1/text-to-speech/${config.voiceId}`,
              method: 'POST',
              requestedAt,
              respondedAt,
              durationMs: respondedAt.getTime() - requestedAt.getTime(),
              status: 200,
            });

            audioBuffers.push(result.audioBuffer);
          }

          // Combine chunks if multiple
          const finalBuffer = audioBuffers.length === 1
            ? audioBuffers[0]
            : Buffer.concat(audioBuffers);

          // Upload to Supabase Storage
          const storagePath = `runs/${context.runId}/audio/${segment.id}.mp3`;
          const audioUrl = await this.uploadAudio(
            context.services.storage,
            storagePath,
            finalBuffer
          );

          // Calculate duration (rough estimate: 150 words per minute, ~5 chars per word)
          const estimatedDuration = (segment.text.length / 5) / 150 * 60;

          completedSegments.push({
            id: segment.id,
            name: segment.name,
            audioUrl,
            audioPath: storagePath,
            durationSeconds: estimatedDuration,
            characterCount: segment.text.length,
          });

        } catch (segmentError) {
          // Log error but continue with other segments
          options?.onLog?.({
            level: 'error',
            message: `Failed to generate audio for ${segment.name}: ${segmentError}`,
            timestamp: new Date(),
            data: { segmentId: segment.id, error: String(segmentError) },
          });

          // If this is a quota error, stop processing
          if (String(segmentError).includes('QUOTA_EXCEEDED')) {
            return {
              success: false,
              error: {
                code: 'QUOTA_EXCEEDED',
                message: 'ElevenLabs character quota exceeded',
                retryable: false
              },
              partialOutput: this.buildPartialOutput(completedSegments),
            };
          }
        }
      }

      // Check if we got any segments
      if (completedSegments.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_SEGMENTS',
            message: 'Failed to generate any audio segments',
            retryable: true
          },
        };
      }

      options?.onProgress?.({
        percent: 100,
        message: 'Voice generation complete',
        stage: 'done',
      });

      const completedAt = new Date();
      const output: VoiceOutput = {
        segments: completedSegments.sort((a, b) => {
          const aIndex = input.segments.findIndex(s => s.id === a.id);
          const bIndex = input.segments.findIndex(s => s.id === b.id);
          return aIndex - bIndex;
        }),
        totalDurationSeconds: completedSegments.reduce((sum, s) => sum + s.durationSeconds, 0),
        totalCharacters: completedSegments.reduce((sum, s) => sum + s.characterCount, 0),
      };

      return {
        success: true,
        output,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.calculateActualCost(output.totalCharacters),
          apiCalls,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: this.mapError(error),
        partialOutput: completedSegments.length > 0
          ? this.buildPartialOutput(completedSegments)
          : undefined,
      };
    }
  }

  // === Private Helpers ===

  private mergeSettings(
    base: VoiceSettings,
    override?: Partial<VoiceSettings>
  ): VoiceSettings {
    if (!override) return base;

    return {
      stability: override.stability ?? base.stability,
      similarityBoost: override.similarityBoost ?? base.similarityBoost,
      style: override.style ?? base.style,
      useSpeakerBoost: override.useSpeakerBoost ?? base.useSpeakerBoost,
    };
  }

  private async generateWithRetry(
    client: ElevenLabsClient,
    params: Parameters<ElevenLabsClient['generateAudio']>[0],
    maxRetries: number,
    retryDelayMs: number
  ): Promise<Awaited<ReturnType<ElevenLabsClient['generateAudio']>>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await client.generateAudio(params);
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-retryable errors
        if (
          lastError.message.includes('INVALID_API_KEY') ||
          lastError.message.includes('QUOTA_EXCEEDED')
        ) {
          throw lastError;
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
        }
      }
    }

    throw lastError;
  }

  private async uploadAudio(
    storage: StorageClient,
    path: string,
    buffer: Buffer
  ): Promise<string> {
    // Upload to Supabase Storage
    const { error } = await storage.upload(path, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = storage.getPublicUrl(path);
    return urlData.publicUrl;
  }

  private buildPartialOutput(segments: VoiceOutput['segments']): Partial<VoiceOutput> {
    return {
      segments,
      totalDurationSeconds: segments.reduce((sum, s) => sum + s.durationSeconds, 0),
      totalCharacters: segments.reduce((sum, s) => sum + s.characterCount, 0),
    };
  }

  private calculateActualCost(totalCharacters: number): CostEstimate {
    const costPer1000Chars = 0.30;
    const cost = (totalCharacters / 1000) * costPer1000Chars;

    return {
      estimated: false,
      breakdown: [{
        service: 'elevenlabs',
        units: totalCharacters,
        unitType: 'characters',
        cost,
      }],
      total: cost,
      confidence: 'high',
    };
  }

  private mapError(error: unknown): { code: string; message: string; retryable: boolean } {
    const message = String(error);

    if (message.includes('INVALID_API_KEY')) {
      return { code: 'INVALID_CREDENTIALS', message: 'Invalid ElevenLabs API key', retryable: false };
    }
    if (message.includes('RATE_LIMIT')) {
      return { code: 'RATE_LIMIT', message: 'ElevenLabs rate limit exceeded', retryable: true };
    }
    if (message.includes('QUOTA_EXCEEDED')) {
      return { code: 'QUOTA_EXCEEDED', message: 'ElevenLabs character quota exceeded', retryable: false };
    }

    return { code: 'VOICE_ERROR', message: String(error), retryable: true };
  }
}

// Export types and functions
export type { VoiceInput, VoiceOutput, VoiceConfig } from './types';
export { ElevenLabsClient } from './elevenlabs';
export { preprocessTextForTTS, splitTextForTTS, applyPronunciationGuide } from './pronunciation';
