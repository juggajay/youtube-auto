'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useIdeationStore } from '@/stores/ideationStore';
import { WizardProgress } from './components/WizardProgress';
import { TopicStep } from './components/TopicStep';
import { HooksStep } from './components/HooksStep';
import { TitlesStep } from './components/TitlesStep';
import { DescriptionStep } from './components/DescriptionStep';
import { SummaryStep } from './components/SummaryStep';

const STEP_LABELS = ['Topic', 'Hooks', 'Titles', 'Description', 'Summary'];

export default function IdeationPage() {
  const {
    currentStep,
    nextStep,
    prevStep,
    canProceed,
    reset,
    isLoading,
    error,
  } = useIdeationStore();

  // Reset store when component unmounts
  useEffect(() => {
    return () => {
      // Optionally reset on unmount
    };
  }, []);

  const handleNext = () => {
    if (canProceed()) {
      nextStep();
    }
  };

  const handleSkip = () => {
    nextStep();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <TopicStep />;
      case 1:
        return <HooksStep />;
      case 2:
        return <TitlesStep />;
      case 3:
        return <DescriptionStep />;
      case 4:
        return <SummaryStep />;
      default:
        return null;
    }
  };

  const getNextButtonText = () => {
    if (currentStep === 0) return 'Continue';
    if (currentStep === 3) return 'Finish';
    return 'Next';
  };

  const canSkip = currentStep > 0 && currentStep < 3;

  return (
    <div className="app">
      <Sidebar />
      <main className="main ideation-page">
        {/* Ambient glow effects */}
        <div className="ideation-ambient" aria-hidden="true">
          <div className="ideation-glow ideation-glow-1" />
          <div className="ideation-glow ideation-glow-2" />
        </div>

        {/* Header */}
        <header className="ideation-header">
          <div className="ideation-header-content">
            <div className="ideation-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
              </svg>
            </div>
            <div>
              <h1 className="ideation-title">Ideation Studio</h1>
              <p className="ideation-subtitle">Transform your ideas into viral-ready content</p>
            </div>
          </div>
          <button
            className="ideation-reset-btn"
            onClick={reset}
            title="Start over"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
        </header>

        {/* Progress indicator */}
        <WizardProgress steps={STEP_LABELS} />

        {/* Main content area */}
        <div className="ideation-content">
          <div className="ideation-step-container">
            {renderStep()}
          </div>

          {/* Error display */}
          {error && (
            <div className="ideation-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Navigation footer - hidden on Summary step */}
        {currentStep < 4 && (
          <footer className="ideation-footer">
            <div className="ideation-footer-content">
              <button
                className="ideation-btn ideation-btn-secondary"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="ideation-footer-center">
                <span className="ideation-step-indicator">
                  Step {currentStep + 1} of {STEP_LABELS.length}
                </span>
              </div>

              <div className="ideation-footer-actions">
                {canSkip && (
                  <button
                    className="ideation-btn ideation-btn-ghost"
                    onClick={handleSkip}
                  >
                    Skip
                  </button>
                )}
                <button
                  className="ideation-btn ideation-btn-primary"
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="ideation-spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {getNextButtonText()}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </footer>
        )}
      </main>

      <style jsx>{`
        .ideation-page {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow: hidden;
        }

        /* Ambient background effects */
        .ideation-ambient {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .ideation-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          animation: float 20s ease-in-out infinite;
        }

        .ideation-glow-1 {
          width: 600px;
          height: 600px;
          background: var(--node-script);
          top: -200px;
          right: -100px;
        }

        .ideation-glow-2 {
          width: 500px;
          height: 500px;
          background: var(--node-thumbnail);
          bottom: -150px;
          left: -100px;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        /* Header */
        .ideation-header {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid var(--border);
          background: rgba(17, 17, 20, 0.8);
          backdrop-filter: blur(12px);
        }

        .ideation-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ideation-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--node-script), var(--node-thumbnail));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3);
        }

        .ideation-header-icon svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .ideation-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: var(--text-primary);
          margin: 0;
        }

        .ideation-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 4px 0 0 0;
        }

        .ideation-reset-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ideation-reset-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-bright);
        }

        .ideation-reset-btn svg {
          width: 16px;
          height: 16px;
        }

        /* Content area */
        .ideation-content {
          position: relative;
          z-index: 1;
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        .ideation-step-container {
          max-width: 800px;
          margin: 0 auto;
        }

        /* Error display */
        .ideation-error {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 800px;
          margin: 24px auto 0;
          padding: 16px 20px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: #fca5a5;
          font-size: 14px;
        }

        .ideation-error svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          color: var(--status-error);
        }

        /* Footer navigation */
        .ideation-footer {
          position: relative;
          z-index: 1;
          padding: 20px 32px;
          border-top: 1px solid var(--border);
          background: rgba(17, 17, 20, 0.9);
          backdrop-filter: blur(12px);
        }

        .ideation-footer-content {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ideation-footer-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .ideation-step-indicator {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .ideation-footer-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Buttons */
        .ideation-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .ideation-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ideation-btn svg {
          width: 16px;
          height: 16px;
        }

        .ideation-btn-primary {
          background: linear-gradient(135deg, var(--node-script), #9333ea);
          color: white;
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);
        }

        .ideation-btn-primary:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);
        }

        .ideation-btn-secondary {
          background: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .ideation-btn-secondary:not(:disabled):hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-bright);
        }

        .ideation-btn-ghost {
          background: transparent;
          color: var(--text-muted);
        }

        .ideation-btn-ghost:hover {
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
        }

        /* Spinner */
        .ideation-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Placeholder component for unimplemented steps
function PlaceholderStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="placeholder-step">
      <div className="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <h2 className="placeholder-title">{title}</h2>
      <p className="placeholder-description">{description}</p>
      <span className="placeholder-badge">Coming Soon</span>

      <style jsx>{`
        .placeholder-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 40px;
          min-height: 400px;
        }

        .placeholder-icon {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .placeholder-icon svg {
          width: 40px;
          height: 40px;
          color: var(--text-muted);
        }

        .placeholder-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 12px 0;
        }

        .placeholder-description {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0 0 24px 0;
          max-width: 400px;
        }

        .placeholder-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
