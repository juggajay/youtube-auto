'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ElementsGrid } from '@/components/elements/ElementsGrid';
import { ElementUploadModal } from '@/components/elements/ElementUploadModal';
import { ElementEditModal } from '@/components/elements/ElementEditModal';
import { useElementsStore } from '@/stores/elementsStore';
import type { ElementType } from '@/types/database';

type ElementFilterType = ElementType | 'all';

const FILTER_TABS: { value: ElementFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'logo', label: 'Logos' },
  { value: 'overlay', label: 'Overlays' },
  { value: 'background', label: 'Backgrounds' },
  { value: 'character', label: 'Characters' },
  { value: 'prop', label: 'Props' },
  { value: 'other', label: 'Other' },
];

export default function ElementsPage() {
  const filter = useElementsStore((state) => state.filter);
  const uploadModalOpen = useElementsStore((state) => state.uploadModalOpen);
  const editModalOpen = useElementsStore((state) => state.editModalOpen);
  const setFilter = useElementsStore((state) => state.setFilter);
  const openUploadModal = useElementsStore((state) => state.openUploadModal);
  const fetchElements = useElementsStore((state) => state.fetchElements);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Elements</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={openUploadModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </button>
          </div>
        </header>

        <div className="elements-page">
          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="filter-tabs">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  className={`filter-tab ${filter.type === tab.value ? 'active' : ''}`}
                  onClick={() => setFilter({ type: tab.value })}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="search-input-wrapper">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or @tag..."
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
              />
              {filter.search && (
                <button
                  className="search-clear"
                  onClick={() => setFilter({ search: '' })}
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Elements Grid */}
          <ElementsGrid />
        </div>

        {/* Modals */}
        {uploadModalOpen && <ElementUploadModal />}
        {editModalOpen && <ElementEditModal />}
      </main>

      <style jsx>{`
        .elements-page {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .filters-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .filter-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-surface);
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .filter-tab {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-tab:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .filter-tab.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 280px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          width: 16px;
          height: 16px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 36px 10px 40px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-input:focus {
          border-color: var(--border-bright);
          background: var(--bg-elevated);
        }

        .search-clear {
          position: absolute;
          right: 8px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-clear:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .search-clear svg {
          width: 14px;
          height: 14px;
        }

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-tabs {
            overflow-x: auto;
            white-space: nowrap;
          }

          .search-input-wrapper {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
