'use client';

import { useState, useEffect, useRef } from 'react';
import type { AssemblyNodeConfig, MusicTrack } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

// Mock data - would be fetched from API in production
const MOCK_TRACKS: MusicTrack[] = [
  { id: '1', name: 'Upbeat Corporate', artist: 'Stock Music', duration: '2:30', mood: 'energetic', previewUrl: '' },
  { id: '2', name: 'Inspiring Piano', artist: 'Stock Music', duration: '3:15', mood: 'inspiring', previewUrl: '' },
  { id: '3', name: 'Chill Lo-Fi', artist: 'Stock Music', duration: '4:00', mood: 'relaxed', previewUrl: '' },
  { id: '4', name: 'Epic Cinematic', artist: 'Stock Music', duration: '3:45', mood: 'dramatic', previewUrl: '' },
  { id: '5', name: 'Acoustic Morning', artist: 'Stock Music', duration: '2:55', mood: 'calm', previewUrl: '' },
  { id: '6', name: 'Tech Innovation', artist: 'Stock Music', duration: '3:20', mood: 'modern', previewUrl: '' },
];

const MOOD_FILTERS = [
  { value: '', label: 'All Moods' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'inspiring', label: 'Inspiring' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'calm', label: 'Calm' },
  { value: 'modern', label: 'Modern' },
] as const;

export function MusicTab({ config, onChange }: Props) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTracks(MOCK_TRACKS);
    setIsLoading(false);
  };

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesMood = !moodFilter || track.mood === moodFilter;
    return matchesSearch && matchesMood;
  });

  const handlePlayPause = (trackId: string, previewUrl: string) => {
    if (playingId === trackId) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        audioRef.current.play().catch(() => {});
      }
      setPlayingId(trackId);
    }
  };

  const selectedTrack = tracks.find((t) => t.id === config.musicTrackId);

  return (
    <div className="refined-panel">
      {/* Hidden audio element for previews */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        style={{ display: 'none' }}
      />

      {/* Enable Music */}
      <div className="panel-section">
        <div className="toggle-row">
          <div className="toggle-row-content">
            <span className="toggle-row-label">Include Music</span>
            <span className="toggle-row-description">Add background music to enhance your video</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.includeMusic}
              onChange={(e) => onChange({ includeMusic: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>
      </div>

      {config.includeMusic && (
        <>
          {/* Search and Filter */}
          <div className="panel-section">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search music..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <select
                className="panel-select panel-select-sm"
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                style={{ width: '140px' }}
              >
                {MOOD_FILTERS.map((mood) => (
                  <option key={mood.value} value={mood.value}>
                    {mood.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Track Display */}
          {selectedTrack && (
            <div className="panel-section">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {selectedTrack.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {selectedTrack.artist}
                  </div>
                </div>
                <button
                  className="panel-btn panel-btn-sm panel-btn-ghost"
                  onClick={() => onChange({ musicTrackId: undefined })}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Track List */}
          <div className="panel-section">
            <div className="panel-section-title">Available Tracks</div>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}>
              {isLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Loading tracks...
                </div>
              ) : filteredTracks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No tracks found
                </div>
              ) : (
                filteredTracks.map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => onChange({ musicTrackId: track.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: config.musicTrackId === track.id ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      borderBottom: index < filteredTracks.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause(track.id, track.previewUrl);
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label={playingId === track.id ? 'Pause' : 'Play'}
                    >
                      {playingId === track.id ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style={{ color: 'var(--text-primary)' }}>
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style={{ color: 'var(--text-primary)' }}>
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {track.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {track.artist}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      padding: '2px 6px',
                      background: 'var(--bg-elevated)',
                      borderRadius: '4px',
                    }}>
                      {track.mood}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {track.duration}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Volume */}
          <div className="panel-section">
            <div className="refined-slider-wrapper">
              <div className="refined-slider-header">
                <span className="refined-slider-label">Volume</span>
                <span className="refined-slider-value">{config.musicVolume}%</span>
              </div>
              <input
                type="range"
                className="refined-slider"
                min={0}
                max={100}
                value={config.musicVolume}
                onChange={(e) => onChange({ musicVolume: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Fade Options */}
          <div className="panel-section">
            <div className="panel-section-title">Fade Options</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="toggle-inline" style={{ flex: 1 }}>
                <span className="toggle-inline-label">Fade In</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.musicFadeIn}
                    onChange={(e) => onChange({ musicFadeIn: e.target.checked })}
                  />
                  <span className="toggle-switch-track" />
                </label>
              </div>
              <div className="toggle-inline" style={{ flex: 1 }}>
                <span className="toggle-inline-label">Fade Out</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.musicFadeOut}
                    onChange={(e) => onChange({ musicFadeOut: e.target.checked })}
                  />
                  <span className="toggle-switch-track" />
                </label>
              </div>
            </div>
          </div>

          {/* Ducking */}
          <div className="panel-section">
            <div className="toggle-row">
              <div className="toggle-row-content">
                <span className="toggle-row-label">Auto-duck during speech</span>
                <span className="toggle-row-description">Lower music volume when voice is speaking</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.ducking}
                  onChange={(e) => onChange({ ducking: e.target.checked })}
                />
                <span className="toggle-switch-track" />
              </label>
            </div>

            {config.ducking && (
              <div className="refined-slider-wrapper" style={{ marginTop: '16px' }}>
                <div className="refined-slider-header">
                  <span className="refined-slider-label">Duck Amount</span>
                  <span className="refined-slider-value">{config.duckingAmount}%</span>
                </div>
                <input
                  type="range"
                  className="refined-slider"
                  min={20}
                  max={80}
                  value={config.duckingAmount}
                  onChange={(e) => onChange({ duckingAmount: parseInt(e.target.value) })}
                />
                <div className="refined-slider-labels">
                  <span>20% (subtle)</span>
                  <span>80% (aggressive)</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
