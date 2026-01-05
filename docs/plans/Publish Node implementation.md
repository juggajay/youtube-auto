# Publish Node Implementation Instructions

## Context

VidFlow now has:
- Trigger Node ✅
- Script Node ✅
- Voice Node ✅
- Thumbnail Node ✅
- Thumbnail Generator UI ✅
- Assembly Node ✅
- 275 tests passing

The Publish Node is the final node. It uploads the video to YouTube with metadata.

---

## Overview

The Publish Node:
1. Receives video file, thumbnail, and metadata from previous nodes
2. Authenticates with YouTube via OAuth
3. Uploads video with title, description, tags
4. Sets thumbnail
5. Configures visibility (public/unlisted/private) and scheduling
6. Returns published video URL or scheduled video ID

---

## File Structure

```
src/lib/nodes/publish/
├── index.ts              # PublishNode class
├── types.ts              # Zod schemas
├── youtube/
│   ├── client.ts         # YouTube API wrapper
│   ├── auth.ts           # OAuth token management
│   ├── upload.ts         # Resumable upload handler
│   └── metadata.ts       # Metadata formatting
└── __tests__/
    └── publish.test.ts

src/app/api/youtube/
├── auth/route.ts         # OAuth callback
├── channels/route.ts     # List user's channels
└── revoke/route.ts       # Revoke access
```

---

## Part 1: Publish Types (types.ts)

```typescript
import { z } from 'zod';

// === Visibility ===

export const VisibilitySchema = z.enum(['public', 'unlisted', 'private']);

// === Schedule ===

export const ScheduleSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('immediate'),
  }),
  z.object({
    mode: z.literal('scheduled'),
    publishAt: z.string().datetime(),  // ISO 8601
  }),
  z.object({
    mode: z.literal('draft'),
  }),
]);

// === Metadata ===

export const VideoMetadataSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(5000),
  tags: z.array(z.string()).max(500),  // Total chars limit
  
  category: z.string().default('22'),  // 22 = People & Blogs
  language: z.string().default('en'),
  
  // Content declarations
  madeForKids: z.boolean().default(false),
  ageRestricted: z.boolean().default(false),
  
  // Monetization (if enabled)
  enableMonetization: z.boolean().default(true),
  
  // Playlist
  playlistId: z.string().optional(),
  
  // End screen / Cards (future)
  endScreenTemplate: z.string().optional(),
});

// === Input Schema ===

export const PublishInputSchema = z.object({
  // From Assembly Node
  video: z.object({
    url: z.string(),
    path: z.string(),
    duration: z.number(),
    fileSize: z.number(),
  }),
  
  // From Thumbnail Node (selected option)
  thumbnail: z.object({
    url: z.string(),
    path: z.string(),
  }).optional(),
  
  // From Script Node (or override)
  metadata: VideoMetadataSchema,
  
  // Schedule override
  schedule: ScheduleSchema.optional(),
  
  // Visibility override
  visibility: VisibilitySchema.optional(),
});

// === Output Schema ===

export const PublishOutputSchema = z.object({
  videoId: z.string(),
  videoUrl: z.string(),
  
  status: z.enum(['published', 'scheduled', 'draft', 'processing']),
  
  // If scheduled
  scheduledPublishAt: z.string().datetime().optional(),
  
  // Processing status
  processingStatus: z.object({
    uploadStatus: z.enum(['uploaded', 'processed', 'failed']),
    processingProgress: z.number().optional(),  // 0-100
  }).optional(),
  
  // Thumbnail
  thumbnailUrl: z.string().optional(),
  
  // Channel info
  channel: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

// === Config Schema ===

export const PublishConfigSchema = z.object({
  // Target channel
  channelId: z.string(),
  
  // Default settings
  defaults: z.object({
    visibility: VisibilitySchema.default('private'),
    category: z.string().default('22'),
    language: z.string().default('en'),
    madeForKids: z.boolean().default(false),
  }),
  
  // Scheduling
  scheduling: z.object({
    mode: z.enum(['immediate', 'scheduled', 'draft']).default('draft'),
    preferredTimes: z.array(z.string()).optional(),  // ["09:00", "17:00"]
    timezone: z.string().default('UTC'),
  }),
  
  // Metadata template
  metadataTemplate: z.object({
    descriptionFooter: z.string().optional(),  // Added to all descriptions
    defaultTags: z.array(z.string()).default([]),
  }),
  
  // Safety
  requireReviewBeforePublic: z.boolean().default(true),
  
  // Notifications
  notifySubscribers: z.boolean().default(true),
});

export type PublishInput = z.infer<typeof PublishInputSchema>;
export type PublishOutput = z.infer<typeof PublishOutputSchema>;
export type PublishConfig = z.infer<typeof PublishConfigSchema>;
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;
export type Visibility = z.infer<typeof VisibilitySchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
```

---

## Part 2: YouTube OAuth (youtube/auth.ts)

```typescript
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.readonly',
];

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // Unix timestamp
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Create OAuth2 client
 */
export function createOAuth2Client(config: OAuthConfig) {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

/**
 * Generate authorization URL
 */
export function getAuthUrl(oauth2Client: ReturnType<typeof createOAuth2Client>): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',  // Force refresh token
  });
}

/**
 * Exchange code for tokens
 */
export async function exchangeCodeForTokens(
  oauth2Client: ReturnType<typeof createOAuth2Client>,
  code: string
): Promise<YouTubeTokens> {
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresAt: tokens.expiry_date!,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  oauth2Client: ReturnType<typeof createOAuth2Client>,
  refreshToken: string
): Promise<YouTubeTokens> {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    accessToken: credentials.access_token!,
    refreshToken: refreshToken,  // Keep original refresh token
    expiresAt: credentials.expiry_date!,
  };
}

/**
 * Check if token needs refresh (5 min buffer)
 */
export function tokenNeedsRefresh(expiresAt: number): boolean {
  const bufferMs = 5 * 60 * 1000;  // 5 minutes
  return Date.now() > (expiresAt - bufferMs);
}

/**
 * Get valid tokens (refresh if needed)
 */
export async function getValidTokens(
  oauth2Client: ReturnType<typeof createOAuth2Client>,
  tokens: YouTubeTokens,
  onRefresh?: (newTokens: YouTubeTokens) => Promise<void>
): Promise<YouTubeTokens> {
  if (!tokenNeedsRefresh(tokens.expiresAt)) {
    return tokens;
  }
  
  const newTokens = await refreshAccessToken(oauth2Client, tokens.refreshToken);
  
  // Callback to persist new tokens
  await onRefresh?.(newTokens);
  
  return newTokens;
}
```

---

## Part 3: YouTube Client (youtube/client.ts)

```typescript
import { google, youtube_v3 } from 'googleapis';
import { createOAuth2Client, YouTubeTokens, getValidTokens } from './auth';

export interface YouTubeClientConfig {
  clientId: string;
  clientSecret: string;
  tokens: YouTubeTokens;
  onTokenRefresh?: (tokens: YouTubeTokens) => Promise<void>;
}

export interface Channel {
  id: string;
  name: string;
  thumbnail: string;
  subscriberCount: number;
}

export interface UploadResult {
  videoId: string;
  status: 'uploaded' | 'processing' | 'failed';
}

export class YouTubeClient {
  private oauth2Client: ReturnType<typeof createOAuth2Client>;
  private youtube: youtube_v3.Youtube;
  private tokens: YouTubeTokens;
  private onTokenRefresh?: (tokens: YouTubeTokens) => Promise<void>;

  constructor(config: YouTubeClientConfig) {
    this.oauth2Client = createOAuth2Client({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: process.env.YOUTUBE_REDIRECT_URI!,
    });
    
    this.tokens = config.tokens;
    this.onTokenRefresh = config.onTokenRefresh;
    
    this.oauth2Client.setCredentials({
      access_token: config.tokens.accessToken,
      refresh_token: config.tokens.refreshToken,
    });
    
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  /**
   * Ensure tokens are valid before API call
   */
  private async ensureValidTokens(): Promise<void> {
    this.tokens = await getValidTokens(
      this.oauth2Client,
      this.tokens,
      this.onTokenRefresh
    );
    
    this.oauth2Client.setCredentials({
      access_token: this.tokens.accessToken,
      refresh_token: this.tokens.refreshToken,
    });
  }

  /**
   * Get user's channels
   */
  async getChannels(): Promise<Channel[]> {
    await this.ensureValidTokens();
    
    const response = await this.youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
    });
    
    return (response.data.items || []).map(channel => ({
      id: channel.id!,
      name: channel.snippet?.title || '',
      thumbnail: channel.snippet?.thumbnails?.default?.url || '',
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
    }));
  }

  /**
   * Upload video
   */
  async uploadVideo(params: {
    filePath: string;
    metadata: {
      title: string;
      description: string;
      tags: string[];
      categoryId: string;
      defaultLanguage: string;
      madeForKids: boolean;
    };
    visibility: 'public' | 'unlisted' | 'private';
    publishAt?: string;  // ISO 8601 for scheduled
    notifySubscribers?: boolean;
    onProgress?: (percent: number) => void;
  }): Promise<UploadResult> {
    await this.ensureValidTokens();
    
    const fs = await import('fs');
    const fileSize = fs.statSync(params.filePath).size;
    
    const response = await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      notifySubscribers: params.notifySubscribers ?? true,
      requestBody: {
        snippet: {
          title: params.metadata.title,
          description: params.metadata.description,
          tags: params.metadata.tags,
          categoryId: params.metadata.categoryId,
          defaultLanguage: params.metadata.defaultLanguage,
        },
        status: {
          privacyStatus: params.visibility,
          selfDeclaredMadeForKids: params.metadata.madeForKids,
          publishAt: params.publishAt,  // Only for scheduled
        },
      },
      media: {
        body: fs.createReadStream(params.filePath),
      },
    }, {
      onUploadProgress: (evt) => {
        const percent = (evt.bytesRead / fileSize) * 100;
        params.onProgress?.(Math.round(percent));
      },
    });
    
    return {
      videoId: response.data.id!,
      status: 'uploaded',
    };
  }

  /**
   * Set video thumbnail
   */
  async setThumbnail(videoId: string, thumbnailPath: string): Promise<void> {
    await this.ensureValidTokens();
    
    const fs = await import('fs');
    
    await this.youtube.thumbnails.set({
      videoId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });
  }

  /**
   * Update video metadata
   */
  async updateVideo(videoId: string, updates: {
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
  }): Promise<void> {
    await this.ensureValidTokens();
    
    // First get current video data
    const current = await this.youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    });
    
    const snippet = current.data.items?.[0]?.snippet;
    if (!snippet) throw new Error('Video not found');
    
    await this.youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: {
          ...snippet,
          title: updates.title ?? snippet.title,
          description: updates.description ?? snippet.description,
          tags: updates.tags ?? snippet.tags,
          categoryId: updates.categoryId ?? snippet.categoryId,
        },
      },
    });
  }

  /**
   * Get video status
   */
  async getVideoStatus(videoId: string): Promise<{
    uploadStatus: string;
    privacyStatus: string;
    publishAt?: string;
  }> {
    await this.ensureValidTokens();
    
    const response = await this.youtube.videos.list({
      part: ['status', 'processingDetails'],
      id: [videoId],
    });
    
    const video = response.data.items?.[0];
    if (!video) throw new Error('Video not found');
    
    return {
      uploadStatus: video.status?.uploadStatus || 'unknown',
      privacyStatus: video.status?.privacyStatus || 'private',
      publishAt: video.status?.publishAt || undefined,
    };
  }

  /**
   * Add video to playlist
   */
  async addToPlaylist(videoId: string, playlistId: string): Promise<void> {
    await this.ensureValidTokens();
    
    await this.youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      },
    });
  }

  /**
   * Get user's playlists
   */
  async getPlaylists(): Promise<{ id: string; title: string }[]> {
    await this.ensureValidTokens();
    
    const response = await this.youtube.playlists.list({
      part: ['snippet'],
      mine: true,
      maxResults: 50,
    });
    
    return (response.data.items || []).map(playlist => ({
      id: playlist.id!,
      title: playlist.snippet?.title || '',
    }));
  }
}
```

---

## Part 4: Metadata Formatting (youtube/metadata.ts)

```typescript
import { VideoMetadata, PublishConfig } from '../types';

/**
 * Format description with template
 */
export function formatDescription(
  description: string,
  config: PublishConfig,
  chapters?: { timestamp: string; title: string }[]
): string {
  let formatted = description;
  
  // Add chapters if available
  if (chapters && chapters.length > 0) {
    const chapterText = chapters
      .map(ch => `${ch.timestamp} ${ch.title}`)
      .join('\n');
    
    formatted = `${formatted}\n\n📑 Chapters:\n${chapterText}`;
  }
  
  // Add footer from template
  if (config.metadataTemplate.descriptionFooter) {
    formatted = `${formatted}\n\n${config.metadataTemplate.descriptionFooter}`;
  }
  
  // Ensure under 5000 char limit
  if (formatted.length > 5000) {
    formatted = formatted.slice(0, 4997) + '...';
  }
  
  return formatted;
}

/**
 * Merge tags with defaults
 */
export function mergeTags(
  tags: string[],
  defaultTags: string[]
): string[] {
  const merged = [...new Set([...tags, ...defaultTags])];
  
  // YouTube has a 500 char total limit for tags
  let totalChars = 0;
  const validTags: string[] = [];
  
  for (const tag of merged) {
    if (totalChars + tag.length + 1 > 500) break;  // +1 for comma
    validTags.push(tag);
    totalChars += tag.length + 1;
  }
  
  return validTags;
}

/**
 * Sanitize title
 */
export function sanitizeTitle(title: string): string {
  // Remove characters YouTube doesn't allow
  let sanitized = title.replace(/[<>]/g, '');
  
  // Max 100 chars
  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 97) + '...';
  }
  
  return sanitized;
}

/**
 * Get category ID from name
 */
export const YOUTUBE_CATEGORIES: Record<string, string> = {
  'Film & Animation': '1',
  'Autos & Vehicles': '2',
  'Music': '10',
  'Pets & Animals': '15',
  'Sports': '17',
  'Travel & Events': '19',
  'Gaming': '20',
  'People & Blogs': '22',
  'Comedy': '23',
  'Entertainment': '24',
  'News & Politics': '25',
  'Howto & Style': '26',
  'Education': '27',
  'Science & Technology': '28',
  'Nonprofits & Activism': '29',
};

/**
 * Calculate optimal publish time
 */
export function getOptimalPublishTime(
  preferredTimes: string[],
  timezone: string
): Date {
  // If no preferred times, publish now
  if (!preferredTimes || preferredTimes.length === 0) {
    return new Date();
  }
  
  const now = new Date();
  
  // Find next preferred time
  for (const timeStr of preferredTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, try tomorrow
    if (candidate <= now) {
      candidate.setDate(candidate.getDate() + 1);
    }
    
    return candidate;
  }
  
  return now;
}
```

---

## Part 5: Publish Node Implementation (index.ts)

```typescript
import { z } from 'zod';
import {
  NodeContract,
  NodeMeta,
  RunContext,
  NodeResult,
  ExecutionOptions,
  ValidationResult,
  CostEstimate,
  ApiCallLog,
} from '../base';
import {
  PublishInputSchema,
  PublishOutputSchema,
  PublishConfigSchema,
  PublishInput,
  PublishOutput,
  PublishConfig,
} from './types';
import { YouTubeClient } from './youtube/client';
import { formatDescription, mergeTags, sanitizeTitle, getOptimalPublishTime } from './youtube/metadata';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

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
      description: script.metadata.description,
      tags: script.metadata.tags,
      category: context.config.publish?.defaults?.category ?? '22',
      language: context.config.publish?.defaults?.language ?? 'en',
      madeForKids: context.config.publish?.defaults?.madeForKids ?? false,
      ageRestricted: false,
      enableMonetization: true,
    };

    // Get selected thumbnail
    const selectedThumbnail = thumbnail?.selectedId
      ? thumbnail.options.find(o => o.id === thumbnail.selectedId)
      : thumbnail?.options?.[0];

    return {
      video: {
        url: assembly.videoUrl,
        path: assembly.videoPath,
        duration: assembly.metadata.duration,
        fileSize: assembly.metadata.fileSize,
      },
      thumbnail: selectedThumbnail
        ? { url: selectedThumbnail.imageUrl, path: selectedThumbnail.imagePath }
        : undefined,
      metadata,
      schedule: context.runOverrides.nodeOverrides?.publish?.schedule,
      visibility: context.runOverrides.nodeOverrides?.publish?.visibility,
    };
  }

  // === Validation ===

  validate(
    input: PublishInput,
    config: PublishConfig,
    context: RunContext
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

  estimateCost(input: PublishInput, config: PublishConfig): CostEstimate {
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
    const workDir = join('/tmp', 'vidflow', context.runId, 'publish');
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
      const youtubeTokens = await context.services.credentials.get('youtube');
      const tokens = JSON.parse(youtubeTokens);

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
```

---

## Part 6: API Routes

### OAuth Callback (src/app/api/youtube/auth/route.ts)

```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { createOAuth2Client, exchangeCodeForTokens } from '@/lib/nodes/publish/youtube/auth';

// GET /api/youtube/auth - Redirect to Google OAuth
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const oauth2Client = createOAuth2Client({
    clientId: process.env.YOUTUBE_CLIENT_ID!,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/auth/callback`,
  });

  if (action === 'connect') {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
      ],
      prompt: 'consent',
    });
    
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// Callback route: /api/youtube/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`);
  }

  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    const oauth2Client = createOAuth2Client({
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/auth/callback`,
    });

    const tokens = await exchangeCodeForTokens(oauth2Client, code);

    // Store tokens encrypted
    await supabase.from('user_credentials').upsert({
      user_id: user.id,
      credential_type: 'youtube',
      encrypted_value: JSON.stringify(tokens),  // Should be encrypted in production
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?youtube=connected`);

  } catch (err) {
    console.error('YouTube OAuth error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed`);
  }
}
```

### Get Channels (src/app/api/youtube/channels/route.ts)

```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { YouTubeClient } from '@/lib/nodes/publish/youtube/client';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: credential } = await supabase
      .from('user_credentials')
      .select('encrypted_value')
      .eq('user_id', user.id)
      .eq('credential_type', 'youtube')
      .single();

    if (!credential) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 });
    }

    const tokens = JSON.parse(credential.encrypted_value);
    
    const client = new YouTubeClient({
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      tokens,
    });

    const channels = await client.getChannels();

    return NextResponse.json({ channels });

  } catch (error) {
    console.error('Failed to get channels:', error);
    return NextResponse.json({ error: 'Failed to get channels' }, { status: 500 });
  }
}
```

---

## Part 7: Tests

```typescript
// src/lib/nodes/publish/__tests__/publish.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublishNode } from '../index';
import { 
  PublishInputSchema, 
  PublishConfigSchema,
  VideoMetadataSchema,
} from '../types';
import { 
  formatDescription, 
  mergeTags, 
  sanitizeTitle,
  getOptimalPublishTime,
} from '../youtube/metadata';

describe('PublishNode', () => {
  const node = new PublishNode();

  describe('meta', () => {
    it('has correct id', () => {
      expect(node.meta.id).toBe('publish');
    });

    it('has correct category', () => {
      expect(node.meta.category).toBe('publish');
    });

    it('requires youtube credentials', () => {
      expect(node.meta.requiredCredentials).toContain('youtube');
    });
  });

  describe('validation', () => {
    const validInput = {
      video: {
        url: 'https://storage.example.com/video.mp4',
        path: 'runs/123/video.mp4',
        duration: 600,
        fileSize: 100000000,
      },
      metadata: {
        title: 'Test Video',
        description: 'Test description',
        tags: ['test', 'video'],
        category: '22',
        language: 'en',
        madeForKids: false,
        ageRestricted: false,
        enableMonetization: true,
      },
    };

    const validConfig = {
      channelId: 'UC123456',
      defaults: {
        visibility: 'private' as const,
        category: '22',
        language: 'en',
        madeForKids: false,
      },
      scheduling: {
        mode: 'draft' as const,
        timezone: 'UTC',
      },
      metadataTemplate: {
        defaultTags: [],
      },
      requireReviewBeforePublic: true,
      notifySubscribers: true,
    };

    it('accepts valid input', () => {
      const result = PublishInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('requires channel ID', () => {
      const config = { ...validConfig, channelId: '' };
      const result = node.validate(validInput as any, config as any, {} as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('config.channelId');
    });

    it('warns on public visibility with review required', () => {
      const input = { ...validInput, visibility: 'public' as const };
      const result = node.validate(input as any, validConfig as any, {} as any);
      expect(result.warnings.some(w => w.field === 'visibility')).toBe(true);
    });

    it('warns when no thumbnail provided', () => {
      const result = node.validate(validInput as any, validConfig as any, {} as any);
      expect(result.warnings.some(w => w.field === 'thumbnail')).toBe(true);
    });
  });

  describe('cost estimation', () => {
    it('estimates zero cost (YouTube API is free)', () => {
      const cost = node.estimateCost({} as any, {} as any);
      expect(cost.total).toBe(0);
    });
  });
});

describe('formatDescription', () => {
  const config = {
    metadataTemplate: {
      descriptionFooter: '---\nFollow us on Twitter!',
      defaultTags: [],
    },
  } as any;

  it('adds footer from config', () => {
    const result = formatDescription('Main content', config);
    expect(result).toContain('Follow us on Twitter');
  });

  it('adds chapters if provided', () => {
    const chapters = [
      { timestamp: '0:00', title: 'Intro' },
      { timestamp: '2:00', title: 'Main Content' },
    ];
    const result = formatDescription('Main content', config, chapters);
    expect(result).toContain('📑 Chapters');
    expect(result).toContain('0:00 Intro');
    expect(result).toContain('2:00 Main Content');
  });

  it('truncates to 5000 chars', () => {
    const longDescription = 'a'.repeat(6000);
    const result = formatDescription(longDescription, { metadataTemplate: {} } as any);
    expect(result.length).toBeLessThanOrEqual(5000);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('mergeTags', () => {
  it('combines tags without duplicates', () => {
    const result = mergeTags(['a', 'b'], ['b', 'c']);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('respects 500 char limit', () => {
    const longTags = Array(100).fill('verylongtag');
    const result = mergeTags(longTags, []);
    const totalChars = result.join(',').length;
    expect(totalChars).toBeLessThanOrEqual(500);
  });
});

describe('sanitizeTitle', () => {
  it('removes disallowed characters', () => {
    const result = sanitizeTitle('Test <script> Title');
    expect(result).toBe('Test script Title');
  });

  it('truncates to 100 chars', () => {
    const longTitle = 'a'.repeat(150);
    const result = sanitizeTitle(longTitle);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('getOptimalPublishTime', () => {
  it('returns now if no preferred times', () => {
    const before = Date.now();
    const result = getOptimalPublishTime([], 'UTC');
    const after = Date.now();
    
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after + 1000);
  });

  it('returns next preferred time', () => {
    const result = getOptimalPublishTime(['09:00', '17:00'], 'UTC');
    const hours = result.getHours();
    expect([9, 17]).toContain(hours);
  });
});

describe('VideoMetadataSchema', () => {
  it('validates correct metadata', () => {
    const metadata = {
      title: 'Test',
      description: 'Test desc',
      tags: ['test'],
      category: '22',
      language: 'en',
      madeForKids: false,
      ageRestricted: false,
      enableMonetization: true,
    };
    
    const result = VideoMetadataSchema.safeParse(metadata);
    expect(result.success).toBe(true);
  });

  it('enforces title max length', () => {
    const metadata = {
      title: 'a'.repeat(101),
      description: 'Test',
      tags: [],
    };
    
    const result = VideoMetadataSchema.safeParse(metadata);
    expect(result.success).toBe(false);
  });

  it('applies default category', () => {
    const metadata = {
      title: 'Test',
      description: 'Test',
      tags: [],
    };
    
    const result = VideoMetadataSchema.parse(metadata);
    expect(result.category).toBe('22');
  });
});
```

---

## Part 8: Register Node

Add to `src/lib/nodes/registry.ts`:

```typescript
import { PublishNode } from './publish';

// In initialization
registry.register(new PublishNode());
```

---

## Checklist

- [ ] Create `src/lib/nodes/publish/types.ts`
- [ ] Create `src/lib/nodes/publish/youtube/auth.ts`
- [ ] Create `src/lib/nodes/publish/youtube/client.ts`
- [ ] Create `src/lib/nodes/publish/youtube/metadata.ts`
- [ ] Create `src/lib/nodes/publish/index.ts`
- [ ] Create `src/lib/nodes/publish/__tests__/publish.test.ts`
- [ ] Create `src/app/api/youtube/auth/route.ts`
- [ ] Create `src/app/api/youtube/auth/callback/route.ts`
- [ ] Create `src/app/api/youtube/channels/route.ts`
- [ ] Register node in registry
- [ ] Add environment variables to `.env.example`
- [ ] All tests passing

---

## Environment Variables

Add to `.env.example`:

```env
# YouTube OAuth
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/auth/callback
```

---

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `{YOUR_APP_URL}/api/youtube/auth/callback`
6. Copy Client ID and Client Secret to env vars

---

## Notes

1. **Quota**: YouTube API has daily quota limits (10,000 units). Each upload costs ~1600 units. Monitor usage.

2. **Token Refresh**: Access tokens expire in 1 hour. The client auto-refreshes using the refresh token.

3. **Scheduled Publishing**: Set `privacyStatus: 'private'` with `publishAt` timestamp. YouTube auto-publishes at that time.

4. **Resumable Upload**: For large files, implement resumable upload to handle network issues. Current implementation uses simple upload.

5. **Thumbnail Requirements**: Custom thumbnails require channel verification. If not verified, thumbnail upload will fail silently.

6. **Processing Time**: YouTube processes videos after upload. Status may be "processing" for several minutes before "processed".