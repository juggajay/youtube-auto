import { deepMerge } from './merge';
import { getSystemDefaults } from './defaults';
import type { ResolvedConfig } from './types';
import type { ValidationResult } from '@/lib/nodes/base';

export type ConfigLevel = 'system' | 'user' | 'project' | 'template' | 'run';

export interface ConfigSource {
  level: ConfigLevel;
  config: Partial<ResolvedConfig>;
}

const LEVEL_ORDER: ConfigLevel[] = ['system', 'user', 'project', 'template', 'run'];

export function resolveConfig(sources: ConfigSource[]): ResolvedConfig {
  const sorted = [...sources].sort((a, b) =>
    LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  );

  const resolved = sorted.reduce(
    (acc, source) => deepMerge(acc, source.config as unknown as Record<string, unknown>),
    getSystemDefaults() as unknown as Record<string, unknown>
  ) as unknown as ResolvedConfig;

  const validation = validateResolvedConfig(resolved);
  if (!validation.valid) {
    throw new ConfigResolutionError(validation.errors);
  }

  return resolved;
}

function validateResolvedConfig(config: ResolvedConfig): ValidationResult {
  const errors: { field: string; message: string }[] = [];
  const warnings: { field: string; message: string }[] = [];

  // Voice: require voiceId if provider set
  if (config.voice.provider && !config.voice.voiceId) {
    errors.push({
      field: 'voice.voiceId',
      message: 'Voice ID required when provider is set'
    });
  }

  // Publish: require channel_id for YouTube
  if (config.publish.platform === 'youtube' && !config.publish.channel_id) {
    errors.push({
      field: 'publish.channel_id',
      message: 'YouTube channel ID required for publishing'
    });
  }

  // Warnings for missing optional fields
  if (!config.channelBible.channel_name) {
    warnings.push({
      field: 'channelBible.channel_name',
      message: 'Channel name not set'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export class ConfigResolutionError extends Error {
  constructor(public errors: { field: string; message: string }[]) {
    super(`Config resolution failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'ConfigResolutionError';
  }
}
