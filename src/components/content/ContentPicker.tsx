'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContentItem, ContentType } from '@/types/database';

interface ContentPickerProps {
  type?: ContentType;
  onSelect: (content: ContentItem) => void;
  onMultiSelect?: (contents: ContentItem[]) => void;
  multiple?: boolean;
  isOpen: boolean;
  onClose: () => void;
  excludeIds?: string[];
}

const TYPE_COLORS: Record<ContentType, string> = {
  hook: 'var(--node-script)',
  title: 'var(--node-trigger)',
  description: 'var(--node-voice)',
  intro: 'var(--node-assembly)',
  cta: 'var(--node-publish)',
  outline: 'var(--node-thumbnail)',
  script: 'var(--status-running)',
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

export function ContentPicker({
  type,
  onSelect,
  onMultiSelect,
  multiple = false,
  isOpen,
  onClose,
  excludeIds = [],
}: ContentPickerProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('pageSize', '50');
      if (type) {
        params.set('type', type);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const response = await fetch(`/api/content?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      const filtered = (data.items || []).filter(
        (item: ContentItem) => !excludeIds.includes(item.id)
      );
      setItems(filtered);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, searchQuery, excludeIds]);

  useEffect(() => {
    if (isOpen) {
      fetchContent();
      // Focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when closed
      setSearchQuery('');
      setSelectedIds(new Set());
    }
  }, [isOpen, fetchContent]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (isOpen) {
        fetchContent();
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isOpen, fetchContent]);

  if (!isOpen) return null;

  const handleItemClick = (item: ContentItem) => {
    if (multiple) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedIds(newSelected);
    } else {
      onSelect(item);
      onClose();
    }
  };

  const handleConfirmMultiple = () => {
    if (onMultiSelect && selectedIds.size > 0) {
      const selectedItems = items.filter((item) => selectedIds.has(item.id));
      onMultiSelect(selectedItems);
      onClose();
    }
  };

  const truncateContent = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <div className="header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>
              {type ? `Select ${TYPE_LABELS[type]}` : 'Select Content'}
              {multiple && ' (Multiple)'}
            </span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search by name or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="picker-body">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Loading content...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>
                {searchQuery
                  ? 'No content matches your search'
                  : type
                  ? `No ${TYPE_LABELS[type].toLowerCase()}s in your library`
                  : 'No content in your library'}
              </span>
            </div>
          ) : (
            <div className="items-list">
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    className={`picker-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {multiple && (
                      <div className="checkbox">
                        {isSelected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="item-content">
                      <div className="item-header">
                        <span
                          className="item-type"
                          style={{ background: TYPE_COLORS[item.type] }}
                        >
                          {TYPE_LABELS[item.type]}
                        </span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <p className="item-preview">{truncateContent(item.content)}</p>
                      {item.tags.length > 0 && (
                        <div className="item-tags">
                          {item.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="item-tag">@{tag}</span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="tag-more">+{item.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="item-meta">
                      <span className="used-count">{item.used_count}x</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {multiple && selectedIds.size > 0 && (
          <div className="picker-footer">
            <span className="selection-count">
              {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="footer-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmMultiple}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .picker-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .picker {
          width: 100%;
          max-width: 520px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 600;
        }

        .header-title svg {
          width: 18px;
          height: 18px;
          color: var(--text-muted);
        }

        .close-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .close-btn svg {
          width: 18px;
          height: 18px;
        }

        .search-container {
          position: relative;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
        }

        .search-icon {
          position: absolute;
          left: 32px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 36px 10px 40px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: var(--border-bright);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .clear-btn {
          position: absolute;
          right: 28px;
          top: 50%;
          transform: translateY(-50%);
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
          transition: all 0.2s;
        }

        .clear-btn:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .clear-btn svg {
          width: 14px;
          height: 14px;
        }

        .picker-body {
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
          gap: 12px;
          padding: 48px 24px;
          color: var(--text-muted);
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--node-script);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state svg {
          width: 48px;
          height: 48px;
          opacity: 0.5;
        }

        .empty-state span {
          font-size: 13px;
          text-align: center;
        }

        .items-list {
          padding: 8px;
        }

        .picker-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .picker-item:hover {
          background: var(--bg-elevated);
          border-color: var(--border);
        }

        .picker-item.selected {
          background: rgba(168, 85, 247, 0.1);
          border-color: var(--node-script);
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-bright);
          border-radius: 4px;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.15s ease;
        }

        .picker-item.selected .checkbox {
          background: var(--node-script);
          border-color: var(--node-script);
        }

        .checkbox svg {
          width: 10px;
          height: 10px;
          color: white;
        }

        .item-content {
          flex: 1;
          min-width: 0;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .item-type {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-preview {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 6px;
        }

        .item-tags {
          display: flex;
          gap: 4px;
        }

        .item-tag {
          padding: 2px 6px;
          background: var(--bg-hover);
          border-radius: 8px;
          font-size: 10px;
          color: var(--text-muted);
        }

        .tag-more {
          padding: 2px 6px;
          background: var(--bg-hover);
          border-radius: 8px;
          font-size: 10px;
          color: var(--text-muted);
        }

        .item-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .used-count {
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-elevated);
          padding: 2px 6px;
          border-radius: 8px;
        }

        .picker-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid var(--border);
          background: var(--bg-elevated);
        }

        .selection-count {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .footer-actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary {
          background: var(--bg-surface);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--node-script), #9333ea);
          color: white;
        }

        .btn-primary:hover {
          box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
        }
      `}</style>
    </div>
  );
}
