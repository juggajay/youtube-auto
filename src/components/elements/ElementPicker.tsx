'use client';

import { useState, useEffect } from 'react';
import { useElementsStore } from '@/stores/elementsStore';
import type { ElementType, ElementWithUrl } from '@/types/database';

interface ElementPickerProps {
  type?: ElementType;
  value?: string;
  onChange: (id: string | null) => void;
  placeholder?: string;
}

type FilterType = ElementType | 'all';

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'logo', label: 'Logos' },
  { value: 'overlay', label: 'Overlays' },
  { value: 'background', label: 'Backgrounds' },
  { value: 'character', label: 'Characters' },
  { value: 'prop', label: 'Props' },
  { value: 'other', label: 'Other' },
];

export function ElementPicker({
  type,
  value,
  onChange,
  placeholder = 'Select an element...',
}: ElementPickerProps) {
  const elements = useElementsStore((state) => state.elements);
  const fetchElements = useElementsStore((state) => state.fetchElements);
  const isLoading = useElementsStore((state) => state.isLoading);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>(type || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && elements.length === 0) {
      fetchElements();
    }
  }, [isOpen, elements.length, fetchElements]);

  const selectedElement = elements.find(e => e.id === value);

  const filteredElements = elements.filter(elem => {
    // Filter by type
    if (filter !== 'all' && elem.type !== filter) {
      return false;
    }
    // If type prop is provided, filter by that type
    if (type && elem.type !== type) {
      return false;
    }
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = elem.name.toLowerCase().includes(query);
      const tagMatch = query.startsWith('@')
        ? elem.tags.some(tag => tag.toLowerCase().includes(query.slice(1)))
        : elem.tags.some(tag => tag.toLowerCase().includes(query));
      return nameMatch || tagMatch;
    }
    return true;
  });

  const handleSelect = (element: ElementWithUrl) => {
    onChange(element.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="element-picker">
      {/* Selected Element Display */}
      <div className="picker-trigger" onClick={() => setIsOpen(true)}>
        {selectedElement ? (
          <>
            <div className="selected-element">
              {(selectedElement.thumbnail_url || selectedElement.url) && (
                <img
                  src={selectedElement.thumbnail_url || selectedElement.url}
                  alt={selectedElement.name}
                  className="selected-thumbnail"
                />
              )}
              <span className="selected-name">{selectedElement.name}</span>
            </div>
            <div className="trigger-actions">
              <button className="trigger-btn" onClick={() => setIsOpen(true)}>
                Change
              </button>
              <button className="trigger-btn clear" onClick={handleClear}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
      </div>

      {/* Picker Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="picker-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Select Element</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-toolbar">
              {/* Filter Tabs (only show if no type prop) */}
              {!type && (
                <div className="filter-tabs">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      className={`filter-tab ${filter === tab.value ? 'active' : ''}`}
                      onClick={() => setFilter(tab.value)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="search-wrapper">
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-body">
              {isLoading ? (
                <div className="picker-loading">
                  <div className="spinner" />
                  <span>Loading elements...</span>
                </div>
              ) : filteredElements.length === 0 ? (
                <div className="picker-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>No elements found</span>
                </div>
              ) : (
                <div className="picker-grid">
                  {filteredElements.map((element) => (
                    <div
                      key={element.id}
                      className={`picker-item ${element.id === value ? 'selected' : ''}`}
                      onClick={() => handleSelect(element)}
                    >
                      <div className="item-thumbnail">
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
                      </div>
                      <span className="item-name">{element.name}</span>
                      {element.id === value && (
                        <div className="item-check">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .element-picker {
          position: relative;
        }

        .picker-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          min-height: 48px;
        }

        .picker-trigger:hover {
          border-color: var(--border-bright);
        }

        .selected-element {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .selected-thumbnail {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          object-fit: cover;
        }

        .selected-name {
          font-size: 14px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .trigger-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .trigger-btn {
          padding: 4px 10px;
          background: var(--bg-hover);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .trigger-btn:hover {
          background: var(--bg-surface);
          color: var(--text-primary);
        }

        .trigger-btn.clear {
          padding: 4px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .trigger-btn.clear:hover {
          color: var(--status-error);
        }

        .trigger-btn svg {
          width: 14px;
          height: 14px;
        }

        .placeholder {
          color: var(--text-muted);
          font-size: 14px;
        }

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

        .picker-modal {
          width: 100%;
          max-width: 640px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .modal-title {
          font-size: 16px;
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

        .modal-toolbar {
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filter-tabs {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .filter-tab.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
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
          padding: 10px 14px 10px 40px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: var(--border-bright);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }

        .picker-loading,
        .picker-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          color: var(--text-muted);
        }

        .picker-loading svg,
        .picker-empty svg {
          width: 48px;
          height: 48px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--text-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .picker-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 600px) {
          .picker-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .picker-item {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }

        .picker-item:hover {
          border-color: var(--border-bright);
        }

        .picker-item.selected {
          border-color: var(--node-trigger);
          background: rgba(6, 182, 212, 0.05);
        }

        .item-thumbnail {
          aspect-ratio: 16 / 9;
          background: var(--bg-hover);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .item-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumbnail-placeholder svg {
          width: 24px;
          height: 24px;
          color: var(--text-muted);
        }

        .item-name {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-check {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 20px;
          height: 20px;
          background: var(--node-trigger);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-check svg {
          width: 12px;
          height: 12px;
          color: white;
        }
      `}</style>
    </div>
  );
}
