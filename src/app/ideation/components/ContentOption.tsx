'use client';

import { useState } from 'react';

interface ContentOptionProps {
  id: string;
  content: string;
  type: 'hook' | 'title' | 'description' | 'thumbnail';
  isSelected: boolean;
  onToggle: (id: string) => void;
  metadata?: {
    style?: string;
    hasNumber?: boolean;
    hasPowerWord?: boolean;
    charCount?: number;
  };
}

const TYPE_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
  hook: { color: 'var(--node-script)', glow: 'var(--node-script-glow)', label: 'Hook' },
  title: { color: 'var(--node-trigger)', glow: 'var(--node-trigger-glow)', label: 'Title' },
  description: { color: 'var(--node-voice)', glow: 'var(--node-voice-glow)', label: 'Description' },
  thumbnail: { color: 'var(--node-thumbnail)', glow: 'var(--node-thumbnail-glow)', label: 'Thumbnail' },
};

const STYLE_LABELS: Record<string, string> = {
  question: 'Question',
  bold_claim: 'Bold Claim',
  story: 'Story',
  statistic: 'Statistic',
  controversy: 'Controversy',
};

export function ContentOption({
  id,
  content,
  type,
  isSelected,
  onToggle,
  metadata,
}: ContentOptionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.hook;

  return (
    <div
      className={`content-option ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(id);
        }
      }}
      aria-pressed={isSelected}
    >
      {/* Left Border Accent */}
      <div className="accent-border" style={{ background: config.color }} />

      {/* Checkbox */}
      <div className="checkbox-container">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(id)}
          className="checkbox-input"
          aria-label={`Select ${type}`}
        />
        <div className="checkbox-visual">
          {isSelected && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="option-content">
        {/* Metadata Badges */}
        {metadata && (
          <div className="metadata-row">
            {metadata.style && (
              <span className="style-badge" style={{ borderColor: config.color, color: config.color }}>
                {STYLE_LABELS[metadata.style] || metadata.style}
              </span>
            )}
            {metadata.hasNumber && (
              <span className="feature-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h8m-8 5h16m-8 5h8" />
                </svg>
                Number
              </span>
            )}
            {metadata.hasPowerWord && (
              <span className="feature-badge power">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Power Word
              </span>
            )}
            {metadata.charCount !== undefined && (
              <span className="char-count">{metadata.charCount} chars</span>
            )}
          </div>
        )}

        {/* Main Content */}
        <p className="content-text">{content}</p>
      </div>

      {/* Selection Indicator Glow */}
      <div
        className="selection-glow"
        style={{
          background: isSelected
            ? `radial-gradient(ellipse at center, ${config.glow} 0%, transparent 70%)`
            : 'transparent',
        }}
      />

      {/* Hover Shimmer Effect */}
      <div className={`hover-shimmer ${isHovered && !isSelected ? 'active' : ''}`} />

      <style jsx>{`
        .content-option {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px 16px 0;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .content-option:hover {
          border-color: var(--border-bright);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .content-option.selected {
          border-color: ${config.color};
          background: linear-gradient(
            135deg,
            var(--bg-surface) 0%,
            rgba(168, 85, 247, 0.03) 100%
          );
          box-shadow: 0 0 0 1px ${config.color}, 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .content-option:focus-visible {
          outline: 2px solid ${config.color};
          outline-offset: 2px;
        }

        /* Accent Border */
        .accent-border {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .content-option:hover .accent-border,
        .content-option.selected .accent-border {
          opacity: 1;
        }

        /* Checkbox */
        .checkbox-container {
          position: relative;
          margin-left: 16px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .checkbox-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .checkbox-visual {
          width: 22px;
          height: 22px;
          border: 2px solid var(--border-bright);
          border-radius: var(--radius-sm);
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .content-option:hover .checkbox-visual {
          border-color: var(--text-muted);
        }

        .checkbox-input:checked + .checkbox-visual {
          background: ${config.color};
          border-color: ${config.color};
          transform: scale(1.05);
        }

        .checkbox-visual svg {
          width: 14px;
          height: 14px;
          color: white;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* Content Area */
        .option-content {
          flex: 1;
          min-width: 0;
        }

        .metadata-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
          align-items: center;
        }

        .style-badge {
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid;
          border-radius: 20px;
          background: transparent;
        }

        .feature-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 500;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border-radius: 12px;
        }

        .feature-badge svg {
          width: 10px;
          height: 10px;
          opacity: 0.7;
        }

        .feature-badge.power {
          color: var(--status-warning);
        }

        .feature-badge.power svg {
          stroke: var(--status-warning);
        }

        .char-count {
          font-size: 11px;
          color: var(--text-muted);
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace;
        }

        .content-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
          word-wrap: break-word;
        }

        .content-option.selected .content-text {
          color: var(--text-primary);
        }

        /* Selection Glow */
        .selection-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }

        /* Hover Shimmer */
        .hover-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.03) 50%,
            transparent 100%
          );
          pointer-events: none;
          opacity: 0;
        }

        .hover-shimmer.active {
          animation: shimmer 0.8s ease-out;
        }

        @keyframes shimmer {
          0% {
            left: -100%;
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default ContentOption;
