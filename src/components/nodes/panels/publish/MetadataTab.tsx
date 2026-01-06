'use client';

import { useState } from 'react';
import type { PublishPanelConfig } from '@/types/nodes/publish';

interface Props {
  config: PublishPanelConfig;
  onChange: (updates: Partial<PublishPanelConfig>) => void;
}

const DESCRIPTION_VARIABLES = [
  { key: '{{video_title}}', desc: 'Video title' },
  { key: '{{channel_name}}', desc: 'Channel name' },
  { key: '{{timestamps}}', desc: 'Auto-generated timestamps' },
  { key: '{{social_links}}', desc: 'Your social media links' },
  { key: '{{affiliate_links}}', desc: 'Affiliate links section' },
];

export function MetadataTab({ config, onChange }: Props) {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !config.tags.includes(newTag.trim())) {
      onChange({ tags: [...config.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    onChange({ tags: config.tags.filter(t => t !== tag) });
  };

  return (
    <div className="metadata-tab">
      <h4>Video Metadata</h4>

      {/* Title */}
      <div className="form-group">
        <label>Title</label>
        <div className="title-source">
          <label className="radio-inline">
            <input
              type="radio"
              checked={config.titleSource === 'generated'}
              onChange={() => onChange({ titleSource: 'generated' })}
            />
            Use AI-generated title
          </label>
          <label className="radio-inline">
            <input
              type="radio"
              checked={config.titleSource === 'override'}
              onChange={() => onChange({ titleSource: 'override' })}
            />
            Custom title
          </label>
        </div>
        {config.titleSource === 'override' && (
          <input
            type="text"
            value={config.titleOverride || ''}
            onChange={(e) => onChange({ titleOverride: e.target.value })}
            placeholder="Enter custom title..."
            maxLength={100}
          />
        )}
        <span className="char-count">
          {(config.titleOverride?.length || 0)}/100
        </span>
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description Template</label>
        <textarea
          value={config.descriptionTemplate}
          onChange={(e) => onChange({ descriptionTemplate: e.target.value })}
          rows={8}
          placeholder="Enter description template..."
        />
        <div className="variable-chips">
          <span className="hint">Insert variable:</span>
          {DESCRIPTION_VARIABLES.map((v) => (
            <button
              key={v.key}
              className="variable-chip"
              onClick={() => onChange({
                descriptionTemplate: config.descriptionTemplate + ' ' + v.key
              })}
              title={v.desc}
            >
              {v.key}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="form-group">
        <label>Tags</label>
        <div className="tags-section">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.autoGenerateTags}
              onChange={(e) => onChange({ autoGenerateTags: e.target.checked })}
            />
            <span>Auto-generate tags from content</span>
          </label>

          <div className="tags-list">
            {config.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => removeTag(tag)}>x</button>
              </span>
            ))}
          </div>

          <div className="add-tag">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
          </div>

          <div className="tag-count">
            {config.tags.length}/{config.maxTags} tags
          </div>
        </div>
      </div>
    </div>
  );
}
