// Script Node Types

export interface ScriptSection {
  id: string;
  name: string;
  type: 'hook' | 'intro' | 'point' | 'story' | 'transition' | 'cta' | 'outro';
  duration: string; // e.g., "30s", "2m"
  instructions: string;
  required: boolean;
}

export interface Archetype {
  id: string;
  name: string;
  icon: string;
  description: string;
  typicalLength: string;
  sections: {
    name: string;
    duration: string;
  }[];
}

export interface ChannelBible {
  tone: string;
  targetAudience: string;
  keyPhrases: string[];
  avoidPhrases: string[];
  brandVoice: string;
  contentGuidelines: string;
}

export interface ScriptNodeConfig {
  // Archetype
  archetypeId: string;
  archetypeOverrides?: Partial<Archetype>;

  // Structure
  sections: ScriptSection[];
  allowReorder: boolean;

  // Hooks
  hooksToGenerate: number; // 1-5
  hookStyle: 'question' | 'statistic' | 'story' | 'controversy' | 'promise';
  hookTone: 'dramatic' | 'conversational' | 'mysterious';

  // Titles
  titlesToGenerate: number; // 1-10
  titlePatterns: string[];
  powerWords: string[];
  titleMaxLength: number;

  // Description
  descriptionTemplate: string;
  descriptionVariables: Record<string, string>;
  includeTimestamps: boolean;
  includeLinks: boolean;

  // Tags
  autoExtractTags: boolean;
  requiredTags: string[];
  bannedTags: string[];
  maxTags: number;

  // AI Model
  model: 'claude-sonnet' | 'claude-opus' | 'gpt-4' | 'gpt-4-turbo';
  temperature: number; // 0-1
  maxTokens: number;

  // Bible Override
  useBible: boolean;
  bibleOverrides: Partial<ChannelBible>;

  // Advanced
  systemPromptAddition: string;
  debugMode: boolean;
  rawOutput: boolean;
}

export const DEFAULT_SCRIPT_CONFIG: ScriptNodeConfig = {
  // Archetype
  archetypeId: '',
  archetypeOverrides: undefined,

  // Structure
  sections: [],
  allowReorder: true,

  // Hooks
  hooksToGenerate: 3,
  hookStyle: 'question',
  hookTone: 'conversational',

  // Titles
  titlesToGenerate: 5,
  titlePatterns: ['how-to', 'number-list'],
  powerWords: ['Secret', 'Ultimate', 'Proven'],
  titleMaxLength: 60,

  // Description
  descriptionTemplate: '',
  descriptionVariables: {},
  includeTimestamps: true,
  includeLinks: true,

  // Tags
  autoExtractTags: true,
  requiredTags: [],
  bannedTags: [],
  maxTags: 30,

  // AI Model
  model: 'claude-sonnet',
  temperature: 0.7,
  maxTokens: 4000,

  // Bible Override
  useBible: true,
  bibleOverrides: {},

  // Advanced
  systemPromptAddition: '',
  debugMode: false,
  rawOutput: false,
};
