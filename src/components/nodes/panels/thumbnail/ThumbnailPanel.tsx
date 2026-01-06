'use client';

import { useState, useCallback } from 'react';
import { useNodeConfigStore, type ThumbnailNodeConfig, type ThumbnailSource, type ThumbnailAspectRatio, type ThumbnailMood } from '@/stores/nodeConfigStore';
import { ElementPicker } from '@/components/elements/ElementPicker';
import { MentionTextarea } from '@/components/ui/MentionTextarea';

interface Props {
  className?: string;
}

type TabId = 'source' | 'style';

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  {
    id: 'source',
    label: 'Source',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  {
    id: 'style',
    label: 'Style',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
  },
];

const SOURCE_OPTIONS: Array<{
  id: ThumbnailSource;
  title: string;
  description: string;
  cost: string;
}> = [
  {
    id: 'existing',
    title: 'Use existing element',
    description: 'Select a thumbnail you\'ve already created',
    cost: '$0'
  },
  {
    id: 'reference',
    title: 'Generate with references',
    description: 'Use @elements as references for AI generation',
    cost: '~$0.02'
  },
  {
    id: 'fresh',
    title: 'Generate fresh',
    description: 'Generate from prompt only (less consistent)',
    cost: '~$0.02'
  },
];

const ASPECT_RATIOS: Array<{
  id: ThumbnailAspectRatio;
  label: string;
  desc: string;
  width: number;
  height: number;
}> = [
  { id: '16:9', label: '16:9', desc: 'YouTube Standard', width: 160, height: 90 },
  { id: '1:1', label: '1:1', desc: 'Square', width: 90, height: 90 },
  { id: '9:16', label: '9:16', desc: 'Vertical/Shorts', width: 56, height: 100 },
];

const MOODS: Array<{ id: ThumbnailMood; label: string; desc: string }> = [
  { id: 'dramatic', label: 'Dramatic', desc: 'Bold, high contrast, attention-grabbing' },
  { id: 'playful', label: 'Playful', desc: 'Fun, colorful, energetic' },
  { id: 'professional', label: 'Professional', desc: 'Clean, business-like, trustworthy' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Simple, elegant, lots of whitespace' },
  { id: 'custom', label: 'Custom', desc: 'Define your own mood in the prompt' },
];

export function ThumbnailPanel({ className = '' }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('source');
  const { thumbnailConfig: config, updateThumbnailConfig } = useNodeConfigStore();

  const handleChange = useCallback(
    (updates: Partial<ThumbnailNodeConfig>) => {
      updateThumbnailConfig(updates);
    },
    [updateThumbnailConfig]
  );

  // Calculate estimated cost based on source mode
  const estimatedCost = config.source === 'existing' ? 0 : 0.02;

  const renderSourceTab = () => (
    <div className="source-tab space-y-6">
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">
          Thumbnail Source
        </h4>
        <p className="text-xs text-[var(--text-muted)]">
          Choose how to get your thumbnail
        </p>
      </div>

      {/* Source Mode Selection */}
      <div className="source-options space-y-3">
        {SOURCE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={`source-option flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
              config.source === option.id
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
            }`}
          >
            <input
              type="radio"
              name="source"
              className="sr-only"
              checked={config.source === option.id}
              onChange={() => handleChange({ source: option.id })}
            />
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                config.source === option.id
                  ? 'border-[var(--accent)]'
                  : 'border-[var(--text-muted)]'
              }`}
            >
              {config.source === option.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {option.title}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {option.cost}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {option.description}
              </span>
            </div>
          </label>
        ))}
      </div>

      {/* Conditional Content Based on Source Mode */}
      <div className="source-content mt-6">
        {config.source === 'existing' && (
          <div className="existing-element-section">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Select Thumbnail Element
            </label>
            <ElementPicker
              value={config.existingElementId}
              onChange={(id) => handleChange({ existingElementId: id || undefined })}
              placeholder="Choose an existing thumbnail..."
            />
            <p className="text-xs text-[var(--text-muted)] mt-2">
              No generation needed - zero cost
            </p>
          </div>
        )}

        {config.source === 'reference' && (
          <div className="reference-section">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Generation Prompt with References
            </label>
            <MentionTextarea
              value={config.prompt || ''}
              onChange={(value) => handleChange({ prompt: value })}
              placeholder="@host looking excited, showing @product, {title} as text overlay"
              rows={4}
            />
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Variables: <code className="px-1 py-0.5 bg-[var(--bg-elevated)] rounded">{'{title}'}</code> = video title, <code className="px-1 py-0.5 bg-[var(--bg-elevated)] rounded">{'{topic}'}</code> = topic
            </p>
          </div>
        )}

        {config.source === 'fresh' && (
          <div className="fresh-section">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Generation Prompt
            </label>
            <textarea
              value={config.prompt || ''}
              onChange={(e) => handleChange({ prompt: e.target.value })}
              placeholder="A vibrant YouTube thumbnail showing..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
            <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <svg
                className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xs text-amber-500">
                Without reference elements, AI-generated thumbnails may be inconsistent with your brand style.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="style-tab space-y-6">
      <div>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">
          Style Settings
        </h4>
        <p className="text-xs text-[var(--text-muted)]">
          Configure output format and mood
        </p>
      </div>

      {/* Aspect Ratio */}
      <div className="form-group">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              className={`aspect-ratio-btn flex flex-col items-center p-3 rounded-lg border transition-all ${
                config.aspectRatio === ratio.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
              }`}
              onClick={() => handleChange({ aspectRatio: ratio.id })}
            >
              {/* Visual Preview */}
              <div
                className="aspect-preview bg-[var(--border)] rounded mb-2 flex items-center justify-center"
                style={{
                  width: ratio.width * 0.6,
                  height: ratio.height * 0.6,
                }}
              >
                <span className="text-[8px] text-[var(--text-muted)]">{ratio.id}</span>
              </div>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {ratio.label}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {ratio.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="form-group">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
          Mood
        </label>
        <select
          value={config.mood || 'dramatic'}
          onChange={(e) => handleChange({ mood: e.target.value as ThumbnailMood })}
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          {MOODS.map((mood) => (
            <option key={mood.id} value={mood.id}>
              {mood.label}
            </option>
          ))}
        </select>
        {config.mood && (
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {MOODS.find(m => m.id === config.mood)?.desc}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className={`thumbnail-panel flex flex-col h-full bg-[var(--bg-primary)] border-l border-[var(--border)] ${className}`}>
      {/* Header */}
      <div className="panel-header flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--node-thumbnail)] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Thumbnail
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Configure thumbnail generation
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container flex border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={tab.icon}
              />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content flex-1 overflow-y-auto p-4">
        {activeTab === 'source' ? renderSourceTab() : renderStyleTab()}
      </div>

      {/* Footer */}
      <div className="panel-footer px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        {/* Cost Estimate */}
        <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-[var(--bg-elevated)]">
          <span className="text-xs text-[var(--text-muted)]">
            Estimated Cost
          </span>
          <span className={`text-sm font-semibold ${estimatedCost === 0 ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>
            ${estimatedCost.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            onClick={() => window.open('/thumbnails', '_blank')}
          >
            Test in Thumbnail Studio
          </button>
        </div>
      </div>
    </div>
  );
}
