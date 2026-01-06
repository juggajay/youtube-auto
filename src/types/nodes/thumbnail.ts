// Thumbnail node types for VidFlow

export type ThumbnailSource = 'existing' | 'reference' | 'fresh';
export type ThumbnailAspectRatio = '16:9' | '1:1' | '9:16';
export type ThumbnailMood = 'dramatic' | 'playful' | 'professional' | 'minimalist' | 'custom';

export interface ThumbnailNodeConfig {
  // Source mode
  source: ThumbnailSource;
  existingElementId?: string;
  prompt?: string; // May contain @mentions and {variables}

  // Style
  aspectRatio: ThumbnailAspectRatio;
  mood?: ThumbnailMood;
}

export const DEFAULT_THUMBNAIL_CONFIG: ThumbnailNodeConfig = {
  source: 'reference',
  prompt: '',
  aspectRatio: '16:9',
  mood: 'dramatic',
};

export interface AspectRatioInfo {
  id: ThumbnailAspectRatio;
  label: string;
  desc: string;
  width: number;
  height: number;
}

export interface MoodInfo {
  id: ThumbnailMood;
  label: string;
  desc: string;
}
