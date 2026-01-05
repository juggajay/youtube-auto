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
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/auth/callback`,
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
