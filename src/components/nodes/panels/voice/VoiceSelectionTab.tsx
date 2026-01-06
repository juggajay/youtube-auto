'use client';

import { useState, useEffect } from 'react';
import type { VoiceNodeConfig, ElevenLabsVoice } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

export function VoiceSelectionTab({ config, onChange }: Props) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/elevenlabs/voices');
      const data = await res.json();
      setVoices(data.voices || []);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    } finally {
      setLoading(false);
    }
  };

  const playPreview = (voice: ElevenLabsVoice) => {
    if (playing === voice.voice_id) {
      setPlaying(null);
      return;
    }

    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPlaying(null);
    audio.play();
    setPlaying(voice.voice_id);
  };

  const selectVoice = (voice: ElevenLabsVoice) => {
    onChange({
      voiceId: voice.voice_id,
      voiceName: voice.name,
      voicePreviewUrl: voice.preview_url,
    });
  };

  const filteredVoices = voices.filter(v =>
    v.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="voice-selection-tab">
      <h4>Select Voice</h4>

      {/* API Key Warning */}
      {voices.length === 0 && !loading && (
        <div className="warning-banner">
          No voices found. Please add your ElevenLabs API key in Settings.
        </div>
      )}

      {/* Search */}
      <div className="voice-search">
        <input
          type="text"
          placeholder="Search voices..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Voice Grid */}
      <div className="voice-grid">
        {loading ? (
          <div className="loading">Loading voices...</div>
        ) : (
          filteredVoices.map((voice) => (
            <div
              key={voice.voice_id}
              className={`voice-card ${config.voiceId === voice.voice_id ? 'selected' : ''}`}
              onClick={() => selectVoice(voice)}
            >
              <div className="voice-info">
                <span className="voice-name">{voice.name}</span>
                <span className="voice-category">{voice.category}</span>
                {voice.labels.accent && (
                  <span className="voice-accent">{voice.labels.accent}</span>
                )}
              </div>
              <button
                className={`preview-btn ${playing === voice.voice_id ? 'playing' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  playPreview(voice);
                }}
              >
                {playing === voice.voice_id ? 'Stop' : 'Play'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Clone Voice Option */}
      <div className="clone-section">
        <h5>Or Clone a Voice</h5>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.useClonedVoice}
            onChange={(e) => onChange({ useClonedVoice: e.target.checked })}
          />
          <span>Use my cloned voice</span>
        </label>
        {config.useClonedVoice && (
          <div className="clone-upload">
            <p className="hint">Upload 1-5 minutes of clean audio to clone a voice</p>
            <button className="btn btn-secondary">Upload Audio Samples</button>
          </div>
        )}
      </div>
    </div>
  );
}
