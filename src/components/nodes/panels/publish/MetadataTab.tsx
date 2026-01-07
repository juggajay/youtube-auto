'use client';

import { useState } from 'react';
import type { PublishNodeConfig } from '@/stores/nodeConfigStore';

interface Props {
  config: PublishNodeConfig;
  onChange: (updates: Partial<PublishNodeConfig>) => void;
}

const DESCRIPTION_VARIABLES = [
  { key: '{{video_title}}', label: 'Title' },
  { key: '{{channel_name}}', label: 'Channel' },
  { key: '{{timestamps}}', label: 'Timestamps' },
  { key: '{{social_links}}', label: 'Socials' },
  { key: '{{affiliate_links}}', label: 'Affiliates' },
];

const TITLE_OPTIONS = [
  {
    id: 'generated' as const,
    label: 'Use AI-generated title',
    description: 'Title from script generation',
  },
  {
    id: 'override' as const,
    label: 'Custom title',
    description: 'Enter your own title',
  },
];

export function MetadataTab({ config, onChange }: Props) {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !config.tags.includes(tag) && config.tags.length < config.maxTags) {
      onChange({ tags: [...config.tags, tag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange({ tags: config.tags.filter((t) => t !== tagToRemove) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const insertVariable = (variable: string) => {
    const template = config.descriptionTemplate || '';
    onChange({ descriptionTemplate: template + (template ? ' ' : '') + variable });
  };

  return (
    <div className="metadata-tab">
      {/* Title Source */}
      <div className="panel-section">
        <div className="panel-section-title">Title</div>
        <div className="radio-options">
          {TITLE_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`radio-option radio-option-compact accent-publish ${config.titleSource === option.id ? 'selected' : ''}`}
              onClick={() => onChange({ titleSource: option.id })}
            >
              <div className="radio-option-indicator" />
              <div className="radio-option-content">
                <div className="radio-option-label">{option.label}</div>
                <div className="radio-option-description">{option.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Title Input */}
        {config.titleSource === 'override' && (
          <div className="title-input-wrapper">
            <input
              type="text"
              className="panel-input"
              value={config.titleOverride || ''}
              onChange={(e) => onChange({ titleOverride: e.target.value })}
              placeholder="Enter video title..."
              maxLength={100}
            />
            <span className="char-counter">
              {(config.titleOverride?.length || 0)}/100
            </span>
          </div>
        )}
      </div>

      {/* Description Template */}
      <div className="panel-section">
        <div className="panel-section-title">Description Template</div>
        <textarea
          className="panel-textarea"
          value={config.descriptionTemplate}
          onChange={(e) => onChange({ descriptionTemplate: e.target.value })}
          rows={6}
          placeholder="Enter description template..."
        />
        <div className="variable-buttons">
          <span className="variable-label">Insert:</span>
          {DESCRIPTION_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              className="variable-btn"
              onClick={() => insertVariable(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="panel-section">
        <div className="panel-section-title">Tags</div>

        {/* Auto-generate toggle */}
        <div className="toggle-row">
          <div className="toggle-row-content">
            <div className="toggle-row-label">Auto-generate tags</div>
            <div className="toggle-row-description">AI generates tags from content</div>
          </div>
          <label className="toggle-switch accent-publish">
            <input
              type="checkbox"
              checked={config.autoGenerateTags}
              onChange={(e) => onChange({ autoGenerateTags: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>

        {/* Tag Input */}
        <div className="tag-input-row">
          <input
            type="text"
            className="panel-input panel-input-sm"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag..."
          />
          <button
            type="button"
            className="add-tag-btn"
            onClick={addTag}
            disabled={!newTag.trim() || config.tags.length >= config.maxTags}
          >
            Add
          </button>
        </div>

        {/* Tags Display */}
        {config.tags.length > 0 && (
          <div className="tags-container">
            {config.tags.map((tag) => (
              <span key={tag} className="panel-badge panel-badge-publish">
                {tag}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tag Counter */}
        <div className="tag-counter">
          {config.tags.length}/{config.maxTags} tags
        </div>
      </div>

      <style jsx>{`
        .metadata-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .title-input-wrapper {
          position: relative;
          margin-top: 12px;
        }

        .char-counter {
          position: absolute;
          right: 12px;
          bottom: 10px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .variable-buttons {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .variable-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-right: 4px;
        }

        .variable-btn {
          padding: 4px 10px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .variable-btn:hover {
          border-color: var(--node-publish);
          color: var(--node-publish);
          background: rgba(255, 0, 0, 0.06);
        }

        .tag-input-row {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .tag-input-row .panel-input {
          flex: 1;
        }

        .add-tag-btn {
          padding: 8px 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-tag-btn:hover:not(:disabled) {
          border-color: var(--node-publish);
          color: var(--node-publish);
        }

        .add-tag-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }

        .tag-remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 4px;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.15s ease;
        }

        .tag-remove:hover {
          opacity: 1;
        }

        .tag-counter {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
