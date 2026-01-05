import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
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
  AssemblyInputSchema,
  AssemblyOutputSchema,
  AssemblyConfigSchema,
  type AssemblyInput,
  type AssemblyOutput,
  type AssemblyConfig,
} from './types';
import { buildTimeline } from './timeline';
import { generateCaptions, generateSrt, generateVtt } from './captions';
import { renderVideo, checkFfmpegAvailable } from './ffmpeg';

export class AssemblyNode implements NodeContract<
  typeof AssemblyInputSchema,
  typeof AssemblyOutputSchema,
  typeof AssemblyConfigSchema
> {
  meta: NodeMeta = {
    id: 'assembly',
    name: 'Video Assembly',
    description: 'Assembles final video from audio, visuals, and captions using FFmpeg',
    icon: 'Film',
    category: 'production',
    requiredCredentials: ['pexels'], // Optional: only if using stock footage
    estimatedDuration: '2-10min',
  };

  inputSchema = AssemblyInputSchema;
  outputSchema = AssemblyOutputSchema;
  configSchema = AssemblyConfigSchema;

  // === Get Input from Context ===

  getInputFromContext(context: RunContext): AssemblyInput {
    const script = context.previousOutputs.script;
    const voice = context.previousOutputs.voice;
    const thumbnail = context.previousOutputs.thumbnail;

    if (!script) {
      throw new Error('Script output not found');
    }

    if (!voice) {
      throw new Error('Voice output not found');
    }

    // Map voice segments to expected format
    const audioSegments = voice.segments.map((segment: {
      id: string;
      file: string;
      duration: number;
      text: string;
    }) => ({
      id: segment.id,
      file: segment.file,
      duration: segment.duration,
      text: segment.text,
    }));

    return {
      script: {
        title: script.title,
        hook: script.hook,
        sections: script.sections,
        outro: script.outro,
      },
      audioSegments,
      thumbnail: thumbnail?.options?.[0]
        ? { imageUrl: thumbnail.options[0].file }
        : undefined,
      styleOverride: (context.runOverrides.nodeOverrides?.['assembly'] as { styleOverride?: AssemblyInput['styleOverride'] } | undefined)?.styleOverride,
    };
  }

  // === Validation ===

  validate(
    input: AssemblyInput,
    config: AssemblyConfig,
    _context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Note: FFmpeg availability is checked at execution time since it's async

    // Script validation
    if (!input.script.title) {
      errors.push({
        field: 'script.title',
        message: 'Script title is required',
      });
    }

    // Audio segments validation
    if (!input.audioSegments || input.audioSegments.length === 0) {
      errors.push({
        field: 'audioSegments',
        message: 'At least one audio segment is required',
      });
    }

    // Check for missing audio for script sections
    const scriptSectionIds = new Set([
      'hook',
      ...input.script.sections.map(s => s.id),
      'outro',
    ]);

    const audioSegmentIds = new Set(input.audioSegments.map(a => a.id));

    for (const id of scriptSectionIds) {
      if (!audioSegmentIds.has(id)) {
        warnings.push({
          field: 'audioSegments',
          message: `No audio segment found for section "${id}"`,
        });
      }
    }

    // Resolution/aspect ratio warnings
    if (config.resolution === '4k') {
      warnings.push({
        field: 'resolution',
        message: '4K rendering will significantly increase processing time',
      });
    }

    // Stock footage requires credentials
    if (config.visualSource === 'stock' || config.visualSource === 'mixed') {
      warnings.push({
        field: 'visualSource',
        message: 'Stock footage will be fetched from Pexels API (requires API key)',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===

  estimateCost(input: AssemblyInput, config: AssemblyConfig): CostEstimate {
    const breakdown: CostEstimate['breakdown'] = [];

    // Estimate total duration
    const totalDuration = input.audioSegments.reduce((sum, seg) => sum + seg.duration, 0);

    // FFmpeg processing (local, but track time)
    breakdown.push({
      service: 'local-ffmpeg',
      units: Math.ceil(totalDuration),
      unitType: 'seconds',
      cost: 0,
    });

    // Stock footage API calls (if applicable)
    if (config.visualSource === 'stock' || config.visualSource === 'mixed') {
      const visualCount = Math.ceil(totalDuration / 7); // ~1 visual per 7 seconds
      breakdown.push({
        service: 'pexels',
        units: visualCount,
        unitType: 'api_calls',
        cost: 0, // Pexels is free
      });
    }

    // AI image generation (if applicable)
    if (config.visualSource === 'ai_generated') {
      const visualCount = Math.ceil(totalDuration / 7);
      breakdown.push({
        service: 'gemini-imagen',
        units: visualCount,
        unitType: 'images',
        cost: visualCount * 0.04,
      });
    }

    const total = breakdown.reduce((sum, item) => sum + item.cost, 0);

    return {
      estimated: true,
      breakdown,
      total,
      confidence: 'medium',
    };
  }

  // === Execution ===

  async execute(
    input: AssemblyInput,
    config: AssemblyConfig,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<AssemblyOutput>> {
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

      options?.onProgress?.({
        percent: 2,
        message: 'Checking FFmpeg availability...',
        stage: 'init',
      });

      // Verify FFmpeg is available
      const ffmpegAvailable = await checkFfmpegAvailable();
      if (!ffmpegAvailable) {
        return {
          success: false,
          error: {
            code: 'FFMPEG_NOT_FOUND',
            message: 'FFmpeg is not installed. Please install FFmpeg to render videos.',
            retryable: false,
          },
        };
      }

      options?.onProgress?.({
        percent: 5,
        message: 'Building timeline...',
        stage: 'timeline',
      });

      // Build timeline from input
      const timeline = await buildTimeline({ input, config });

      options?.onLog?.({
        level: 'info',
        message: `Timeline built: ${timeline.segments.length} segments, ${timeline.totalDuration.toFixed(1)}s total`,
        timestamp: new Date(),
        data: { segmentCount: timeline.segments.length, duration: timeline.totalDuration },
      });

      // Generate captions
      options?.onProgress?.({
        percent: 10,
        message: 'Generating captions...',
        stage: 'captions',
      });

      const captions = generateCaptions(timeline.segments, {
        maxCharsPerCaption: config.captionStyle.maxWidth,
        maxDurationPerCaption: 4,
      });

      options?.onLog?.({
        level: 'info',
        message: `Generated ${captions.length} caption blocks`,
        timestamp: new Date(),
      });

      // Set up work directory
      const workDir = join(tmpdir(), 'youtube-auto', context.runId, 'assembly');
      const outputFileName = `${context.runId}_final.${config.format}`;
      const outputPath = join(workDir, outputFileName);

      // Get credentials for stock footage
      let pexelsApiKey: string | undefined;
      if (config.visualSource === 'stock' || config.visualSource === 'mixed') {
        pexelsApiKey = await context.services.credentials.get('pexels');
        if (!pexelsApiKey) {
          options?.onLog?.({
            level: 'warn',
            message: 'Pexels API key not configured - will use text cards as fallback',
            timestamp: new Date(),
          });
        }
      }

      // Render video
      options?.onProgress?.({
        percent: 15,
        message: 'Starting video render...',
        stage: 'render',
      });

      const renderResult = await renderVideo({
        timeline: timeline.segments,
        config,
        outputPath,
        workDir,
        credentials: {
          pexels: pexelsApiKey,
          gemini: await context.services.credentials.get('gemini'),
        },
        onProgress: (percent, message) => {
          // Map render progress to 15-90%
          const mappedPercent = 15 + (percent * 0.75);
          options?.onProgress?.({
            percent: Math.round(mappedPercent),
            message,
            stage: 'render',
          });
        },
      });

      options?.onProgress?.({
        percent: 90,
        message: 'Uploading video...',
        stage: 'upload',
      });

      // Upload video to storage
      const videoStoragePath = `runs/${context.runId}/video/${outputFileName}`;
      const videoUrl = await this.uploadFile(
        context.services.storage,
        videoStoragePath,
        renderResult.outputPath,
        'video/mp4'
      );

      // Generate and upload subtitles if configured
      let subtitleUrl: string | undefined;
      let subtitlePath: string | undefined;

      if (config.generateSubtitleFile && captions.length > 0) {
        options?.onProgress?.({
          percent: 95,
          message: 'Generating subtitles...',
          stage: 'subtitles',
        });

        const srtContent = generateSrt(captions);
        const vttContent = generateVtt(captions);

        // Save subtitle files
        const srtPath = join(workDir, `${context.runId}.srt`);
        const vttPath = join(workDir, `${context.runId}.vtt`);

        await writeFile(srtPath, srtContent);
        await writeFile(vttPath, vttContent);

        // Upload VTT (more widely supported)
        const subtitleStoragePath = `runs/${context.runId}/video/${context.runId}.vtt`;
        subtitleUrl = await this.uploadTextFile(
          context.services.storage,
          subtitleStoragePath,
          vttContent,
          'text/vtt'
        );
        subtitlePath = subtitleStoragePath;
      }

      options?.onProgress?.({
        percent: 100,
        message: 'Video assembly complete',
        stage: 'done',
      });

      const completedAt = new Date();
      const output: AssemblyOutput = {
        videoUrl,
        videoPath: videoStoragePath,
        subtitleUrl,
        subtitlePath,
        metadata: {
          duration: renderResult.duration,
          resolution: config.resolution,
          fileSize: renderResult.fileSize,
          format: config.format,
        },
        timeline: timeline.segments,
      };

      return {
        success: true,
        output,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.calculateActualCost(input, config, timeline.totalDuration),
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

  private async uploadFile(
    storage: StorageClient,
    path: string,
    localPath: string,
    contentType: string
  ): Promise<string> {
    const { readFile } = await import('fs/promises');
    const buffer = await readFile(localPath);

    const { error } = await storage.upload(path, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = storage.getPublicUrl(path);
    return urlData.publicUrl;
  }

  private async uploadTextFile(
    storage: StorageClient,
    path: string,
    content: string,
    contentType: string
  ): Promise<string> {
    const buffer = Buffer.from(content, 'utf-8');

    const { error } = await storage.upload(path, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed to upload subtitle file: ${error.message}`);
    }

    const { data: urlData } = storage.getPublicUrl(path);
    return urlData.publicUrl;
  }

  private calculateActualCost(
    input: AssemblyInput,
    config: AssemblyConfig,
    duration: number
  ): CostEstimate {
    const breakdown: CostEstimate['breakdown'] = [];

    // FFmpeg is local processing
    breakdown.push({
      service: 'local-ffmpeg',
      units: Math.ceil(duration),
      unitType: 'seconds',
      cost: 0,
    });

    // Stock footage (free)
    if (config.visualSource === 'stock' || config.visualSource === 'mixed') {
      const visualCount = Math.ceil(duration / 7);
      breakdown.push({
        service: 'pexels',
        units: visualCount,
        unitType: 'api_calls',
        cost: 0,
      });
    }

    const total = breakdown.reduce((sum, item) => sum + item.cost, 0);

    return {
      estimated: false,
      breakdown,
      total,
      confidence: 'high',
    };
  }

  private mapError(error: unknown): { code: string; message: string; retryable: boolean } {
    const message = String(error);

    if (message.includes('ENOENT') || message.includes('not found')) {
      return { code: 'FILE_NOT_FOUND', message: 'Required file not found', retryable: false };
    }
    if (message.includes('FFmpeg')) {
      return { code: 'FFMPEG_ERROR', message, retryable: true };
    }
    if (message.includes('Pexels')) {
      return { code: 'PEXELS_ERROR', message: 'Failed to fetch stock footage', retryable: true };
    }
    if (message.includes('storage') || message.includes('upload')) {
      return { code: 'STORAGE_ERROR', message: 'Failed to upload files', retryable: true };
    }

    return { code: 'ASSEMBLY_ERROR', message: String(error), retryable: true };
  }
}

// Export types
export type { AssemblyInput, AssemblyOutput, AssemblyConfig } from './types';
export { buildTimeline } from './timeline';
export { generateCaptions, generateSrt, generateVtt } from './captions';
export { renderVideo, checkFfmpegAvailable, getVideoDuration } from './ffmpeg';
