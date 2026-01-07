import { create } from 'zustand';

// =============================================================================
// SCRIPT NODE CONFIG
// =============================================================================

// Content source types for the simplified panel
export type ContentSource = 'library' | 'generate';
export type DescriptionSource = 'library' | 'template' | 'generate';
export type TargetDuration = 'short' | 'standard' | 'long' | 'custom';
export type ScriptModel = 'claude-sonnet-4' | 'claude-opus-4';
export type Archetype = 'tutorial' | 'listicle' | 'explainer' | 'news' | 'review' | 'vs-battle' | 'story';

// Script section flags for advanced options
export interface ScriptSections {
  hook: boolean;
  introduction: boolean;
  mainContent: boolean;
  conclusion: boolean;
  callToAction: boolean;
}

export interface ScriptNodeConfig {
  // Content Tab
  hookSource: ContentSource;
  hookContentId?: string;

  titleSource: ContentSource;
  titleContentId?: string;

  descriptionSource: DescriptionSource;
  descriptionContentId?: string;
  descriptionTemplate?: string;

  autoGenerateTags: boolean;
  requiredTags: string[];

  // Generation Tab
  archetype: Archetype;
  targetDuration: TargetDuration;
  customDurationMin?: number;
  customDurationMax?: number;
  model: ScriptModel;
  temperature: number; // 0.3 to 1.0
  useChannelBible: boolean;

  // Advanced Tab
  sections: ScriptSections;
  customInstructions?: string;
  includeTimestamps: boolean;
  includeSectionHeaders: boolean;
  includeBrollSuggestions: boolean;
}

// =============================================================================
// VOICE NODE CONFIG
// =============================================================================

export type VoiceProvider = 'elevenlabs' | 'playht' | 'openai';
export type AudioFormat = 'mp3' | 'wav' | 'ogg';
export type SampleRate = 22050 | 44100 | 48000;

export interface PronunciationEntry {
  word: string;
  pronunciation: string; // IPA or phonetic
}

export interface VoiceNodeConfig {
  // Voice Selection
  voiceId: string;
  voiceName: string;
  voicePreviewUrl?: string;
  useClonedVoice: boolean;
  clonedVoiceId?: string;

  // Provider
  provider: VoiceProvider;

  // Speech Settings
  speed: number; // 0.5 - 2.0
  stability: number; // 0 - 1
  clarity: number; // 0 - 1
  styleExaggeration: number; // 0 - 1

  // Pronunciation
  pronunciationDict: PronunciationEntry[];

  // Output
  format: AudioFormat;
  sampleRate: SampleRate;
  chunkByParagraph: boolean;
}

// =============================================================================
// THUMBNAIL NODE CONFIG
// =============================================================================

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

// =============================================================================
// ASSEMBLY NODE CONFIG
// =============================================================================

export type VisualSource = 'stock' | 'ai-generated' | 'text-cards' | 'mixed';
export type StockProvider = 'pexels' | 'pixabay' | 'storyblocks';
export type TransitionStyle = 'cut' | 'fade' | 'slide' | 'zoom' | 'none';
export type CaptionStyle = 'standard' | 'highlighted' | 'karaoke' | 'minimal';
export type CaptionPosition = 'bottom' | 'top' | 'center';
export type VideoResolution = '720p' | '1080p' | '4k';
export type FrameRate = 24 | 30 | 60;
export type VideoFormat = 'mp4' | 'mov' | 'webm';
export type VideoQuality = 'draft' | 'standard' | 'high';

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
  quality: VideoQuality;
}

// =============================================================================
// PUBLISH NODE CONFIG
// =============================================================================

export type Visibility = 'public' | 'unlisted' | 'private';
export type TitleSource = 'generated' | 'override';
export type PublishMode = 'immediate' | 'scheduled' | 'premiere';

export interface PublishNodeConfig {
  // Platform
  channelId: string;
  channelName: string;
  visibility: Visibility;

  // Metadata
  titleSource: TitleSource;
  titleOverride?: string;
  descriptionTemplate: string;
  descriptionVariables: Record<string, string>;
  tags: string[];
  autoGenerateTags: boolean;
  maxTags: number;

  // Schedule
  publishMode: PublishMode;
  scheduledTime?: string; // ISO datetime
  premiereCountdown: number; // minutes

  // Advanced
  category: string;
  language: string;
  madeForKids: boolean;
  ageRestricted: boolean;
  allowComments: boolean;
  allowRatings: boolean;
  isShort: boolean;

  // Playlist
  addToPlaylist: boolean;
  playlistId?: string;

  // Notifications
  notifySubscribers: boolean;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultScriptConfig: ScriptNodeConfig = {
  // Content Tab
  hookSource: 'generate',
  hookContentId: undefined,
  titleSource: 'generate',
  titleContentId: undefined,
  descriptionSource: 'generate',
  descriptionContentId: undefined,
  descriptionTemplate: `{intro}

Timestamps:
{timestamps}

Links:
{links}

{cta}`,
  autoGenerateTags: true,
  requiredTags: [],

  // Generation Tab
  archetype: 'tutorial',
  targetDuration: 'standard',
  customDurationMin: undefined,
  customDurationMax: undefined,
  model: 'claude-sonnet-4',
  temperature: 0.7,
  useChannelBible: true,

  // Advanced Tab
  sections: {
    hook: true,
    introduction: true,
    mainContent: true,
    conclusion: true,
    callToAction: true,
  },
  customInstructions: undefined,
  includeTimestamps: true,
  includeSectionHeaders: true,
  includeBrollSuggestions: false,
};

const defaultVoiceConfig: VoiceNodeConfig = {
  voiceId: '',
  voiceName: '',
  useClonedVoice: false,
  provider: 'elevenlabs',
  speed: 1.0,
  stability: 0.5,
  clarity: 0.75,
  styleExaggeration: 0.3,
  pronunciationDict: [],
  format: 'mp3',
  sampleRate: 44100,
  chunkByParagraph: false,
};

const defaultThumbnailConfig: ThumbnailNodeConfig = {
  source: 'reference',
  prompt: '',
  aspectRatio: '16:9',
  mood: 'dramatic',
};

const defaultAssemblyConfig: AssemblyNodeConfig = {
  visualSource: 'mixed',
  stockProvider: 'pexels',
  aiImageStyle: 'realistic',
  textCardStyle: 'minimal',
  includeIntro: false,
  introTemplate: '',
  introDuration: 5,
  includeOutro: false,
  outroTemplate: '',
  outroDuration: 10,
  transitionStyle: 'fade',
  transitionDuration: 500,
  includeCaptions: true,
  captionStyle: 'highlighted',
  captionPosition: 'bottom',
  captionFont: 'Roboto',
  captionFontSize: 48,
  captionColor: '#FFFFFF',
  captionBackground: true,
  captionBackgroundColor: '#000000',
  includeMusic: false,
  musicVolume: 20,
  musicFadeIn: true,
  musicFadeOut: true,
  ducking: true,
  duckingAmount: 50,
  resolution: '1080p',
  frameRate: 30,
  format: 'mp4',
  quality: 'standard',
};

const defaultPublishConfig: PublishNodeConfig = {
  channelId: '',
  channelName: '',
  visibility: 'private',
  titleSource: 'generated',
  descriptionTemplate: '',
  descriptionVariables: {},
  tags: [],
  autoGenerateTags: true,
  maxTags: 15,
  publishMode: 'immediate',
  premiereCountdown: 15,
  category: '22', // People & Blogs
  language: 'en',
  madeForKids: false,
  ageRestricted: false,
  allowComments: true,
  allowRatings: true,
  isShort: false,
  addToPlaylist: false,
  notifySubscribers: true,
};

// =============================================================================
// STORE STATE TYPE
// =============================================================================

export type NodeType = 'script' | 'voice' | 'thumbnail' | 'assembly' | 'publish';

export interface NodeConfigState {
  // Active node for editing
  activeNode: NodeType | null;

  // Node configs
  scriptConfig: ScriptNodeConfig;
  voiceConfig: VoiceNodeConfig;
  thumbnailConfig: ThumbnailNodeConfig;
  assemblyConfig: AssemblyNodeConfig;
  publishConfig: PublishNodeConfig;

  // Dirty state tracking
  isDirty: boolean;
  dirtyNodes: Set<NodeType>;

  // Actions - General
  setActiveNode: (node: NodeType | null) => void;
  markDirty: (node: NodeType) => void;
  clearDirty: () => void;

  // Actions - Script Config
  updateScriptConfig: (updates: Partial<ScriptNodeConfig>) => void;
  setScriptConfig: (config: ScriptNodeConfig) => void;
  addRequiredTag: (tag: string) => void;
  removeRequiredTag: (tag: string) => void;

  // Actions - Voice Config
  updateVoiceConfig: (updates: Partial<VoiceNodeConfig>) => void;
  setVoiceConfig: (config: VoiceNodeConfig) => void;
  addPronunciationEntry: (entry: PronunciationEntry) => void;
  removePronunciationEntry: (index: number) => void;
  updatePronunciationEntry: (index: number, entry: PronunciationEntry) => void;

  // Actions - Thumbnail Config
  updateThumbnailConfig: (updates: Partial<ThumbnailNodeConfig>) => void;
  setThumbnailConfig: (config: ThumbnailNodeConfig) => void;

  // Actions - Assembly Config
  updateAssemblyConfig: (updates: Partial<AssemblyNodeConfig>) => void;
  setAssemblyConfig: (config: AssemblyNodeConfig) => void;

  // Actions - Publish Config
  updatePublishConfig: (updates: Partial<PublishNodeConfig>) => void;
  setPublishConfig: (config: PublishNodeConfig) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  // Actions - Bulk
  loadAllConfigs: (configs: Partial<{
    script: ScriptNodeConfig;
    voice: VoiceNodeConfig;
    thumbnail: ThumbnailNodeConfig;
    assembly: AssemblyNodeConfig;
    publish: PublishNodeConfig;
  }>) => void;
  resetAllConfigs: () => void;
  resetConfig: (node: NodeType) => void;

  // Getters
  getConfig: (node: NodeType) =>
    | ScriptNodeConfig
    | VoiceNodeConfig
    | ThumbnailNodeConfig
    | AssemblyNodeConfig
    | PublishNodeConfig;
}

// =============================================================================
// STORE
// =============================================================================

export const useNodeConfigStore = create<NodeConfigState>((set, get) => ({
  // Initial state
  activeNode: null,
  scriptConfig: { ...defaultScriptConfig },
  voiceConfig: { ...defaultVoiceConfig },
  thumbnailConfig: { ...defaultThumbnailConfig },
  assemblyConfig: { ...defaultAssemblyConfig },
  publishConfig: { ...defaultPublishConfig },
  isDirty: false,
  dirtyNodes: new Set(),

  // General actions
  setActiveNode: (node) => set({ activeNode: node }),

  markDirty: (node) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add(node);
      return { isDirty: true, dirtyNodes: newDirtyNodes };
    }),

  clearDirty: () => set({ isDirty: false, dirtyNodes: new Set() }),

  // Script config actions
  updateScriptConfig: (updates) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('script');
      return {
        scriptConfig: { ...state.scriptConfig, ...updates },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  setScriptConfig: (config) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('script');
      return {
        scriptConfig: config,
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  addRequiredTag: (tag) =>
    set((state) => {
      if (state.scriptConfig.requiredTags.includes(tag)) return state;
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('script');
      return {
        scriptConfig: {
          ...state.scriptConfig,
          requiredTags: [...state.scriptConfig.requiredTags, tag],
        },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  removeRequiredTag: (tag) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('script');
      return {
        scriptConfig: {
          ...state.scriptConfig,
          requiredTags: state.scriptConfig.requiredTags.filter((t) => t !== tag),
        },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  // Voice config actions
  updateVoiceConfig: (updates) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('voice');
      return {
        voiceConfig: { ...state.voiceConfig, ...updates },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  setVoiceConfig: (config) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('voice');
      return {
        voiceConfig: config,
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  addPronunciationEntry: (entry) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('voice');
      return {
        voiceConfig: {
          ...state.voiceConfig,
          pronunciationDict: [...state.voiceConfig.pronunciationDict, entry],
        },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  removePronunciationEntry: (index) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('voice');
      return {
        voiceConfig: {
          ...state.voiceConfig,
          pronunciationDict: state.voiceConfig.pronunciationDict.filter(
            (_, i) => i !== index
          ),
        },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  updatePronunciationEntry: (index, entry) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('voice');
      return {
        voiceConfig: {
          ...state.voiceConfig,
          pronunciationDict: state.voiceConfig.pronunciationDict.map((e, i) =>
            i === index ? entry : e
          ),
        },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  // Thumbnail config actions
  updateThumbnailConfig: (updates) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('thumbnail');
      return {
        thumbnailConfig: { ...state.thumbnailConfig, ...updates },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  setThumbnailConfig: (config) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('thumbnail');
      return {
        thumbnailConfig: config,
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  // Assembly config actions
  updateAssemblyConfig: (updates) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('assembly');
      return {
        assemblyConfig: { ...state.assemblyConfig, ...updates },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  setAssemblyConfig: (config) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('assembly');
      return {
        assemblyConfig: config,
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  // Publish config actions
  updatePublishConfig: (updates) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('publish');
      return {
        publishConfig: { ...state.publishConfig, ...updates },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  setPublishConfig: (config) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('publish');
      return {
        publishConfig: config,
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  addTag: (tag) =>
    set((state) => {
      if (state.publishConfig.tags.includes(tag)) return state;
      if (state.publishConfig.tags.length >= state.publishConfig.maxTags) return state;
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('publish');
      return {
        publishConfig: {
          ...state.publishConfig,
          tags: [...state.publishConfig.tags, tag],
        },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  removeTag: (tag) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.add('publish');
      return {
        publishConfig: {
          ...state.publishConfig,
          tags: state.publishConfig.tags.filter((t) => t !== tag),
        },
        isDirty: true,
        dirtyNodes: newDirtyNodes,
      };
    }),

  // Bulk actions
  loadAllConfigs: (configs) =>
    set((state) => ({
      scriptConfig: configs.script || state.scriptConfig,
      voiceConfig: configs.voice || state.voiceConfig,
      thumbnailConfig: configs.thumbnail || state.thumbnailConfig,
      assemblyConfig: configs.assembly || state.assemblyConfig,
      publishConfig: configs.publish || state.publishConfig,
      isDirty: false,
      dirtyNodes: new Set(),
    })),

  resetAllConfigs: () =>
    set({
      scriptConfig: { ...defaultScriptConfig },
      voiceConfig: { ...defaultVoiceConfig },
      thumbnailConfig: { ...defaultThumbnailConfig },
      assemblyConfig: { ...defaultAssemblyConfig },
      publishConfig: { ...defaultPublishConfig },
      isDirty: false,
      dirtyNodes: new Set(),
    }),

  resetConfig: (node) =>
    set((state) => {
      const newDirtyNodes = new Set(state.dirtyNodes);
      newDirtyNodes.delete(node);

      switch (node) {
        case 'script':
          return {
            scriptConfig: { ...defaultScriptConfig },
            dirtyNodes: newDirtyNodes,
            isDirty: newDirtyNodes.size > 0,
          };
        case 'voice':
          return {
            voiceConfig: { ...defaultVoiceConfig },
            dirtyNodes: newDirtyNodes,
            isDirty: newDirtyNodes.size > 0,
          };
        case 'thumbnail':
          return {
            thumbnailConfig: { ...defaultThumbnailConfig },
            dirtyNodes: newDirtyNodes,
            isDirty: newDirtyNodes.size > 0,
          };
        case 'assembly':
          return {
            assemblyConfig: { ...defaultAssemblyConfig },
            dirtyNodes: newDirtyNodes,
            isDirty: newDirtyNodes.size > 0,
          };
        case 'publish':
          return {
            publishConfig: { ...defaultPublishConfig },
            dirtyNodes: newDirtyNodes,
            isDirty: newDirtyNodes.size > 0,
          };
        default:
          return state;
      }
    }),

  // Getters
  getConfig: (node) => {
    const state = get();
    switch (node) {
      case 'script':
        return state.scriptConfig;
      case 'voice':
        return state.voiceConfig;
      case 'thumbnail':
        return state.thumbnailConfig;
      case 'assembly':
        return state.assemblyConfig;
      case 'publish':
        return state.publishConfig;
      default:
        throw new Error(`Unknown node type: ${node}`);
    }
  },
}));
