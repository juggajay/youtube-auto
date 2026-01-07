'use client';

import { useState, useCallback } from 'react';
import { useNodeConfigStore, type ThumbnailNodeConfig, type ThumbnailSource, type ThumbnailAspectRatio, type ThumbnailMood } from '@/stores/nodeConfigStore';
import { ElementPicker } from '@/components/elements/ElementPicker';
import { MentionTextarea } from '@/components/ui/MentionTextarea';

interface Props {
  className?: string;
}

type TabId = 'source' | 'style';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'source', label: 'Source' },
  { id: 'style', label: 'Style' },
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
}> = [
  { id: '16:9', label: '16:9', desc: 'Standard' },
  { id: '1:1', label: '1:1', desc: 'Square' },
  { id: '9:16', label: '9:16', desc: 'Vertical' },
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
    <div className="refined-panel">
      <div className="panel-section">
        <div className="panel-section-title">Thumbnail Source</div>
        <p className="panel-section-subtitle">Choose how to get your thumbnail</p>

        {/* Source Mode Selection */}
        <div className="radio-options">
          {SOURCE_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`radio-option ${config.source === option.id ? 'selected accent-thumbnail' : ''}`}
              onClick={() => handleChange({ source: option.id })}
            >
              <div className="radio-option-indicator" />
              <div className="radio-option-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="radio-option-label">{option.title}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{option.cost}</span>
                </div>
                <span className="radio-option-description">{option.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Conditional Content Based on Source Mode */}
      <div className="panel-section">
        {config.source === 'existing' && (
          <>
            <div className="panel-section-title">Select Element</div>
            <ElementPicker
              value={config.existingElementId}
              onChange={(id) => handleChange({ existingElementId: id || undefined })}
              placeholder="Choose an existing thumbnail..."
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              No generation needed - zero cost
            </p>
          </>
        )}

        {config.source === 'reference' && (
          <>
            <div className="panel-section-title">Prompt with References</div>
            <MentionTextarea
              value={config.prompt || ''}
              onChange={(value) => handleChange({ prompt: value })}
              placeholder="@host looking excited, showing @product, {title} as text overlay"
              rows={4}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Variables: <code style={{ padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: '4px' }}>{'{title}'}</code> = video title, <code style={{ padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: '4px' }}>{'{topic}'}</code> = topic
            </p>
          </>
        )}

        {config.source === 'fresh' && (
          <>
            <div className="panel-section-title">Generation Prompt</div>
            <textarea
              value={config.prompt || ''}
              onChange={(e) => handleChange({ prompt: e.target.value })}
              placeholder="A vibrant YouTube thumbnail showing..."
              rows={4}
              className="panel-textarea"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginTop: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
              <svg
                style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}
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
              <p style={{ fontSize: '12px', color: '#f59e0b', lineHeight: '1.5' }}>
                Without reference elements, AI-generated thumbnails may be inconsistent with your brand style.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="refined-panel">
      <div className="panel-section">
        <div className="panel-section-title">Aspect Ratio</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              className={`panel-btn ${config.aspectRatio === ratio.id ? 'panel-btn-primary' : 'panel-btn-secondary'}`}
              style={{
                flex: 1,
                flexDirection: 'column',
                padding: '12px 8px',
                gap: '4px',
                background: config.aspectRatio === ratio.id ? 'var(--node-thumbnail)' : undefined,
              }}
              onClick={() => handleChange({ aspectRatio: ratio.id })}
            >
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{ratio.label}</span>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{ratio.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Mood</div>
        <div className="panel-select-wrapper">
          <select
            value={config.mood || 'dramatic'}
            onChange={(e) => handleChange({ mood: e.target.value as ThumbnailMood })}
            className="panel-select"
          >
            {MOODS.map((mood) => (
              <option key={mood.id} value={mood.id}>
                {mood.label}
              </option>
            ))}
          </select>
        </div>
        {config.mood && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {MOODS.find(m => m.id === config.mood)?.desc}
          </p>
        )}
      </div>

      {/* Cost Estimate */}
      <div className="panel-section">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estimated Cost</span>
          <span style={{
            fontSize: '16px',
            fontWeight: 600,
            color: estimatedCost === 0 ? '#10b981' : 'var(--text-primary)',
          }}>
            ${estimatedCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-[var(--bg-surface)] ${className}`}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--node-thumbnail)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg
            style={{ width: '16px', height: '16px', color: 'white' }}
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
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Thumbnail
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Configure thumbnail generation
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: activeTab === tab.id ? 'var(--node-thumbnail)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--node-thumbnail)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'source' ? renderSourceTab() : renderStyleTab()}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
      }}>
        <button
          className="panel-btn panel-btn-secondary"
          style={{ width: '100%' }}
          onClick={() => window.open('/thumbnails', '_blank')}
        >
          Test in Thumbnail Studio
        </button>
      </div>
    </div>
  );
}
