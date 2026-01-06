'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Template } from '@/types/database';

interface TemplateCardProps {
  template: Template;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
}

const ARCHETYPE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  tutorial: { icon: 'book', label: 'Tutorial', color: 'var(--node-voice)' },
  listicle: { icon: 'list', label: 'Listicle', color: 'var(--node-script)' },
  story: { icon: 'book-open', label: 'Story', color: 'var(--node-thumbnail)' },
  review: { icon: 'star', label: 'Review', color: 'var(--status-warning)' },
  vlog: { icon: 'video', label: 'Vlog', color: 'var(--node-assembly)' },
  news: { icon: 'newspaper', label: 'News', color: 'var(--node-trigger)' },
  shorts: { icon: 'smartphone', label: 'Shorts', color: 'var(--node-publish)' },
  custom: { icon: 'settings', label: 'Custom', color: 'var(--text-muted)' },
};

function getArchetypeIcon(archetype: string) {
  const info = ARCHETYPE_INFO[archetype] || ARCHETYPE_INFO.custom;

  switch (info.icon) {
    case 'book':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'list':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      );
    case 'book-open':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'video':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case 'newspaper':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'smartphone':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}

export function TemplateCard({
  template,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: TemplateCardProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const archetype = ARCHETYPE_INFO[template.archetype_id] || ARCHETYPE_INFO.custom;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setConfirmDelete(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleUse = () => {
    // Navigate to new run with template pre-loaded
    router.push(`/runs/new?template=${template.id}`);
  };

  const handleEdit = () => {
    router.push(`/templates/${template.id}/edit`);
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
      setShowDropdown(false);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const hasConfig = (config: unknown): boolean => {
    return config !== null && config !== undefined && Object.keys(config as object).length > 0;
  };

  return (
    <div className="template-card">
      <div className="card-header">
        <div className="archetype-icon" style={{ background: archetype.color }}>
          {getArchetypeIcon(template.archetype_id)}
        </div>
        <div className="card-header-content">
          <h3 className="template-name">{template.name}</h3>
          <span className="archetype-label">{archetype.label}</span>
        </div>
        <button
          className={`favorite-btn ${template.is_favorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {template.is_favorite ? (
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}
        </button>
      </div>

      {template.description && (
        <p className="template-description">{template.description}</p>
      )}

      {/* Config Summary */}
      <div className="config-summary">
        {hasConfig(template.script_config) && (
          <span className="config-badge" title="Script configuration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Script
          </span>
        )}
        {hasConfig(template.voice_config) && (
          <span className="config-badge" title="Voice configuration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Voice
          </span>
        )}
        {hasConfig(template.thumbnail_config) && (
          <span className="config-badge" title="Thumbnail configuration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Thumbnail
          </span>
        )}
        {hasConfig(template.assembly_config) && (
          <span className="config-badge" title="Assembly configuration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            Assembly
          </span>
        )}
        {hasConfig(template.publish_config) && (
          <span className="config-badge" title="Publish configuration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <polyline points="9 14 12 11 15 14" />
            </svg>
            Publish
          </span>
        )}
      </div>

      {/* Review Points */}
      <div className="review-points">
        {template.default_review_script && (
          <span className="review-badge">Review Script</span>
        )}
        {template.default_review_thumbnail && (
          <span className="review-badge">Review Thumbnail</span>
        )}
        {template.default_review_before_publish && (
          <span className="review-badge">Review Before Publish</span>
        )}
      </div>

      {/* Usage Count */}
      <div className="template-meta">
        <span className="use-count">
          Used {template.use_count} {template.use_count === 1 ? 'time' : 'times'}
        </span>
      </div>

      <div className="card-actions">
        <button className="btn btn-primary" onClick={handleUse}>
          Use Template
        </button>
        <button className="btn btn-secondary" onClick={handleEdit}>
          Edit
        </button>
        <div className="dropdown" ref={dropdownRef}>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
              setConfirmDelete(false);
            }}
            aria-label="More options"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                  setShowDropdown(false);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Duplicate
              </button>
              <button
                className={confirmDelete ? 'danger confirm' : 'danger'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {confirmDelete ? 'Confirm Delete' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .template-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .template-card:hover {
          border-color: var(--border-bright);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .archetype-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .archetype-icon :global(svg) {
          width: 20px;
          height: 20px;
          stroke: white;
        }

        .card-header-content {
          flex: 1;
          min-width: 0;
        }

        .template-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .archetype-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .favorite-btn {
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
          flex-shrink: 0;
        }

        .favorite-btn:hover {
          background: var(--bg-hover);
          color: var(--status-warning);
        }

        .favorite-btn.active {
          color: var(--status-warning);
        }

        .favorite-btn :global(svg) {
          width: 16px;
          height: 16px;
        }

        .template-description {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .config-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .config-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .review-points {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .review-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--status-success);
        }

        .review-badge::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--status-success);
          border-radius: 50%;
        }

        .template-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .use-count {
          font-size: 12px;
          color: var(--text-muted);
        }

        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 8px;
        }

        .card-actions .btn {
          flex: 1;
          padding: 10px 14px;
          font-size: 13px;
        }

        .card-actions .btn-primary {
          background: linear-gradient(135deg, var(--node-publish), #cc0000);
          color: white;
          border: none;
          box-shadow: 0 2px 8px rgba(255, 0, 0, 0.2);
        }

        .card-actions .btn-primary:hover {
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
        }

        .card-actions .btn-secondary {
          background: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .card-actions .btn-secondary:hover {
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .dropdown {
          position: relative;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          bottom: 100%;
          margin-bottom: 4px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 4px;
          min-width: 140px;
          z-index: 10;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .dropdown-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .dropdown-menu button:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .dropdown-menu button.danger {
          color: var(--status-error);
        }

        .dropdown-menu button.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .dropdown-menu button.danger.confirm {
          background: var(--status-error);
          color: white;
        }
      `}</style>
    </div>
  );
}
