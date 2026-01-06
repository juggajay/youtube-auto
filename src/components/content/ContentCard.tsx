'use client';

import { useState } from 'react';
import type { ContentItem, ContentType } from '@/types/database';

interface ContentCardProps {
  content: ContentItem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (content: ContentItem) => void;
  onDelete?: (id: string) => void;
  selectionMode?: boolean;
}

// Color mapping for content types
const TYPE_COLORS: Record<ContentType, { bg: string; glow: string }> = {
  hook: { bg: 'var(--node-script)', glow: 'var(--node-script-glow)' },
  title: { bg: 'var(--node-trigger)', glow: 'var(--node-trigger-glow)' },
  description: { bg: 'var(--node-voice)', glow: 'var(--node-voice-glow)' },
  intro: { bg: 'var(--node-assembly)', glow: 'var(--node-assembly-glow)' },
  cta: { bg: 'var(--node-publish)', glow: 'var(--node-publish-glow)' },
  outline: { bg: 'var(--node-thumbnail)', glow: 'var(--node-thumbnail-glow)' },
  script: { bg: 'var(--status-running)', glow: 'rgba(59, 130, 246, 0.3)' },
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

export function ContentCard({
  content,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  selectionMode = false,
}: ContentCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const typeColor = TYPE_COLORS[content.type] || { bg: 'var(--text-muted)', glow: 'rgba(255,255,255,0.1)' };

  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(content.id);
    } else if (onEdit) {
      onEdit(content);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (onDelete) {
      onDelete(content.id);
    }
    setConfirmDelete(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateContent = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div
      className={`content-card ${isSelected ? 'selected' : ''} ${selectionMode ? 'selection-mode' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setConfirmDelete(false);
      }}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="selection-checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(content.id)}
            aria-label={`Select ${content.name}`}
          />
          <div className="checkbox-visual">
            {isSelected && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card-header">
        <span className="type-badge" style={{ background: typeColor.bg }}>
          {TYPE_LABELS[content.type]}
        </span>
        <h3 className="card-title">{content.name}</h3>
      </div>

      {/* Content Preview */}
      <p className="content-preview">{truncateContent(content.content)}</p>

      {/* Tags */}
      {content.tags.length > 0 && (
        <div className="tags-container">
          {content.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="tag-pill">
              @{tag}
            </span>
          ))}
          {content.tags.length > 3 && (
            <span className="tags-more">+{content.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="card-meta">
        <span className="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
          Used {content.used_count}x
        </span>
        <span className="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatDate(content.last_used_at)}
        </span>
      </div>

      {/* Action Buttons (visible on hover) */}
      {showActions && !selectionMode && (
        <div className="card-actions">
          <button
            className="action-btn edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(content);
            }}
            aria-label="Edit"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className={`action-btn delete ${confirmDelete ? 'confirm' : ''}`}
            onClick={handleDelete}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}

      {/* Glow effect on hover */}
      <div className="card-glow" style={{ background: typeColor.glow }} />

      <style jsx>{`
        .content-card {
          position: relative;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .content-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        }

        .content-card.selected {
          border-color: var(--node-script);
          box-shadow: 0 0 0 1px var(--node-script), 0 8px 24px rgba(168, 85, 247, 0.15);
        }

        .content-card.selection-mode {
          padding-left: 48px;
        }

        .card-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .content-card:hover .card-glow {
          opacity: 1;
        }

        /* Selection Checkbox */
        .selection-checkbox {
          position: absolute;
          left: 12px;
          top: 16px;
        }

        .selection-checkbox input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .checkbox-visual {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border-bright);
          border-radius: var(--radius-sm);
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .selection-checkbox input:checked + .checkbox-visual {
          background: var(--node-script);
          border-color: var(--node-script);
        }

        .checkbox-visual svg {
          width: 12px;
          height: 12px;
          color: white;
        }

        /* Header */
        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .type-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Content Preview */
        .content-preview {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        /* Tags */
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag-pill {
          padding: 3px 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .content-card:hover .tag-pill {
          background: var(--bg-hover);
          color: var(--text-secondary);
        }

        .tags-more {
          padding: 3px 8px;
          background: var(--bg-hover);
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Meta */
        .card-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: auto;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .meta-item svg {
          width: 12px;
          height: 12px;
          opacity: 0.7;
        }

        /* Action Buttons */
        .card-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 6px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .action-btn.delete:hover {
          border-color: var(--status-error);
          color: var(--status-error);
        }

        .action-btn.delete.confirm {
          background: var(--status-error);
          border-color: var(--status-error);
          color: white;
        }

        .action-btn svg {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}
