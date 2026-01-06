'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/db/client';
import type { Template } from '@/types/database';

interface LoadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (template: Template) => void;
}

const ARCHETYPE_INFO: Record<string, { label: string; color: string }> = {
  tutorial: { label: 'Tutorial', color: 'var(--node-voice)' },
  listicle: { label: 'Listicle', color: 'var(--node-script)' },
  story: { label: 'Story', color: 'var(--node-thumbnail)' },
  review: { label: 'Review', color: 'var(--status-warning)' },
  vlog: { label: 'Vlog', color: 'var(--node-assembly)' },
  news: { label: 'News', color: 'var(--node-trigger)' },
  shorts: { label: 'Shorts', color: 'var(--node-publish)' },
  custom: { label: 'Custom', color: 'var(--text-muted)' },
};

export function LoadTemplateModal({
  isOpen,
  onClose,
  onLoad,
}: LoadTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('use_count', { ascending: false });

    if (error) {
      console.error('Failed to fetch templates:', error);
    }

    setTemplates(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSelectedId(null);
      setSearch('');
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [isOpen, fetchTemplates]);

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

  const handleLoad = async () => {
    if (!selectedId) return;

    const template = templates.find((t) => t.id === selectedId);
    if (!template) return;

    setLoadingTemplate(true);

    try {
      // Increment use count
      const supabase = createClient();
      await supabase
        .from('templates')
        .update({ use_count: template.use_count + 1 })
        .eq('id', selectedId);

      onLoad(template);
      onClose();
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const favoriteTemplates = filteredTemplates.filter((t) => t.is_favorite);
  const regularTemplates = filteredTemplates.filter((t) => !t.is_favorite);

  const hasConfig = (config: unknown): boolean => {
    return config !== null && config !== undefined && Object.keys(config as object).length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content load-template-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>Load Template</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <p>No templates saved yet.</p>
              <span>Create your first template to reuse pipeline configurations.</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No templates match your search.</p>
              <span>Try a different search term.</span>
            </div>
          ) : (
            <div className="template-list">
              {/* Favorites */}
              {favoriteTemplates.length > 0 && (
                <div className="template-section">
                  <h3 className="section-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Favorites
                  </h3>
                  {favoriteTemplates.map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      isSelected={selectedId === template.id}
                      onClick={() => setSelectedId(template.id)}
                      onDoubleClick={() => {
                        setSelectedId(template.id);
                        handleLoad();
                      }}
                      hasConfig={hasConfig}
                    />
                  ))}
                </div>
              )}

              {/* Regular templates */}
              {regularTemplates.length > 0 && (
                <div className="template-section">
                  {favoriteTemplates.length > 0 && (
                    <h3 className="section-title">All Templates</h3>
                  )}
                  {regularTemplates.map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      isSelected={selectedId === template.id}
                      onClick={() => setSelectedId(template.id)}
                      onDoubleClick={() => {
                        setSelectedId(template.id);
                        handleLoad();
                      }}
                      hasConfig={hasConfig}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loadingTemplate}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleLoad}
            disabled={!selectedId || loadingTemplate}
          >
            {loadingTemplate ? (
              <>
                <span className="spinner-small" />
                Loading...
              </>
            ) : (
              'Load Template'
            )}
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

        .load-template-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
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

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
        }

        .search-bar :global(svg) {
          width: 18px;
          height: 18px;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          min-height: 200px;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-state :global(svg) {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state p {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .empty-state span {
          font-size: 13px;
        }

        .template-list {
          padding: 8px 0;
        }

        .template-section {
          padding: 0 12px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          padding: 12px 12px 8px;
        }

        .section-title :global(svg) {
          color: var(--status-warning);
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

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--node-thumbnail);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
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

// Separate component for template item to avoid inline style complexity
function TemplateItem({
  template,
  isSelected,
  onClick,
  onDoubleClick,
  hasConfig,
}: {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  hasConfig: (config: unknown) => boolean;
}) {
  const archetype = ARCHETYPE_INFO[template.archetype_id] || ARCHETYPE_INFO.custom;

  const configCount = [
    hasConfig(template.script_config),
    hasConfig(template.voice_config),
    hasConfig(template.thumbnail_config),
    hasConfig(template.assembly_config),
    hasConfig(template.publish_config),
  ].filter(Boolean).length;

  return (
    <div
      className={`template-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="template-item-header">
        <div className="template-item-info">
          <h4>{template.name}</h4>
          {template.description && <p>{template.description}</p>}
        </div>
        <div className="template-item-meta">
          <span
            className="archetype-badge"
            style={{ background: archetype.color }}
          >
            {archetype.label}
          </span>
          <span className="use-count">{template.use_count} uses</span>
        </div>
      </div>
      {configCount > 0 && (
        <div className="template-item-configs">
          {configCount} node configuration{configCount !== 1 ? 's' : ''}
        </div>
      )}

      <style jsx>{`
        .template-item {
          padding: 14px 16px;
          margin: 0 4px 4px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }

        .template-item:hover {
          background: var(--bg-hover);
        }

        .template-item.selected {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
        }

        .template-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .template-item-info {
          flex: 1;
          min-width: 0;
        }

        .template-item-info h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .template-item-info p {
          font-size: 12px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .template-item-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .archetype-badge {
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .use-count {
          font-size: 11px;
          color: var(--text-muted);
        }

        .template-item-configs {
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
