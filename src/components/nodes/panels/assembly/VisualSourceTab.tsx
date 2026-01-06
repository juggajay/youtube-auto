'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const VISUAL_SOURCES = [
  {
    id: 'stock',
    label: 'Stock Footage',
    desc: 'Auto-matched from Pexels, Pixabay, etc.',
    icon: '🎬',
  },
  {
    id: 'ai-generated',
    label: 'AI Generated',
    desc: 'Create visuals from script descriptions',
    icon: '🤖',
  },
  {
    id: 'text-cards',
    label: 'Text Cards',
    desc: 'Animated text on backgrounds',
    icon: '📝',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    desc: 'Combine all sources intelligently',
    icon: '🎨',
  },
] as const;

const STOCK_PROVIDERS = [
  { id: 'pexels', label: 'Pexels', desc: 'Free, high quality' },
  { id: 'pixabay', label: 'Pixabay', desc: 'Free, large library' },
  { id: 'storyblocks', label: 'Storyblocks', desc: 'Premium, unlimited' },
] as const;

const AI_IMAGE_STYLES = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'illustration', label: 'Illustration' },
  { value: '3d-render', label: '3D Render' },
  { value: 'anime', label: 'Anime' },
] as const;

const TEXT_CARD_STYLES = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'gradient', label: 'Gradient Background' },
  { value: 'animated', label: 'Animated' },
  { value: 'kinetic', label: 'Kinetic Typography' },
] as const;

export function VisualSourceTab({ config, onChange }: Props) {
  return (
    <div className="visual-source-tab">
      <h4 className="tab-title">Visual Source</h4>
      <p className="tab-hint">Where should the video visuals come from?</p>

      <div className="source-grid">
        {VISUAL_SOURCES.map((source) => (
          <button
            key={source.id}
            className={`source-card ${config.visualSource === source.id ? 'selected' : ''}`}
            onClick={() => onChange({ visualSource: source.id as AssemblyNodeConfig['visualSource'] })}
          >
            <span className="source-icon">{source.icon}</span>
            <span className="source-label">{source.label}</span>
            <span className="source-desc">{source.desc}</span>
          </button>
        ))}
      </div>

      {/* Stock Provider */}
      {(config.visualSource === 'stock' || config.visualSource === 'mixed') && (
        <div className="form-group">
          <label className="form-label">Stock Provider</label>
          <div className="provider-options">
            {STOCK_PROVIDERS.map((provider) => (
              <label key={provider.id} className="radio-card">
                <input
                  type="radio"
                  name="stockProvider"
                  checked={config.stockProvider === provider.id}
                  onChange={() => onChange({ stockProvider: provider.id as AssemblyNodeConfig['stockProvider'] })}
                />
                <span className="provider-label">{provider.label}</span>
                <span className="provider-desc">{provider.desc}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* AI Image Style */}
      {(config.visualSource === 'ai-generated' || config.visualSource === 'mixed') && (
        <div className="form-group">
          <label className="form-label">AI Image Style</label>
          <select
            className="form-select"
            value={config.aiImageStyle}
            onChange={(e) => onChange({ aiImageStyle: e.target.value })}
          >
            {AI_IMAGE_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Text Card Style */}
      {(config.visualSource === 'text-cards' || config.visualSource === 'mixed') && (
        <div className="form-group">
          <label className="form-label">Text Card Style</label>
          <select
            className="form-select"
            value={config.textCardStyle}
            onChange={(e) => onChange({ textCardStyle: e.target.value })}
          >
            {TEXT_CARD_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
