'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useElementsStore } from '@/stores/elementsStore';
import { useRouter } from 'next/navigation';
import type { ElementType } from '@/types/database';

interface SaveToElementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string; // base64 data URL
  prompt?: string; // original prompt used
  aspectRatio?: string; // aspect ratio used for generation
}

type ElementTypeOption = {
  value: ElementType;
  label: string;
  description: string;
};

const ELEMENT_TYPE_OPTIONS: ElementTypeOption[] = [
  {
    value: 'other',
    label: 'Thumbnail',
    description: 'Ready to use in pipeline'
  },
  {
    value: 'prop',
    label: 'Style Reference',
    description: 'Use as generation reference'
  },
  {
    value: 'background',
    label: 'Background',
    description: 'For compositing'
  },
];

/**
 * Extract keywords from a prompt to auto-generate name and suggest tags
 */
function extractKeywords(prompt: string): string[] {
  // Common words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'it',
    'its', 'very', 'much', 'more', 'most', 'such', 'like', 'just',
    'youtube', 'thumbnail', 'image', 'picture', 'photo', 'style'
  ]);

  // Split by non-word characters and filter
  const words = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Return unique words
  return [...new Set(words)];
}

/**
 * Generate a name from prompt keywords
 */
function generateNameFromPrompt(prompt: string): string {
  const keywords = extractKeywords(prompt);
  if (keywords.length === 0) {
    return `Thumbnail ${new Date().toLocaleDateString()}`;
  }
  // Take first 3-4 keywords and capitalize
  const nameWords = keywords.slice(0, 4).map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  );
  return nameWords.join(' ');
}

export function SaveToElementsModal({
  isOpen,
  onClose,
  imageData,
  prompt = '',
  aspectRatio = '16:9',
}: SaveToElementsModalProps) {
  const router = useRouter();
  const uploadElement = useElementsStore((state) => state.uploadElement);
  const allTags = useElementsStore((state) => state.allTags);
  const fetchTags = useElementsStore((state) => state.fetchTags);

  const [name, setName] = useState('');
  const [type, setType] = useState<ElementType>('other');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedElementId, setSavedElementId] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate name and suggest tags from prompt
  const suggestedTags = useMemo(() => {
    return extractKeywords(prompt);
  }, [prompt]);

  // Filter tags for autocomplete
  const filteredSuggestions = useMemo(() => {
    const searchTerm = tagInput.toLowerCase().replace('@', '');
    if (!searchTerm) return [];

    // Combine existing tags and suggested keywords
    const allSuggestions = [...new Set([...allTags, ...suggestedTags])];

    return allSuggestions
      .filter(tag =>
        tag.toLowerCase().includes(searchTerm) &&
        !tags.includes(tag)
      )
      .slice(0, 6);
  }, [tagInput, allTags, suggestedTags, tags]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(prompt ? generateNameFromPrompt(prompt) : '');
      setType('other');
      setTags([]);
      setTagInput('');
      setError(null);
      setSuccess(false);
      setSavedElementId(null);
      setSaving(false);

      // Focus name input after animation
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);

      // Fetch available tags for autocomplete
      fetchTags();
    }
  }, [isOpen, prompt, fetchTags]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, saving]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !saving) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, saving]);

  // Convert base64 data URL to File
  const dataURLtoFile = useCallback((dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }, []);

  // Add tag
  const addTag = useCallback((tagName: string) => {
    const normalized = tagName.trim().toLowerCase().replace('@', '');
    if (normalized && !tags.includes(normalized)) {
      setTags(prev => [...prev, normalized]);
      setTagInput('');
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(0);
      tagInputRef.current?.focus();
    }
  }, [tags]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  }, []);

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showTagSuggestions && filteredSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          return;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          addTag(filteredSuggestions[selectedSuggestionIndex]);
          return;
        case 'Escape':
          e.preventDefault();
          setShowTagSuggestions(false);
          return;
      }
    }

    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }

    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Convert data URL to File
      const filename = `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      const file = dataURLtoFile(imageData, filename);

      // Prepare metadata
      const metadata: Record<string, unknown> = {
        generator: 'imagen-4',
        aspect_ratio: aspectRatio,
        generated_at: new Date().toISOString(),
      };

      if (prompt) {
        metadata.prompt = prompt;
      }

      // Upload element - need to pass metadata through the API
      // The uploadElement function uses FormData, so we need to handle this differently
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name.trim());
      formData.append('type', type);
      formData.append('tags', JSON.stringify(tags));
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('/api/elements', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || 'Failed to save element');
      }

      const { element } = await response.json();

      setSuccess(true);
      setSavedElementId(element.id);
    } catch (err) {
      console.error('Failed to save element:', err);
      setError(err instanceof Error ? err.message : 'Failed to save element');
    } finally {
      setSaving(false);
    }
  };

  // Handle view in elements
  const handleViewInElements = () => {
    router.push('/elements');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <h2>{success ? 'Saved to Elements' : 'Save to Elements'}</h2>
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {success ? (
            <div className="success-state">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="success-message">Element saved successfully!</p>
              <div className="success-preview">
                <img src={imageData} alt="Saved thumbnail" />
              </div>
              <div className="success-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={handleViewInElements}>
                  View in Elements
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Image Preview */}
              <div className="preview-section">
                <img src={imageData} alt="Preview" className="preview-image" />
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

              {/* Type Selection */}
              <div className="form-group">
                <label className="form-label">Type</label>
                <div className="type-options">
                  {ELEMENT_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`type-option ${type === option.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="element-type"
                        value={option.value}
                        checked={type === option.value}
                        onChange={(e) => setType(e.target.value as ElementType)}
                        disabled={saving}
                      />
                      <div className="type-option-content">
                        <span className="type-option-label">{option.label}</span>
                        <span className="type-option-desc">{option.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="form-group">
                <label className="form-label" htmlFor="element-name">Name *</label>
                <input
                  ref={nameInputRef}
                  id="element-name"
                  type="text"
                  className="form-input"
                  placeholder="Enter element name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>

              {/* Tags Input */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tags-input-container">
                  <div className="tags-input">
                    <div className="tags-list">
                      {tags.map((tag) => (
                        <span key={tag} className="tag">
                          @{tag}
                          <button
                            className="tag-remove"
                            onClick={() => removeTag(tag)}
                            disabled={saving}
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
                        ref={tagInputRef}
                        type="text"
                        className="tag-input"
                        placeholder={tags.length === 0 ? 'Add tags...' : ''}
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          setShowTagSuggestions(e.target.value.length > 0);
                          setSelectedSuggestionIndex(0);
                        }}
                        onKeyDown={handleTagKeyDown}
                        onFocus={() => tagInput && setShowTagSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* Tag Suggestions Dropdown */}
                  {showTagSuggestions && filteredSuggestions.length > 0 && (
                    <div className="tag-suggestions">
                      {filteredSuggestions.map((suggestion, index) => (
                        <div
                          key={suggestion}
                          className={`tag-suggestion ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                          onMouseDown={() => addTag(suggestion)}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          <span className="suggestion-at">@</span>
                          <span className="suggestion-name">{suggestion}</span>
                          {suggestedTags.includes(suggestion) && (
                            <span className="suggestion-badge">from prompt</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="form-hint">Press Enter to add a tag. Suggestions from prompt shown automatically.</p>
              </div>

              {/* Suggested Tags from Prompt */}
              {suggestedTags.length > 0 && tags.length === 0 && (
                <div className="suggested-tags">
                  <span className="suggested-label">Suggested:</span>
                  {suggestedTags.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      className="suggested-tag"
                      onClick={() => addTag(tag)}
                      disabled={saving}
                    >
                      @{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Metadata Preview */}
              <div className="metadata-preview">
                <div className="metadata-item">
                  <span className="metadata-label">Generator:</span>
                  <span className="metadata-value">Imagen 4.0</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Aspect Ratio:</span>
                  <span className="metadata-value">{aspectRatio}</span>
                </div>
                {prompt && (
                  <div className="metadata-item prompt">
                    <span className="metadata-label">Prompt:</span>
                    <span className="metadata-value">{prompt.length > 80 ? `${prompt.slice(0, 80)}...` : prompt}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!success && (
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? (
                <>
                  <span className="spinner-small" />
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        )}
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
          padding: 24px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
        }

        .btn-close {
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

        .btn-close:hover:not(:disabled) {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .btn-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-close :global(svg) {
          width: 18px;
          height: 18px;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .preview-section {
          margin-bottom: 20px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
        }

        .preview-image {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          display: block;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--status-error);
          font-size: 13px;
          margin-bottom: 16px;
        }

        .error-message :global(svg) {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--border-bright);
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 6px;
        }

        /* Type Selection */
        .type-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .type-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }

        .type-option:hover {
          border-color: var(--border-bright);
        }

        .type-option.selected {
          border-color: var(--node-thumbnail);
          background: rgba(34, 197, 94, 0.05);
        }

        .type-option input[type="radio"] {
          margin-top: 2px;
          accent-color: var(--node-thumbnail);
        }

        .type-option-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .type-option-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .type-option-desc {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Tags Input */
        .tags-input-container {
          position: relative;
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
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: var(--radius-sm);
          font-size: 12px;
          color: var(--node-script);
        }

        .tag-remove {
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--node-script);
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.15s ease;
        }

        .tag-remove:hover:not(:disabled) {
          opacity: 1;
        }

        .tag-remove :global(svg) {
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

        /* Tag Suggestions */
        .tag-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 100;
          margin-top: 4px;
          max-height: 200px;
          overflow-y: auto;
          background: var(--bg-surface);
          border: 1px solid var(--border-bright);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }

        .tag-suggestion {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .tag-suggestion:hover,
        .tag-suggestion.selected {
          background: var(--bg-hover);
        }

        .suggestion-at {
          color: var(--node-script);
          font-weight: 600;
        }

        .suggestion-name {
          color: var(--text-primary);
          font-size: 14px;
        }

        .suggestion-badge {
          margin-left: auto;
          font-size: 10px;
          color: var(--text-muted);
          background: var(--bg-elevated);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }

        /* Suggested Tags */
        .suggested-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          margin-bottom: 16px;
        }

        .suggested-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .suggested-tag {
          padding: 4px 10px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggested-tag:hover:not(:disabled) {
          border-color: var(--node-script);
          color: var(--node-script);
        }

        /* Metadata Preview */
        .metadata-preview {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }

        .metadata-item {
          display: flex;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .metadata-item:last-child {
          margin-bottom: 0;
        }

        .metadata-item.prompt {
          flex-direction: column;
          gap: 4px;
        }

        .metadata-label {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .metadata-value {
          color: var(--text-secondary);
        }

        .metadata-item.prompt .metadata-value {
          font-style: italic;
          line-height: 1.4;
        }

        /* Success State */
        .success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 0;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 50%;
          margin-bottom: 16px;
          color: var(--status-success);
        }

        .success-icon :global(svg) {
          width: 32px;
          height: 32px;
        }

        .success-message {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .success-preview {
          width: 100%;
          max-width: 300px;
          margin-bottom: 24px;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .success-preview img {
          width: 100%;
          display: block;
        }

        .success-actions {
          display: flex;
          gap: 12px;
        }

        /* Modal Footer */
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
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
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
          background: linear-gradient(135deg, var(--node-thumbnail), #16a34a);
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .btn-primary :global(svg) {
          width: 16px;
          height: 16px;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
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
