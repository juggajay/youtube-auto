'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentEditModal } from '@/components/content/ContentEditModal';
import { ContentCreateModal } from '@/components/content/ContentCreateModal';
import { useContentStore } from '@/stores/contentStore';
import type { ContentItem, ContentType, ContentLibraryInsert } from '@/types/database';

type ContentFilterType = ContentType | 'all';

const FILTER_TABS: { value: ContentFilterType; label: string; color?: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hook', label: 'Hooks', color: 'var(--node-script)' },
  { value: 'title', label: 'Titles', color: 'var(--node-trigger)' },
  { value: 'description', label: 'Descriptions', color: 'var(--node-voice)' },
  { value: 'intro', label: 'Intros', color: 'var(--node-assembly)' },
  { value: 'cta', label: 'CTAs', color: 'var(--node-publish)' },
  { value: 'outline', label: 'Outlines', color: 'var(--node-thumbnail)' },
  { value: 'script', label: 'Scripts', color: 'var(--status-running)' },
];

export default function ContentPage() {
  const items = useContentStore((state) => state.items);
  const selectedItems = useContentStore((state) => state.selectedItems);
  const typeFilter = useContentStore((state) => state.typeFilter);
  const searchQuery = useContentStore((state) => state.searchQuery);
  const isLoading = useContentStore((state) => state.isLoading);
  const page = useContentStore((state) => state.page);
  const pageSize = useContentStore((state) => state.pageSize);
  const totalCount = useContentStore((state) => state.totalCount);

  const fetchContent = useContentStore((state) => state.fetchContent);
  const setTypeFilter = useContentStore((state) => state.setTypeFilter);
  const setSearchQuery = useContentStore((state) => state.setSearchQuery);
  const setPage = useContentStore((state) => state.setPage);
  const toggleSelection = useContentStore((state) => state.toggleSelection);
  const selectAll = useContentStore((state) => state.selectAll);
  const clearSelection = useContentStore((state) => state.clearSelection);
  const createContent = useContentStore((state) => state.createContent);
  const updateContent = useContentStore((state) => state.updateContent);
  const deleteContent = useContentStore((state) => state.deleteContent);
  const bulkDelete = useContentStore((state) => state.bulkDelete);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch content on mount and when filters change
  useEffect(() => {
    fetchContent();
  }, [fetchContent, typeFilter, page]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchContent();
    }, 300);
  }, [setSearchQuery, fetchContent]);

  // Close tag dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    }

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagDropdown]);

  // Get all unique tags from items
  const allTags = Array.from(new Set(items.flatMap((item) => item.tags))).sort();

  const handleEdit = (content: ContentItem) => {
    setSelectedContent(content);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (id: string, data: { name: string; content: string; tags: string[] }) => {
    await updateContent(id, data);
  };

  const handleDelete = async (id: string) => {
    await deleteContent(id);
  };

  const handleCreate = async (data: Omit<ContentLibraryInsert, 'user_id'>) => {
    await createContent(data as ContentLibraryInsert);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    await bulkDelete(selectedItems);
    setSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      clearSelection();
    }
    setSelectionMode(!selectionMode);
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Content Library</h1>
          <div className="header-actions">
            {selectionMode && selectedItems.length > 0 && (
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete ({selectedItems.length})
              </button>
            )}
            <button
              className={`btn ${selectionMode ? 'btn-secondary active' : 'btn-secondary'}`}
              onClick={toggleSelectionMode}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
            <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New
            </button>
          </div>
        </header>

        <div className="content-page">
          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="filter-tabs-wrapper">
              <div className="filter-tabs">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    className={`filter-tab ${typeFilter === tab.value ? 'active' : ''}`}
                    onClick={() => setTypeFilter(tab.value)}
                    style={{
                      '--tab-color': tab.color || 'var(--text-secondary)',
                    } as React.CSSProperties}
                  >
                    {tab.color && <span className="tab-dot" style={{ background: tab.color }} />}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-controls">
              {/* Tag Filter */}
              <div className="tag-filter" ref={tagDropdownRef}>
                <button
                  className={`tag-filter-btn ${showTagDropdown ? 'active' : ''}`}
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  Tags
                  <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showTagDropdown && (
                  <div className="tag-dropdown">
                    {allTags.length === 0 ? (
                      <div className="no-tags">No tags available</div>
                    ) : (
                      allTags.map((tag) => (
                        <button
                          key={tag}
                          className="tag-option"
                          onClick={() => {
                            handleSearchChange(`@${tag}`);
                            setShowTagDropdown(false);
                          }}
                        >
                          @{tag}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Search Input */}
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name, content, or @tag..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="search-clear"
                    onClick={() => handleSearchChange('')}
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
          </div>

          {/* Selection Controls */}
          {selectionMode && items.length > 0 && (
            <div className="selection-bar">
              <button className="select-all-btn" onClick={selectAll}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Select All
              </button>
              {selectedItems.length > 0 && (
                <button className="clear-selection-btn" onClick={clearSelection}>
                  Clear Selection
                </button>
              )}
              <span className="selection-count">
                {selectedItems.length} of {items.length} selected
              </span>
            </div>
          )}

          {/* Content Grid */}
          {isLoading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-header">
                    <div className="skeleton-badge" />
                    <div className="skeleton-title" />
                  </div>
                  <div className="skeleton-content" />
                  <div className="skeleton-content short" />
                  <div className="skeleton-meta" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="empty-title">
                {searchQuery || typeFilter !== 'all'
                  ? 'No content found'
                  : 'Your content library is empty'}
              </h3>
              <p className="empty-description">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Create reusable hooks, titles, descriptions, and more to speed up your workflow'}
              </p>
              {!searchQuery && typeFilter === 'all' && (
                <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Your First Content
                </button>
              )}
            </div>
          ) : (
            <div className="content-grid">
              {items.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={toggleSelection}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Previous
              </button>

              <div className="pagination-info">
                <span className="page-current">{page}</span>
                <span className="page-separator">of</span>
                <span className="page-total">{totalPages}</span>
              </div>

              <button
                className="pagination-btn"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        {selectedContent && (
          <ContentEditModal
            content={selectedContent}
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedContent(null);
            }}
            onSave={handleSaveEdit}
            onDelete={handleDelete}
          />
        )}

        <ContentCreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreate}
          defaultType={typeFilter !== 'all' ? typeFilter : 'hook'}
        />
      </main>

      <style jsx>{`
        .content-page {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: calc(100vh - 56px);
        }

        .filters-bar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-tabs-wrapper {
          overflow-x: auto;
          margin: -4px;
          padding: 4px;
        }

        .filter-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-surface);
          padding: 4px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          width: fit-content;
        }

        .filter-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .filter-tab:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .filter-tab.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .filter-tab.active .tab-dot {
          box-shadow: 0 0 8px var(--tab-color);
        }

        .tab-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: box-shadow 0.2s ease;
        }

        .filter-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* Tag Filter */
        .tag-filter {
          position: relative;
        }

        .tag-filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag-filter-btn:hover,
        .tag-filter-btn.active {
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .tag-filter-btn svg {
          width: 14px;
          height: 14px;
        }

        .tag-filter-btn .chevron {
          width: 12px;
          height: 12px;
          margin-left: 4px;
        }

        .tag-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 180px;
          max-height: 240px;
          overflow-y: auto;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 4px;
          z-index: 20;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: dropdownIn 0.15s ease;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tag-option {
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 13px;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tag-option:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .no-tags {
          padding: 12px;
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
        }

        /* Search Input */
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          width: 16px;
          height: 16px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 42px;
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
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }

        .search-clear {
          position: absolute;
          right: 8px;
          width: 28px;
          height: 28px;
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

        /* Selection Bar */
        .selection-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: var(--radius-md);
        }

        .select-all-btn,
        .clear-selection-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .select-all-btn:hover,
        .clear-selection-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .select-all-btn svg {
          width: 12px;
          height: 12px;
        }

        .selection-count {
          margin-left: auto;
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
        }

        @media (min-width: 640px) {
          .content-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Loading Grid */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
        }

        @media (min-width: 640px) {
          .loading-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .loading-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .skeleton-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .skeleton-badge {
          width: 48px;
          height: 20px;
          background: var(--bg-elevated);
          border-radius: 10px;
          animation: pulse 1.5s ease infinite;
        }

        .skeleton-title {
          flex: 1;
          height: 18px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          animation: pulse 1.5s ease infinite;
          animation-delay: 0.1s;
        }

        .skeleton-content {
          height: 14px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          animation: pulse 1.5s ease infinite;
          animation-delay: 0.2s;
        }

        .skeleton-content.short {
          width: 60%;
          animation-delay: 0.3s;
        }

        .skeleton-meta {
          height: 12px;
          width: 120px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          animation: pulse 1.5s ease infinite;
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 24px;
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
        }

        .empty-description {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 400px;
          line-height: 1.5;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 24px 0;
          margin-top: auto;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-btn svg {
          width: 14px;
          height: 14px;
        }

        .pagination-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .page-current {
          color: var(--text-primary);
          font-weight: 600;
        }

        .page-separator {
          color: var(--text-muted);
        }

        .page-total {
          color: var(--text-secondary);
        }

        /* Header Actions */
        .header-actions .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-actions .btn svg {
          width: 14px;
          height: 14px;
        }

        .btn-danger {
          background: var(--status-error);
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-secondary.active {
          background: var(--node-script);
          color: white;
          border: none;
        }

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
          }

          .filter-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input-wrapper {
            max-width: 100%;
          }

          .header-actions {
            flex-wrap: wrap;
          }

          .header-actions .btn span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
