'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const CAPTION_STYLES = [
  { id: 'standard', label: 'Standard' },
  { id: 'highlighted', label: 'Highlighted' },
  { id: 'karaoke', label: 'Karaoke' },
  { id: 'minimal', label: 'Minimal' },
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
    <div className="refined-panel">
      {/* Enable Captions */}
      <div className="panel-section">
        <div className="toggle-row">
          <div className="toggle-row-content">
            <span className="toggle-row-label">Include Captions</span>
            <span className="toggle-row-description">Captions increase engagement by 80% on mobile</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.includeCaptions}
              onChange={(e) => onChange({ includeCaptions: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>
      </div>

      {config.includeCaptions && (
        <>
          {/* Caption Style */}
          <div className="panel-section">
            <div className="panel-section-title">Caption Style</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CAPTION_STYLES.map((style) => (
                <button
                  key={style.id}
                  className={`panel-btn panel-btn-sm ${config.captionStyle === style.id ? 'panel-btn-primary' : 'panel-btn-secondary'}`}
                  style={{
                    background: config.captionStyle === style.id ? 'var(--node-assembly)' : undefined,
                  }}
                  onClick={() => onChange({ captionStyle: style.id as AssemblyNodeConfig['captionStyle'] })}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="panel-section">
            <div className="panel-section-title">Position</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {CAPTION_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  className={`panel-btn panel-btn-sm ${config.captionPosition === pos ? 'panel-btn-primary' : 'panel-btn-secondary'}`}
                  style={{
                    flex: 1,
                    background: config.captionPosition === pos ? 'var(--node-assembly)' : undefined,
                  }}
                  onClick={() => onChange({ captionPosition: pos as AssemblyNodeConfig['captionPosition'] })}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Settings */}
          <div className="panel-section">
            <div className="panel-section-title">Font</div>
            <select
              className="panel-select"
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

          {/* Font Size */}
          <div className="panel-section">
            <div className="refined-slider-wrapper">
              <div className="refined-slider-header">
                <span className="refined-slider-label">Font Size</span>
                <span className="refined-slider-value">{config.captionFontSize}px</span>
              </div>
              <input
                type="range"
                className="refined-slider"
                value={config.captionFontSize}
                onChange={(e) => onChange({ captionFontSize: parseInt(e.target.value) })}
                min={12}
                max={72}
                step={2}
              />
              <div className="refined-slider-labels">
                <span>12px</span>
                <span>72px</span>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="panel-section">
            <div className="panel-section-title">Colors</div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Text Color */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}>
                  Text
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <input
                    type="color"
                    value={config.captionColor}
                    onChange={(e) => onChange({ captionColor: e.target.value })}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {config.captionColor}
                  </span>
                </div>
              </div>

              {/* Background Color */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Background
                  </label>
                  <input
                    type="checkbox"
                    checked={config.captionBackground}
                    onChange={(e) => onChange({ captionBackground: e.target.checked })}
                    style={{ width: '14px', height: '14px', accentColor: 'var(--node-assembly)' }}
                  />
                </div>
                {config.captionBackground && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <input
                      type="color"
                      value={config.captionBackgroundColor}
                      onChange={(e) => onChange({ captionBackgroundColor: e.target.value })}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {config.captionBackgroundColor}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="panel-section">
            <div className="panel-section-title">Preview</div>
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: config.captionPosition === 'top'
                ? 'flex-start'
                : config.captionPosition === 'center'
                  ? 'center'
                  : 'flex-end',
              justifyContent: 'center',
              padding: '16px',
              overflow: 'hidden',
            }}>
              <div style={{
                fontFamily: config.captionFont,
                fontSize: `${Math.min(config.captionFontSize, 24)}px`,
                color: config.captionColor,
                backgroundColor: config.captionBackground
                  ? config.captionBackgroundColor
                  : 'transparent',
                padding: config.captionBackground ? '6px 12px' : '0',
                borderRadius: config.captionBackground ? '4px' : '0',
                textAlign: 'center',
                maxWidth: '90%',
              }}>
                Sample caption text
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
