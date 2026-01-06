'use client';

import { useState, useRef, useEffect } from 'react';
import { useIdeationStore } from '@/stores/ideationStore';

const ARCHETYPES = [
  {
    id: 'educational_tutorial',
    name: 'Educational Tutorial',
    description: 'Step-by-step teaching format',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    color: 'var(--node-script)',
  },
  {
    id: 'product_review',
    name: 'Product Review',
    description: 'Honest evaluation of products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    color: 'var(--node-voice)',
  },
  {
    id: 'story_narrative',
    name: 'Story/Narrative',
    description: 'Engaging storytelling format',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    color: 'var(--node-thumbnail)',
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Numbered list of items',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    color: 'var(--node-assembly)',
  },
  {
    id: 'how_to_guide',
    name: 'How-To Guide',
    description: 'Practical instruction format',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: 'var(--node-trigger)',
  },
  {
    id: 'opinion_commentary',
    name: 'Opinion/Commentary',
    description: 'Personal perspective and analysis',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: 'var(--node-publish)',
  },
];

export function TopicStep() {
  const { topic, archetype, setTopic, setArchetype } = useIdeationStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedArchetype = ARCHETYPES.find((a) => a.id === archetype);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="topic-step">
      {/* Main topic input area */}
      <div className="topic-input-container">
        <div className="topic-input-decoration" aria-hidden="true">
          <div className="decoration-line decoration-line-1" />
          <div className="decoration-line decoration-line-2" />
          <div className="decoration-dot decoration-dot-1" />
          <div className="decoration-dot decoration-dot-2" />
        </div>

        <label htmlFor="topic-input" className="topic-label">
          What&apos;s your video about?
        </label>

        <div className="topic-input-wrapper">
          <input
            ref={inputRef}
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter your video topic..."
            className="topic-input"
            autoComplete="off"
          />
          {topic && (
            <button
              className="topic-clear-btn"
              onClick={() => setTopic('')}
              aria-label="Clear topic"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <p className="topic-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Be specific - &ldquo;How to grow tomatoes in containers&rdquo; is better than &ldquo;gardening&rdquo;
        </p>
      </div>

      {/* Archetype selector */}
      <div className="archetype-section">
        <div className="archetype-header">
          <span className="archetype-label">Video Format</span>
          <span className="archetype-optional">Optional</span>
        </div>

        <div className="archetype-selector" ref={dropdownRef} onKeyDown={handleKeyDown}>
          <button
            className={`archetype-trigger ${isDropdownOpen ? 'open' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            style={selectedArchetype ? { '--archetype-color': selectedArchetype.color } as React.CSSProperties : undefined}
          >
            {selectedArchetype ? (
              <>
                <span
                  className="archetype-trigger-icon selected"
                  style={{ background: selectedArchetype.color }}
                >
                  {selectedArchetype.icon}
                </span>
                <span className="archetype-trigger-text">
                  <span className="archetype-trigger-name">{selectedArchetype.name}</span>
                  <span className="archetype-trigger-desc">{selectedArchetype.description}</span>
                </span>
              </>
            ) : (
              <>
                <span className="archetype-trigger-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </span>
                <span className="archetype-trigger-text">
                  <span className="archetype-trigger-name">Select a format</span>
                  <span className="archetype-trigger-desc">Choose a video style to guide generation</span>
                </span>
              </>
            )}
            <svg className="archetype-trigger-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="archetype-dropdown" role="listbox">
              {selectedArchetype && (
                <button
                  className="archetype-option archetype-option-clear"
                  onClick={() => {
                    setArchetype(null);
                    setIsDropdownOpen(false);
                  }}
                  role="option"
                >
                  <span className="archetype-option-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <span className="archetype-option-text">
                    <span className="archetype-option-name">Clear selection</span>
                    <span className="archetype-option-desc">Let AI decide the best format</span>
                  </span>
                </button>
              )}

              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.id}
                  className={`archetype-option ${archetype === arch.id ? 'selected' : ''}`}
                  onClick={() => {
                    setArchetype(arch.id);
                    setIsDropdownOpen(false);
                  }}
                  role="option"
                  aria-selected={archetype === arch.id}
                  style={{ '--archetype-color': arch.color } as React.CSSProperties}
                >
                  <span className="archetype-option-icon" style={{ background: arch.color }}>
                    {arch.icon}
                  </span>
                  <span className="archetype-option-text">
                    <span className="archetype-option-name">{arch.name}</span>
                    <span className="archetype-option-desc">{arch.description}</span>
                  </span>
                  {archetype === arch.id && (
                    <svg className="archetype-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick archetype chips for mobile/quick selection */}
      <div className="archetype-chips">
        {ARCHETYPES.slice(0, 4).map((arch) => (
          <button
            key={arch.id}
            className={`archetype-chip ${archetype === arch.id ? 'selected' : ''}`}
            onClick={() => setArchetype(archetype === arch.id ? null : arch.id)}
            style={{ '--chip-color': arch.color } as React.CSSProperties}
          >
            <span className="archetype-chip-icon">{arch.icon}</span>
            {arch.name}
          </button>
        ))}
      </div>

      <style jsx>{`
        .topic-step {
          padding: 40px 0;
        }

        /* Topic input container */
        .topic-input-container {
          position: relative;
          padding: 48px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          margin-bottom: 32px;
          overflow: hidden;
        }

        /* Decorative elements */
        .topic-input-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .decoration-line {
          position: absolute;
          background: linear-gradient(90deg, transparent, var(--node-script), transparent);
          opacity: 0.1;
        }

        .decoration-line-1 {
          height: 1px;
          width: 200px;
          top: 24px;
          right: 24px;
        }

        .decoration-line-2 {
          width: 1px;
          height: 100px;
          bottom: 24px;
          left: 24px;
          background: linear-gradient(180deg, transparent, var(--node-thumbnail), transparent);
        }

        .decoration-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .decoration-dot-1 {
          background: var(--node-script);
          top: 24px;
          right: 220px;
          opacity: 0.5;
        }

        .decoration-dot-2 {
          background: var(--node-thumbnail);
          bottom: 120px;
          left: 24px;
          opacity: 0.5;
        }

        .topic-label {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }

        .topic-input-wrapper {
          position: relative;
        }

        .topic-input {
          width: 100%;
          padding: 20px 48px 20px 24px;
          font-size: 18px;
          font-weight: 500;
          color: var(--text-primary);
          background: var(--bg-deep);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .topic-input::placeholder {
          color: var(--text-muted);
        }

        .topic-input:focus {
          border-color: var(--node-script);
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.15);
        }

        .topic-clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .topic-clear-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .topic-clear-btn svg {
          width: 16px;
          height: 16px;
        }

        .topic-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .topic-hint svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          color: var(--node-script);
        }

        /* Archetype section */
        .archetype-section {
          margin-bottom: 24px;
        }

        .archetype-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .archetype-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .archetype-optional {
          font-size: 12px;
          color: var(--text-muted);
          padding: 2px 8px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
        }

        /* Archetype selector dropdown */
        .archetype-selector {
          position: relative;
        }

        .archetype-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .archetype-trigger:hover {
          border-color: var(--border-bright);
          background: var(--bg-elevated);
        }

        .archetype-trigger.open {
          border-color: var(--archetype-color, var(--border-bright));
          box-shadow: 0 0 0 3px var(--archetype-color, var(--border))20;
        }

        .archetype-trigger-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .archetype-trigger-icon.selected {
          color: white;
        }

        .archetype-trigger-icon svg {
          width: 22px;
          height: 22px;
          color: var(--text-muted);
        }

        .archetype-trigger-icon.selected svg {
          color: white;
        }

        .archetype-trigger-text {
          flex: 1;
          min-width: 0;
        }

        .archetype-trigger-name {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .archetype-trigger-desc {
          display: block;
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .archetype-trigger-chevron {
          width: 20px;
          height: 20px;
          color: var(--text-muted);
          transition: transform 0.2s;
        }

        .archetype-trigger.open .archetype-trigger-chevron {
          transform: rotate(180deg);
        }

        /* Dropdown menu */
        .archetype-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
          z-index: 100;
          padding: 8px;
          max-height: 400px;
          overflow-y: auto;
          animation: dropdownFadeIn 0.2s ease;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .archetype-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .archetype-option:hover {
          background: var(--bg-elevated);
        }

        .archetype-option.selected {
          background: rgba(168, 85, 247, 0.1);
        }

        .archetype-option-clear {
          border-bottom: 1px solid var(--border);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          margin-bottom: 8px;
          padding-bottom: 14px;
        }

        .archetype-option-clear .archetype-option-icon {
          background: var(--bg-elevated);
        }

        .archetype-option-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .archetype-option-icon svg {
          width: 20px;
          height: 20px;
          color: white;
        }

        .archetype-option-clear .archetype-option-icon svg {
          color: var(--text-muted);
        }

        .archetype-option-text {
          flex: 1;
          min-width: 0;
        }

        .archetype-option-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .archetype-option-desc {
          display: block;
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .archetype-option-check {
          width: 20px;
          height: 20px;
          color: var(--node-script);
        }

        /* Quick chips */
        .archetype-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .archetype-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .archetype-chip:hover {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .archetype-chip.selected {
          background: var(--chip-color);
          border-color: var(--chip-color);
          color: white;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--chip-color) 40%, transparent);
        }

        .archetype-chip-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .archetype-chip-icon svg {
          width: 100%;
          height: 100%;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .topic-input-container {
            padding: 32px 24px;
          }

          .topic-label {
            font-size: 24px;
          }

          .topic-input {
            font-size: 16px;
            padding: 16px 40px 16px 16px;
          }

          .archetype-chips {
            gap: 8px;
          }

          .archetype-chip {
            padding: 8px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
