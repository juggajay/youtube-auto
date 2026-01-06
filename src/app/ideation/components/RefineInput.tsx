'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface RefineInputProps {
  onSubmit: (refinement: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function RefineInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Describe how to refine this...',
  className = '',
}: RefineInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      onSubmit(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Pulse animation when loading
  useEffect(() => {
    if (isLoading && buttonRef.current) {
      buttonRef.current.classList.add('loading-pulse');
    } else if (buttonRef.current) {
      buttonRef.current.classList.remove('loading-pulse');
    }
  }, [isLoading]);

  const canSubmit = value.trim().length > 0 && !isLoading;

  return (
    <div className={`refine-input-container ${className} ${isFocused ? 'focused' : ''}`}>
      {/* Animated Border */}
      <div className="input-border" />

      {/* AI Icon */}
      <div className="ai-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={isLoading}
        className="refine-input"
        aria-label="Refinement instruction"
      />

      {/* Submit Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`submit-button ${canSubmit ? 'active' : ''}`}
        aria-label="Submit refinement"
      >
        {isLoading ? (
          <div className="spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                <animate
                  attributeName="stroke-dashoffset"
                  dur="1s"
                  repeatCount="indefinite"
                  values="32;0;32"
                />
              </circle>
            </svg>
          </div>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        )}
      </button>

      {/* Helper Text */}
      <div className="helper-row">
        <span className="hint">
          <kbd>Enter</kbd> to send
        </span>
        {value.length > 0 && (
          <span className="char-indicator">{value.length} / 200</span>
        )}
      </div>

      <style jsx>{`
        .refine-input-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 4px 4px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .refine-input-container:hover {
          border-color: var(--border-bright);
        }

        .refine-input-container.focused {
          border-color: var(--node-script);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1),
            0 8px 24px rgba(0, 0, 0, 0.15);
        }

        /* Animated Border Gradient */
        .input-border {
          position: absolute;
          inset: -1px;
          border-radius: var(--radius-lg);
          background: linear-gradient(
            90deg,
            var(--node-script),
            var(--node-thumbnail),
            var(--node-script)
          );
          background-size: 200% 100%;
          opacity: 0;
          z-index: -1;
          transition: opacity 0.3s ease;
        }

        .refine-input-container.focused .input-border {
          opacity: 0.5;
          animation: borderShift 3s ease infinite;
        }

        @keyframes borderShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        /* AI Icon */
        .ai-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ai-icon svg {
          width: 18px;
          height: 18px;
          color: var(--node-script);
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .refine-input-container.focused .ai-icon svg {
          opacity: 1;
          animation: sparkle 1.5s ease infinite;
        }

        @keyframes sparkle {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(10deg) scale(1.05);
          }
          50% {
            transform: rotate(0deg) scale(1);
          }
          75% {
            transform: rotate(-10deg) scale(1.05);
          }
        }

        /* Input Field */
        .refine-input {
          flex: 1;
          min-width: 0;
          padding: 12px 0;
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 14px;
          color: var(--text-primary);
          transition: color 0.2s ease;
        }

        .refine-input:focus {
          outline: none;
        }

        .refine-input::placeholder {
          color: var(--text-muted);
          transition: color 0.2s ease;
        }

        .refine-input:focus::placeholder {
          color: var(--text-secondary);
        }

        .refine-input:disabled {
          color: var(--text-secondary);
          cursor: not-allowed;
        }

        /* Submit Button */
        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: not-allowed;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }

        .submit-button svg {
          width: 18px;
          height: 18px;
          transition: transform 0.2s ease;
        }

        .submit-button.active {
          background: linear-gradient(135deg, var(--node-script), var(--node-thumbnail));
          border-color: transparent;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
        }

        .submit-button.active:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);
        }

        .submit-button.active:hover svg {
          transform: translateX(2px) translateY(-2px);
        }

        .submit-button.active:active {
          transform: scale(0.98);
        }

        /* Loading Pulse */
        .submit-button.loading-pulse {
          animation: loadingPulse 1.5s ease infinite;
        }

        @keyframes loadingPulse {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(168, 85, 247, 0.3);
          }
          50% {
            box-shadow: 0 4px 24px rgba(168, 85, 247, 0.5);
          }
        }

        .spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner svg {
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Helper Row */
        .helper-row {
          position: absolute;
          bottom: -24px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--text-muted);
          padding: 0 4px;
          opacity: 0;
          transform: translateY(-4px);
          transition: all 0.2s ease;
        }

        .refine-input-container.focused .helper-row {
          opacity: 1;
          transform: translateY(0);
        }

        .hint {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        kbd {
          padding: 2px 6px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
        }

        .char-indicator {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}

export default RefineInput;
