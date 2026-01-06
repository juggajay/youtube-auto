'use client';

import { useState, useRef, useCallback } from 'react';
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ElementUploadModal() {
  const closeUploadModal = useElementsStore((state) => state.closeUploadModal);
  const uploadElement = useElementsStore((state) => state.uploadElement);
  const uploadProgress = useElementsStore((state) => state.uploadProgress);
  const isLoading = useElementsStore((state) => state.isLoading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<ElementType>('logo');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));

    // Auto-fill name from filename
    if (!name) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(fileName);
    }
  }, [name]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

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

  const handleSubmit = async () => {
    if (!file || !name.trim()) {
      setError('Please provide a file and name');
      return;
    }

    try {
      await uploadElement(file, name.trim(), type, tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeUploadModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Upload Element</h2>
          <button className="modal-close" onClick={closeUploadModal} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Drop Zone */}
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
                <button
                  className="preview-change"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="drop-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="drop-text">
                  Drag & drop an image here, or <span>browse</span>
                </p>
                <p className="drop-hint">PNG, JPG, WEBP up to 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          {/* Name Input */}
          <div className="form-group">
            <label className="form-label">Name *</label>
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
            <p className="form-hint">Press Enter to add a tag</p>
          </div>

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeUploadModal} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!file || !name.trim() || isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload'}
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
          max-width: 480px;
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

        .drop-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .drop-zone:hover,
        .drop-zone.dragging {
          border-color: var(--border-bright);
          background: var(--bg-elevated);
        }

        .drop-zone.has-preview {
          padding: 12px;
        }

        .drop-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: var(--text-muted);
        }

        .drop-icon svg {
          width: 100%;
          height: 100%;
        }

        .drop-text {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .drop-text span {
          color: var(--node-trigger);
          text-decoration: underline;
        }

        .drop-hint {
          font-size: 12px;
          color: var(--text-muted);
        }

        .preview-container {
          position: relative;
        }

        .preview-image {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: var(--radius-md);
        }

        .preview-change {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 6px 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preview-change:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        .error-message {
          color: var(--status-error);
          font-size: 13px;
          margin-top: -12px;
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

        .form-hint {
          font-size: 12px;
          color: var(--text-muted);
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

        .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--bg-elevated);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--node-trigger), var(--node-script));
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: var(--text-muted);
          min-width: 36px;
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
