'use client';

import { useElementsStore } from '@/stores/elementsStore';
import { ElementCard } from './ElementCard';

export function ElementsGrid() {
  const isLoading = useElementsStore((state) => state.isLoading);
  const filter = useElementsStore((state) => state.filter);
  const getFilteredElements = useElementsStore((state) => state.getFilteredElements);
  const elements = getFilteredElements();

  // Loading skeleton
  if (isLoading && elements.length === 0) {
    return (
      <div className="elements-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="element-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-content">
              <div className="skeleton-title" />
              <div className="skeleton-tags" />
            </div>
          </div>
        ))}

        <style jsx>{`
          .elements-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }

          @media (max-width: 1200px) {
            .elements-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (max-width: 900px) {
            .elements-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 600px) {
            .elements-grid {
              grid-template-columns: 1fr;
            }
          }

          .element-skeleton {
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            animation: pulse 1.5s ease-in-out infinite;
          }

          .skeleton-image {
            aspect-ratio: 16 / 9;
            background: var(--bg-elevated);
          }

          .skeleton-content {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .skeleton-title {
            height: 16px;
            width: 70%;
            background: var(--bg-elevated);
            border-radius: var(--radius-sm);
          }

          .skeleton-tags {
            height: 12px;
            width: 50%;
            background: var(--bg-elevated);
            border-radius: var(--radius-sm);
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    );
  }

  // Empty state
  if (elements.length === 0) {
    const hasFilters = filter.type !== 'all' || filter.search;

    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <h3 className="empty-title">
          {hasFilters ? 'No matching elements' : 'No elements yet'}
        </h3>
        <p className="empty-description">
          {hasFilters
            ? 'Try adjusting your filters or search query.'
            : 'Upload your first element to get started. Elements can be logos, overlays, backgrounds, characters, or props.'}
        </p>

        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
          }

          .empty-icon {
            width: 80px;
            height: 80px;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }

          .empty-icon svg {
            width: 40px;
            height: 40px;
            color: var(--text-muted);
          }

          .empty-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
          }

          .empty-description {
            font-size: 14px;
            color: var(--text-muted);
            max-width: 400px;
            line-height: 1.5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="elements-grid">
      {elements.map((element) => (
        <ElementCard key={element.id} element={element} />
      ))}

      <style jsx>{`
        .elements-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .elements-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .elements-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .elements-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
