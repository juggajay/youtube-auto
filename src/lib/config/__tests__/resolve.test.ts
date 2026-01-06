import { describe, it, expect } from 'vitest';
import { resolveConfig, ConfigResolutionError } from '../resolve';
import type { ConfigSource } from '../resolve';
import type { ResolvedConfig } from '../types';

describe('resolveConfig', () => {
  // Helper to create valid config sources with proper typing
  const validProjectConfig: ConfigSource = {
    level: 'project',
    config: {
      voice: { voiceId: 'valid-voice-id' },
      publish: { channel_id: 'valid-channel-id' },
    } as Partial<ResolvedConfig>,
  };

  it('returns system defaults when only valid overrides provided', () => {
    const result = resolveConfig([validProjectConfig]);
    expect(result.voice.speed).toBe(1.0);
    expect(result.intervention.nodes.publish).toBe('always_review');
  });

  it('merges sources in level order', () => {
    const sources: ConfigSource[] = [
      { level: 'project', config: { voice: { speed: 1.2, voiceId: 'test' }, publish: { channel_id: 'test' } } as Partial<ResolvedConfig> },
      { level: 'user', config: { voice: { speed: 1.1 } } as Partial<ResolvedConfig> },
    ];
    const result = resolveConfig(sources);
    expect(result.voice.speed).toBe(1.2);
  });

  it('run level overrides all others', () => {
    const sources: ConfigSource[] = [
      { level: 'system', config: { voice: { speed: 1.0 } } as Partial<ResolvedConfig> },
      { level: 'user', config: { voice: { speed: 1.1 } } as Partial<ResolvedConfig> },
      { level: 'project', config: { voice: { speed: 1.2, voiceId: 'test' }, publish: { channel_id: 'test' } } as Partial<ResolvedConfig> },
      { level: 'run', config: { voice: { speed: 1.5 } } as Partial<ResolvedConfig> },
    ];
    const result = resolveConfig(sources);
    expect(result.voice.speed).toBe(1.5);
  });

  it('throws ConfigResolutionError when required fields missing', () => {
    const sources: ConfigSource[] = [
      {
        level: 'project',
        config: {
          voice: { provider: 'elevenlabs', voiceId: '' },
        } as Partial<ResolvedConfig>,
      },
    ];

    expect(() => resolveConfig(sources)).toThrow(ConfigResolutionError);
  });
});
