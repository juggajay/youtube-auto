'use client';

interface ContentDefaults {
  typicalLengthMinutes: number;
  hookStyle: 'question' | 'statistic' | 'story' | 'controversy' | 'promise' | '';
  ctaApproach: string;
}

interface Props {
  values: ContentDefaults;
  onChange: (values: ContentDefaults) => void;
}

const HOOK_STYLES = [
  {
    value: 'question',
    label: 'Question Hook',
    description: 'Start with an intriguing question that viewers want answered',
    example: '"Have you ever wondered why..."',
  },
  {
    value: 'statistic',
    label: 'Statistic/Fact Hook',
    description: 'Lead with a surprising statistic or fact',
    example: '"97% of people don\'t know that..."',
  },
  {
    value: 'story',
    label: 'Story Hook',
    description: 'Begin with a personal anecdote or narrative',
    example: '"Last week, something crazy happened..."',
  },
  {
    value: 'controversy',
    label: 'Controversy Hook',
    description: 'Challenge common beliefs or popular opinions',
    example: '"Everything you\'ve been told about X is wrong..."',
  },
  {
    value: 'promise',
    label: 'Promise Hook',
    description: 'Make a direct promise of value to the viewer',
    example: '"By the end of this video, you\'ll know exactly how to..."',
  },
] as const;

const LENGTH_PRESETS = [
  { value: 1, label: 'Short', description: '~1 min (Shorts)' },
  { value: 5, label: 'Quick', description: '~5 min' },
  { value: 10, label: 'Standard', description: '~10 min' },
  { value: 15, label: 'In-depth', description: '~15 min' },
  { value: 20, label: 'Deep Dive', description: '20+ min' },
];

export function ContentDefaultsSection({ values, onChange }: Props) {
  const handleChange = <K extends keyof ContentDefaults>(key: K, value: ContentDefaults[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="content-defaults-section">
      <h3>Content Defaults</h3>
      <p className="hint">Set your typical video format and structure preferences</p>

      {/* Video Length */}
      <div className="form-group">
        <label>
          <strong>Typical Video Length</strong>
          <span className="label-hint">Default duration for generated scripts</span>
        </label>
        <div className="length-presets">
          {LENGTH_PRESETS.map((preset) => (
            <button
              key={preset.value}
              className={`length-preset ${values.typicalLengthMinutes === preset.value ? 'active' : ''}`}
              onClick={() => handleChange('typicalLengthMinutes', preset.value)}
            >
              <span className="preset-label">{preset.label}</span>
              <span className="preset-desc">{preset.description}</span>
            </button>
          ))}
        </div>
        <div className="custom-length">
          <span>Custom:</span>
          <input
            type="number"
            value={values.typicalLengthMinutes}
            onChange={(e) => handleChange('typicalLengthMinutes', Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
            min={1}
            max={60}
          />
          <span>minutes</span>
        </div>
      </div>

      {/* Hook Style */}
      <div className="form-group">
        <label>
          <strong>Hook Style</strong>
          <span className="label-hint">How your videos typically start</span>
        </label>
        <div className="hook-styles">
          {HOOK_STYLES.map((style) => (
            <button
              key={style.value}
              className={`hook-style ${values.hookStyle === style.value ? 'active' : ''}`}
              onClick={() => handleChange('hookStyle', style.value)}
            >
              <div className="hook-header">
                <span className="hook-label">{style.label}</span>
                {values.hookStyle === style.value && (
                  <span className="hook-selected">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              <span className="hook-desc">{style.description}</span>
              <span className="hook-example">{style.example}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA Approach */}
      <div className="form-group">
        <label>
          <strong>CTA Approach</strong>
          <span className="label-hint">How you typically end videos and ask for engagement</span>
        </label>
        <textarea
          value={values.ctaApproach}
          onChange={(e) => handleChange('ctaApproach', e.target.value)}
          placeholder="Describe your typical call-to-action style...

Example: I usually ask a question related to the topic to encourage comments, then remind viewers to subscribe if they found value. I keep it casual and don't beg for likes."
          rows={5}
        />
        <div className="cta-suggestions">
          <span className="suggestions-label">Quick presets:</span>
          <button
            className="suggestion-btn"
            onClick={() => handleChange('ctaApproach', 'Casual engagement - Ask a thought-provoking question, soft subscribe reminder. No aggressive calls to action.')}
          >
            Casual
          </button>
          <button
            className="suggestion-btn"
            onClick={() => handleChange('ctaApproach', 'Direct engagement - Clear call to like, subscribe, and comment. Mention notification bell. End with community question.')}
          >
            Direct
          </button>
          <button
            className="suggestion-btn"
            onClick={() => handleChange('ctaApproach', 'Value-focused - Focus on delivering value first. Mention other helpful videos. Soft subscribe mention only if viewers want more content like this.')}
          >
            Value-first
          </button>
        </div>
      </div>

      <style jsx>{`
        .content-defaults-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .content-defaults-section h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary, #fff);
        }

        .content-defaults-section > .hint {
          margin: -16px 0 0 0;
          font-size: 14px;
          color: var(--text-secondary, #888);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--bg-surface, #1a1a1a);
          border-radius: 12px;
          border: 1px solid var(--border, #333);
        }

        .form-group label {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .form-group label strong {
          font-size: 14px;
          color: var(--text-primary, #fff);
        }

        .label-hint {
          font-size: 12px;
          color: var(--text-secondary, #888);
          font-weight: normal;
        }

        /* Length Presets */
        .length-presets {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .length-preset {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 12px 16px;
          background: var(--bg-hover, #2a2a2a);
          border: 2px solid var(--border, #333);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .length-preset:hover {
          border-color: var(--text-secondary, #888);
        }

        .length-preset.active {
          border-color: var(--accent, #ff0000);
          background: rgba(255, 0, 0, 0.1);
        }

        .preset-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }

        .preset-desc {
          font-size: 11px;
          color: var(--text-secondary, #888);
        }

        .custom-length {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary, #888);
        }

        .custom-length input {
          width: 70px;
          padding: 8px 12px;
          background: var(--bg-hover, #2a2a2a);
          border: 1px solid var(--border, #333);
          border-radius: 6px;
          font-size: 14px;
          color: var(--text-primary, #fff);
          text-align: center;
        }

        .custom-length input:focus {
          outline: none;
          border-color: var(--accent, #ff0000);
        }

        /* Hook Styles */
        .hook-styles {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hook-style {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 14px 16px;
          background: var(--bg-hover, #2a2a2a);
          border: 2px solid var(--border, #333);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .hook-style:hover {
          border-color: var(--text-secondary, #888);
        }

        .hook-style.active {
          border-color: var(--accent, #ff0000);
          background: rgba(255, 0, 0, 0.1);
        }

        .hook-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .hook-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }

        .hook-selected {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: var(--accent, #ff0000);
          border-radius: 50%;
        }

        .hook-selected svg {
          width: 12px;
          height: 12px;
          color: white;
        }

        .hook-desc {
          font-size: 13px;
          color: var(--text-secondary, #888);
        }

        .hook-example {
          font-size: 12px;
          color: var(--text-tertiary, #666);
          font-style: italic;
        }

        /* CTA Textarea */
        textarea {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-hover, #2a2a2a);
          border: 1px solid var(--border, #333);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-primary, #fff);
          resize: vertical;
          min-height: 100px;
          line-height: 1.6;
          transition: border-color 0.15s ease;
        }

        textarea:focus {
          outline: none;
          border-color: var(--accent, #ff0000);
        }

        textarea::placeholder {
          color: var(--text-secondary, #888);
        }

        .cta-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .suggestions-label {
          font-size: 12px;
          color: var(--text-secondary, #888);
        }

        .suggestion-btn {
          padding: 6px 12px;
          background: var(--bg-hover, #2a2a2a);
          border: 1px solid var(--border, #333);
          border-radius: 6px;
          font-size: 12px;
          color: var(--text-primary, #fff);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .suggestion-btn:hover {
          border-color: var(--accent, #ff0000);
          color: var(--accent, #ff0000);
        }
      `}</style>
    </div>
  );
}
