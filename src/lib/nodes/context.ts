import { v4 as uuidv4 } from 'uuid';
import type { NodeError, RunStatus } from './base';
import type { ResolvedConfig } from '@/lib/config/types';

// === Node Output Types ===

export interface TriggerOutput {
  topic: string;
  archetypeId?: string;  // Optional - archetypes are UI presets, not constraints
  sourceType: 'manual' | 'scheduled' | 'webhook' | 'nicheradar';
  sourceData?: Record<string, unknown>;

  // Script Node inputs - set by UI before run starts
  // Archetypes pre-fill these, but users can customize
  structure?: {
    sections: {
      id: string;
      name: string;
      purpose: string;
      targetDuration?: number;
      required: boolean;
      notes?: string;
    }[];
    turnPlacement?: number;
    totalDuration: { min: number; max: number };
  };
  rules?: {
    alwaysInclude?: string[];
    neverInclude?: string[];
    tone?: string;
    vocabulary?: {
      useJargon?: boolean;
      bannedWords?: string[];
      preferredPhrases?: string[];
    };
    customInstructions?: string;
  };
}

export interface ResearchOutput {
  summary: string;
  keyPoints: string[];
  sources: { title: string; url: string; snippet: string }[];
  comparisons?: Record<string, unknown>;
  recentDevelopments?: string[];
}

export interface ScriptOutput {
  title: string;
  hook: {
    text: string;
    durationEstimate: number;
    visualNotes: string;
  };
  sections: {
    id: string;
    name: string;
    archetypeSectionId?: string;
    script: string;
    durationEstimate: number;
    visualNotes: string;
    bRollSuggestions: string[];
  }[];
  outro: {
    text: string;
    cta: string;
  };
  metadata: {
    descriptionDraft: string;
    tags: string[];
    chapters: { timestamp: string; title: string }[];
  };
  totalDurationEstimate: number;
  wordCount: number;
}

export interface VoiceOutput {
  segments: {
    id: string;
    file: string;
    duration: number;
    text: string;
  }[];
  totalDuration: number;
}

export interface ThumbnailOutput {
  selected: string;
  options: {
    file: string;
    ctrScore?: number;
  }[];
}

export interface AssemblyOutput {
  videoFile: string;
  subtitleFile?: string;
  duration: number;
  resolution: string;
}

// === Run Context ===

export interface RunContext {
  // Identifiers
  runId: string;
  projectId: string;
  userId: string;

  // Run State
  status: RunStatus;
  startedAt: Date;
  currentNode: string | null;
  completedNodes: string[];
  skippedNodes: string[];

  // Retry Tracking
  retry: {
    attemptNumber: number;
    maxAttempts: number;
    lastError?: NodeError;
  };

  // Accumulated Outputs
  previousOutputs: {
    trigger?: TriggerOutput;
    research?: ResearchOutput;
    script?: ScriptOutput;
    voice?: VoiceOutput;
    thumbnail?: ThumbnailOutput;
    assembly?: AssemblyOutput;
    [nodeId: string]: unknown;
  };

  // Resolved Configuration
  config: ResolvedConfig;

  // Services (injected at runtime)
  services: RunServices;

  // Run Overrides
  runOverrides: {
    instructions?: string;
    skipNodes?: string[];
    nodeOverrides?: Record<string, unknown>;
  };
}

export interface RunServices {
  db: DatabaseClient;
  storage: StorageClient;
  credentials: CredentialManager;
  logger: Logger;
}

// Placeholder interfaces - will be implemented later
export interface DatabaseClient {
  // To be implemented
}

export interface StorageClient {
  // To be implemented
}

export interface CredentialManager {
  get(type: string): Promise<string>;
  set(type: string, value: string): Promise<void>;
  has(type: string): Promise<boolean>;
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  log(level: string, message: string, data?: Record<string, unknown>): void;
}

// === Factory Function ===

export interface CreateContextParams {
  userId: string;
  projectId: string;
  config?: ResolvedConfig;
  services?: Partial<RunServices>;
  runOverrides?: RunContext['runOverrides'];
}

export function createInitialRunContext(params: CreateContextParams): RunContext {
  const defaultConfig: ResolvedConfig = {
    channelBible: {
      channel_name: '',
      target_audience: { demographics: '', knowledge_level: '', why_they_watch: '' },
      tone: { overall: 'professional', humor: 'none', formality: 'neutral' },
      vocabulary: { use_jargon: false, explain_threshold: '', banned_words: [], preferred_phrases: [] },
      structure: { typical_length: '8-12 minutes', hook_style: '', cta_style: '', intro_length: '' },
      rules: { always_include: [], never_include: [], fact_check: '' },
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: '',
      speed: 1.0,
      stability: 0.75,
      pronunciationGuide: [],
    },
    thumbnail: {
      dimensions: { width: 1280, height: 720 },
      colors: { primary: '#2563EB', secondary: '#1E293B', text: '#FFFFFF', accent: '#F59E0B' },
      typography: { font_family: 'Inter', max_words: 4, text_position: 'dynamic' },
      style: { background_type: 'generated', include_face: false, overall_mood: 'professional' },
      elements: { use_arrows: false, use_circles: false, use_icons: true },
    },
    assembly: {
      resolution: '1080p',
      aspect_ratio: '16:9',
      frame_rate: 30,
      assets: {},
      style: {
        transition_type: 'cut',
        text_animation: 'fade',
        caption_style: { enabled: true, font: 'Inter', position: 'bottom', style: 'standard' },
      },
      b_roll: { source: 'generated' },
    },
    publish: {
      platform: 'youtube',
      channel_id: '',
      defaults: { visibility: 'private', category: '22', language: 'en', made_for_kids: false },
      scheduling: { mode: 'draft' },
      metadata_template: { description_template: '', default_tags: [] },
    },
    intervention: {
      nodes: {
        trigger: 'auto',
        research: 'auto',
        script: 'review',
        voice: 'auto',
        thumbnail: 'review',
        assembly: 'auto',
        publish: 'always_review',
      },
      defaults: { pauseOnError: true, notifyOnComplete: true },
    },
  };

  const defaultLogger: Logger = {
    debug: (msg, data) => console.debug(`[DEBUG] ${msg}`, data),
    info: (msg, data) => console.info(`[INFO] ${msg}`, data),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data),
    log: (level, msg, data) => console.log(`[${level.toUpperCase()}] ${msg}`, data),
  };

  return {
    runId: uuidv4(),
    projectId: params.projectId,
    userId: params.userId,
    status: 'pending',
    startedAt: new Date(),
    currentNode: null,
    completedNodes: [],
    skippedNodes: [],
    retry: {
      attemptNumber: 1,
      maxAttempts: 3,
      lastError: undefined,
    },
    previousOutputs: {},
    config: params.config ?? defaultConfig,
    services: {
      db: params.services?.db ?? ({} as DatabaseClient),
      storage: params.services?.storage ?? ({} as StorageClient),
      credentials: params.services?.credentials ?? ({
        get: async () => '',
        set: async () => {},
        has: async () => false,
      } as CredentialManager),
      logger: params.services?.logger ?? defaultLogger,
    },
    runOverrides: params.runOverrides ?? {},
  };
}

// Re-export RunStatus from base
export type { RunStatus } from './base';
