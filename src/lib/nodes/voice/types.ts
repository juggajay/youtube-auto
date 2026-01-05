import { z } from 'zod';

// === Voice Settings (ElevenLabs-specific) ===

export const VoiceSettingsSchema = z.object({
  stability: z.number().min(0).max(1).default(0.5),
  similarityBoost: z.number().min(0).max(1).default(0.75),
  style: z.number().min(0).max(1).default(0),
  useSpeakerBoost: z.boolean().default(true),
});

export const PronunciationEntrySchema = z.object({
  word: z.string(),
  pronunciation: z.string(),
  caseSensitive: z.boolean().default(false),
});

// === Input Schema ===

export const VoiceInputSchema = z.object({
  // Segments from Script Node output
  segments: z.array(z.object({
    id: z.string(),                    // Matches section ID from script
    name: z.string(),                  // Section name for logging
    text: z.string(),                  // Script content to voice
    order: z.number(),                 // Sequence order
  })).min(1),

  // Optional per-run overrides
  settingsOverride: VoiceSettingsSchema.partial().optional(),
  speedOverride: z.number().min(0.5).max(2.0).optional(),
});

// === Output Schema ===

export const VoiceOutputSchema = z.object({
  segments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    audioUrl: z.string(),              // Supabase storage URL
    audioPath: z.string(),             // Storage path for cleanup
    durationSeconds: z.number(),
    characterCount: z.number(),
  })),

  totalDurationSeconds: z.number(),
  totalCharacters: z.number(),
});

// === Config Schema ===

export const VoiceConfigSchema = z.object({
  provider: z.enum(['elevenlabs', 'playht', 'openai']).default('elevenlabs'),
  voiceId: z.string(),
  modelId: z.enum([
    'eleven_multilingual_v2',
    'eleven_monolingual_v1',
    'eleven_turbo_v2',
  ]).default('eleven_multilingual_v2'),

  settings: VoiceSettingsSchema,
  speed: z.number().min(0.5).max(2.0).default(1.0),

  pronunciationGuide: z.array(PronunciationEntrySchema).default([]),

  // Processing options
  outputFormat: z.enum(['mp3_44100_128', 'mp3_44100_192', 'pcm_16000', 'pcm_22050']).default('mp3_44100_128'),

  // Retry settings
  maxRetries: z.number().default(3),
  retryDelayMs: z.number().default(1000),
});

export type VoiceInput = z.infer<typeof VoiceInputSchema>;
export type VoiceOutput = z.infer<typeof VoiceOutputSchema>;
export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;
export type VoiceSettings = z.infer<typeof VoiceSettingsSchema>;
export type PronunciationEntry = z.infer<typeof PronunciationEntrySchema>;
