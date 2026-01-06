# Type-Specific Intervention Modals

## Overview

Each intervention type gets its own specialized modal, NOT a generic modal with text.

## Components

```
src/components/intervention/
├── InterventionContainer.tsx   # Router to correct modal type
├── ScriptReviewModal.tsx       # Full script editor
├── ThumbnailReviewModal.tsx    # Image grid selector
├── PublishReviewModal.tsx      # Final confirmation
└── index.ts
```

## Task 1: InterventionContainer

```tsx
// src/components/intervention/InterventionContainer.tsx
'use client';

import { useRunStore } from '@/stores/runStore';
import { ScriptReviewModal } from './ScriptReviewModal';
import { ThumbnailReviewModal } from './ThumbnailReviewModal';
import { PublishReviewModal } from './PublishReviewModal';

export function InterventionContainer() {
  const { currentIntervention, dismissIntervention, respondToIntervention } = useRunStore();

  if (!currentIntervention) return null;

  const props = {
    intervention: currentIntervention,
    onDismiss: dismissIntervention,
    onRespond: respondToIntervention,
  };

  switch (currentIntervention.nodeType) {
    case 'script':
      return <ScriptReviewModal {...props} />;
    case 'thumbnail':
      return <ThumbnailReviewModal {...props} />;
    case 'publish':
      return <PublishReviewModal {...props} />;
    default:
      return null;
  }
}
```

## Task 2: ScriptReviewModal

Full editable script view with:
- Generated script in editable textarea
- Title options (radio select)
- Description preview
- Tags display
- Word count & duration estimate

```tsx
// src/components/intervention/ScriptReviewModal.tsx
'use client';

import { useState } from 'react';
import type { Intervention } from '@/types/database';

interface Props {
  intervention: Intervention & {
    generated_content: {
      script: string;
      titleOptions: string[];
      description: string;
      tags: string[];
      wordCount: number;
      estimatedDuration: string;
      hooks: string[];
    };
  };
  onDismiss: () => void;
  onRespond: (response: any) => void;
}

export function ScriptReviewModal({ intervention, onDismiss, onRespond }: Props) {
  const content = intervention.generated_content;

  const [editedScript, setEditedScript] = useState(content.script);
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [editedDescription, setEditedDescription] = useState(content.description);
  const [editedTags, setEditedTags] = useState(content.tags);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'script' | 'titles' | 'description' | 'tags'>('script');

  const wordCount = editedScript.split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = Math.round(wordCount / 150); // ~150 words per minute

  const handleApprove = () => {
    onRespond({
      action: 'approve',
      edits: {
        script: editedScript,
        selectedTitleIndex: selectedTitle,
        description: editedDescription,
        tags: editedTags,
      },
      notes,
    });
  };

  const handleRegenerate = () => {
    onRespond({
      action: 'regenerate',
      feedback: notes,
    });
  };

  return (
    <div className="modal-overlay intervention-modal">
      <div className="modal-content script-review-modal">
        <div className="modal-header">
          <h2>📝 Review Generated Script</h2>
          <button className="btn-icon" onClick={onDismiss}>×</button>
        </div>

        {/* Tab Navigation */}
        <div className="review-tabs">
          <button
            className={`tab ${activeTab === 'script' ? 'active' : ''}`}
            onClick={() => setActiveTab('script')}
          >
            Script
          </button>
          <button
            className={`tab ${activeTab === 'titles' ? 'active' : ''}`}
            onClick={() => setActiveTab('titles')}
          >
            Titles ({content.titleOptions.length})
          </button>
          <button
            className={`tab ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`tab ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            Tags ({editedTags.length})
          </button>
        </div>

        <div className="modal-body">
          {/* Script Tab */}
          {activeTab === 'script' && (
            <div className="script-tab">
              {/* Hook Options */}
              {content.hooks.length > 1 && (
                <div className="hooks-section">
                  <h4>Choose Opening Hook</h4>
                  <div className="hook-options">
                    {content.hooks.map((hook, i) => (
                      <label key={i} className="hook-option">
                        <input
                          type="radio"
                          name="hook"
                          checked={editedScript.startsWith(hook)}
                          onChange={() => {
                            // Replace first paragraph with selected hook
                            const rest = editedScript.split('\n\n').slice(1).join('\n\n');
                            setEditedScript(hook + '\n\n' + rest);
                          }}
                        />
                        <span className="hook-text">{hook}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Script Editor */}
              <div className="script-editor">
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={20}
                  className="script-textarea"
                />
                <div className="script-stats">
                  <span>{wordCount} words</span>
                  <span>~{estimatedMinutes} min read</span>
                </div>
              </div>
            </div>
          )}

          {/* Titles Tab */}
          {activeTab === 'titles' && (
            <div className="titles-tab">
              <h4>Select Video Title</h4>
              <div className="title-options">
                {content.titleOptions.map((title, i) => (
                  <label key={i} className={`title-option ${selectedTitle === i ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="title"
                      checked={selectedTitle === i}
                      onChange={() => setSelectedTitle(i)}
                    />
                    <span className="title-text">{title}</span>
                    <span className="title-length">{title.length} chars</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="description-tab">
              <h4>Video Description</h4>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={12}
                className="description-textarea"
              />
              <span className="char-count">{editedDescription.length}/5000</span>
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="tags-tab">
              <h4>Video Tags</h4>
              <div className="tags-editor">
                {editedTags.map((tag, i) => (
                  <span key={i} className="tag">
                    {tag}
                    <button onClick={() => setEditedTags(editedTags.filter((_, j) => j !== i))}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    setEditedTags([...editedTags, e.currentTarget.value.trim()]);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div className="notes-section">
            <label>Notes / Feedback</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any feedback for regeneration or notes for yourself..."
              rows={2}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleRegenerate}>
            🔄 Regenerate
          </button>
          <button className="btn btn-primary" onClick={handleApprove}>
            ✅ Approve & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Task 3: ThumbnailReviewModal

Grid of generated thumbnails with:
- Click to select
- Generate more button
- Open in Thumbnail Studio button

```tsx
// src/components/intervention/ThumbnailReviewModal.tsx
'use client';

import { useState } from 'react';
import type { Intervention } from '@/types/database';

interface Props {
  intervention: Intervention & {
    generated_content: {
      thumbnails: Array<{
        id: string;
        imageUrl: string;
        prompt: string;
      }>;
    };
  };
  onDismiss: () => void;
  onRespond: (response: any) => void;
}

export function ThumbnailReviewModal({ intervention, onDismiss, onRespond }: Props) {
  const content = intervention.generated_content;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleSelect = () => {
    if (!selectedId) return;

    onRespond({
      action: 'select',
      selectedThumbnailId: selectedId,
    });
  };

  const handleGenerateMore = async () => {
    setGenerating(true);
    onRespond({
      action: 'generate_more',
    });
  };

  const handleOpenStudio = () => {
    // Open thumbnail in full editor
    window.open(`/studio/thumbnail?intervention=${intervention.id}`, '_blank');
  };

  return (
    <div className="modal-overlay intervention-modal">
      <div className="modal-content thumbnail-review-modal">
        <div className="modal-header">
          <h2>🖼️ Choose Thumbnail</h2>
          <button className="btn-icon" onClick={onDismiss}>×</button>
        </div>

        <div className="modal-body">
          {/* Thumbnail Grid */}
          <div className="thumbnail-grid">
            {content.thumbnails.map((thumb) => (
              <div
                key={thumb.id}
                className={`thumbnail-option ${selectedId === thumb.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(thumb.id)}
              >
                <img src={thumb.imageUrl} alt="Generated thumbnail" />
                <button
                  className="zoom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedImage(thumb.imageUrl);
                  }}
                >
                  🔍
                </button>
                {selectedId === thumb.id && (
                  <div className="selected-badge">✓ Selected</div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="thumbnail-actions">
            <button
              className="btn btn-secondary"
              onClick={handleGenerateMore}
              disabled={generating}
            >
              {generating ? '⏳ Generating...' : '🎲 Generate More'}
            </button>
            <button className="btn btn-secondary" onClick={handleOpenStudio}>
              🎨 Open in Thumbnail Studio
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onDismiss}>
            Skip (Use First)
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSelect}
            disabled={!selectedId}
          >
            ✅ Use Selected
          </button>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div className="zoom-overlay" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="Zoomed thumbnail" />
        </div>
      )}
    </div>
  );
}
```

## Task 4: PublishReviewModal

Final confirmation with:
- Video player preview
- All metadata displayed
- Final visibility confirmation

```tsx
// src/components/intervention/PublishReviewModal.tsx
'use client';

import { useState } from 'react';
import type { Intervention } from '@/types/database';

interface Props {
  intervention: Intervention & {
    generated_content: {
      videoUrl: string;
      thumbnailUrl: string;
      title: string;
      description: string;
      tags: string[];
      visibility: string;
      scheduledTime?: string;
      channel: {
        name: string;
        thumbnail: string;
      };
      estimatedReach: string;
    };
  };
  onDismiss: () => void;
  onRespond: (response: any) => void;
}

export function PublishReviewModal({ intervention, onDismiss, onRespond }: Props) {
  const content = intervention.generated_content;
  const [visibility, setVisibility] = useState(content.visibility);
  const [confirmed, setConfirmed] = useState(false);

  const handlePublish = () => {
    if (!confirmed) return;

    onRespond({
      action: 'publish',
      visibility,
    });
  };

  const handleSaveDraft = () => {
    onRespond({
      action: 'save_draft',
    });
  };

  return (
    <div className="modal-overlay intervention-modal">
      <div className="modal-content publish-review-modal">
        <div className="modal-header">
          <h2>🚀 Ready to Publish</h2>
          <button className="btn-icon" onClick={onDismiss}>×</button>
        </div>

        <div className="modal-body">
          {/* Video Preview */}
          <div className="video-preview-section">
            <div className="video-player">
              <video src={content.videoUrl} controls poster={content.thumbnailUrl} />
            </div>
            <div className="thumbnail-preview">
              <img src={content.thumbnailUrl} alt="Thumbnail" />
            </div>
          </div>

          {/* Channel */}
          <div className="channel-section">
            <img src={content.channel.thumbnail} alt={content.channel.name} className="channel-avatar" />
            <span className="channel-name">{content.channel.name}</span>
          </div>

          {/* Metadata Summary */}
          <div className="metadata-summary">
            <div className="metadata-row">
              <label>Title</label>
              <span className="value">{content.title}</span>
            </div>
            <div className="metadata-row">
              <label>Description</label>
              <pre className="value description-preview">{content.description.slice(0, 200)}...</pre>
            </div>
            <div className="metadata-row">
              <label>Tags</label>
              <div className="tags-preview">
                {content.tags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
                {content.tags.length > 5 && (
                  <span className="more">+{content.tags.length - 5} more</span>
                )}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="visibility-section">
            <label>Visibility</label>
            <div className="visibility-options">
              {['public', 'unlisted', 'private'].map((vis) => (
                <button
                  key={vis}
                  className={`vis-btn ${visibility === vis ? 'selected' : ''}`}
                  onClick={() => setVisibility(vis)}
                >
                  {vis === 'public' && '🌍 Public'}
                  {vis === 'unlisted' && '🔗 Unlisted'}
                  {vis === 'private' && '🔒 Private'}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Time */}
          {content.scheduledTime && (
            <div className="schedule-info">
              <span className="schedule-icon">📅</span>
              <span>Scheduled for: {new Date(content.scheduledTime).toLocaleString()}</span>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="confirmation-section">
            <label className="checkbox-large">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                I confirm this video is ready to be published to YouTube
                {visibility === 'public' && ' and will be visible to everyone'}
              </span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleSaveDraft}>
            💾 Save as Draft
          </button>
          <button className="btn btn-secondary" onClick={onDismiss}>
            ← Go Back
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handlePublish}
            disabled={!confirmed}
          >
            🚀 Publish to YouTube
          </button>
        </div>
      </div>
    </div>
  );
}
```
