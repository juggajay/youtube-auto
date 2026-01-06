'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/db/client';
import type {
  TemplateInsert,
  ScriptNodeConfig,
  VoiceNodeConfig,
  ThumbnailNodeConfig,
  AssemblyNodeConfig,
  PublishNodeConfig,
} from '@/types/database';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (templateId: string) => void;
  // Current config state (passed from parent or store)
  archetypeId?: string;
  scriptConfig?: ScriptNodeConfig | null;
  voiceConfig?: VoiceNodeConfig | null;
  thumbnailConfig?: ThumbnailNodeConfig | null;
  assemblyConfig?: AssemblyNodeConfig | null;
  publishConfig?: PublishNodeConfig | null;
  interventions?: {
    reviewScript: boolean;
    reviewThumbnail: boolean;
    reviewBeforePublish: boolean;
  };
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  onSaved,
  archetypeId = 'custom',
  scriptConfig,
  voiceConfig,
  thumbnailConfig,
  assemblyConfig,
  publishConfig,
  interventions,
}: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const hasConfig = (config: unknown): boolean => {
    return config !== null && config !== undefined && Object.keys(config as object).length > 0;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const templateData: TemplateInsert = {
        user_id: '', // Will be set by RLS policy or trigger
        name: name.trim(),
        description: description.trim() || null,
        archetype_id: archetypeId,
        script_config: scriptConfig || null,
        voice_config: voiceConfig || null,
        thumbnail_config: thumbnailConfig || null,
        assembly_config: assemblyConfig || null,
        publish_config: publishConfig || null,
        default_review_script: interventions?.reviewScript ?? false,
        default_review_thumbnail: interventions?.reviewThumbnail ?? false,
        default_review_before_publish: interventions?.reviewBeforePublish ?? true,
      };

      const { data, error: saveError } = await supabase
        .from('templates')
        .insert(templateData)
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      if (data) {
        onSaved(data.id);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  if (!isOpen) return null;

  const configCount = [
    hasConfig(scriptConfig),
    hasConfig(voiceConfig),
    hasConfig(thumbnailConfig),
    hasConfig(assemblyConfig),
    hasConfig(publishConfig),
  ].filter(Boolean).length;

  return (
    <div className="modal-overlay">
      <div className="modal-content save-template-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>Save as Template</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

            <div className="form-group">
              <label htmlFor="template-name">Template Name *</label>
              <input
                ref={inputRef}
                id="template-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Tutorial Style"
                className="form-input"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="template-description">Description</label>
              <textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this template for?"
                rows={3}
                className="form-textarea"
                disabled={saving}
              />
            </div>

            <div className="config-preview">
              <h4>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Includes ({configCount} configurations)
              </h4>
              <ul className="config-list">
                {hasConfig(scriptConfig) && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Script configuration
                  </li>
                )}
                {hasConfig(voiceConfig) && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    Voice configuration
                  </li>
                )}
                {hasConfig(thumbnailConfig) && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Thumbnail configuration
                  </li>
                )}
                {hasConfig(assemblyConfig) && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                      <line x1="7" y1="2" x2="7" y2="22" />
                      <line x1="17" y1="2" x2="17" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                    Assembly configuration
                  </li>
                )}
                {hasConfig(publishConfig) && (
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      <line x1="12" y1="11" x2="12" y2="17" />
                      <polyline points="9 14 12 11 15 14" />
                    </svg>
                    Publish configuration
                  </li>
                )}
                {configCount === 0 && (
                  <li className="no-config">
                    No node configurations set. The template will save with default settings.
                  </li>
                )}
              </ul>

              {interventions && (
                <div className="intervention-preview">
                  <h5>Review Points</h5>
                  <div className="intervention-list">
                    <span className={interventions.reviewScript ? 'active' : ''}>
                      Script Review
                    </span>
                    <span className={interventions.reviewThumbnail ? 'active' : ''}>
                      Thumbnail Review
                    </span>
                    <span className={interventions.reviewBeforePublish ? 'active' : ''}>
                      Pre-Publish Review
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || saving}
            >
              {saving ? (
                <>
                  <span className="spinner-small" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </button>
          </div>
        </form>
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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .save-template-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 480px;
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

        .btn-close:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
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

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .form-input,
        .form-textarea {
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

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--border-bright);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: var(--text-muted);
        }

        .form-input:disabled,
        .form-textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .config-preview {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
        }

        .config-preview h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .config-preview h4 :global(svg) {
          width: 16px;
          height: 16px;
          color: var(--status-success);
        }

        .config-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .config-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          font-size: 13px;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border);
        }

        .config-list li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .config-list li :global(svg) {
          width: 14px;
          height: 14px;
          color: var(--text-muted);
        }

        .config-list li.no-config {
          color: var(--text-muted);
          font-style: italic;
        }

        .intervention-preview {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .intervention-preview h5 {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .intervention-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .intervention-list span {
          padding: 4px 10px;
          background: var(--bg-surface);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-muted);
        }

        .intervention-list span.active {
          background: rgba(34, 197, 94, 0.1);
          color: var(--status-success);
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
          background: linear-gradient(135deg, var(--node-publish), #cc0000);
          color: white;
          box-shadow: 0 2px 8px rgba(255, 0, 0, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
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
