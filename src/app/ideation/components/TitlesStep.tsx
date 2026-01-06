'use client';

import { useIdeationStore } from '@/stores/ideationStore';
import { useCallback, useMemo } from 'react';

const POWER_WORDS = [
  'Secret', 'Hidden', 'Shocking', 'Ultimate', 'Proven',
  'Never', 'Always', 'Truth', 'Exposed', 'Revealed',
  'Amazing', 'Essential', 'Revolutionary', 'Exclusive', 'Insane',
];

function getCharCountColor(count: number): { color: string; label: string; bg: string } {
  if (count <= 50) return { color: 'text-emerald-400', label: 'Perfect', bg: 'bg-emerald-500/20' };
  if (count <= 60) return { color: 'text-cyan-400', label: 'Good', bg: 'bg-cyan-500/20' };
  if (count <= 70) return { color: 'text-amber-400', label: 'Long', bg: 'bg-amber-500/20' };
  return { color: 'text-red-400', label: 'Too long', bg: 'bg-red-500/20' };
}

function highlightPowerWords(text: string): React.ReactNode[] {
  const words = text.split(/(\s+)/);
  return words.map((word, i) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    const isPowerWord = POWER_WORDS.some(
      pw => cleanWord.toLowerCase() === pw.toLowerCase()
    );
    if (isPowerWord) {
      return <span key={i} className="text-cyan-300 font-semibold">{word}</span>;
    }
    return <span key={i}>{word}</span>;
  });
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

export function TitlesStep() {
  const {
    generatedTitles,
    selectedTitleIds,
    isGeneratingTitles,
    generateTitles,
    toggleTitleSelection,
    selectedHookIds,
    generatedHooks,
  } = useIdeationStore();

  const selectedHooks = useMemo(() => {
    return generatedHooks.filter(h => selectedHookIds.includes(h.id));
  }, [generatedHooks, selectedHookIds]);

  const handleGenerate = useCallback(() => {
    generateTitles(5);
  }, [generateTitles]);

  const handleGenerateMore = useCallback(() => {
    generateTitles(3);
  }, [generateTitles]);

  const hasContent = generatedTitles.length > 0;

  return (
    <div className="titles-step">
      {/* Context - Selected Hooks */}
      {selectedHooks.length > 0 && (
        <div className="context-panel">
          <div className="context-header">
            <span className="context-dot" />
            <span className="context-label">Based on your hooks</span>
          </div>
          <div className="context-items">
            {selectedHooks.slice(0, 2).map((hook) => (
              <p key={hook.id} className="context-item">&ldquo;{hook.content}&rdquo;</p>
            ))}
            {selectedHooks.length > 2 && (
              <span className="context-more">+{selectedHooks.length - 2} more</span>
            )}
          </div>
        </div>
      )}

      {/* Empty State / Generate */}
      {!hasContent && (
        <div className="empty-state">
          <div className="empty-content">
            <div className="empty-icon-row">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 8h10M7 12h6" />
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                </svg>
              </div>
              <div className="empty-line" />
              <div className="empty-badge">5 titles</div>
            </div>

            <h3 className="empty-title">Generate Titles</h3>
            <p className="empty-desc">
              Create click-worthy titles optimized for YouTube search and discovery
            </p>

            <button
              onClick={handleGenerate}
              disabled={isGeneratingTitles}
              className="generate-btn"
            >
              {isGeneratingTitles ? (
                <>
                  <span className="spinner" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <span>Generate Titles</span>
                </>
              )}
            </button>

            <div className="empty-hints">
              <div className="hint">
                <span className="hint-dot hint-dot-green" />
                <span>50-60 chars ideal</span>
              </div>
              <div className="hint">
                <span className="hint-dot hint-dot-purple" />
                <span>Numbers boost CTR</span>
              </div>
              <div className="hint">
                <span className="hint-dot hint-dot-cyan" />
                <span>Power words convert</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGeneratingTitles && !hasContent && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-bars">
              <div className="bar bar-1" />
              <div className="bar bar-2" />
              <div className="bar bar-3" />
            </div>
            <span className="loading-text">Crafting titles...</span>
          </div>
        </div>
      )}

      {/* Titles Grid */}
      {hasContent && (
        <div className="titles-section">
          <div className="titles-header">
            <span className="titles-count">{generatedTitles.length} titles</span>
            {selectedTitleIds.length > 0 && (
              <span className="selection-badge">{selectedTitleIds.length} selected</span>
            )}
          </div>

          <div className="titles-grid">
            {generatedTitles.map((title, index) => {
              const isSelected = selectedTitleIds.includes(title.id);
              const charCount = title.charCount || title.content.length;
              const { color: charColor, label: charLabel, bg: charBg } = getCharCountColor(charCount);
              const titleHasNumber = title.hasNumber ?? hasNumber(title.content);

              return (
                <button
                  key={title.id}
                  onClick={() => toggleTitleSelection(title.id)}
                  className={`title-card ${isSelected ? 'selected' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="title-content">
                    <p className="title-text">{highlightPowerWords(title.content)}</p>
                    <div className="title-meta">
                      <span className={`char-badge ${charBg} ${charColor}`}>
                        {charCount} · {charLabel}
                      </span>
                      {titleHasNumber && (
                        <span className="feature-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          Number
                        </span>
                      )}
                      {title.hasPowerWord && (
                        <span className="feature-badge feature-badge-cyan">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                          Power
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="title-check">
                    {isSelected ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <div className="check-empty" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Generate More */}
          <button
            onClick={handleGenerateMore}
            disabled={isGeneratingTitles}
            className="generate-more-btn"
          >
            {isGeneratingTitles ? (
              <span className="spinner-small" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            <span>Generate More</span>
          </button>
        </div>
      )}

      <style jsx>{`
        .titles-step {
          padding: 8px 0;
        }

        /* Context Panel */
        .context-panel {
          margin-bottom: 24px;
          padding: 16px 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }

        .context-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .context-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--node-trigger);
        }

        .context-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .context-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .context-item {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          padding-left: 14px;
          border-left: 2px solid var(--border-bright);
          line-height: 1.5;
        }

        .context-more {
          font-size: 12px;
          color: var(--text-muted);
          padding-left: 14px;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          justify-content: center;
          padding: 48px 24px;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
        }

        .empty-icon-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          width: 100%;
          justify-content: center;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, var(--node-trigger), #0891b2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .empty-icon svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .empty-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--node-trigger), transparent);
          max-width: 80px;
        }

        .empty-badge {
          padding: 6px 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .empty-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .empty-desc {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 28px 0;
          line-height: 1.6;
        }

        .generate-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, var(--node-trigger), #0891b2);
          border: none;
          border-radius: var(--radius-lg);
          font-size: 15px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 24px rgba(6, 182, 212, 0.3);
        }

        .generate-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(6, 182, 212, 0.4);
        }

        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .generate-btn svg {
          width: 18px;
          height: 18px;
        }

        .empty-hints {
          display: flex;
          gap: 20px;
          margin-top: 32px;
        }

        .hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .hint-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .hint-dot-green { background: #22c55e; }
        .hint-dot-purple { background: #a855f7; }
        .hint-dot-cyan { background: #06b6d4; }

        /* Loading */
        .loading-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 12, 0.8);
          backdrop-filter: blur(4px);
          z-index: 10;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 32px;
        }

        .bar {
          width: 4px;
          background: var(--node-trigger);
          border-radius: 2px;
          animation: bars 1s ease-in-out infinite;
        }

        .bar-1 { height: 12px; animation-delay: 0s; }
        .bar-2 { height: 20px; animation-delay: 0.2s; }
        .bar-3 { height: 16px; animation-delay: 0.4s; }

        @keyframes bars {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }

        .loading-text {
          font-size: 13px;
          color: var(--text-muted);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border-bright);
          border-top-color: var(--node-trigger);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Titles Section */
        .titles-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .titles-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .titles-count {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .selection-badge {
          padding: 4px 10px;
          background: var(--node-trigger);
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 600;
          color: white;
        }

        .titles-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .title-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          animation: fadeIn 0.3s ease-out both;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .title-card:hover {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
        }

        .title-card.selected {
          background: rgba(6, 182, 212, 0.08);
          border-color: var(--node-trigger);
        }

        .title-content {
          flex: 1;
          min-width: 0;
        }

        .title-text {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.5;
          margin: 0 0 10px 0;
        }

        .title-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .char-badge {
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
        }

        .feature-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(168, 85, 247, 0.15);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 500;
          color: #a855f7;
        }

        .feature-badge-cyan {
          background: rgba(6, 182, 212, 0.15);
          color: #06b6d4;
        }

        .feature-badge svg {
          width: 12px;
          height: 12px;
        }

        .title-check {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title-card.selected .title-check {
          background: var(--node-trigger);
          border-radius: var(--radius-sm);
          color: white;
        }

        .title-check svg {
          width: 14px;
          height: 14px;
        }

        .check-empty {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          transition: border-color 0.15s;
        }

        .title-card:hover .check-empty {
          border-color: var(--border-bright);
        }

        .generate-more-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: transparent;
          border: 1px dashed var(--border);
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }

        .generate-more-btn:not(:disabled):hover {
          border-color: var(--node-trigger);
          color: var(--node-trigger);
          background: rgba(6, 182, 212, 0.05);
        }

        .generate-more-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .generate-more-btn svg {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
}
