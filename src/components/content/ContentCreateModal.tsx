'use client';

import { useState } from 'react';
import type { ContentType, ContentLibraryInsert } from '@/types/database';

interface ContentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<ContentLibraryInsert, 'user_id'>) => Promise<void>;
  defaultType?: ContentType;
}

const CONTENT_TYPES: { value: ContentType; label: string; description: string; color: string }[] = [
  { value: 'hook', label: 'Hook', description: 'Attention-grabbing opening lines', color: 'var(--node-script)' },
  { value: 'title', label: 'Title', description: 'Video title templates', color: 'var(--node-trigger)' },
  { value: 'description', label: 'Description', description: 'Video description snippets', color: 'var(--node-voice)' },
  { value: 'intro', label: 'Intro', description: 'Introduction scripts', color: 'var(--node-assembly)' },
  { value: 'cta', label: 'CTA', description: 'Call-to-action phrases', color: 'var(--node-publish)' },
  { value: 'outline', label: 'Outline', description: 'Video structure templates', color: 'var(--node-thumbnail)' },
  { value: 'script', label: 'Script', description: 'Full script templates', color: 'var(--status-running)' },
];

export function ContentCreateModal({
  isOpen,
  onClose,
  onCreate,
  defaultType = 'hook',
}: ContentCreateModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ContentType>(defaultType);
  const [contentText, setContentText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const selectedType = CONTENT_TYPES.find((t) => t.value === type) || CONTENT_TYPES[0];

  const resetForm = () => {
    setName('');
    setType(defaultType);
    setContentText('');
    setTagInput('');
    setTags([]);
    setError(null);
    setShowTypeDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().replace(/^@/, '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !contentText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onCreate({
        name: name.trim(),
        type,
        content: contentText.trim(),
        tags,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon" style={{ background: selectedType.color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className="modal-title">Create New Content</h2>
              <p className="modal-subtitle">Add reusable content to your library</p>
            </div>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Name Input */}
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Give your content a memorable name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type Selector */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="type-selector">
              <button
                type="button"
                className="type-trigger"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <span className="type-dot" style={{ background: selectedType.color }} />
                <span className="type-name">{selectedType.label}</span>
                <span className="type-desc">{selectedType.description}</span>
                <svg
                  className={`chevron ${showTypeDropdown ? 'open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showTypeDropdown && (
                <div className="type-dropdown">
                  {CONTENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`type-option ${type === t.value ? 'selected' : ''}`}
                      onClick={() => {
                        setType(t.value);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <span className="type-dot" style={{ background: t.color }} />
                      <div className="type-info">
                        <span className="type-name">{t.label}</span>
                        <span className="type-desc">{t.description}</span>
                      </div>
                      {type === t.value && (
                        <svg
                          className="check"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Textarea */}
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              className="form-textarea"
              placeholder={getPlaceholder(type)}
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={6}
            />
            <div className="textarea-footer">
              <span className="hint">
                Use {'{'}topic{'}'} and {'{'}audience{'}'} as dynamic placeholders
              </span>
              <span className="char-count">{contentText.length} chars</span>
            </div>
          </div>

          {/* Tags Input */}
          <div className="form-group">
            <label className="form-label">
              Tags
              <span className="label-hint">Optional - helps organize your library</span>
            </label>
            <div className="tags-input-container">
              <div className="tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    @{tag}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tag-input"
                  placeholder={tags.length === 0 ? 'Type and press Enter...' : ''}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddTag}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!name.trim() || !contentText.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Creating...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Content
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          width: 100%;
          max-width: 580px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid var(--border);
        }

        .header-content {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header-icon svg {
          width: 24px;
          height: 24px;
          stroke: white;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .modal-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }

        .modal-close {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .modal-close svg {
          width: 20px;
          height: 20px;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--status-error);
          font-size: 13px;
        }

        .error-message svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .label-hint {
          font-size: 11px;
          font-weight: 400;
          color: var(--text-muted);
        }

        .form-input,
        .form-textarea {
          padding: 12px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-textarea:focus {
          border-color: var(--border-bright);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: var(--text-muted);
        }

        .form-textarea {
          resize: vertical;
          min-height: 140px;
          line-height: 1.6;
        }

        .textarea-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }

        .hint {
          font-size: 11px;
          color: var(--text-muted);
        }

        .char-count {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Type Selector */
        .type-selector {
          position: relative;
        }

        .type-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .type-trigger:hover {
          border-color: var(--border-bright);
        }

        .type-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .type-name {
          font-weight: 500;
        }

        .type-desc {
          flex: 1;
          color: var(--text-muted);
          font-size: 12px;
          margin-left: 8px;
        }

        .chevron {
          width: 16px;
          height: 16px;
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .type-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 4px;
          z-index: 10;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: dropdownIn 0.15s ease;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .type-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .type-option:hover {
          background: var(--bg-hover);
        }

        .type-option.selected {
          background: rgba(168, 85, 247, 0.1);
        }

        .type-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .type-option .type-desc {
          margin-left: 0;
        }

        .check {
          width: 16px;
          height: 16px;
          color: var(--node-script);
        }

        /* Tags */
        .tags-input-container {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          min-height: 48px;
          transition: all 0.2s;
        }

        .tags-input-container:focus-within {
          border-color: var(--border-bright);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: 16px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .tag-remove {
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }

        .tag-remove:hover {
          color: var(--status-error);
        }

        .tag-remove svg {
          width: 10px;
          height: 10px;
        }

        .tag-input {
          flex: 1;
          min-width: 120px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          padding: 4px 0;
        }

        .tag-input::placeholder {
          color: var(--text-muted);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          background: var(--bg-elevated);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg-surface);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover:not(:disabled) {
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--node-script), #9333ea);
          color: white;
          box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);
        }

        .btn-primary svg {
          width: 16px;
          height: 16px;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function getPlaceholder(type: ContentType): string {
  switch (type) {
    case 'hook':
      return 'Example: "What if I told you that {topic} could change everything you know about {audience}?"';
    case 'title':
      return 'Example: "10 {topic} Secrets That Will Blow Your Mind"';
    case 'description':
      return 'Example: "In this video, we explore {topic} and discover..."';
    case 'intro':
      return 'Example: "Hey everyone, welcome back to the channel! Today we\'re diving deep into {topic}..."';
    case 'cta':
      return 'Example: "If you found this helpful, smash that like button and subscribe for more {topic} content!"';
    case 'outline':
      return 'Example:\n1. Introduction\n2. Problem statement\n3. Solution overview\n4. Deep dive\n5. Conclusion';
    case 'script':
      return 'Enter your full script template here...';
    default:
      return 'Enter your content...';
  }
}
