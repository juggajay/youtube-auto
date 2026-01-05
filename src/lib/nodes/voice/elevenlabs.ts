import type { VoiceSettings } from './types';

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
    } catch {
      return { valid: false };
    }
  }
}
