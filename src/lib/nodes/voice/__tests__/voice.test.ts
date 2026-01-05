import { describe, it, expect } from 'vitest';
import { VoiceGeneratorNode } from '../index';
import { VoiceInputSchema, VoiceOutputSchema, VoiceConfigSchema, VoiceSettingsSchema } from '../types';
import { applyPronunciationGuide, preprocessTextForTTS, splitTextForTTS } from '../pronunciation';
import { createInitialRunContext } from '../../context';

describe('VoiceGeneratorNode', () => {
  const node = new VoiceGeneratorNode();

  describe('meta', () => {
    it('has correct id', () => {
      expect(node.meta.id).toBe('voice');
    });

    it('has correct category', () => {
      expect(node.meta.category).toBe('production');
    });

    it('requires elevenlabs credentials', () => {
      expect(node.meta.requiredCredentials).toContain('elevenlabs');
    });

    it('has description', () => {
      expect(node.meta.description).toBeTruthy();
    });
  });

  describe('schemas', () => {
    describe('VoiceInputSchema', () => {
      it('accepts valid input', () => {
        const input = {
          segments: [
            { id: 'hook', name: 'Hook', text: 'Welcome to the video!', order: 0 },
            { id: 'main', name: 'Main Content', text: 'Here is the content.', order: 1 },
          ],
        };

        const result = VoiceInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('accepts input with overrides', () => {
        const input = {
          segments: [
            { id: 'hook', name: 'Hook', text: 'Welcome!', order: 0 },
          ],
          settingsOverride: {
            stability: 0.7,
            similarityBoost: 0.8,
          },
          speedOverride: 1.2,
        };

        const result = VoiceInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('rejects empty segments', () => {
        const input = {
          segments: [],
        };

        const result = VoiceInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('rejects speed override out of range', () => {
        const input = {
          segments: [
            { id: 'hook', name: 'Hook', text: 'Test', order: 0 },
          ],
          speedOverride: 3.0,
        };

        const result = VoiceInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('VoiceSettingsSchema', () => {
      it('uses default values', () => {
        const settings = {};
        const result = VoiceSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.stability).toBe(0.5);
          expect(result.data.similarityBoost).toBe(0.75);
          expect(result.data.style).toBe(0);
          expect(result.data.useSpeakerBoost).toBe(true);
        }
      });

      it('rejects values out of range', () => {
        const settings = {
          stability: 1.5,
        };
        const result = VoiceSettingsSchema.safeParse(settings);
        expect(result.success).toBe(false);
      });
    });

    describe('VoiceConfigSchema', () => {
      it('accepts valid config', () => {
        const config = {
          voiceId: 'voice-123',
          settings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0,
            useSpeakerBoost: true,
          },
        };

        const result = VoiceConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it('uses default values', () => {
        const config = {
          voiceId: 'voice-123',
          settings: {},
        };

        const result = VoiceConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.provider).toBe('elevenlabs');
          expect(result.data.modelId).toBe('eleven_multilingual_v2');
          expect(result.data.speed).toBe(1.0);
          expect(result.data.outputFormat).toBe('mp3_44100_128');
          expect(result.data.maxRetries).toBe(3);
        }
      });

      it('rejects invalid model', () => {
        const config = {
          voiceId: 'voice-123',
          modelId: 'invalid-model',
          settings: {},
        };

        const result = VoiceConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validate', () => {
    const context = createInitialRunContext({
      userId: 'test-user',
      projectId: 'test-project',
    });

    it('returns valid for correct input', () => {
      const input = {
        segments: [
          { id: 'hook', name: 'Hook', text: 'Welcome to the video!', order: 0 },
        ],
      };
      const config = {
        voiceId: 'voice-123',
        provider: 'elevenlabs' as const,
        modelId: 'eleven_multilingual_v2' as const,
        settings: { stability: 0.5, similarityBoost: 0.75, style: 0, useSpeakerBoost: true },
        speed: 1.0,
        pronunciationGuide: [],
        outputFormat: 'mp3_44100_128' as const,
        maxRetries: 3,
        retryDelayMs: 1000,
      };

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('errors on missing voiceId', () => {
      const input = {
        segments: [
          { id: 'hook', name: 'Hook', text: 'Test', order: 0 },
        ],
      };
      const config = {
        voiceId: '',
        provider: 'elevenlabs' as const,
        modelId: 'eleven_multilingual_v2' as const,
        settings: { stability: 0.5, similarityBoost: 0.75, style: 0, useSpeakerBoost: true },
        speed: 1.0,
        pronunciationGuide: [],
        outputFormat: 'mp3_44100_128' as const,
        maxRetries: 3,
        retryDelayMs: 1000,
      };

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'config.voiceId')).toBe(true);
    });

    it('warns on very long content', () => {
      const longText = 'x'.repeat(110000);
      const input = {
        segments: [
          { id: 'hook', name: 'Hook', text: longText, order: 0 },
        ],
      };
      const config = {
        voiceId: 'voice-123',
        provider: 'elevenlabs' as const,
        modelId: 'eleven_multilingual_v2' as const,
        settings: { stability: 0.5, similarityBoost: 0.75, style: 0, useSpeakerBoost: true },
        speed: 1.0,
        pronunciationGuide: [],
        outputFormat: 'mp3_44100_128' as const,
        maxRetries: 3,
        retryDelayMs: 1000,
      };

      const result = node.validate(input, config, context);
      expect(result.warnings.some(w => w.message.includes('Very long'))).toBe(true);
    });

    it('warns on empty segments', () => {
      const input = {
        segments: [
          { id: 'hook', name: 'Hook', text: 'Test', order: 0 },
          { id: 'empty', name: 'Empty', text: '   ', order: 1 },
        ],
      };
      const config = {
        voiceId: 'voice-123',
        provider: 'elevenlabs' as const,
        modelId: 'eleven_multilingual_v2' as const,
        settings: { stability: 0.5, similarityBoost: 0.75, style: 0, useSpeakerBoost: true },
        speed: 1.0,
        pronunciationGuide: [],
        outputFormat: 'mp3_44100_128' as const,
        maxRetries: 3,
        retryDelayMs: 1000,
      };

      const result = node.validate(input, config, context);
      expect(result.warnings.some(w => w.message.includes('empty segment'))).toBe(true);
    });
  });

  describe('estimateCost', () => {
    it('estimates cost based on character count', () => {
      const input = {
        segments: [
          { id: 'hook', name: 'Hook', text: 'A'.repeat(1000), order: 0 },
          { id: 'main', name: 'Main', text: 'B'.repeat(2000), order: 1 },
        ],
      };
      const config = {
        voiceId: 'voice-123',
        provider: 'elevenlabs' as const,
        modelId: 'eleven_multilingual_v2' as const,
        settings: { stability: 0.5, similarityBoost: 0.75, style: 0, useSpeakerBoost: true },
        speed: 1.0,
        pronunciationGuide: [],
        outputFormat: 'mp3_44100_128' as const,
        maxRetries: 3,
        retryDelayMs: 1000,
      };

      const cost = node.estimateCost(input, config);

      expect(cost.breakdown[0].units).toBe(3000);
      expect(cost.breakdown[0].service).toBe('elevenlabs');
      expect(cost.total).toBeCloseTo(0.9, 2); // 3000 chars * $0.30/1000
    });
  });
});

describe('applyPronunciationGuide', () => {
  it('replaces words with pronunciations', () => {
    const text = 'The API is great. Use the API wisely.';
    const guide = [
      { word: 'API', pronunciation: 'A.P.I.', caseSensitive: false },
    ];

    const result = applyPronunciationGuide(text, guide);
    expect(result).toBe('The A.P.I. is great. Use the A.P.I. wisely.');
  });

  it('respects case sensitivity', () => {
    const text = 'API api Api';
    const guide = [
      { word: 'API', pronunciation: 'A.P.I.', caseSensitive: true },
    ];

    const result = applyPronunciationGuide(text, guide);
    expect(result).toBe('A.P.I. api Api');
  });

  it('handles empty guide', () => {
    const text = 'Hello world';
    const result = applyPronunciationGuide(text, []);
    expect(result).toBe('Hello world');
  });

  it('only replaces whole words', () => {
    const text = 'The APIs and API are different';
    const guide = [
      { word: 'API', pronunciation: 'A.P.I.', caseSensitive: false },
    ];

    const result = applyPronunciationGuide(text, guide);
    expect(result).toBe('The APIs and A.P.I. are different');
  });
});

describe('preprocessTextForTTS', () => {
  it('normalizes whitespace', () => {
    const text = 'Hello   world\n\ntest';
    const result = preprocessTextForTTS(text, []);
    expect(result).toBe('Hello world test');
  });

  it('applies pronunciation guide', () => {
    const text = 'The API works';
    const guide = [
      { word: 'API', pronunciation: 'A.P.I.', caseSensitive: false },
    ];

    const result = preprocessTextForTTS(text, guide);
    expect(result).toContain('A.P.I.');
  });

  it('converts common abbreviations', () => {
    const text = 'The SQL database and AI model';
    const result = preprocessTextForTTS(text, []);
    expect(result).toContain('sequel');
    expect(result).toContain('A.I.');
  });
});

describe('splitTextForTTS', () => {
  it('returns single chunk for short text', () => {
    const text = 'This is a short text.';
    const result = splitTextForTTS(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it('splits long text at sentence boundaries', () => {
    const sentence = 'This is a test sentence. ';
    const text = sentence.repeat(100); // ~2500 chars
    const result = splitTextForTTS(text, 500);

    expect(result.length).toBeGreaterThan(1);
    // Each chunk should end with a sentence
    for (const chunk of result) {
      expect(chunk.endsWith('.')).toBe(true);
    }
  });

  it('respects max length', () => {
    const sentence = 'Short. ';
    const text = sentence.repeat(100);
    const maxLength = 100;
    const result = splitTextForTTS(text, maxLength);

    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(maxLength + 50); // Allow some overflow for sentence completion
    }
  });

  it('handles text without sentence boundaries', () => {
    const text = 'A'.repeat(100);
    const result = splitTextForTTS(text, 50);

    // Should still return the text even if it exceeds limit (no good split point)
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });
});
