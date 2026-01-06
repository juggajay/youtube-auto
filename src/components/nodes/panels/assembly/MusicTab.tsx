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
    // Fetch music library
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setIsLoading(true);
    // TODO: Implement actual music library API
    // Simulating API delay
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
        audioRef.current.play().catch(() => {
          // Handle autoplay restrictions
        });
      }
      setPlayingId(trackId);
    }
  };

  const selectedTrack = tracks.find((t) => t.id === config.musicTrackId);

  return (
    <div className="music-tab">
      <h4 className="tab-title">Background Music</h4>

      {/* Hidden audio element for previews */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        style={{ display: 'none' }}
      />

      {/* Enable Music */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.includeMusic}
            onChange={(e) => onChange({ includeMusic: e.target.checked })}
          />
          <span>Include background music</span>
        </label>
        <p className="form-hint">Add background music to enhance your video</p>
      </div>

      {config.includeMusic && (
        <>
          {/* Search and Filter */}
          <div className="music-filters">
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Search music..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="form-group">
              <select
                className="form-select"
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
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
            <div className="selected-track">
              <div className="selected-label">Selected:</div>
              <div className="selected-info">
                <span className="track-name">{selectedTrack.name}</span>
                <span className="track-artist">{selectedTrack.artist}</span>
              </div>
              <button
                className="clear-btn"
                onClick={() => onChange({ musicTrackId: undefined })}
              >
                Clear
              </button>
            </div>
          )}

          {/* Track List */}
          <div className="track-list">
            {isLoading ? (
              <div className="loading-state">Loading tracks...</div>
            ) : filteredTracks.length === 0 ? (
              <div className="empty-state">No tracks found</div>
            ) : (
              filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className={`track-item ${config.musicTrackId === track.id ? 'selected' : ''}`}
                  onClick={() => onChange({ musicTrackId: track.id })}
                >
                  <button
                    className="preview-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(track.id, track.previewUrl);
                    }}
                    aria-label={playingId === track.id ? 'Pause' : 'Play'}
                  >
                    {playingId === track.id ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    )}
                  </button>
                  <div className="track-info">
                    <span className="track-name">{track.name}</span>
                    <span className="track-artist">{track.artist}</span>
                  </div>
                  <span className="track-mood">{track.mood}</span>
                  <span className="track-duration">{track.duration}</span>
                </div>
              ))
            )}
          </div>

          {/* Volume */}
          <div className="form-group">
            <label className="form-label">
              Volume
              <span className="value-badge">{config.musicVolume}%</span>
            </label>
            <input
              type="range"
              className="form-range"
              min={0}
              max={100}
              value={config.musicVolume}
              onChange={(e) => onChange({ musicVolume: parseInt(e.target.value) })}
            />
          </div>

          {/* Fade Options */}
          <div className="form-row fade-options">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={config.musicFadeIn}
                onChange={(e) => onChange({ musicFadeIn: e.target.checked })}
              />
              <span>Fade In</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={config.musicFadeOut}
                onChange={(e) => onChange({ musicFadeOut: e.target.checked })}
              />
              <span>Fade Out</span>
            </label>
          </div>

          {/* Ducking */}
          <div className="ducking-section">
            <div className="form-group">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={config.ducking}
                  onChange={(e) => onChange({ ducking: e.target.checked })}
                />
                <span>Auto-duck during speech</span>
              </label>
              <p className="form-hint">Lower music volume when voice is speaking</p>
            </div>

            {config.ducking && (
              <div className="form-group">
                <label className="form-label">
                  Duck Amount
                  <span className="value-badge">{config.duckingAmount}%</span>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min={20}
                  max={80}
                  value={config.duckingAmount}
                  onChange={(e) => onChange({ duckingAmount: parseInt(e.target.value) })}
                />
                <div className="range-labels">
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
