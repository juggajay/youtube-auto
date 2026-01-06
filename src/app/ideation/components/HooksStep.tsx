'use client';

import { useState } from 'react';
import { useIdeationStore } from '@/stores/ideationStore';
import type { HookStyle } from '@/lib/ideation/types';

const HOOK_STYLES: { id: HookStyle; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'question',
    label: 'Question',
    description: 'Engage with curiosity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'bold_claim',
    label: 'Bold Claim',
    description: 'Make a strong statement',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'story',
    label: 'Story',
    description: 'Start with narrative',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: 'statistic',
    label: 'Statistic',
    description: 'Lead with data',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'controversy',
    label: 'Controversy',
    description: 'Challenge assumptions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

const STYLE_COLORS: Record<HookStyle, string> = {
  question: 'var(--node-trigger)',
  bold_claim: 'var(--node-voice)',
  story: 'var(--node-thumbnail)',
  statistic: 'var(--node-assembly)',
  controversy: 'var(--node-publish)',
};

export function HooksStep() {
  const {
    topic,
    generatedHooks,
    selectedHookIds,
    isGeneratingHooks,
    generateHooks,
    toggleHookSelection,
  } = useIdeationStore();

  const [selectedStyles, setSelectedStyles] = useState<HookStyle[]>([]);
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const toggleStyle = (style: HookStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleGenerate = async () => {
    await generateHooks(5, selectedStyles.length > 0 ? selectedStyles : undefined);
  };

  const handleGenerateMore = async () => {
    await generateHooks(3, selectedStyles.length > 0 ? selectedStyles : undefined);
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || selectedHookIds.length === 0) return;

    setIsRefining(true);
    // TODO: Implement refine with AI - for now just regenerate
    await generateHooks(3, selectedStyles.length > 0 ? selectedStyles : undefined);
    setIsRefining(false);
    setRefineInput('');
  };

  const selectedCount = selectedHookIds.length;
  const hasHooks = generatedHooks.length > 0;

  return (
    <div className="hooks-step">
      {/* Header section */}
      <div className="hooks-header">
        <div className="hooks-header-content">
          <h2 className="hooks-title">Generate Hooks</h2>
          <p className="hooks-description">
            Create attention-grabbing opening lines for your video about{' '}
            <span className="hooks-topic">{topic}</span>
          </p>
        </div>

        {selectedCount > 0 && (
          <div className="hooks-selection-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {selectedCount} selected
          </div>
        )}
      </div>

      {/* Style selector */}
      <div className="style-selector">
        <div className="style-selector-header">
          <span className="style-selector-label">Hook Styles</span>
          <span className="style-selector-hint">
            {selectedStyles.length === 0 ? 'All styles' : `${selectedStyles.length} selected`}
          </span>
        </div>
        <div className="style-chips">
          {HOOK_STYLES.map((style) => (
            <button
              key={style.id}
              className={`style-chip ${selectedStyles.includes(style.id) ? 'selected' : ''}`}
              onClick={() => toggleStyle(style.id)}
              style={{ '--style-color': STYLE_COLORS[style.id] } as React.CSSProperties}
            >
              <span className="style-chip-icon">{style.icon}</span>
              <span className="style-chip-label">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button or results */}
      {!hasHooks ? (
        <div className="generate-section">
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isGeneratingHooks}
          >
            {isGeneratingHooks ? (
              <>
                <span className="generate-spinner" />
                Generating hooks...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Generate Hooks
              </>
            )}
          </button>
          <p className="generate-hint">
            We&apos;ll create 5 unique hooks based on your topic and selected styles
          </p>
        </div>
      ) : (
        <>
          {/* Hooks grid */}
          <div className="hooks-grid">
            {isGeneratingHooks && (
              // Skeleton cards during generation
              <>
                {[1, 2, 3].map((i) => (
                  <div key={`skeleton-${i}`} className="hook-card hook-card-skeleton">
                    <div className="skeleton-line skeleton-line-long" />
                    <div className="skeleton-line skeleton-line-medium" />
                    <div className="skeleton-badge" />
                  </div>
                ))}
              </>
            )}

            {generatedHooks.map((hook) => {
              const isSelected = selectedHookIds.includes(hook.id);
              const styleInfo = HOOK_STYLES.find((s) => s.id === hook.style);

              return (
                <button
                  key={hook.id}
                  className={`hook-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleHookSelection(hook.id)}
                  style={{ '--hook-color': STYLE_COLORS[hook.style] } as React.CSSProperties}
                >
                  <div className="hook-card-content">
                    <p className="hook-text">{hook.content}</p>
                    <div className="hook-card-footer">
                      <span
                        className="hook-style-badge"
                        style={{ background: STYLE_COLORS[hook.style] }}
                      >
                        {styleInfo?.icon}
                        {styleInfo?.label}
                      </span>
                    </div>
                  </div>
                  <div className="hook-card-checkbox">
                    {isSelected ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <div className="hook-checkbox-empty" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions section */}
          <div className="hooks-actions">
            <button
              className="generate-more-btn"
              onClick={handleGenerateMore}
              disabled={isGeneratingHooks}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Generate More
            </button>
          </div>

          {/* Refine section */}
          {selectedCount > 0 && (
            <div className="refine-section">
              <div className="refine-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Refine with AI</span>
              </div>
              <div className="refine-input-wrapper">
                <input
                  type="text"
                  value={refineInput}
                  onChange={(e) => setRefineInput(e.target.value)}
                  placeholder="Make it more urgent, add humor, shorter..."
                  className="refine-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                />
                <button
                  className="refine-btn"
                  onClick={handleRefine}
                  disabled={!refineInput.trim() || isRefining}
                >
                  {isRefining ? (
                    <span className="refine-spinner" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .hooks-step {
          padding: 24px 0;
        }

        /* Header */
        .hooks-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .hooks-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .hooks-description {
          font-size: 15px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .hooks-topic {
          color: var(--node-script);
          font-weight: 500;
        }

        .hooks-selection-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, var(--node-script), #9333ea);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .hooks-selection-badge svg {
          width: 16px;
          height: 16px;
        }

        /* Style selector */
        .style-selector {
          margin-bottom: 28px;
        }

        .style-selector-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .style-selector-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .style-selector-hint {
          font-size: 13px;
          color: var(--text-muted);
        }

        .style-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .style-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .style-chip:hover {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .style-chip.selected {
          background: color-mix(in srgb, var(--style-color) 15%, transparent);
          border-color: var(--style-color);
          color: var(--text-primary);
        }

        .style-chip.selected .style-chip-icon {
          color: var(--style-color);
        }

        .style-chip-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .style-chip-icon svg {
          width: 100%;
          height: 100%;
        }

        /* Generate section */
        .generate-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 64px 24px;
          background: var(--bg-surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius-xl);
        }

        .generate-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, var(--node-script), #9333ea);
          border: none;
          border-radius: var(--radius-lg);
          font-size: 16px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3);
        }

        .generate-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(168, 85, 247, 0.4);
        }

        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .generate-btn svg {
          width: 20px;
          height: 20px;
        }

        .generate-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .generate-hint {
          margin-top: 16px;
          font-size: 14px;
          color: var(--text-muted);
        }

        /* Hooks grid */
        .hooks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .hook-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .hook-card:hover {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
        }

        .hook-card.selected {
          background: color-mix(in srgb, var(--hook-color) 8%, var(--bg-surface));
          border-color: var(--hook-color);
          box-shadow: 0 4px 20px color-mix(in srgb, var(--hook-color) 20%, transparent);
        }

        .hook-card-content {
          flex: 1;
          min-width: 0;
        }

        .hook-text {
          font-size: 15px;
          line-height: 1.5;
          color: var(--text-primary);
          margin: 0 0 16px 0;
        }

        .hook-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hook-style-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hook-style-badge svg {
          width: 12px;
          height: 12px;
        }

        .hook-card-checkbox {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hook-card.selected .hook-card-checkbox {
          background: var(--hook-color);
          color: white;
        }

        .hook-card-checkbox svg {
          width: 16px;
          height: 16px;
        }

        .hook-checkbox-empty {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-radius: 4px;
        }

        .hook-card:hover .hook-checkbox-empty {
          border-color: var(--border-bright);
        }

        /* Skeleton */
        .hook-card-skeleton {
          cursor: default;
          pointer-events: none;
          min-height: 140px;
        }

        .skeleton-line {
          height: 14px;
          background: var(--bg-elevated);
          border-radius: 7px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-line-long {
          width: 90%;
          margin-bottom: 10px;
        }

        .skeleton-line-medium {
          width: 60%;
          margin-bottom: 20px;
        }

        .skeleton-badge {
          width: 80px;
          height: 24px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Actions */
        .hooks-actions {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        .generate-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .generate-more-btn:not(:disabled):hover {
          background: var(--bg-elevated);
          border-color: var(--border-bright);
          color: var(--text-primary);
        }

        .generate-more-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .generate-more-btn svg {
          width: 18px;
          height: 18px;
        }

        /* Refine section */
        .refine-section {
          padding: 20px 24px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }

        .refine-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .refine-header svg {
          width: 18px;
          height: 18px;
          color: var(--node-script);
        }

        .refine-input-wrapper {
          display: flex;
          gap: 12px;
        }

        .refine-input {
          flex: 1;
          padding: 12px 16px;
          background: var(--bg-deep);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
        }

        .refine-input::placeholder {
          color: var(--text-muted);
        }

        .refine-input:focus {
          border-color: var(--node-script);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
        }

        .refine-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--node-script), #9333ea);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .refine-btn:not(:disabled):hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
        }

        .refine-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refine-btn svg {
          width: 18px;
          height: 18px;
        }

        .refine-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .hooks-header {
            flex-direction: column;
            gap: 16px;
          }

          .hooks-title {
            font-size: 24px;
          }

          .hooks-grid {
            grid-template-columns: 1fr;
          }

          .style-chips {
            gap: 8px;
          }

          .style-chip {
            padding: 8px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
