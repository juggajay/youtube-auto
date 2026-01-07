'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const INTRO_TEMPLATES = [
  { value: 'default', label: 'Default' },
  { value: 'logo-reveal', label: 'Logo Reveal' },
  { value: 'text-animation', label: 'Text Animation' },
  { value: 'custom', label: 'Custom' },
] as const;

const OUTRO_TEMPLATES = [
  { value: 'default', label: 'Default' },
  { value: 'subscribe-cta', label: 'Subscribe CTA' },
  { value: 'video-grid', label: 'Video Grid' },
  { value: 'social-links', label: 'Social Links' },
  { value: 'custom', label: 'Custom' },
] as const;

const TRANSITION_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'cut', label: 'Cut' },
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
] as const;

export function StructureTab({ config, onChange }: Props) {
  return (
    <div className="refined-panel">
      {/* Intro Section */}
      <div className="panel-section">
        <div className="panel-section-title">Intro</div>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <span className="toggle-row-label">Include Intro</span>
            <span className="toggle-row-description">Add an intro sequence to your video</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.includeIntro}
              onChange={(e) => onChange({ includeIntro: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>

        {config.includeIntro && (
          <>
            <div style={{ marginTop: '16px' }}>
              <div className="panel-section-title">Intro Template</div>
              <select
                className="panel-select"
                value={config.introTemplate}
                onChange={(e) => onChange({ introTemplate: e.target.value })}
              >
                {INTRO_TEMPLATES.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="refined-slider-wrapper" style={{ marginTop: '16px' }}>
              <div className="refined-slider-header">
                <span className="refined-slider-label">Intro Duration</span>
                <span className="refined-slider-value">{config.introDuration}s</span>
              </div>
              <input
                type="range"
                className="refined-slider"
                min={1}
                max={15}
                step={1}
                value={config.introDuration}
                onChange={(e) => onChange({ introDuration: parseInt(e.target.value) })}
              />
              <div className="refined-slider-labels">
                <span>1s</span>
                <span>15s</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Outro Section */}
      <div className="panel-section">
        <div className="panel-section-title">Outro</div>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <span className="toggle-row-label">Include Outro</span>
            <span className="toggle-row-description">Add an outro sequence with CTAs</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.includeOutro}
              onChange={(e) => onChange({ includeOutro: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>

        {config.includeOutro && (
          <>
            <div style={{ marginTop: '16px' }}>
              <div className="panel-section-title">Outro Template</div>
              <select
                className="panel-select"
                value={config.outroTemplate}
                onChange={(e) => onChange({ outroTemplate: e.target.value })}
              >
                {OUTRO_TEMPLATES.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="refined-slider-wrapper" style={{ marginTop: '16px' }}>
              <div className="refined-slider-header">
                <span className="refined-slider-label">Outro Duration</span>
                <span className="refined-slider-value">{config.outroDuration}s</span>
              </div>
              <input
                type="range"
                className="refined-slider"
                min={5}
                max={30}
                step={1}
                value={config.outroDuration}
                onChange={(e) => onChange({ outroDuration: parseInt(e.target.value) })}
              />
              <div className="refined-slider-labels">
                <span>5s</span>
                <span>30s</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transitions Section */}
      <div className="panel-section">
        <div className="panel-section-title">Transitions</div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TRANSITION_STYLES.map((style) => (
            <button
              key={style.id}
              className={`panel-btn panel-btn-sm ${config.transitionStyle === style.id ? 'panel-btn-primary' : 'panel-btn-secondary'}`}
              style={{
                background: config.transitionStyle === style.id ? 'var(--node-assembly)' : undefined,
              }}
              onClick={() => onChange({ transitionStyle: style.id as AssemblyNodeConfig['transitionStyle'] })}
            >
              {style.label}
            </button>
          ))}
        </div>

        {config.transitionStyle !== 'none' && config.transitionStyle !== 'cut' && (
          <div className="refined-slider-wrapper" style={{ marginTop: '16px' }}>
            <div className="refined-slider-header">
              <span className="refined-slider-label">Transition Duration</span>
              <span className="refined-slider-value">{config.transitionDuration}ms</span>
            </div>
            <input
              type="range"
              className="refined-slider"
              min={100}
              max={2000}
              step={100}
              value={config.transitionDuration}
              onChange={(e) => onChange({ transitionDuration: parseInt(e.target.value) })}
            />
            <div className="refined-slider-labels">
              <span>100ms</span>
              <span>2000ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
