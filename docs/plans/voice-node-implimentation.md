# Voice Node Implementation Instructions

## Context

VidFlow now has:
- Core infrastructure (Phase 1) ✅
- Script Node (Phase 2) ✅
- 86 tests passing

The Voice Node takes script output and generates audio using ElevenLabs.

---

## Overview

The Voice Node:
1. Receives script segments from Script Node
2. Applies pronunciation corrections
3. Calls ElevenLabs API for each segment
4. Uploads audio files to Supabase Storage
5. Returns audio URLs for Assembly Node

**Key principle:** Voice settings are configured in Project Settings UI, with optional per-run overrides.

---

## File Structure

```
src/lib/nodes/voice/
├── index.ts              # VoiceGeneratorNode class
├── types.ts              # Zod schemas
├── elevenlabs.ts         # ElevenLabs API wrapper
├── pronunciation.ts      # Text preprocessing
└── __tests__/
    └── voice.test.ts

src/app/api/elevenlabs/
├── voices/route.ts       # GET available voices
├── preview/route.ts      # POST preview audio
└── test-connection/route.ts  # POST validate API key

src/components/settings/
└── VoiceSettings.tsx     # Voice configuration UI
```

---

## Part 1: Voice Node Types (types.ts)

```typescript
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
```

---

## Part 2: ElevenLabs API Wrapper (elevenlabs.ts)

```typescript
import { VoiceSettings } from './types';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: 'premade' | 'cloned' | 'generated';
  labels: Record<string, string>;  // e.g., { accent: 'american', gender: 'male' }
  preview_url: string;
}

export interface GenerateAudioParams {
  voiceId: string;
  text: string;
  modelId: string;
  settings: VoiceSettings;
  outputFormat: string;
}

export interface GenerateAudioResult {
  audioBuffer: Buffer;
  contentType: string;
}

export class ElevenLabsClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // === Get Available Voices ===
  
  async getVoices(): Promise<ElevenLabsVoice[]> {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices;
  }

  // === Generate Audio ===
  
  async generateAudio(params: GenerateAudioParams): Promise<GenerateAudioResult> {
    const { voiceId, text, modelId, settings, outputFormat } = params;

    const response = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost,
            style: settings.style,
            use_speaker_boost: settings.useSpeakerBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('INVALID_API_KEY: Invalid ElevenLabs API key');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMIT: ElevenLabs rate limit exceeded');
      }
      if (response.status === 400 && error.includes('quota')) {
        throw new Error('QUOTA_EXCEEDED: ElevenLabs character quota exceeded');
      }
      
      throw new Error(`ELEVENLABS_ERROR: ${response.status} - ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    return {
      audioBuffer: Buffer.from(arrayBuffer),
      contentType,
    };
  }

  // === Generate Audio with Streaming (optional, for progress) ===
  
  async generateAudioStream(
    params: GenerateAudioParams,
    onChunk?: (chunk: Buffer) => void
  ): Promise<GenerateAudioResult> {
    const { voiceId, text, modelId, settings, outputFormat } = params;

    const response = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/stream?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost,
            style: settings.style,
            use_speaker_boost: settings.useSpeakerBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ELEVENLABS_ERROR: ${response.status}`);
    }

    const chunks: Buffer[] = [];
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = Buffer.from(value);
      chunks.push(chunk);
      onChunk?.(chunk);
    }

    return {
      audioBuffer: Buffer.concat(chunks),
      contentType: 'audio/mpeg',
    };
  }

  // === Get Subscription Info (for quota checking) ===
  
  async getSubscription(): Promise<{
    character_count: number;
    character_limit: number;
    can_use_instant_voice_cloning: boolean;
  }> {
    const response = await fetch(`${ELEVENLABS_API_BASE}/user/subscription`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.status}`);
    }

    return response.json();
  }

  // === Test Connection ===
  
  async testConnection(): Promise<{ valid: boolean; quota?: number; limit?: number }> {
    try {
      const subscription = await this.getSubscription();
      return {
        valid: true,
        quota: subscription.character_count,
        limit: subscription.character_limit,
      };
    } catch (error) {
      return { valid: false };
    }
  }
}
```

---

## Part 3: Pronunciation Preprocessing (pronunciation.ts)

```typescript
import { PronunciationEntry } from './types';

/**
 * Apply pronunciation guide to text.
 * Replaces words with their phonetic versions using ElevenLabs pronunciation tags.
 */
export function applyPronunciationGuide(
  text: string,
  guide: PronunciationEntry[]
): string {
  if (guide.length === 0) return text;

  let result = text;

  for (const entry of guide) {
    // Build regex based on case sensitivity
    const flags = entry.caseSensitive ? 'g' : 'gi';
    const pattern = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, flags);
    
    // ElevenLabs uses <phoneme> tags for pronunciation
    // Alternative: just replace with the pronunciation spelling
    const replacement = entry.pronunciation;
    
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Preprocess text for TTS
 * - Apply pronunciation guide
 * - Normalize whitespace
 * - Handle special characters
 */
export function preprocessTextForTTS(
  text: string,
  pronunciationGuide: PronunciationEntry[]
): string {
  let processed = text;

  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ').trim();

  // Apply pronunciation guide
  processed = applyPronunciationGuide(processed, pronunciationGuide);

  // Convert common abbreviations (optional)
  const abbreviations: Record<string, string> = {
    'API': 'A.P.I.',
    'URL': 'U.R.L.',
    'SQL': 'sequel',
    'AI': 'A.I.',
    'UI': 'U.I.',
    'UX': 'U.X.',
  };

  for (const [abbr, expanded] of Object.entries(abbreviations)) {
    const pattern = new RegExp(`\\b${abbr}\\b`, 'g');
    processed = processed.replace(pattern, expanded);
  }

  return processed;
}

/**
 * Split long text into chunks suitable for TTS
 * ElevenLabs has a ~5000 character limit per request
 */
export function splitTextForTTS(text: string, maxLength: number = 4500): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

---

## Part 4: Voice Node Implementation (index.ts)

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
  VoiceInputSchema,
  VoiceOutputSchema,
  VoiceConfigSchema,
  VoiceInput,
  VoiceOutput,
  VoiceConfig,
  VoiceSettings,
} from './types';
import { ElevenLabsClient } from './elevenlabs';
import { preprocessTextForTTS, splitTextForTTS } from './pronunciation';

export class VoiceGeneratorNode implements NodeContract<
  typeof VoiceInputSchema,
  typeof VoiceOutputSchema,
  typeof VoiceConfigSchema
> {
  meta: NodeMeta = {
    id: 'voice',
    name: 'Voice Generator',
    description: 'Generates audio from script using ElevenLabs',
    icon: 'Mic',
    category: 'production',
    requiredCredentials: ['elevenlabs'],
    estimatedDuration: '1-5min',
  };

  inputSchema = VoiceInputSchema;
  outputSchema = VoiceOutputSchema;
  configSchema = VoiceConfigSchema;

  // === Get Input from Context ===

  getInputFromContext(context: RunContext): VoiceInput {
    const script = context.previousOutputs.script;
    
    if (!script) {
      throw new Error('Script output not found');
    }

    // Convert script sections to voice segments
    const segments = [
      // Hook
      {
        id: 'hook',
        name: 'Hook',
        text: script.hook.content,
        order: 0,
      },
      // Main sections
      ...script.sections.map((section, index) => ({
        id: section.id,
        name: section.name,
        text: section.content,
        order: index + 1,
      })),
      // Outro
      {
        id: 'outro',
        name: 'Outro',
        text: script.outro.content,
        order: script.sections.length + 1,
      },
    ];

    return {
      segments,
      settingsOverride: context.runOverrides.nodeOverrides?.voice?.settings,
      speedOverride: context.runOverrides.nodeOverrides?.voice?.speed,
    };
  }

  // === Validation ===

  validate(
    input: VoiceInput,
    config: VoiceConfig,
    context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Voice ID required
    if (!config.voiceId) {
      errors.push({
        field: 'config.voiceId',
        message: 'Voice ID is required',
      });
    }

    // Check total character count
    const totalChars = input.segments.reduce((sum, s) => sum + s.text.length, 0);
    
    if (totalChars > 100000) {
      warnings.push({
        field: 'segments',
        message: `Very long script (${totalChars} chars) - generation will take a while`,
      });
    }

    // Check for empty segments
    const emptySegments = input.segments.filter(s => !s.text.trim());
    if (emptySegments.length > 0) {
      warnings.push({
        field: 'segments',
        message: `${emptySegments.length} empty segment(s) will be skipped`,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===

  estimateCost(input: VoiceInput, config: VoiceConfig): CostEstimate {
    const totalChars = input.segments.reduce((sum, s) => sum + s.text.length, 0);

    // ElevenLabs pricing (approximate, varies by plan)
    // Creator plan: ~$0.30 per 1000 characters
    const costPer1000Chars = 0.30;
    const estimatedCost = (totalChars / 1000) * costPer1000Chars;

    return {
      estimated: true,
      breakdown: [{
        service: 'elevenlabs',
        units: totalChars,
        unitType: 'characters',
        cost: estimatedCost,
      }],
      total: estimatedCost,
      confidence: 'medium',
    };
  }

  // === Execution ===

  async execute(
    input: VoiceInput,
    config: VoiceConfig,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<VoiceOutput>> {
    const startedAt = new Date();
    const apiCalls: ApiCallLog[] = [];
    const completedSegments: VoiceOutput['segments'] = [];
    
    try {
      // Check cancellation
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      // Get API key
      const apiKey = await context.services.credentials.get('elevenlabs');
      const client = new ElevenLabsClient(apiKey);

      // Merge settings with overrides
      const settings = this.mergeSettings(config.settings, input.settingsOverride);
      const speed = input.speedOverride ?? config.speed;

      // Filter out empty segments
      const validSegments = input.segments.filter(s => s.text.trim());
      const totalSegments = validSegments.length;

      options?.onProgress?.({ 
        percent: 5, 
        message: `Generating audio for ${totalSegments} segments...`,
        stage: 'init',
      });

      // Process each segment
      for (let i = 0; i < validSegments.length; i++) {
        const segment = validSegments[i];
        
        // Check cancellation
        if (options?.signal?.aborted) {
          // Return partial output
          return {
            success: false,
            error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
            partialOutput: this.buildPartialOutput(completedSegments),
          };
        }

        const progress = Math.round(((i + 1) / totalSegments) * 90) + 5;
        options?.onProgress?.({ 
          percent: progress, 
          message: `Generating: ${segment.name} (${i + 1}/${totalSegments})`,
          stage: 'generation',
        });

        try {
          // Preprocess text
          const processedText = preprocessTextForTTS(
            segment.text,
            config.pronunciationGuide
          );

          // Split if too long
          const textChunks = splitTextForTTS(processedText);
          const audioBuffers: Buffer[] = [];

          for (const chunk of textChunks) {
            const requestedAt = new Date();
            
            const result = await this.generateWithRetry(
              client,
              {
                voiceId: config.voiceId,
                text: chunk,
                modelId: config.modelId,
                settings,
                outputFormat: config.outputFormat,
              },
              config.maxRetries,
              config.retryDelayMs
            );

            const respondedAt = new Date();
            
            apiCalls.push({
              service: 'elevenlabs',
              endpoint: `/v1/text-to-speech/${config.voiceId}`,
              method: 'POST',
              requestedAt,
              respondedAt,
              durationMs: respondedAt.getTime() - requestedAt.getTime(),
              status: 200,
            });

            audioBuffers.push(result.audioBuffer);
          }

          // Combine chunks if multiple
          const finalBuffer = audioBuffers.length === 1 
            ? audioBuffers[0] 
            : Buffer.concat(audioBuffers);

          // Upload to Supabase Storage
          const storagePath = `runs/${context.runId}/audio/${segment.id}.mp3`;
          const audioUrl = await this.uploadAudio(
            context.services.storage,
            storagePath,
            finalBuffer
          );

          // Calculate duration (rough estimate: 150 words per minute, ~5 chars per word)
          const estimatedDuration = (segment.text.length / 5) / 150 * 60;

          completedSegments.push({
            id: segment.id,
            name: segment.name,
            audioUrl,
            audioPath: storagePath,
            durationSeconds: estimatedDuration,
            characterCount: segment.text.length,
          });

        } catch (segmentError) {
          // Log error but continue with other segments
          options?.onLog?.({
            level: 'error',
            message: `Failed to generate audio for ${segment.name}: ${segmentError}`,
            timestamp: new Date(),
            data: { segmentId: segment.id, error: String(segmentError) },
          });

          // If this is a quota error, stop processing
          if (String(segmentError).includes('QUOTA_EXCEEDED')) {
            return {
              success: false,
              error: { 
                code: 'QUOTA_EXCEEDED', 
                message: 'ElevenLabs character quota exceeded', 
                retryable: false 
              },
              partialOutput: this.buildPartialOutput(completedSegments),
            };
          }
        }
      }

      // Check if we got any segments
      if (completedSegments.length === 0) {
        return {
          success: false,
          error: { 
            code: 'NO_SEGMENTS', 
            message: 'Failed to generate any audio segments', 
            retryable: true 
          },
        };
      }

      options?.onProgress?.({ 
        percent: 100, 
        message: 'Voice generation complete',
        stage: 'done',
      });

      const completedAt = new Date();
      const output: VoiceOutput = {
        segments: completedSegments.sort((a, b) => {
          const aIndex = input.segments.findIndex(s => s.id === a.id);
          const bIndex = input.segments.findIndex(s => s.id === b.id);
          return aIndex - bIndex;
        }),
        totalDurationSeconds: completedSegments.reduce((sum, s) => sum + s.durationSeconds, 0),
        totalCharacters: completedSegments.reduce((sum, s) => sum + s.characterCount, 0),
      };

      return {
        success: true,
        output,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.calculateActualCost(output.totalCharacters),
          apiCalls,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: this.mapError(error),
        partialOutput: completedSegments.length > 0 
          ? this.buildPartialOutput(completedSegments) 
          : undefined,
      };
    }
  }

  // === Private Helpers ===

  private mergeSettings(
    base: VoiceSettings,
    override?: Partial<VoiceSettings>
  ): VoiceSettings {
    if (!override) return base;
    
    return {
      stability: override.stability ?? base.stability,
      similarityBoost: override.similarityBoost ?? base.similarityBoost,
      style: override.style ?? base.style,
      useSpeakerBoost: override.useSpeakerBoost ?? base.useSpeakerBoost,
    };
  }

  private async generateWithRetry(
    client: ElevenLabsClient,
    params: Parameters<ElevenLabsClient['generateAudio']>[0],
    maxRetries: number,
    retryDelayMs: number
  ): Promise<Awaited<ReturnType<ElevenLabsClient['generateAudio']>>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await client.generateAudio(params);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry non-retryable errors
        if (
          lastError.message.includes('INVALID_API_KEY') ||
          lastError.message.includes('QUOTA_EXCEEDED')
        ) {
          throw lastError;
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
        }
      }
    }

    throw lastError;
  }

  private async uploadAudio(
    storage: StorageClient,
    path: string,
    buffer: Buffer
  ): Promise<string> {
    // Upload to Supabase Storage
    const { data, error } = await storage.upload(path, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = storage.getPublicUrl(path);
    return urlData.publicUrl;
  }

  private buildPartialOutput(segments: VoiceOutput['segments']): Partial<VoiceOutput> {
    return {
      segments,
      totalDurationSeconds: segments.reduce((sum, s) => sum + s.durationSeconds, 0),
      totalCharacters: segments.reduce((sum, s) => sum + s.characterCount, 0),
    };
  }

  private calculateActualCost(totalCharacters: number): CostEstimate {
    const costPer1000Chars = 0.30;
    const cost = (totalCharacters / 1000) * costPer1000Chars;

    return {
      estimated: false,
      breakdown: [{
        service: 'elevenlabs',
        units: totalCharacters,
        unitType: 'characters',
        cost,
      }],
      total: cost,
      confidence: 'high',
    };
  }

  private mapError(error: unknown): { code: string; message: string; retryable: boolean } {
    const message = String(error);

    if (message.includes('INVALID_API_KEY')) {
      return { code: 'INVALID_CREDENTIALS', message: 'Invalid ElevenLabs API key', retryable: false };
    }
    if (message.includes('RATE_LIMIT')) {
      return { code: 'RATE_LIMIT', message: 'ElevenLabs rate limit exceeded', retryable: true };
    }
    if (message.includes('QUOTA_EXCEEDED')) {
      return { code: 'QUOTA_EXCEEDED', message: 'ElevenLabs character quota exceeded', retryable: false };
    }

    return { code: 'VOICE_ERROR', message: String(error), retryable: true };
  }
}
```

---

## Part 5: API Routes

### GET /api/elevenlabs/voices

```typescript
// src/app/api/elevenlabs/voices/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { ElevenLabsClient } from '@/lib/nodes/voice/elevenlabs';

export async function GET(request: Request) {
  try {
    // Get user's API key from credentials
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: credential } = await supabase
      .from('user_credentials')
      .select('encrypted_value')
      .eq('user_id', user.id)
      .eq('credential_type', 'elevenlabs')
      .single();

    if (!credential) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 400 });
    }

    // Decrypt API key (implement based on your encryption method)
    const apiKey = await decryptCredential(credential.encrypted_value);
    
    const client = new ElevenLabsClient(apiKey);
    const voices = await client.getVoices();

    // Group by category
    const grouped = {
      premade: voices.filter(v => v.category === 'premade'),
      cloned: voices.filter(v => v.category === 'cloned'),
      generated: voices.filter(v => v.category === 'generated'),
    };

    return NextResponse.json({ voices: grouped });

  } catch (error) {
    console.error('Failed to fetch voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
```

### POST /api/elevenlabs/preview

```typescript
// src/app/api/elevenlabs/preview/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { ElevenLabsClient } from '@/lib/nodes/voice/elevenlabs';
import { VoiceSettingsSchema } from '@/lib/nodes/voice/types';
import { z } from 'zod';

const PreviewRequestSchema = z.object({
  voiceId: z.string(),
  text: z.string().max(500),  // Limit preview length
  settings: VoiceSettingsSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { voiceId, text, settings } = PreviewRequestSchema.parse(body);

    // Get user's API key
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: credential } = await supabase
      .from('user_credentials')
      .select('encrypted_value')
      .eq('user_id', user.id)
      .eq('credential_type', 'elevenlabs')
      .single();

    if (!credential) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 400 });
    }

    const apiKey = await decryptCredential(credential.encrypted_value);
    const client = new ElevenLabsClient(apiKey);

    const result = await client.generateAudio({
      voiceId,
      text,
      modelId: 'eleven_multilingual_v2',
      settings: settings ?? {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
      },
      outputFormat: 'mp3_44100_128',
    });

    // Return audio as base64
    const base64Audio = result.audioBuffer.toString('base64');
    
    return NextResponse.json({
      audio: `data:audio/mpeg;base64,${base64Audio}`,
    });

  } catch (error) {
    console.error('Preview failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
```

### POST /api/elevenlabs/test-connection

```typescript
// src/app/api/elevenlabs/test-connection/route.ts

import { NextResponse } from 'next/server';
import { ElevenLabsClient } from '@/lib/nodes/voice/elevenlabs';
import { z } from 'zod';

const TestRequestSchema = z.object({
  apiKey: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey } = TestRequestSchema.parse(body);

    const client = new ElevenLabsClient(apiKey);
    const result = await client.testConnection();

    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ valid: false, error: String(error) });
  }
}
```

---

## Part 6: Voice Settings UI Component

```typescript
// src/components/settings/VoiceSettings.tsx

'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Plus, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

interface VoiceSettingsProps {
  projectId: string;
  initialConfig?: VoiceConfig;
  onSave: (config: VoiceConfig) => Promise<void>;
}

export function VoiceSettings({ projectId, initialConfig, onSave }: VoiceSettingsProps) {
  // API Key
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);

  // Voices
  const [voices, setVoices] = useState<{ premade: Voice[]; cloned: Voice[]; generated: Voice[] }>({
    premade: [],
    cloned: [],
    generated: [],
  });
  const [selectedVoiceId, setSelectedVoiceId] = useState(initialConfig?.voiceId ?? '');
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Settings
  const [stability, setStability] = useState(initialConfig?.settings.stability ?? 0.5);
  const [similarityBoost, setSimilarityBoost] = useState(initialConfig?.settings.similarityBoost ?? 0.75);
  const [style, setStyle] = useState(initialConfig?.settings.style ?? 0);
  const [speed, setSpeed] = useState(initialConfig?.speed ?? 1.0);

  // Pronunciation
  const [pronunciations, setPronunciations] = useState<Array<{ word: string; pronunciation: string }>>(
    initialConfig?.pronunciationGuide ?? []
  );
  const [newWord, setNewWord] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');

  // Preview
  const [previewText, setPreviewText] = useState('Hello, this is a voice preview test.');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);

  // Test API Key
  const testApiKey = async () => {
    setApiKeyStatus('testing');
    try {
      const response = await fetch('/api/elevenlabs/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const result = await response.json();
      
      if (result.valid) {
        setApiKeyStatus('valid');
        setQuota({ used: result.quota, limit: result.limit });
        fetchVoices();
      } else {
        setApiKeyStatus('invalid');
      }
    } catch {
      setApiKeyStatus('invalid');
    }
  };

  // Fetch Voices
  const fetchVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await fetch('/api/elevenlabs/voices');
      const data = await response.json();
      setVoices(data.voices);
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    } finally {
      setLoadingVoices(false);
    }
  };

  // Preview Voice
  const handlePreview = async () => {
    if (!selectedVoiceId) return;
    
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/elevenlabs/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: selectedVoiceId,
          text: previewText,
          settings: { stability, similarityBoost, style, useSpeakerBoost: true },
        }),
      });
      const data = await response.json();
      setPreviewAudio(data.audio);
      
      // Auto-play
      const audio = new Audio(data.audio);
      audio.play();
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Add Pronunciation
  const addPronunciation = () => {
    if (!newWord || !newPronunciation) return;
    setPronunciations([...pronunciations, { word: newWord, pronunciation: newPronunciation }]);
    setNewWord('');
    setNewPronunciation('');
  };

  // Remove Pronunciation
  const removePronunciation = (index: number) => {
    setPronunciations(pronunciations.filter((_, i) => i !== index));
  };

  // Save
  const handleSave = async () => {
    await onSave({
      provider: 'elevenlabs',
      voiceId: selectedVoiceId,
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability,
        similarityBoost,
        style,
        useSpeakerBoost: true,
      },
      speed,
      pronunciationGuide: pronunciations,
      outputFormat: 'mp3_44100_128',
      maxRetries: 3,
      retryDelayMs: 1000,
    });
  };

  // Fetch voices on mount if API key already configured
  useEffect(() => {
    if (initialConfig?.voiceId) {
      fetchVoices();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle>ElevenLabs API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter your ElevenLabs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button onClick={testApiKey} disabled={!apiKey || apiKeyStatus === 'testing'}>
              {apiKeyStatus === 'testing' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test Connection
            </Button>
          </div>
          
          {apiKeyStatus === 'valid' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Connected
              {quota && (
                <span className="text-sm text-muted-foreground">
                  ({quota.used.toLocaleString()} / {quota.limit.toLocaleString()} characters used)
                </span>
              )}
            </div>
          )}
          
          {apiKeyStatus === 'invalid' && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              Invalid API key
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.cloned.length > 0 && (
                <>
                  <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                    Your Cloned Voices
                  </div>
                  {voices.cloned.map((voice) => (
                    <SelectItem key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </>
              )}
              
              <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                Pre-made Voices
              </div>
              {voices.premade.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} ({voice.labels.accent}, {voice.labels.gender})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Preview */}
          <div className="flex gap-2">
            <Input
              placeholder="Preview text..."
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handlePreview}
              disabled={!selectedVoiceId || previewLoading}
              variant="outline"
            >
              {previewLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Stability</Label>
              <span className="text-sm text-muted-foreground">{stability.toFixed(2)}</span>
            </div>
            <Slider
              value={[stability]}
              onValueChange={([v]) => setStability(v)}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Higher = more consistent, lower = more expressive
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Clarity + Similarity</Label>
              <span className="text-sm text-muted-foreground">{similarityBoost.toFixed(2)}</span>
            </div>
            <Slider
              value={[similarityBoost]}
              onValueChange={([v]) => setSimilarityBoost(v)}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Higher = closer to original voice
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Style Exaggeration</Label>
              <span className="text-sm text-muted-foreground">{style.toFixed(2)}</span>
            </div>
            <Slider
              value={[style]}
              onValueChange={([v]) => setStyle(v)}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Higher = more expressive style
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Speed</Label>
              <span className="text-sm text-muted-foreground">{speed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pronunciation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Pronunciation Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Pronunciation</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pronunciations.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.word}</TableCell>
                  <TableCell>{entry.pronunciation}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePronunciation(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-2">
            <Input
              placeholder="Word"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
            />
            <Input
              placeholder="Pronunciation"
              value={newPronunciation}
              onChange={(e) => setNewPronunciation(e.target.value)}
            />
            <Button onClick={addPronunciation} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full">
        Save Voice Settings
      </Button>
    </div>
  );
}
```

---

## Part 7: Update ResolvedConfig Type

Add to `src/lib/config/types.ts`:

```typescript
export interface VoiceConfig {
  provider: 'elevenlabs' | 'playht' | 'openai';
  voiceId: string;
  modelId: 'eleven_multilingual_v2' | 'eleven_monolingual_v1' | 'eleven_turbo_v2';
  
  settings: {
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
  
  speed: number;
  pronunciationGuide: { word: string; pronunciation: string; caseSensitive?: boolean }[];
  outputFormat: 'mp3_44100_128' | 'mp3_44100_192' | 'pcm_16000' | 'pcm_22050';
  maxRetries: number;
  retryDelayMs: number;
}
```

---

## Part 8: Tests

Write tests for:
1. VoiceInput/Output schema validation
2. ElevenLabsClient (mock API responses)
3. Pronunciation preprocessing
4. Text splitting for long content
5. Partial output on failure
6. Cost estimation

---

## Checklist

- [ ] Create `src/lib/nodes/voice/types.ts`
- [ ] Create `src/lib/nodes/voice/elevenlabs.ts`
- [ ] Create `src/lib/nodes/voice/pronunciation.ts`
- [ ] Create `src/lib/nodes/voice/index.ts`
- [ ] Create `src/lib/nodes/voice/__tests__/voice.test.ts`
- [ ] Create `src/app/api/elevenlabs/voices/route.ts`
- [ ] Create `src/app/api/elevenlabs/preview/route.ts`
- [ ] Create `src/app/api/elevenlabs/test-connection/route.ts`
- [ ] Create `src/components/settings/VoiceSettings.tsx`
- [ ] Register voice node in registry
- [ ] Update ResolvedConfig with VoiceConfig type
- [ ] Add voice settings to project settings page
- [ ] All tests passing

---

## Integration Notes

1. **Storage**: Voice node uploads to `runs/{runId}/audio/{segmentId}.mp3`
2. **Credentials**: API key stored encrypted in `user_credentials` table
3. **Quota tracking**: Consider tracking character usage per project
4. **Preview limits**: Limit preview to 500 chars to avoid quota burn
5. **Caching**: Consider caching voice list (changes rarely)