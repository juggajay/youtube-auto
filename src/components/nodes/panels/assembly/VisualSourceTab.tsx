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
  },
  {
    id: 'ai-generated',
    label: 'AI Generated',
    desc: 'Create visuals from script descriptions',
  },
  {
    id: 'text-cards',
    label: 'Text Cards',
    desc: 'Animated text on backgrounds',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    desc: 'Combine all sources intelligently',
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
    <div className="refined-panel">
      <div className="panel-section">
        <div className="panel-section-title">Visual Source</div>
        <p className="panel-section-subtitle">Where should the video visuals come from?</p>

        <div className="radio-options-grid">
          {VISUAL_SOURCES.map((source) => (
            <label
              key={source.id}
              className={`radio-option ${config.visualSource === source.id ? 'selected accent-assembly' : ''}`}
              onClick={() => onChange({ visualSource: source.id as AssemblyNodeConfig['visualSource'] })}
            >
              <div className="radio-option-indicator" />
              <div className="radio-option-content">
                <span className="radio-option-label">{source.label}</span>
                <span className="radio-option-description">{source.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Stock Provider */}
      {(config.visualSource === 'stock' || config.visualSource === 'mixed') && (
        <div className="panel-section">
          <div className="panel-section-title">Stock Provider</div>
          <div className="radio-options">
            {STOCK_PROVIDERS.map((provider) => (
              <label
                key={provider.id}
                className={`radio-option radio-option-compact ${config.stockProvider === provider.id ? 'selected accent-assembly' : ''}`}
                onClick={() => onChange({ stockProvider: provider.id as AssemblyNodeConfig['stockProvider'] })}
              >
                <div className="radio-option-indicator" />
                <div className="radio-option-content">
                  <span className="radio-option-label">{provider.label}</span>
                  <span className="radio-option-description">{provider.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* AI Image Style */}
      {(config.visualSource === 'ai-generated' || config.visualSource === 'mixed') && (
        <div className="panel-section">
          <div className="panel-section-title">AI Image Style</div>
          <select
            className="panel-select"
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
        <div className="panel-section">
          <div className="panel-section-title">Text Card Style</div>
          <select
            className="panel-select"
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
