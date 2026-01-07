'use client';

import { useState, useEffect, useRef } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchVoices();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
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
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(voice.preview_url);
    audioRef.current = audio;
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
    v.name.toLowerCase().includes(filter.toLowerCase()) ||
    v.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="panel-section">
      {/* API Key Warning */}
      {voices.length === 0 && !loading && (
        <div className="panel-alert panel-alert-warning">
          <span className="panel-alert-icon">!</span>
          <span>No voices found. Please add your ElevenLabs API key in Settings.</span>
        </div>
      )}

      {/* Search */}
      <div className="panel-input-wrapper">
        <input
          type="text"
          className="panel-input"
          placeholder="Search voices by name or category..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Voice List */}
      <div className="voice-list">
        {loading ? (
          <div className="panel-loading">
            <span className="panel-loading-spinner" />
            <span>Loading voices...</span>
          </div>
        ) : filteredVoices.length === 0 ? (
          <div className="panel-empty-state">
            No voices match your search.
          </div>
        ) : (
          filteredVoices.map((voice) => (
            <div
              key={voice.voice_id}
              className={`voice-list-item ${config.voiceId === voice.voice_id ? 'selected' : ''}`}
              onClick={() => selectVoice(voice)}
            >
              <div className="voice-list-avatar">
                {voice.name.charAt(0).toUpperCase()}
              </div>
              <div className="voice-list-info">
                <span className="voice-list-name">{voice.name}</span>
                <span className="voice-list-meta">
                  <span className="voice-list-category">{voice.category}</span>
                  {voice.labels.accent && (
                    <span className="voice-list-accent">{voice.labels.accent}</span>
                  )}
                </span>
              </div>
              <button
                className={`voice-list-play ${playing === voice.voice_id ? 'playing' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  playPreview(voice);
                }}
                title={playing === voice.voice_id ? 'Stop' : 'Play preview'}
              >
                {playing === voice.voice_id ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Voice Cloning Section */}
      <div className="panel-section">
        <h4 className="panel-section-title">Voice Cloning</h4>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <span className="toggle-row-label">Use cloned voice</span>
            <span className="toggle-row-description">Upload audio samples to clone a voice</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.useClonedVoice}
              onChange={(e) => onChange({ useClonedVoice: e.target.checked })}
            />
            <span className="toggle-switch-slider accent-voice" />
          </label>
        </div>

        {config.useClonedVoice && (
          <div className="panel-upload-zone">
            <div className="panel-upload-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="panel-upload-text">Upload 1-5 minutes of clean audio</span>
            <span className="panel-upload-hint">MP3, WAV, or M4A files supported</span>
            <button className="panel-btn panel-btn-secondary panel-btn-sm">
              Choose Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
