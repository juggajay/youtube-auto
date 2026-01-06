'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const CAPTION_STYLES = [
  { id: 'standard', label: 'Standard', desc: 'Simple text overlay', preview: '📝' },
  { id: 'highlighted', label: 'Highlighted', desc: 'Word-by-word highlight', preview: '🔆' },
  { id: 'karaoke', label: 'Karaoke', desc: 'Bouncing ball effect', preview: '🎤' },
  { id: 'minimal', label: 'Minimal', desc: 'Small, unobtrusive', preview: '✨' },
] as const;

const CAPTION_POSITIONS = ['top', 'center', 'bottom'] as const;

const CAPTION_FONTS = [
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Lato', label: 'Lato' },
] as const;

export function CaptionsTab({ config, onChange }: Props) {
  return (
    <div className="captions-tab">
      <h4 className="tab-title">Captions</h4>

      {/* Enable Captions */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.includeCaptions}
            onChange={(e) => onChange({ includeCaptions: e.target.checked })}
          />
          <span>Include burned-in captions</span>
        </label>
        <p className="form-hint">Captions increase engagement by 80% on mobile</p>
      </div>

      {config.includeCaptions && (
        <>
          {/* Style */}
          <div className="form-group">
            <label className="form-label">Caption Style</label>
            <div className="style-grid">
              {CAPTION_STYLES.map((style) => (
                <button
                  key={style.id}
                  className={`style-card ${config.captionStyle === style.id ? 'selected' : ''}`}
                  onClick={() => onChange({ captionStyle: style.id as AssemblyNodeConfig['captionStyle'] })}
                >
                  <span className="style-preview">{style.preview}</span>
                  <span className="style-label">{style.label}</span>
                  <span className="style-desc">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="form-group">
            <label className="form-label">Position</label>
            <div className="position-options">
              {CAPTION_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  className={`position-btn ${config.captionPosition === pos ? 'selected' : ''}`}
                  onClick={() => onChange({ captionPosition: pos as AssemblyNodeConfig['captionPosition'] })}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Settings */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Font</label>
              <select
                className="form-select"
                value={config.captionFont}
                onChange={(e) => onChange({ captionFont: e.target.value })}
              >
                {CAPTION_FONTS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Size
                <span className="value-badge">{config.captionFontSize}px</span>
              </label>
              <input
                type="range"
                className="form-range"
                value={config.captionFontSize}
                onChange={(e) => onChange({ captionFontSize: parseInt(e.target.value) })}
                min={12}
                max={72}
                step={2}
              />
            </div>
          </div>

          {/* Colors */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Text Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  className="form-color"
                  value={config.captionColor}
                  onChange={(e) => onChange({ captionColor: e.target.value })}
                />
                <span className="color-value">{config.captionColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={config.captionBackground}
                  onChange={(e) => onChange({ captionBackground: e.target.checked })}
                />
                <span>Background</span>
              </label>
              {config.captionBackground && (
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    className="form-color"
                    value={config.captionBackgroundColor}
                    onChange={(e) => onChange({ captionBackgroundColor: e.target.value })}
                  />
                  <span className="color-value">{config.captionBackgroundColor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="caption-preview">
            <div className="preview-label">Preview</div>
            <div
              className="preview-container"
              style={{
                justifyContent:
                  config.captionPosition === 'top'
                    ? 'flex-start'
                    : config.captionPosition === 'center'
                    ? 'center'
                    : 'flex-end',
              }}
            >
              <div
                className="preview-text"
                style={{
                  fontFamily: config.captionFont,
                  fontSize: `${Math.min(config.captionFontSize, 24)}px`,
                  color: config.captionColor,
                  backgroundColor: config.captionBackground
                    ? config.captionBackgroundColor
                    : 'transparent',
                  padding: config.captionBackground ? '4px 8px' : '0',
                }}
              >
                Sample caption text
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
