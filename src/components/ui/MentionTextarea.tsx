'use client';

import React, {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
  useCallback,
} from 'react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

interface TagOption {
  id: string;
  name: string;
  category?: string;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder = '',
  rows = 4,
  className = '',
}: MentionTextareaProps) {
  const [tags, setTags] = useState<TagOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/elements/tags');
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Filter tags based on search
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Calculate dropdown position based on cursor
  const calculateDropdownPosition = useCallback(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    // Create mirror content up to cursor
    const textBeforeCursor = value.substring(0, textarea.selectionStart);
    mirror.textContent = textBeforeCursor;

    // Get mirror position for calculating cursor location
    const mirrorRect = mirror.getBoundingClientRect();

    // Calculate position relative to textarea
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    const scrollTop = textarea.scrollTop;

    // Position dropdown below the current line
    setDropdownPosition({
      top: mirrorRect.height - scrollTop + lineHeight + 4,
      left: Math.min(mirrorRect.width % textarea.clientWidth, textarea.clientWidth - 200),
    });
  }, [value]);

  // Handle text change
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    onChange(newValue);

    // Check for @ mention trigger
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if we're in a mention context (no spaces after @)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStartIndex(lastAtIndex);
        setMentionSearch(textAfterAt);
        setShowDropdown(true);
        setSelectedIndex(0);
        calculateDropdownPosition();
        return;
      }
    }

    setShowDropdown(false);
    setMentionStartIndex(null);
    setMentionSearch('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || filteredTags.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredTags.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredTags.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        if (showDropdown && filteredTags.length > 0) {
          e.preventDefault();
          selectTag(filteredTags[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  // Select a tag from dropdown
  const selectTag = (tag: TagOption) => {
    if (mentionStartIndex === null) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeMention = value.substring(0, mentionStartIndex);
    const afterCursor = value.substring(textarea.selectionStart);

    const newValue = `${beforeMention}@${tag.name}${afterCursor}`;
    onChange(newValue);

    // Reset state
    setShowDropdown(false);
    setMentionStartIndex(null);
    setMentionSearch('');

    // Set cursor position after the inserted mention
    const newCursorPosition = mentionStartIndex + tag.name.length + 1;
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 0);
  };

  // Handle blur - close dropdown with delay to allow click
  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // Render value with highlighted mentions
  const renderHighlightedValue = () => {
    const mentionRegex = /@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(value)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(value.substring(lastIndex, match.index));
      }
      // Add highlighted mention
      parts.push(
        <span key={match.index} className="mention-highlight">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(value.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className={`mention-textarea-container ${className}`}>
      {/* Hidden mirror div for measuring cursor position */}
      <div
        ref={mirrorRef}
        className="mention-textarea-mirror"
        aria-hidden="true"
      />

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        className="mention-textarea"
        spellCheck="false"
      />

      {/* Visual overlay for highlighting mentions */}
      <div className="mention-overlay" aria-hidden="true">
        {renderHighlightedValue()}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="mention-dropdown"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {isLoading ? (
            <div className="mention-dropdown-loading">Loading tags...</div>
          ) : filteredTags.length === 0 ? (
            <div className="mention-dropdown-empty">No matching tags</div>
          ) : (
            filteredTags.slice(0, 8).map((tag, index) => (
              <div
                key={tag.id}
                className={`mention-dropdown-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onMouseDown={() => selectTag(tag)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="mention-dropdown-at">@</span>
                <span className="mention-dropdown-name">{tag.name}</span>
                {tag.category && (
                  <span className="mention-dropdown-category">
                    {tag.category}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .mention-textarea-container {
          position: relative;
          width: 100%;
        }

        .mention-textarea-mirror {
          position: absolute;
          visibility: hidden;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          padding: 12px;
          border: 1px solid transparent;
          pointer-events: none;
        }

        .mention-textarea {
          width: 100%;
          padding: 12px;
          background: var(--bg-elevated, #18181c);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          border-radius: var(--radius-md, 10px);
          color: var(--text-primary, #f4f4f5);
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          z-index: 2;
          /* Make textarea background slightly transparent for overlay */
          caret-color: var(--text-primary, #f4f4f5);
        }

        .mention-textarea:focus {
          outline: none;
          border-color: var(--border-bright, rgba(255, 255, 255, 0.12));
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.1);
        }

        .mention-textarea::placeholder {
          color: var(--text-muted, #52525b);
        }

        .mention-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 12px;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
          pointer-events: none;
          color: transparent;
          z-index: 1;
          overflow: hidden;
        }

        .mention-overlay :global(.mention-highlight) {
          color: var(--node-script, #a855f7);
          background: rgba(168, 85, 247, 0.15);
          border-radius: 4px;
          padding: 1px 2px;
        }

        .mention-dropdown {
          position: absolute;
          z-index: 100;
          min-width: 200px;
          max-width: 300px;
          max-height: 240px;
          overflow-y: auto;
          background: var(--bg-surface, #111114);
          border: 1px solid var(--border-bright, rgba(255, 255, 255, 0.12));
          border-radius: var(--radius-md, 10px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }

        .mention-dropdown-loading,
        .mention-dropdown-empty {
          padding: 12px 16px;
          color: var(--text-muted, #52525b);
          font-size: 13px;
          text-align: center;
        }

        .mention-dropdown-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .mention-dropdown-item:hover,
        .mention-dropdown-item.selected {
          background: var(--bg-hover, #1f1f24);
        }

        .mention-dropdown-at {
          color: var(--node-script, #a855f7);
          font-weight: 600;
        }

        .mention-dropdown-name {
          color: var(--text-primary, #f4f4f5);
          font-size: 14px;
          font-weight: 500;
        }

        .mention-dropdown-category {
          margin-left: auto;
          font-size: 11px;
          color: var(--text-muted, #52525b);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Scrollbar styling */
        .mention-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .mention-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }

        .mention-dropdown::-webkit-scrollbar-thumb {
          background: var(--border-bright, rgba(255, 255, 255, 0.12));
          border-radius: 3px;
        }

        .mention-dropdown::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted, #52525b);
        }
      `}</style>
    </div>
  );
}

export default MentionTextarea;
