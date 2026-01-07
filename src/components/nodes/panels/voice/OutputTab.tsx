'use client';

import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

const AUDIO_FORMATS = [
  { id: 'mp3', label: 'MP3', description: 'Compressed, smaller files' },
  { id: 'wav', label: 'WAV', description: 'Lossless, best quality' },
  { id: 'ogg', label: 'OGG', description: 'Open format, good compression' },
] as const;

const SAMPLE_RATES = [
  { value: 22050, label: '22,050 Hz', description: 'Good for speech' },
  { value: 44100, label: '44,100 Hz', description: 'CD Quality - Recommended' },
  { value: 48000, label: '48,000 Hz', description: 'Video Standard' },
] as const;

export function OutputTab({ config, onChange }: Props) {
  return (
    <div className="panel-section">
      {/* Audio Format */}
      <div className="panel-section">
        <h4 className="panel-section-title">Audio Format</h4>
        <div className="radio-options">
          {AUDIO_FORMATS.map((format) => (
            <label
              key={format.id}
              className={`radio-option radio-option-compact ${config.format === format.id ? 'selected accent-voice' : ''}`}
            >
              <span className="radio-option-indicator" />
              <div className="radio-option-content">
                <span className="radio-option-label">{format.label}</span>
                <span className="radio-option-description">{format.description}</span>
              </div>
              <input
                type="radio"
                name="format"
                className="sr-only"
                checked={config.format === format.id}
                onChange={() => onChange({ format: format.id })}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Sample Rate */}
      <div className="panel-section">
        <h4 className="panel-section-title">Sample Rate</h4>
        <div className="panel-select-wrapper">
          <select
            className="panel-select"
            value={config.sampleRate}
            onChange={(e) => onChange({ sampleRate: parseInt(e.target.value) as VoiceNodeConfig['sampleRate'] })}
          >
            {SAMPLE_RATES.map((rate) => (
              <option key={rate.value} value={rate.value}>
                {rate.label} - {rate.description}
              </option>
            ))}
          </select>
        </div>
        <p className="panel-hint">Higher sample rate = better quality but larger files. 44.1kHz recommended for YouTube.</p>
      </div>

      {/* Chunk by Paragraph */}
      <div className="panel-section">
        <h4 className="panel-section-title">Processing</h4>
        <div className="toggle-row">
          <div className="toggle-row-content">
            <span className="toggle-row-label">Generate audio per paragraph</span>
            <span className="toggle-row-description">
              Splits script into chunks for easier editing and re-recording
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.chunkByParagraph}
              onChange={(e) => onChange({ chunkByParagraph: e.target.checked })}
            />
            <span className="toggle-switch-slider accent-voice" />
          </label>
        </div>
      </div>
    </div>
  );
}
