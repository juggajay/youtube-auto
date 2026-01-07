'use client';

import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

export function SpeechSettingsTab({ config, onChange }: Props) {
  // Calculate slider progress for visual feedback
  const getSpeedProgress = () => ((config.speed - 0.5) / 1.5) * 100;

  return (
    <div className="panel-section">
      {/* Speed Slider */}
      <div className="refined-slider-wrapper">
        <div className="refined-slider-header">
          <span className="refined-slider-label">Speed</span>
          <span className="refined-slider-value">{config.speed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          className="refined-slider accent-voice"
          min={0.5}
          max={2.0}
          step={0.1}
          value={config.speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
          style={{ '--progress': `${getSpeedProgress()}%` } as React.CSSProperties}
        />
        <div className="refined-slider-labels">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Stability Slider */}
      <div className="refined-slider-wrapper">
        <div className="refined-slider-header">
          <span className="refined-slider-label">Stability</span>
          <span className="refined-slider-value">{Math.round(config.stability * 100)}%</span>
        </div>
        <input
          type="range"
          className="refined-slider accent-voice"
          min={0}
          max={1}
          step={0.05}
          value={config.stability}
          onChange={(e) => onChange({ stability: parseFloat(e.target.value) })}
          style={{ '--progress': `${config.stability * 100}%` } as React.CSSProperties}
        />
        <div className="refined-slider-labels">
          <span>Variable</span>
          <span>Stable</span>
        </div>
        <p className="panel-hint">Higher stability = more consistent, lower = more expressive</p>
      </div>

      {/* Clarity Slider */}
      <div className="refined-slider-wrapper">
        <div className="refined-slider-header">
          <span className="refined-slider-label">Clarity</span>
          <span className="refined-slider-value">{Math.round(config.clarity * 100)}%</span>
        </div>
        <input
          type="range"
          className="refined-slider accent-voice"
          min={0}
          max={1}
          step={0.05}
          value={config.clarity}
          onChange={(e) => onChange({ clarity: parseFloat(e.target.value) })}
          style={{ '--progress': `${config.clarity * 100}%` } as React.CSSProperties}
        />
        <div className="refined-slider-labels">
          <span>Natural</span>
          <span>Enhanced</span>
        </div>
      </div>

      {/* Style Exaggeration Slider */}
      <div className="refined-slider-wrapper">
        <div className="refined-slider-header">
          <span className="refined-slider-label">Style Intensity</span>
          <span className="refined-slider-value">{Math.round(config.styleExaggeration * 100)}%</span>
        </div>
        <input
          type="range"
          className="refined-slider accent-voice"
          min={0}
          max={1}
          step={0.05}
          value={config.styleExaggeration}
          onChange={(e) => onChange({ styleExaggeration: parseFloat(e.target.value) })}
          style={{ '--progress': `${config.styleExaggeration * 100}%` } as React.CSSProperties}
        />
        <div className="refined-slider-labels">
          <span>Subtle</span>
          <span>Dramatic</span>
        </div>
        <p className="panel-hint">How much the voice adapts to emotional content</p>
      </div>

      {/* Presets */}
      <div className="panel-section">
        <h4 className="panel-section-title">Quick Presets</h4>
        <div className="panel-btn-group">
          <button
            className="panel-btn panel-btn-secondary panel-btn-sm"
            onClick={() => onChange({
              stability: 0.5,
              clarity: 0.75,
              styleExaggeration: 0.3,
              speed: 1.0
            })}
          >
            Conversational
          </button>
          <button
            className="panel-btn panel-btn-secondary panel-btn-sm"
            onClick={() => onChange({
              stability: 0.7,
              clarity: 0.9,
              styleExaggeration: 0.5,
              speed: 0.95
            })}
          >
            Professional
          </button>
          <button
            className="panel-btn panel-btn-secondary panel-btn-sm"
            onClick={() => onChange({
              stability: 0.3,
              clarity: 0.6,
              styleExaggeration: 0.8,
              speed: 1.1
            })}
          >
            Dramatic
          </button>
        </div>
      </div>
    </div>
  );
}
