'use client';

import { useIdeationStore } from '@/stores/ideationStore';
import { useCallback, useMemo, useRef } from 'react';

const YOUTUBE_DESCRIPTION_LIMIT = 5000;

export function DescriptionStep() {
  const {
    generatedDescription,
    editedDescription,
    isGeneratingDescription,
    generateDescription,
    setEditedDescription,
    selectedTitleIds,
    generatedTitles,
  } = useIdeationStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedTitle = useMemo(() => {
    return generatedTitles.find(t => selectedTitleIds.includes(t.id));
  }, [generatedTitles, selectedTitleIds]);

  const handleGenerate = useCallback(() => {
    generateDescription();
  }, [generateDescription]);

  const handleRegenerate = useCallback(() => {
    generateDescription();
  }, [generateDescription]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedDescription(e.target.value);
  }, [setEditedDescription]);

  const charCount = editedDescription?.length || 0;
  const charPercentage = Math.min((charCount / YOUTUBE_DESCRIPTION_LIMIT) * 100, 100);
  const hasContent = !!(generatedDescription || editedDescription);
  const isModified = editedDescription !== generatedDescription;

  const getCharStatus = () => {
    if (charCount < 500) return { color: 'var(--text-muted)', label: 'Short', bg: 'var(--bg-elevated)' };
    if (charCount < 2000) return { color: '#22c55e', label: 'Good', bg: 'rgba(34, 197, 94, 0.15)' };
    if (charCount < 4000) return { color: '#f59e0b', label: 'Long', bg: 'rgba(245, 158, 11, 0.15)' };
    return { color: '#ef4444', label: 'Near limit', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  const status = getCharStatus();

  return (
    <div className="description-step">
      {/* Context - Selected Title */}
      {selectedTitle && (
        <div className="context-panel">
          <div className="context-header">
            <span className="context-dot" />
            <span className="context-label">For your video</span>
          </div>
          <p className="context-title">{selectedTitle.content}</p>
        </div>
      )}

      {/* Empty State / Generate */}
      {!hasContent && !isGeneratingDescription && (
        <div className="empty-state">
          <div className="empty-content">
            <div className="empty-icon-row">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </div>
              <div className="empty-line" />
              <div className="empty-badge">SEO optimized</div>
            </div>

            <h3 className="empty-title">Generate Description</h3>
            <p className="empty-desc">
              Create an engaging, SEO-optimized description with timestamps, links, and CTAs
            </p>

            <button
              onClick={handleGenerate}
              disabled={isGeneratingDescription}
              className="generate-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>Generate Description</span>
            </button>

            <div className="empty-features">
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Timestamps</span>
              </div>
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>Links</span>
              </div>
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>CTAs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGeneratingDescription && !hasContent && (
        <div className="loading-state">
          <div className="loading-content">
            <div className="loading-icon">
              <div className="loading-ring" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </div>
            <span className="loading-text">Writing your description...</span>
          </div>
        </div>
      )}

      {/* Description Editor */}
      {hasContent && (
        <div className="editor-section">
          {/* Editor Header */}
          <div className="editor-header">
            <div className="editor-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
              <span>Description</span>
              {isModified && <span className="modified-badge">Modified</span>}
            </div>
            <button
              onClick={handleRegenerate}
              disabled={isGeneratingDescription}
              className="regenerate-btn"
            >
              {isGeneratingDescription ? (
                <span className="spinner-small" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              )}
              <span>Regenerate</span>
            </button>
          </div>

          {/* Textarea */}
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              value={editedDescription || ''}
              onChange={handleDescriptionChange}
              placeholder="Your video description will appear here..."
              className="editor-textarea"
            />
          </div>

          {/* Character Count Bar */}
          <div className="char-section">
            <div className="char-bar">
              <div
                className="char-fill"
                style={{
                  width: `${charPercentage}%`,
                  background: status.color
                }}
              />
            </div>
            <div className="char-info">
              <span className="char-count" style={{ color: status.color }}>
                {charCount.toLocaleString()}
              </span>
              <span className="char-divider">/</span>
              <span className="char-limit">{YOUTUBE_DESCRIPTION_LIMIT.toLocaleString()}</span>
              <span className="char-label" style={{ background: status.bg, color: status.color }}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="tips-row">
            <div className="tip">
              <span className="tip-dot" style={{ background: '#22c55e' }} />
              <span>First 200 chars appear in search</span>
            </div>
            <div className="tip">
              <span className="tip-dot" style={{ background: '#3b82f6' }} />
              <span>Include keywords naturally</span>
            </div>
            <div className="tip">
              <span className="tip-dot" style={{ background: '#f59e0b' }} />
              <span>Add timestamps for chapters</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .description-step {
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
          margin-bottom: 10px;
        }

        .context-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--node-voice);
        }

        .context-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .context-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
          padding-left: 14px;
          border-left: 2px solid var(--node-voice);
          line-height: 1.5;
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
          background: linear-gradient(135deg, var(--node-voice), #d97706);
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
          background: linear-gradient(90deg, var(--node-voice), transparent);
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
          background: linear-gradient(135deg, var(--node-voice), #d97706);
          border: none;
          border-radius: var(--radius-lg);
          font-size: 15px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 24px rgba(245, 158, 11, 0.3);
        }

        .generate-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
        }

        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .generate-btn svg {
          width: 18px;
          height: 18px;
        }

        .empty-features {
          display: flex;
          gap: 24px;
          margin-top: 32px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .feature svg {
          width: 16px;
          height: 16px;
          color: var(--node-voice);
        }

        /* Loading State */
        .loading-state {
          display: flex;
          justify-content: center;
          padding: 64px 24px;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .loading-icon {
          position: relative;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-ring {
          position: absolute;
          inset: 0;
          border: 2px solid var(--border);
          border-top-color: var(--node-voice);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-icon svg {
          width: 28px;
          height: 28px;
          color: var(--node-voice);
        }

        .loading-text {
          font-size: 14px;
          color: var(--text-muted);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Editor Section */
        .editor-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .editor-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .editor-title svg {
          width: 18px;
          height: 18px;
          color: var(--node-voice);
        }

        .modified-badge {
          padding: 3px 8px;
          background: rgba(245, 158, 11, 0.15);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 500;
          color: var(--node-voice);
        }

        .regenerate-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }

        .regenerate-btn:not(:disabled):hover {
          background: var(--bg-elevated);
          border-color: var(--node-voice);
          color: var(--node-voice);
        }

        .regenerate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .regenerate-btn svg {
          width: 14px;
          height: 14px;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border);
          border-top-color: var(--node-voice);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .textarea-wrapper {
          position: relative;
        }

        .editor-textarea {
          width: 100%;
          height: 280px;
          padding: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-primary);
          resize: none;
          outline: none;
          transition: border-color 0.15s;
        }

        .editor-textarea::placeholder {
          color: var(--text-muted);
        }

        .editor-textarea:focus {
          border-color: var(--node-voice);
        }

        .char-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .char-bar {
          flex: 1;
          height: 3px;
          background: var(--bg-elevated);
          border-radius: 2px;
          overflow: hidden;
        }

        .char-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s, background 0.3s;
        }

        .char-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          flex-shrink: 0;
        }

        .char-count {
          font-weight: 600;
          font-family: 'SF Mono', monospace;
        }

        .char-divider {
          color: var(--text-muted);
        }

        .char-limit {
          color: var(--text-muted);
          font-family: 'SF Mono', monospace;
        }

        .char-label {
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
        }

        .tips-row {
          display: flex;
          gap: 20px;
          padding-top: 8px;
        }

        .tip {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .tip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
