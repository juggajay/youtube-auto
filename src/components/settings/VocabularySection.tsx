'use client';

import { useState, KeyboardEvent } from 'react';

interface Props {
  preferredTerms: string[];
  bannedWords: string[];
  signaturePhrases: string[];
  onChange: (field: 'preferredTerms' | 'bannedWords' | 'signaturePhrases', values: string[]) => void;
}

export function VocabularySection({ preferredTerms, bannedWords, signaturePhrases, onChange }: Props) {
  return (
    <div className="vocabulary-section">
      <h3>Vocabulary</h3>
      <p className="hint">Define words and phrases to shape the AI's language</p>

      {/* Preferred Terms */}
      <div className="vocab-group">
        <label>
          <strong>Preferred Terms</strong>
          <span className="label-hint">Words/phrases you want the AI to use</span>
        </label>
        <TagInput
          values={preferredTerms}
          onChange={(values) => onChange('preferredTerms', values)}
          placeholder="Type a term and press Enter..."
          variant="default"
          suggestions={['game-changer', "let's dive in", "here's the thing", 'absolutely', 'honestly']}
        />
      </div>

      {/* Banned Words */}
      <div className="vocab-group">
        <label>
          <strong>Banned Words</strong>
          <span className="label-hint">Words/phrases the AI should never use</span>
        </label>
        <TagInput
          values={bannedWords}
          onChange={(values) => onChange('bannedWords', values)}
          placeholder="Type a banned word and press Enter..."
          variant="negative"
          suggestions={['utilize', 'synergy', 'at the end of the day', 'basically', 'literally']}
        />
      </div>

      {/* Signature Phrases */}
      <div className="vocab-group">
        <label>
          <strong>Signature Phrases</strong>
          <span className="label-hint">Your catchphrases and recurring lines</span>
        </label>
        <TagInput
          values={signaturePhrases}
          onChange={(values) => onChange('signaturePhrases', values)}
          placeholder="Type a signature phrase and press Enter..."
          variant="accent"
          suggestions={["And that's the tea", 'Let me know in the comments', 'Smash that like button']}
        />
      </div>

      <style jsx>{`
        .vocabulary-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .vocabulary-section h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary, #fff);
        }

        .vocabulary-section > .hint {
          margin: -16px 0 0 0;
          font-size: 14px;
          color: var(--text-secondary, #888);
        }

        .vocab-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          background: var(--bg-surface, #1a1a1a);
          border-radius: 12px;
          border: 1px solid var(--border, #333);
        }

        .vocab-group label {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .vocab-group label strong {
          font-size: 14px;
          color: var(--text-primary, #fff);
        }

        .label-hint {
          font-size: 12px;
          color: var(--text-secondary, #888);
          font-weight: normal;
        }
      `}</style>
    </div>
  );
}

// Reusable TagInput component
interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  variant?: 'default' | 'negative' | 'accent';
  suggestions?: string[];
}

function TagInput({
  values,
  onChange,
  placeholder,
  variant = 'default',
  suggestions = [],
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag?: string) => {
    const trimmed = (tag || input).trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      removeTag(values.length - 1);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) => !values.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  );

  const getVariantColors = () => {
    switch (variant) {
      case 'negative':
        return { bg: 'rgba(255, 68, 68, 0.15)', border: '#ff4444', text: '#ff6666' };
      case 'accent':
        return { bg: 'rgba(255, 0, 0, 0.15)', border: 'var(--accent, #ff0000)', text: 'var(--accent, #ff0000)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399' };
    }
  };

  const colors = getVariantColors();

  return (
    <div className="tag-input-wrapper">
      <div className="tags">
        {values.map((tag, i) => (
          <span
            key={i}
            className="tag"
            style={{
              background: colors.bg,
              borderColor: colors.border,
              color: colors.text
            }}
          >
            {tag}
            <button onClick={() => removeTag(i)} aria-label={`Remove ${tag}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={values.length === 0 ? placeholder : ''}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="suggestions">
          <span className="suggestions-label">Suggestions:</span>
          {filteredSuggestions.slice(0, 5).map((suggestion, i) => (
            <button
              key={i}
              className="suggestion"
              onClick={() => addTag(suggestion)}
              style={{
                background: colors.bg,
                borderColor: colors.border,
                color: colors.text
              }}
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .tag-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          background: var(--bg-hover, #2a2a2a);
          border: 1px solid var(--border, #333);
          border-radius: 8px;
          min-height: 44px;
          align-items: center;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .tag button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.15s ease;
        }

        .tag button:hover {
          opacity: 1;
        }

        .tag button svg {
          width: 12px;
          height: 12px;
        }

        .tags input {
          flex: 1;
          min-width: 120px;
          padding: 4px 0;
          background: transparent;
          border: none;
          font-size: 14px;
          color: var(--text-primary, #fff);
        }

        .tags input:focus {
          outline: none;
        }

        .tags input::placeholder {
          color: var(--text-secondary, #888);
        }

        .suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .suggestions-label {
          font-size: 12px;
          color: var(--text-secondary, #888);
          margin-right: 4px;
        }

        .suggestion {
          padding: 4px 10px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .suggestion:hover {
          filter: brightness(1.2);
        }
      `}</style>
    </div>
  );
}

export { TagInput };
