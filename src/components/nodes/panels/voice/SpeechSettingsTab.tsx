'use client';

import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

export function SpeechSettingsTab({ config, onChange }: Props) {
  return (
    <div className="speech-settings-tab">
      <h4>Speech Settings</h4>

      {/* Speed */}
      <div className="form-group">
        <label>
          Speed
          <span className="value-badge">{config.speed.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.1}
          value={config.speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Slow (0.5x)</span>
          <span>Normal (1x)</span>
          <span>Fast (2x)</span>
        </div>
      </div>

      {/* Stability */}
      <div className="form-group">
        <label>
          Stability
          <span className="value-badge">{Math.round(config.stability * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.stability}
          onChange={(e) => onChange({ stability: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Variable</span>
          <span>Stable</span>
        </div>
        <p className="hint">Higher = more consistent, Lower = more expressive</p>
      </div>

      {/* Clarity + Similarity Enhancement */}
      <div className="form-group">
        <label>
          Clarity
          <span className="value-badge">{Math.round(config.clarity * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.clarity}
          onChange={(e) => onChange({ clarity: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Natural</span>
          <span>Enhanced</span>
        </div>
      </div>

      {/* Style Exaggeration */}
      <div className="form-group">
        <label>
          Style Intensity
          <span className="value-badge">{Math.round(config.styleExaggeration * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.styleExaggeration}
          onChange={(e) => onChange({ styleExaggeration: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Subtle</span>
          <span>Dramatic</span>
        </div>
        <p className="hint">How much the voice adapts to the emotional content</p>
      </div>

      {/* Presets */}
      <div className="presets">
        <h5>Quick Presets</h5>
        <div className="preset-buttons">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onChange({ stability: 0.5, clarity: 0.75, styleExaggeration: 0.3 })}
          >
            Conversational
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onChange({ stability: 0.7, clarity: 0.9, styleExaggeration: 0.5 })}
          >
            Professional
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onChange({ stability: 0.3, clarity: 0.6, styleExaggeration: 0.8 })}
          >
            Dramatic
          </button>
        </div>
      </div>
    </div>
  );
}
