'use client';

import { useElementsStore } from '@/stores/elementsStore';
import type { ElementWithUrl } from '@/types/database';

interface ElementCardProps {
  element: ElementWithUrl;
}

const TYPE_COLORS: Record<string, string> = {
  logo: 'var(--node-thumbnail)',
  overlay: 'var(--node-assembly)',
  background: 'var(--node-script)',
  character: 'var(--node-voice)',
  prop: 'var(--node-trigger)',
  other: 'var(--text-muted)',
};

export function ElementCard({ element }: ElementCardProps) {
  const openEditModal = useElementsStore((state) => state.openEditModal);

  const handleClick = () => {
    openEditModal(element);
  };

  return (
    <div className="element-card" onClick={handleClick}>
      {/* Thumbnail */}
      <div className="card-thumbnail">
        {element.thumbnail_url || element.url ? (
          <img src={element.thumbnail_url || element.url} alt={element.name} />
        ) : (
          <div className="thumbnail-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Type Badge */}
        <span
          className="type-badge"
          style={{ background: TYPE_COLORS[element.type] || 'var(--text-muted)' }}
        >
          {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
        </span>

        {/* Hover Overlay */}
        <div className="card-overlay">
          <button
            className="overlay-btn"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(element);
            }}
            aria-label="Edit element"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="card-content">
        <h4 className="element-name">{element.name}</h4>

        {element.tags.length > 0 && (
          <div className="element-tags">
            {element.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="tag">
                @{tag}
              </span>
            ))}
            {element.tags.length > 3 && (
              <span className="tag-more">+{element.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .element-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .element-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .card-thumbnail {
          position: relative;
          aspect-ratio: 16 / 9;
          background: var(--bg-elevated);
          overflow: hidden;
        }

        .card-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .element-card:hover .card-thumbnail img {
          transform: scale(1.05);
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumbnail-placeholder svg {
          width: 48px;
          height: 48px;
          color: var(--text-muted);
        }

        .type-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .element-card:hover .card-overlay {
          opacity: 1;
        }

        .overlay-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .overlay-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
        }

        .overlay-btn svg {
          width: 14px;
          height: 14px;
        }

        .card-content {
          padding: 12px;
        }

        .element-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .element-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tag {
          padding: 2px 6px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .tag-more {
          padding: 2px 6px;
          background: var(--bg-hover);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
