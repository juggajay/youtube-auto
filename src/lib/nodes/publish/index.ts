import { mkdir, rm, writeFile } from 'fs/promises';
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
import type { RunContext } from '../context';
import {
  PublishInputSchema,
  PublishOutputSchema,
  PublishConfigSchema,
  type PublishInput,
  type PublishOutput,
  type PublishConfig,
} from './types';
import { YouTubeClient } from './youtube/client';
import { formatDescription, mergeTags, sanitizeTitle, getOptimalPublishTime } from './youtube/metadata';

export class PublishNode implements NodeContract<
  typeof PublishInputSchema,
  typeof PublishOutputSchema,
  typeof PublishConfigSchema
> {
  meta: NodeMeta = {
    id: 'publish',
    name: 'YouTube Publish',
    description: 'Uploads video to YouTube with metadata and thumbnail',
    icon: 'Upload',
    category: 'publish',
    requiredCredentials: ['youtube'],
    estimatedDuration: '2-10min',
  };

  inputSchema = PublishInputSchema;
  outputSchema = PublishOutputSchema;
  configSchema = PublishConfigSchema;

  // === Get Input from Context ===

  getInputFromContext(context: RunContext): PublishInput {
    const assembly = context.previousOutputs.assembly;
    const script = context.previousOutputs.script;
    const thumbnail = context.previousOutputs.thumbnail;

    if (!assembly) throw new Error('Assembly output not found');
    if (!script) throw new Error('Script output not found');

    // Build metadata from script
    const metadata = {
      title: script.title,
      description: script.metadata?.descriptionDraft || '',
      tags: script.metadata?.tags || [],
      category: context.config.publish?.defaults?.category ?? '22',
      language: context.config.publish?.defaults?.language ?? 'en',
      madeForKids: context.config.publish?.defaults?.made_for_kids ?? false,
      ageRestricted: false,
      enableMonetization: true,
    };

    // Get selected thumbnail
    const selectedThumbnail = thumbnail?.options?.[0];

    return {
      video: {
        url: assembly.videoFile,
        path: assembly.videoFile,
        duration: assembly.duration,
        fileSize: 0, // Not tracked in current AssemblyOutput
      },
      thumbnail: selectedThumbnail
        ? { url: selectedThumbnail.file, path: selectedThumbnail.file }
        : undefined,
      metadata,
      schedule: (context.runOverrides.nodeOverrides?.['publish'] as { schedule?: PublishInput['schedule'] } | undefined)?.schedule,
      visibility: (context.runOverrides.nodeOverrides?.['publish'] as { visibility?: PublishInput['visibility'] } | undefined)?.visibility,
    };
  }

  // === Validation ===

  validate(
    input: PublishInput,
    config: PublishConfig,
    _context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Channel ID required
    if (!config.channelId) {
      errors.push({
        field: 'config.channelId',
        message: 'YouTube channel ID is required',
      });
    }

    // Video required
    if (!input.video?.url) {
      errors.push({
        field: 'video',
        message: 'Video file is required',
      });
    }

    // Title required
    if (!input.metadata?.title) {
      errors.push({
        field: 'metadata.title',
        message: 'Video title is required',
      });
    }

    // Title length
    if (input.metadata?.title && input.metadata.title.length > 100) {
      warnings.push({
        field: 'metadata.title',
        message: 'Title will be truncated to 100 characters',
      });
    }

    // Description length
    if (input.metadata?.description && input.metadata.description.length > 5000) {
      warnings.push({
        field: 'metadata.description',
        message: 'Description will be truncated to 5000 characters',
      });
    }

    // Public visibility warning
    const visibility = input.visibility ?? config.defaults.visibility;
    if (visibility === 'public' && config.requireReviewBeforePublic) {
      warnings.push({
        field: 'visibility',
        message: 'Video will be published publicly - ensure content is reviewed',
      });
    }

    // Thumbnail recommendation
    if (!input.thumbnail) {
      warnings.push({
        field: 'thumbnail',
        message: 'No thumbnail provided - YouTube will auto-generate one',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===

  estimateCost(_input: PublishInput, _config: PublishConfig): CostEstimate {
    // YouTube API is free (within quota limits)
    return {
      estimated: true,
      breakdown: [{
        service: 'youtube',
        units: 1,
        unitType: 'upload',
        cost: 0,
      }],
      total: 0,
      confidence: 'high',
    };
  }

  // === Execution ===

  async execute(
    input: PublishInput,
    config: PublishConfig,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<PublishOutput>> {
    const startedAt = new Date();
    const apiCalls: ApiCallLog[] = [];

    // Create temp directory for downloads
    const workDir = join(tmpdir(), 'vidflow', context.runId, 'publish');
    await mkdir(workDir, { recursive: true });

    try {
      // Check cancellation
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      options?.onProgress?.({
        percent: 5,
        message: 'Initializing YouTube client...',
        stage: 'init',
      });

      // === Get YouTube credentials ===
      const youtubeTokensRaw = await context.services.credentials.get('youtube');
      if (!youtubeTokensRaw) {
        return {
          success: false,
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'YouTube credentials not configured. Connect your YouTube account in settings.',
            retryable: false,
          },
        };
      }

      const tokens = JSON.parse(youtubeTokensRaw);

      const client = new YouTubeClient({
        clientId: process.env.YOUTUBE_CLIENT_ID!,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
        tokens,
        onTokenRefresh: async (newTokens) => {
          // Persist refreshed tokens
          await context.services.credentials.set('youtube', JSON.stringify(newTokens));
        },
      });

      // === Verify channel access ===
      options?.onProgress?.({
        percent: 10,
        message: 'Verifying channel access...',
        stage: 'auth',
      });

      const channels = await client.getChannels();
      const targetChannel = channels.find(c => c.id === config.channelId);

      if (!targetChannel) {
        return {
          success: false,
          error: {
            code: 'CHANNEL_NOT_FOUND',
            message: `Channel ${config.channelId} not found or not accessible`,
            retryable: false,
          },
        };
      }

      apiCalls.push({
        service: 'youtube',
        endpoint: '/channels.list',
        method: 'GET',
        requestedAt: new Date(),
        respondedAt: new Date(),
        durationMs: 0,
        status: 200,
      });

      // Check cancellation
      if (options?.signal?.aborted) {
        await this.cleanup(workDir);
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      // === Download video from storage ===
      options?.onProgress?.({
        percent: 15,
        message: 'Preparing video file...',
        stage: 'download',
      });

      const videoLocalPath = join(workDir, 'video.mp4');
      await this.downloadFile(input.video.url, videoLocalPath);

      // === Download thumbnail if provided ===
      let thumbnailLocalPath: string | undefined;
      if (input.thumbnail) {
        options?.onProgress?.({
          percent: 20,
          message: 'Preparing thumbnail...',
          stage: 'download',
        });

        thumbnailLocalPath = join(workDir, 'thumbnail.jpg');
        await this.downloadFile(input.thumbnail.url, thumbnailLocalPath);
      }

      // Check cancellation
      if (options?.signal?.aborted) {
        await this.cleanup(workDir);
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      // === Prepare metadata ===
      const visibility = input.visibility ?? config.defaults.visibility;
      const schedule = input.schedule ?? { mode: config.scheduling.mode };

      const title = sanitizeTitle(input.metadata.title);
      const description = formatDescription(
        input.metadata.description,
        config,
        undefined  // chapters could be added here
      );
      const tags = mergeTags(input.metadata.tags, config.metadataTemplate.defaultTags);

      // Calculate publish time for scheduled
      let publishAt: string | undefined;
      if (schedule.mode === 'scheduled') {
        if ('publishAt' in schedule && schedule.publishAt) {
          publishAt = schedule.publishAt;
        } else {
          const optimalTime = getOptimalPublishTime(
            config.scheduling.preferredTimes ?? [],
            config.scheduling.timezone
          );
          publishAt = optimalTime.toISOString();
        }
      }

      // === Upload video ===
      options?.onProgress?.({
        percent: 25,
        message: 'Uploading video to YouTube...',
        stage: 'upload',
      });

      const uploadRequestedAt = new Date();

      const uploadResult = await client.uploadVideo({
        filePath: videoLocalPath,
        metadata: {
          title,
          description,
          tags,
          categoryId: input.metadata.category,
          defaultLanguage: input.metadata.language,
          madeForKids: input.metadata.madeForKids,
        },
        visibility: schedule.mode === 'scheduled' ? 'private' : visibility,
        publishAt,
        notifySubscribers: config.notifySubscribers,
        onProgress: (percent) => {
          // Map upload progress to 25-80%
          const mappedPercent = 25 + (percent * 0.55);
          options?.onProgress?.({
            percent: Math.round(mappedPercent),
            message: `Uploading: ${percent}%`,
            stage: 'upload',
          });
        },
      });

      const uploadRespondedAt = new Date();

      apiCalls.push({
        service: 'youtube',
        endpoint: '/videos.insert',
        method: 'POST',
        requestedAt: uploadRequestedAt,
        respondedAt: uploadRespondedAt,
        durationMs: uploadRespondedAt.getTime() - uploadRequestedAt.getTime(),
        status: 200,
      });

      options?.onLog?.({
        level: 'info',
        message: `Video uploaded: ${uploadResult.videoId}`,
        timestamp: new Date(),
        data: { videoId: uploadResult.videoId },
      });

      // Check cancellation
      if (options?.signal?.aborted) {
        await this.cleanup(workDir);
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      // === Set thumbnail ===
      let thumbnailUrl: string | undefined;
      if (thumbnailLocalPath) {
        options?.onProgress?.({
          percent: 85,
          message: 'Setting thumbnail...',
          stage: 'thumbnail',
        });

        try {
          await client.setThumbnail(uploadResult.videoId, thumbnailLocalPath);
          thumbnailUrl = input.thumbnail?.url;

          apiCalls.push({
            service: 'youtube',
            endpoint: '/thumbnails.set',
            method: 'POST',
            requestedAt: new Date(),
            respondedAt: new Date(),
            durationMs: 0,
            status: 200,
          });
        } catch (error) {
          // Thumbnail failure is not fatal
          options?.onLog?.({
            level: 'warn',
            message: `Failed to set thumbnail: ${error}`,
            timestamp: new Date(),
          });
        }
      }

      // === Add to playlist ===
      if (input.metadata.playlistId) {
        options?.onProgress?.({
          percent: 90,
          message: 'Adding to playlist...',
          stage: 'playlist',
        });

        try {
          await client.addToPlaylist(uploadResult.videoId, input.metadata.playlistId);

          apiCalls.push({
            service: 'youtube',
            endpoint: '/playlistItems.insert',
            method: 'POST',
            requestedAt: new Date(),
            respondedAt: new Date(),
            durationMs: 0,
            status: 200,
          });
        } catch (error) {
          options?.onLog?.({
            level: 'warn',
            message: `Failed to add to playlist: ${error}`,
            timestamp: new Date(),
          });
        }
      }

      // === Cleanup ===
      options?.onProgress?.({
        percent: 95,
        message: 'Cleaning up...',
        stage: 'cleanup',
      });

      await this.cleanup(workDir);

      // === Build output ===
      options?.onProgress?.({
        percent: 100,
        message: 'Publish complete',
        stage: 'done',
      });

      const completedAt = new Date();

      const status = schedule.mode === 'draft'
        ? 'draft'
        : schedule.mode === 'scheduled'
          ? 'scheduled'
          : 'published';

      const output: PublishOutput = {
        videoId: uploadResult.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${uploadResult.videoId}`,
        status,
        scheduledPublishAt: publishAt,
        processingStatus: {
          uploadStatus: 'uploaded',
        },
        thumbnailUrl,
        channel: {
          id: targetChannel.id,
          name: targetChannel.name,
        },
      };

      return {
        success: true,
        output,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.estimateCost(input, config),
          apiCalls,
        },
      };

    } catch (error) {
      await this.cleanup(workDir);
      return {
        success: false,
        error: this.mapError(error),
      };
    }
  }

  // === Private Helpers ===

  private async downloadFile(url: string, localPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    await writeFile(localPath, Buffer.from(buffer));
  }

  private async cleanup(workDir: string): Promise<void> {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  private mapError(error: unknown): { code: string; message: string; retryable: boolean } {
    const message = String(error);

    if (message.includes('quota') || message.includes('403')) {
      return {
        code: 'QUOTA_EXCEEDED',
        message: 'YouTube API quota exceeded - try again tomorrow',
        retryable: false
      };
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return {
        code: 'AUTH_FAILED',
        message: 'YouTube authentication failed - reconnect your account',
        retryable: false
      };
    }
    if (message.includes('duplicate')) {
      return {
        code: 'DUPLICATE_VIDEO',
        message: 'This video may have already been uploaded',
        retryable: false
      };
    }
    if (message.includes('network') || message.includes('ECONNRESET')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error during upload',
        retryable: true
      };
    }

    return { code: 'PUBLISH_ERROR', message: String(error), retryable: true };
  }
}

// Export types
export type { PublishInput, PublishOutput, PublishConfig } from './types';
export { YouTubeClient } from './youtube/client';
export { formatDescription, mergeTags, sanitizeTitle, getOptimalPublishTime } from './youtube/metadata';
