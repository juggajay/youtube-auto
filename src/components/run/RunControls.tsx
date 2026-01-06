'use client';

import { useState } from 'react';
import { RunStatus } from '@/stores/runStore';

interface Props {
  status: RunStatus;
  onPause: () => void;
  onResume: () => void;
  onAbort: () => Promise<void>;
  onRetry?: () => void;
  disabled?: boolean;
}

export function RunControls({
  status,
  onPause,
  onResume,
  onAbort,
  onRetry,
  disabled = false,
}: Props) {
  const [isAborting, setIsAborting] = useState(false);
  const [showConfirmAbort, setShowConfirmAbort] = useState(false);

  const handleAbort = async () => {
    if (!showConfirmAbort) {
      setShowConfirmAbort(true);
      return;
    }

    setIsAborting(true);
    try {
      await onAbort();
    } finally {
      setIsAborting(false);
      setShowConfirmAbort(false);
    }
  };

  const handleCancelAbort = () => {
    setShowConfirmAbort(false);
  };

  const isPausable = status === 'running';
  const isResumable = status === 'paused';
  const isAbortable = ['running', 'paused', 'intervention', 'initializing'].includes(status);
  const isRetryable = status === 'failed' && onRetry;
  const isComplete = status === 'completed' || status === 'cancelled';

  const buttonBase = 'flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-[13px] border cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center gap-2">
      {/* Pause Button */}
      {isPausable && !showConfirmAbort && (
        <button
          className={`${buttonBase} bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:border-[var(--status-warning)] hover:text-[var(--status-warning)]`}
          onClick={onPause}
          disabled={disabled}
          title="Pause run"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <span>Pause</span>
        </button>
      )}

      {/* Resume Button */}
      {isResumable && !showConfirmAbort && (
        <button
          className={`${buttonBase} bg-[var(--status-running)] border-[var(--status-running)] text-white hover:bg-blue-600 hover:border-blue-600`}
          onClick={onResume}
          disabled={disabled}
          title="Resume run"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Resume</span>
        </button>
      )}

      {/* Retry Button */}
      {isRetryable && !showConfirmAbort && (
        <button
          className={`${buttonBase} bg-[var(--status-running)] border-[var(--status-running)] text-white hover:bg-blue-600 hover:border-blue-600`}
          onClick={onRetry}
          disabled={disabled}
          title="Retry run"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Retry</span>
        </button>
      )}

      {/* Abort Button */}
      {isAbortable && (
        <>
          {showConfirmAbort ? (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded-lg">
              <span className="text-[13px] text-[var(--status-error)] font-medium">Abort run?</span>
              <button
                className={`${buttonBase} bg-[var(--status-error)] border-[var(--status-error)] text-white hover:bg-red-600 hover:border-red-600 px-2.5 py-1.5`}
                onClick={handleAbort}
                disabled={isAborting}
              >
                {isAborting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Yes</span>
                  </>
                )}
              </button>
              <button
                className={`${buttonBase} bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] px-2.5 py-1.5`}
                onClick={handleCancelAbort}
                disabled={isAborting}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>No</span>
              </button>
            </div>
          ) : (
            <button
              className={`${buttonBase} bg-transparent border-[var(--status-error)] text-[var(--status-error)] hover:bg-red-500/10`}
              onClick={handleAbort}
              disabled={disabled}
              title="Abort run"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
              <span>Abort</span>
            </button>
          )}
        </>
      )}

      {/* Complete Status */}
      {isComplete && (
        <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium ${
          status === 'completed' ? 'bg-green-500/10 text-[var(--status-success)]' : 'bg-zinc-500/10 text-[var(--text-muted)]'
        }`}>
          {status === 'completed' ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Completed</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>Cancelled</span>
            </>
          )}
        </div>
      )}

      {/* Failed Status (when no retry) */}
      {status === 'failed' && !isRetryable && (
        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium bg-red-500/10 text-[var(--status-error)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Failed</span>
        </div>
      )}
    </div>
  );
}
