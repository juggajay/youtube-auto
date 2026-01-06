'use client';

import { useState, useEffect } from 'react';
import { useElementsStore } from '@/stores/elementsStore';
import type { ElementType } from '@/types/database';

const ELEMENT_TYPES: { value: ElementType; label: string }[] = [
  { value: 'logo', label: 'Logo' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'background', label: 'Background' },
  { value: 'character', label: 'Character' },
  { value: 'prop', label: 'Prop' },
  { value: 'other', label: 'Other' },
];

export function ElementEditModal() {
  const selectedElement = useElementsStore((state) => state.selectedElement);
  const closeEditModal = useElementsStore((state) => state.closeEditModal);
  const updateElement = useElementsStore((state) => state.updateElement);
  const deleteElement = useElementsStore((state) => state.deleteElement);
  const isLoading = useElementsStore((state) => state.isLoading);

  const [name, setName] = useState('');
  const [type, setType] = useState<ElementType>('logo');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with selected element data
  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name);
      setType(selectedElement.type);
      setTags(selectedElement.tags);
    }
  }, [selectedElement]);

  if (!selectedElement) return null;

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().replace(/^@/, '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      await updateElement(selectedElement.id, {
        name: name.trim(),
        type,
        tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      await deleteElement(selectedElement.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setConfirmDelete(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="modal-overlay" onClick={closeEditModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Element</h2>
          <button className="modal-close" onClick={closeEditModal} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Image Preview */}
          <div className="image-preview">
            {selectedElement.thumbnail_url || selectedElement.url ? (
              <img src={selectedElement.thumbnail_url || selectedElement.url} alt={selectedElement.name} />
            ) : (
              <div className="preview-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          <div className="stats-row">
            <div className="stat">
              <span className="stat-label">Used</span>
              <span className="stat-value">{selectedElement.used_count} times</span>
            </div>
            <div className="stat">
              <span className="stat-label">Created</span>
              <span className="stat-value">{formatDate(selectedElement.created_at)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Size</span>
              <span className="stat-value">{formatFileSize(selectedElement.file_size_bytes)}</span>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          {/* Name Input */}
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter element name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Type Dropdown */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as ElementType)}
            >
              {ELEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Input */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tags-input">
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
                  placeholder={tags.length === 0 ? 'Add tags...' : ''}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddTag}
                />
              </div>
            </div>
          </div>

          {/* Delete Section */}
          <div className="danger-zone">
            <div className="danger-info">
              <h4>Delete Element</h4>
              <p>This action cannot be undone.</p>
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
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeEditModal} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 500px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .modal-close svg {
          width: 18px;
          height: 18px;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .image-preview {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: var(--bg-elevated);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .preview-placeholder svg {
          width: 64px;
          height: 64px;
          color: var(--text-muted);
        }

        .stats-row {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .error-message {
          color: var(--status-error);
          font-size: 13px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-input,
        .form-select {
          padding: 10px 14px;
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
        .form-select:focus {
          border-color: var(--border-bright);
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .form-select {
          cursor: pointer;
        }

        .tags-input {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 8px 10px;
          min-height: 44px;
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
          padding: 4px 8px;
          background: var(--bg-hover);
          border-radius: var(--radius-sm);
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
          min-width: 80px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          outline: none;
        }

        .tag-input::placeholder {
          color: var(--text-muted);
        }

        .danger-zone {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
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
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: transparent;
          border: 1px solid var(--status-error);
          border-radius: var(--radius-md);
          color: var(--status-error);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
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
        }

        .modal-footer .btn {
          padding: 10px 20px;
        }

        .modal-footer .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
