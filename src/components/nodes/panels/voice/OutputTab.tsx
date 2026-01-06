'use client';

import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

export function OutputTab({ config, onChange }: Props) {
  return (
    <div className="output-tab">
      <h4>Output Settings</h4>

      {/* Format */}
      <div className="form-group">
        <label>Audio Format</label>
        <div className="format-options">
          {[
            { id: 'mp3', label: 'MP3', desc: 'Compressed, smaller files' },
            { id: 'wav', label: 'WAV', desc: 'Lossless, best quality' },
            { id: 'ogg', label: 'OGG', desc: 'Open format, good compression' },
          ].map((format) => (
            <label key={format.id} className="radio-card">
              <input
                type="radio"
                name="format"
                checked={config.format === format.id}
                onChange={() => onChange({ format: format.id as VoiceNodeConfig['format'] })}
              />
              <span className="format-label">{format.label}</span>
              <span className="format-desc">{format.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sample Rate */}
      <div className="form-group">
        <label>Sample Rate</label>
        <select
          value={config.sampleRate}
          onChange={(e) => onChange({ sampleRate: parseInt(e.target.value) as VoiceNodeConfig['sampleRate'] })}
        >
          <option value={22050}>22,050 Hz (Good for speech)</option>
          <option value={44100}>44,100 Hz (CD Quality)</option>
          <option value={48000}>48,000 Hz (Video Standard)</option>
        </select>
        <p className="hint">Higher = better quality but larger files. 44.1kHz recommended for YouTube.</p>
      </div>

      {/* Chunking */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.chunkByParagraph}
            onChange={(e) => onChange({ chunkByParagraph: e.target.checked })}
          />
          <span>Generate audio per paragraph</span>
        </label>
        <p className="hint">
          Splits script into chunks for easier editing. Useful if you want to re-record sections.
        </p>
      </div>
    </div>
  );
}
