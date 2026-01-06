'use client';

import {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
} from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

interface TagOption {
  id: string;
  name: string;
  category?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Type @ to add a tag...',
  className = '',
}: TagInputProps) {
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/elements/tags');
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Normalize tag: lowercase, ensure @ prefix
  const normalizeTag = (tag: string): string => {
    let normalized = tag.trim().toLowerCase();
    if (!normalized.startsWith('@')) {
      normalized = `@${normalized}`;
    }
    return normalized;
  };

  // Check if tag already exists
  const isDuplicate = (tag: string): boolean => {
    const normalized = normalizeTag(tag);
    return tags.some((t) => t.toLowerCase() === normalized.toLowerCase());
  };

  // Filter available tags based on input
  const getFilteredTags = (): TagOption[] => {
    const searchTerm = inputValue.startsWith('@')
      ? inputValue.substring(1).toLowerCase()
      : inputValue.toLowerCase();

    return availableTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchTerm) &&
        !tags.some(
          (t) => t.toLowerCase() === `@${tag.name.toLowerCase()}`
        )
    );
  };

  const filteredTags = getFilteredTags();

  // Add a tag
  const addTag = (tagName: string) => {
    const normalized = normalizeTag(tagName);
    if (normalized.length > 1 && !isDuplicate(normalized)) {
      onChange([...tags, normalized]);
      setInputValue('');
      setShowDropdown(false);
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  };

  // Remove a tag by index
  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Show dropdown when typing @ or any character
    if (value.length > 0 || value === '@') {
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredTags.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredTags.length - 1 ? prev + 1 : 0
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredTags.length - 1
          );
          return;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          addTag(filteredTags[selectedIndex].name);
          return;
        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          return;
      }
    }

    // Handle Enter to add custom tag
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
      return;
    }

    // Handle Backspace to remove last tag when input is empty
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  // Handle blur - close dropdown with delay
  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // Focus input when clicking container
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={`tag-input-container ${className}`} ref={containerRef}>
      <div className="tag-input-wrapper" onClick={handleContainerClick}>
        {/* Existing tags */}
        {tags.map((tag, index) => (
          <span key={`${tag}-${index}`} className="tag-badge">
            <span className="tag-text">{tag}</span>
            <button
              type="button"
              className="tag-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              aria-label={`Remove ${tag}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowDropdown(true)}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="tag-input"
        />
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="tag-dropdown">
          {isLoading ? (
            <div className="tag-dropdown-loading">Loading tags...</div>
          ) : filteredTags.length === 0 ? (
            <div className="tag-dropdown-empty">
              {inputValue ? (
                <span>
                  Press Enter to add <strong>@{inputValue.replace('@', '')}</strong>
                </span>
              ) : (
                'No matching tags'
              )}
            </div>
          ) : (
            filteredTags.slice(0, 8).map((tag, index) => (
              <div
                key={tag.id}
                className={`tag-dropdown-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onMouseDown={() => addTag(tag.name)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="tag-dropdown-at">@</span>
                <span className="tag-dropdown-name">{tag.name}</span>
                {tag.category && (
                  <span className="tag-dropdown-category">{tag.category}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .tag-input-container {
          position: relative;
          width: 100%;
        }

        .tag-input-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-elevated, #18181c);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          border-radius: var(--radius-md, 10px);
          min-height: 46px;
          align-items: center;
          cursor: text;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .tag-input-wrapper:focus-within {
          border-color: var(--border-bright, rgba(255, 255, 255, 0.12));
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.1);
        }

        .tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px 4px 10px;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: var(--radius-sm, 6px);
          font-size: 13px;
          font-weight: 500;
          color: var(--node-script, #a855f7);
          transition: background-color 0.15s ease;
        }

        .tag-badge:hover {
          background: rgba(168, 85, 247, 0.2);
        }

        .tag-text {
          line-height: 1;
        }

        .tag-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--node-script, #a855f7);
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.15s ease, background-color 0.15s ease;
        }

        .tag-remove:hover {
          opacity: 1;
          background: rgba(168, 85, 247, 0.2);
        }

        .tag-input {
          flex: 1;
          min-width: 100px;
          padding: 4px 0;
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 14px;
          color: var(--text-primary, #f4f4f5);
        }

        .tag-input:focus {
          outline: none;
        }

        .tag-input::placeholder {
          color: var(--text-muted, #52525b);
        }

        .tag-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 100;
          margin-top: 4px;
          max-height: 240px;
          overflow-y: auto;
          background: var(--bg-surface, #111114);
          border: 1px solid var(--border-bright, rgba(255, 255, 255, 0.12));
          border-radius: var(--radius-md, 10px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }

        .tag-dropdown-loading,
        .tag-dropdown-empty {
          padding: 12px 16px;
          color: var(--text-muted, #52525b);
          font-size: 13px;
          text-align: center;
        }

        .tag-dropdown-empty strong {
          color: var(--node-script, #a855f7);
        }

        .tag-dropdown-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .tag-dropdown-item:hover,
        .tag-dropdown-item.selected {
          background: var(--bg-hover, #1f1f24);
        }

        .tag-dropdown-at {
          color: var(--node-script, #a855f7);
          font-weight: 600;
        }

        .tag-dropdown-name {
          color: var(--text-primary, #f4f4f5);
          font-size: 14px;
          font-weight: 500;
        }

        .tag-dropdown-category {
          margin-left: auto;
          font-size: 11px;
          color: var(--text-muted, #52525b);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Scrollbar styling */
        .tag-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .tag-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }

        .tag-dropdown::-webkit-scrollbar-thumb {
          background: var(--border-bright, rgba(255, 255, 255, 0.12));
          border-radius: 3px;
        }

        .tag-dropdown::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted, #52525b);
        }
      `}</style>
    </div>
  );
}

export default TagInput;
