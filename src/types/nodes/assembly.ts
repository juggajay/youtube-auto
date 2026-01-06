// Assembly node configuration types
// types/nodes/assembly.ts

export type VisualSource = 'stock' | 'ai-generated' | 'text-cards' | 'mixed';
export type StockProvider = 'pexels' | 'pixabay' | 'storyblocks';
export type TransitionStyle = 'cut' | 'fade' | 'slide' | 'zoom' | 'none';
export type CaptionStyle = 'standard' | 'highlighted' | 'karaoke' | 'minimal';
export type CaptionPosition = 'bottom' | 'top' | 'center';
export type VideoResolution = '720p' | '1080p' | '4k';
export type FrameRate = 24 | 30 | 60;
export type VideoFormat = 'mp4' | 'mov' | 'webm';
export type QualityPreset = 'draft' | 'standard' | 'high';

export interface AssemblyNodeConfig {
  // Visual Source
  visualSource: VisualSource;
  stockProvider: StockProvider;
  aiImageStyle: string;
  textCardStyle: string;

  // Structure
  includeIntro: boolean;
  introTemplate: string;
  introDuration: number; // seconds
  includeOutro: boolean;
  outroTemplate: string;
  outroDuration: number;
  transitionStyle: TransitionStyle;
  transitionDuration: number; // ms

  // Captions
  includeCaptions: boolean;
  captionStyle: CaptionStyle;
  captionPosition: CaptionPosition;
  captionFont: string;
  captionFontSize: number;
  captionColor: string;
  captionBackground: boolean;
  captionBackgroundColor: string;

  // Music
  includeMusic: boolean;
  musicTrackId?: string;
  musicVolume: number; // 0-100
  musicFadeIn: boolean;
  musicFadeOut: boolean;
  ducking: boolean; // Lower music during speech
  duckingAmount: number; // percentage to reduce

  // Output
  resolution: VideoResolution;
  frameRate: FrameRate;
  format: VideoFormat;
  quality: QualityPreset;
}

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  mood: string;
  previewUrl: string;
}

export const DEFAULT_ASSEMBLY_CONFIG: AssemblyNodeConfig = {
  // Visual Source
  visualSource: 'stock',
  stockProvider: 'pexels',
  aiImageStyle: 'realistic',
  textCardStyle: 'minimal',

  // Structure
  includeIntro: true,
  introTemplate: 'default',
  introDuration: 5,
  includeOutro: true,
  outroTemplate: 'default',
  outroDuration: 10,
  transitionStyle: 'fade',
  transitionDuration: 500,

  // Captions
  includeCaptions: true,
  captionStyle: 'standard',
  captionPosition: 'bottom',
  captionFont: 'Roboto',
  captionFontSize: 24,
  captionColor: '#ffffff',
  captionBackground: true,
  captionBackgroundColor: '#000000',

  // Music
  includeMusic: false,
  musicTrackId: undefined,
  musicVolume: 30,
  musicFadeIn: true,
  musicFadeOut: true,
  ducking: true,
  duckingAmount: 50,

  // Output
  resolution: '1080p',
  frameRate: 30,
  format: 'mp4',
  quality: 'standard',
};
