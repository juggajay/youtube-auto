'use client';

import { useState, useEffect } from 'react';
import type { ContentItem, ContentType } from '@/types/database';

interface ContentEditModalProps {
  content: ContentItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; content: string; tags: string[] }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const TYPE_COLORS: Record<ContentType, string> = {
  hook: 'var(--node-script)',
  title: 'var(--node-trigger)',
  description: 'var(--node-voice)',
  intro: 'var(--node-assembly)',
  cta: 'var(--node-publish)',
  outline: 'var(--node-thumbnail)',
  script: 'var(--status-running)',
};

const TYPE_LABELS: Record<ContentType, string> = {
  hook: 'Hook',
  title: 'Title',
  description: 'Description',
  intro: 'Intro',
  cta: 'CTA',
  outline: 'Outline',
  script: 'Script',
};

export function ContentEditModal({
  content,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: ContentEditModalProps) {
  const [name, setName] = useState('');
  const [contentText, setContentText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with content data
  useEffect(() => {
    if (content && isOpen) {
      setName(content.name);
      setContentText(content.content);
      setTags(content.tags);
      setTagInput('');
      setError(null);
      setConfirmDelete(false);
    }
  }, [content, isOpen]);

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

  const handleSave = async () => {
    if (!name.trim() || !contentText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSave(content.id, {
        name: name.trim(),
        content: contentText.trim(),
        tags,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    if (!onDelete) return;

    setIsLoading(true);
    setError(null);

    try {
      await onDelete(content.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setConfirmDelete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-left">
            <span
              className="type-indicator"
              style={{ background: TYPE_COLORS[content.type] }}
            />
            <h2 className="modal-title">Edit {TYPE_LABELS[content.type]}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat">
              <span className="stat-label">Type</span>
              <span
                className="stat-value type-badge"
                style={{ background: TYPE_COLORS[content.type] }}
              >
                {TYPE_LABELS[content.type]}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Used</span>
              <span className="stat-value">{content.used_count} times</span>
            </div>
            <div className="stat">
              <span className="stat-label">Created</span>
              <span className="stat-value">{formatDate(content.created_at)}</span>
            </div>
          </div>

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
              placeholder="Enter a descriptive name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Content Textarea */}
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              className="form-textarea"
              placeholder="Enter the content..."
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={6}
            />
            <div className="char-count">{contentText.length} characters</div>
          </div>

          {/* Tags Input */}
          <div className="form-group">
            <label className="form-label">
              Tags
              <span className="label-hint">Press Enter to add</span>
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
                  placeholder={tags.length === 0 ? 'Add tags for easy reference...' : ''}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddTag}
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {onDelete && (
            <div className="danger-zone">
              <div className="danger-info">
                <h4>Delete Content</h4>
                <p>This action cannot be undone. The content will be permanently removed.</p>
              </div>
              <button
                className={`btn btn-danger ${confirmDelete ? 'confirm' : ''}`}
                onClick={handleDelete}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {confirmDelete ? 'Click again to confirm' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || !contentText.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Saving...
              </>
            ) : (
              'Save Changes'
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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal {
          width: 100%;
          max-width: 560px;
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
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .type-indicator {
          width: 4px;
          height: 24px;
          border-radius: 2px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
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

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .stat-value.type-badge {
          display: inline-flex;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
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
          min-height: 120px;
          line-height: 1.6;
        }

        .char-count {
          font-size: 11px;
          color: var(--text-muted);
          text-align: right;
          margin-top: 4px;
        }

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

        .danger-zone {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: var(--radius-md);
          margin-top: 8px;
        }

        .danger-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .danger-info p {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: transparent;
          border: 1px solid var(--status-error);
          border-radius: var(--radius-md);
          color: var(--status-error);
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .btn-danger.confirm {
          background: var(--status-error);
          color: white;
        }

        .btn-danger svg {
          width: 14px;
          height: 14px;
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

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
