'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeationStore } from '@/stores/ideationStore';

// Toast notification component
interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function SummaryStep() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [confettiParticles, setConfettiParticles] = useState<Array<{
    id: number;
    x: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
  }>>([]);

  const {
    topic,
    archetype,
    generatedHooks,
    selectedHookIds,
    generatedTitles,
    selectedTitleIds,
    editedDescription,
    saveSelectedToLibrary,
    reset,
    goToStep,
    isLoading,
    error,
  } = useIdeationStore();

  // Generate confetti particles on mount
  useEffect(() => {
    const colors = [
      'var(--status-success)',
      'var(--node-script)',
      'var(--node-trigger)',
      'var(--node-thumbnail)',
      'var(--node-voice)',
    ];

    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
    }));

    setConfettiParticles(particles);

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Get selected items
  const selectedHooks = generatedHooks.filter((h) => selectedHookIds.includes(h.id));
  const selectedTitles = generatedTitles.filter((t) => selectedTitleIds.includes(t.id));

  // Toast management
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Handle save to library
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSelectedToLibrary();
      if (!error) {
        addToast('success', 'All content saved to your library!');
      } else {
        addToast('error', error);
      }
    } catch (err) {
      addToast('error', 'Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle starting new ideation
  const handleStartNew = () => {
    reset();
    goToStep(0);
  };

  // Handle use in pipeline
  const handleUsePipeline = () => {
    // Store selected content in sessionStorage for pipeline pre-selection
    const pipelineContent = {
      hooks: selectedHooks.map((h) => h.content),
      titles: selectedTitles.map((t) => t.content),
      description: editedDescription,
      topic,
      archetype,
    };
    sessionStorage.setItem('ideation-content', JSON.stringify(pipelineContent));
    router.push('/pipelines?from=ideation');
  };

  // Truncate description
  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength).trim() + '...';
  };

  // Style badge colors
  const STYLE_COLORS: Record<string, string> = {
    question: 'var(--node-trigger)',
    bold_claim: 'var(--status-error)',
    story: 'var(--node-voice)',
    statistic: 'var(--node-assembly)',
    controversy: 'var(--node-thumbnail)',
  };

  const STYLE_LABELS: Record<string, string> = {
    question: 'Question',
    bold_claim: 'Bold Claim',
    story: 'Story',
    statistic: 'Statistic',
    controversy: 'Controversy',
  };

  // Calculate total items
  const totalItems =
    selectedHooks.length +
    selectedTitles.length +
    (editedDescription ? 1 : 0);

  return (
    <div className="summary-step">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="confetti-particle"
              style={{
                left: `${particle.x}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                backgroundColor: particle.color,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Success Header */}
      <div className="success-header">
        <div className="success-icon-wrapper">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="success-glow" />
          <div className="success-ring" />
        </div>
        <h2 className="success-title">Ideation Complete!</h2>
        <p className="success-subtitle">
          You&apos;ve created <strong>{totalItems} content items</strong> ready for your next video
        </p>
      </div>

      {/* Summary Grid */}
      <div className="summary-grid">
        {/* Topic & Archetype Card */}
        <div className="summary-card topic-card">
          <div className="card-header">
            <div className="card-icon topic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="card-title">Topic & Archetype</h3>
          </div>
          <div className="card-content">
            <div className="topic-display">
              <span className="topic-label">Topic</span>
              <p className="topic-value">{topic}</p>
            </div>
            {archetype && (
              <div className="archetype-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {archetype.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        </div>

        {/* Hooks Card */}
        {selectedHooks.length > 0 && (
          <div className="summary-card hooks-card">
            <div className="card-header">
              <div className="card-icon hooks">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="card-title">Selected Hooks</h3>
              <span className="card-count">{selectedHooks.length}</span>
            </div>
            <div className="card-content">
              <ul className="hooks-list">
                {selectedHooks.map((hook) => (
                  <li key={hook.id} className="hook-item">
                    <span
                      className="hook-badge"
                      style={{ backgroundColor: STYLE_COLORS[hook.style] || 'var(--text-muted)' }}
                    >
                      {STYLE_LABELS[hook.style] || hook.style}
                    </span>
                    <p className="hook-content">{hook.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Titles Card */}
        {selectedTitles.length > 0 && (
          <div className="summary-card titles-card">
            <div className="card-header">
              <div className="card-icon titles">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3" />
                  <path d="M9 20h6" />
                  <path d="M12 4v16" />
                </svg>
              </div>
              <h3 className="card-title">Selected Titles</h3>
              <span className="card-count">{selectedTitles.length}</span>
            </div>
            <div className="card-content">
              <ul className="titles-list">
                {selectedTitles.map((title) => (
                  <li key={title.id} className="title-item">
                    <p className="title-content">{title.content}</p>
                    {title.charCount && (
                      <span className="char-count">{title.charCount} chars</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Description Card */}
        {editedDescription && (
          <div className="summary-card description-card">
            <div className="card-header">
              <div className="card-icon description">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="card-title">Description</h3>
              <button
                className="expand-btn"
                onClick={() => setExpandedDescription(!expandedDescription)}
              >
                {expandedDescription ? 'Collapse' : 'Expand'}
              </button>
            </div>
            <div className="card-content">
              <p className="description-preview">
                {expandedDescription
                  ? editedDescription
                  : truncateDescription(editedDescription)}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="action-btn save-btn"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <>
              <div className="btn-spinner" />
              Saving...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save All to Content Library
            </>
          )}
        </button>

        <button
          className="action-btn new-btn"
          onClick={handleStartNew}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Start New Ideation
        </button>

        <button
          className="action-btn pipeline-btn"
          onClick={handleUsePipeline}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          Use in Pipeline
          <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .summary-step {
          position: relative;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* Confetti */
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 100vh;
          pointer-events: none;
          overflow: hidden;
          z-index: 1000;
        }

        .confetti-particle {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        /* Success Header */
        .success-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .success-icon-wrapper {
          position: relative;
          display: inline-flex;
          margin-bottom: 24px;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--status-success), #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
          z-index: 2;
          animation: iconPop 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes iconPop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .success-icon svg {
          width: 40px;
          height: 40px;
          color: white;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .success-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(
            circle,
            rgba(34, 197, 94, 0.3) 0%,
            transparent 70%
          );
          border-radius: 50%;
          animation: glowPulse 2s ease infinite;
          z-index: 1;
        }

        @keyframes glowPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }

        .success-ring {
          position: absolute;
          inset: -10px;
          border: 2px solid rgba(34, 197, 94, 0.3);
          border-radius: 50%;
          animation: ringExpand 1s ease-out forwards;
        }

        @keyframes ringExpand {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .success-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .success-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
        }

        .success-subtitle strong {
          color: var(--status-success);
        }

        /* Summary Grid */
        .summary-grid {
          display: grid;
          gap: 20px;
          margin-bottom: 40px;
        }

        /* Summary Cards */
        .summary-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .summary-card:hover {
          border-color: var(--border-bright);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border);
        }

        .card-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-icon svg {
          width: 18px;
          height: 18px;
          color: white;
        }

        .card-icon.topic {
          background: linear-gradient(135deg, var(--node-trigger), #0891b2);
        }

        .card-icon.hooks {
          background: linear-gradient(135deg, var(--node-script), #9333ea);
        }

        .card-icon.titles {
          background: linear-gradient(135deg, var(--node-trigger), #06b6d4);
        }

        .card-icon.description {
          background: linear-gradient(135deg, var(--node-voice), #d97706);
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .card-count {
          padding: 4px 10px;
          background: var(--bg-hover);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .expand-btn {
          padding: 6px 12px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .expand-btn:hover {
          background: var(--bg-surface);
          color: var(--text-primary);
          border-color: var(--border-bright);
        }

        .card-content {
          padding: 20px;
        }

        /* Topic Card */
        .topic-display {
          margin-bottom: 16px;
        }

        .topic-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-bottom: 6px;
          display: block;
        }

        .topic-value {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.5;
        }

        .archetype-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: linear-gradient(
            135deg,
            rgba(168, 85, 247, 0.15),
            rgba(236, 72, 153, 0.15)
          );
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          color: var(--node-script);
          text-transform: capitalize;
        }

        .archetype-badge svg {
          width: 14px;
          height: 14px;
          color: var(--node-thumbnail);
        }

        /* Hooks List */
        .hooks-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hook-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--node-script);
        }

        .hook-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
        }

        .hook-content {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.5;
        }

        /* Titles List */
        .titles-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .title-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--node-trigger);
        }

        .title-content {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.4;
          flex: 1;
        }

        .char-count {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* Description Preview */
        .description-preview {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          white-space: pre-wrap;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 24px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-btn svg {
          width: 18px;
          height: 18px;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Save Button */
        .save-btn {
          background: linear-gradient(135deg, var(--status-success), #059669);
          border: none;
          color: white;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(34, 197, 94, 0.4);
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* New Button */
        .new-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .new-btn:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-bright);
          transform: translateY(-2px);
        }

        /* Pipeline Button */
        .pipeline-btn {
          background: linear-gradient(135deg, var(--node-script), var(--node-thumbnail));
          border: none;
          color: white;
          box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
        }

        .pipeline-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);
        }

        .pipeline-btn .arrow-icon {
          width: 16px;
          height: 16px;
          transition: transform 0.2s ease;
        }

        .pipeline-btn:hover .arrow-icon {
          transform: translateX(4px);
        }

        /* Toast Container */
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 1000;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: toastSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes toastSlide {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toast.success {
          border-color: var(--status-success);
        }

        .toast.error {
          border-color: var(--status-error);
        }

        .toast-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast.success .toast-icon svg {
          color: var(--status-success);
        }

        .toast.error .toast-icon svg {
          color: var(--status-error);
        }

        .toast-icon svg {
          width: 20px;
          height: 20px;
        }

        .toast-message {
          font-size: 14px;
          color: var(--text-primary);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .summary-step {
            padding: 24px 16px 60px;
          }

          .success-title {
            font-size: 24px;
          }

          .success-icon {
            width: 64px;
            height: 64px;
          }

          .success-icon svg {
            width: 32px;
            height: 32px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default SummaryStep;
