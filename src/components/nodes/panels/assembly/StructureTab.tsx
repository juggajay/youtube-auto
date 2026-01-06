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
  { id: 'none', label: 'None', desc: 'No transition' },
  { id: 'cut', label: 'Cut', desc: 'Instant switch' },
  { id: 'fade', label: 'Fade', desc: 'Smooth crossfade' },
  { id: 'slide', label: 'Slide', desc: 'Slide animation' },
  { id: 'zoom', label: 'Zoom', desc: 'Zoom transition' },
] as const;

export function StructureTab({ config, onChange }: Props) {
  return (
    <div className="structure-tab">
      <h4 className="tab-title">Video Structure</h4>
      <p className="tab-hint">Configure intro, outro, and transitions</p>

      {/* Intro Section */}
      <div className="structure-section">
        <div className="form-group">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.includeIntro}
              onChange={(e) => onChange({ includeIntro: e.target.checked })}
            />
            <span>Include Intro</span>
          </label>
          <p className="form-hint">Add an intro sequence to your video</p>
        </div>

        {config.includeIntro && (
          <>
            <div className="form-group">
              <label className="form-label">Intro Template</label>
              <select
                className="form-select"
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

            <div className="form-group">
              <label className="form-label">
                Intro Duration
                <span className="value-badge">{config.introDuration}s</span>
              </label>
              <input
                type="range"
                className="form-range"
                min={1}
                max={15}
                step={1}
                value={config.introDuration}
                onChange={(e) => onChange({ introDuration: parseInt(e.target.value) })}
              />
              <div className="range-labels">
                <span>1s</span>
                <span>15s</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Outro Section */}
      <div className="structure-section">
        <div className="form-group">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.includeOutro}
              onChange={(e) => onChange({ includeOutro: e.target.checked })}
            />
            <span>Include Outro</span>
          </label>
          <p className="form-hint">Add an outro sequence with CTAs</p>
        </div>

        {config.includeOutro && (
          <>
            <div className="form-group">
              <label className="form-label">Outro Template</label>
              <select
                className="form-select"
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

            <div className="form-group">
              <label className="form-label">
                Outro Duration
                <span className="value-badge">{config.outroDuration}s</span>
              </label>
              <input
                type="range"
                className="form-range"
                min={5}
                max={30}
                step={1}
                value={config.outroDuration}
                onChange={(e) => onChange({ outroDuration: parseInt(e.target.value) })}
              />
              <div className="range-labels">
                <span>5s</span>
                <span>30s</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transitions Section */}
      <div className="structure-section">
        <h5 className="section-title">Transitions</h5>

        <div className="form-group">
          <label className="form-label">Transition Style</label>
          <div className="transition-options">
            {TRANSITION_STYLES.map((style) => (
              <button
                key={style.id}
                className={`transition-btn ${config.transitionStyle === style.id ? 'selected' : ''}`}
                onClick={() => onChange({ transitionStyle: style.id as AssemblyNodeConfig['transitionStyle'] })}
              >
                <span className="transition-label">{style.label}</span>
                <span className="transition-desc">{style.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {config.transitionStyle !== 'none' && config.transitionStyle !== 'cut' && (
          <div className="form-group">
            <label className="form-label">
              Transition Duration
              <span className="value-badge">{config.transitionDuration}ms</span>
            </label>
            <input
              type="range"
              className="form-range"
              min={100}
              max={2000}
              step={100}
              value={config.transitionDuration}
              onChange={(e) => onChange({ transitionDuration: parseInt(e.target.value) })}
            />
            <div className="range-labels">
              <span>100ms</span>
              <span>2000ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
