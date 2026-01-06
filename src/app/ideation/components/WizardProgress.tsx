'use client';

import { useIdeationStore } from '@/stores/ideationStore';

interface WizardProgressProps {
  steps: string[];
}

const STEP_ICONS = [
  // Topic - lightbulb
  <svg key="topic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>,
  // Hooks - anchor/hook
  <svg key="hooks" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="3" />
    <path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3" />
  </svg>,
  // Titles - text
  <svg key="titles" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v16" />
  </svg>,
  // Description - document
  <svg key="description" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>,
  // Thumbnail - image
  <svg key="thumbnail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>,
];

const STEP_COLORS = [
  'var(--node-script)',      // Topic - purple
  'var(--node-trigger)',     // Hooks - cyan
  'var(--node-voice)',       // Titles - amber
  'var(--node-assembly)',    // Description - green
  'var(--node-thumbnail)',   // Thumbnail - pink
];

export function WizardProgress({ steps }: WizardProgressProps) {
  const { currentStep, completedSteps, goToStep } = useIdeationStore();

  const getStepStatus = (index: number): 'completed' | 'current' | 'pending' => {
    if (completedSteps.includes(index)) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const canNavigateTo = (index: number): boolean => {
    return completedSteps.includes(index) || index === currentStep;
  };

  const handleStepClick = (index: number) => {
    if (canNavigateTo(index)) {
      goToStep(index);
    }
  };

  return (
    <div className="wizard-progress">
      <div className="wizard-progress-track" aria-hidden="true" />
      <div
        className="wizard-progress-fill"
        aria-hidden="true"
        style={{
          width: `${(Math.max(0, ...completedSteps, currentStep) / (steps.length - 1)) * 100}%`
        }}
      />

      <div className="wizard-steps">
        {steps.map((label, index) => {
          const status = getStepStatus(index);
          const isNavigable = canNavigateTo(index);

          return (
            <button
              key={label}
              className={`wizard-step wizard-step-${status}`}
              onClick={() => handleStepClick(index)}
              disabled={!isNavigable}
              aria-current={status === 'current' ? 'step' : undefined}
              style={{
                '--step-color': STEP_COLORS[index],
                '--step-glow': `${STEP_COLORS[index]}40`,
              } as React.CSSProperties}
            >
              <div className="wizard-step-indicator">
                <div className="wizard-step-ring" />
                <div className="wizard-step-icon">
                  {status === 'completed' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    STEP_ICONS[index]
                  )}
                </div>
              </div>
              <span className="wizard-step-label">{label}</span>
              {status === 'current' && (
                <span className="wizard-step-pulse" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .wizard-progress {
          position: relative;
          z-index: 1;
          padding: 32px 48px 24px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
        }

        .wizard-progress-track {
          position: absolute;
          top: 56px;
          left: 120px;
          right: 120px;
          height: 2px;
          background: var(--bg-elevated);
          border-radius: 1px;
        }

        .wizard-progress-fill {
          position: absolute;
          top: 56px;
          left: 120px;
          height: 2px;
          background: linear-gradient(90deg, var(--node-script), var(--node-thumbnail));
          border-radius: 1px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: calc(100% - 240px);
        }

        .wizard-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
        }

        .wizard-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .wizard-step:disabled {
          cursor: not-allowed;
        }

        .wizard-step-indicator {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 1;
        }

        .wizard-step-ring {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          border: 2px solid var(--border);
          background: var(--bg-surface);
          transition: all 0.3s ease;
        }

        .wizard-step-icon {
          position: relative;
          z-index: 1;
          width: 22px;
          height: 22px;
          color: var(--text-muted);
          transition: all 0.3s ease;
        }

        .wizard-step-icon svg {
          width: 100%;
          height: 100%;
        }

        .wizard-step-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        /* Pending state */
        .wizard-step-pending .wizard-step-indicator {
          opacity: 0.6;
        }

        .wizard-step-pending:not(:disabled):hover .wizard-step-indicator {
          opacity: 0.8;
        }

        /* Completed state */
        .wizard-step-completed .wizard-step-ring {
          background: var(--step-color);
          border-color: var(--step-color);
          box-shadow: 0 4px 16px var(--step-glow);
        }

        .wizard-step-completed .wizard-step-icon {
          color: white;
        }

        .wizard-step-completed .wizard-step-label {
          color: var(--text-secondary);
        }

        .wizard-step-completed:hover .wizard-step-ring {
          transform: scale(1.05);
          box-shadow: 0 6px 24px var(--step-glow);
        }

        /* Current state */
        .wizard-step-current .wizard-step-ring {
          border-color: var(--step-color);
          border-width: 2px;
          background: rgba(10, 10, 12, 0.9);
        }

        .wizard-step-current .wizard-step-icon {
          color: var(--step-color);
        }

        .wizard-step-current .wizard-step-label {
          color: var(--text-primary);
          font-weight: 600;
        }

        /* Pulse animation for current step */
        .wizard-step-pulse {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: var(--step-color);
          opacity: 0;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: translateX(-50%) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateX(-50%) scale(1.15);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 0;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .wizard-progress {
            padding: 24px 16px 20px;
          }

          .wizard-progress-track,
          .wizard-progress-fill {
            left: 60px;
            right: 60px;
          }

          .wizard-progress-fill {
            max-width: calc(100% - 120px);
          }

          .wizard-step-indicator {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }

          .wizard-step-icon {
            width: 18px;
            height: 18px;
          }

          .wizard-step-label {
            font-size: 11px;
          }

          .wizard-step-pulse {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  );
}
