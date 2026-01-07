'use client';

import { useState, useEffect } from 'react';
import type { PublishNodeConfig } from '@/stores/nodeConfigStore';

interface YouTubePlaylist {
  id: string;
  title: string;
  itemCount: number;
}

interface Props {
  config: PublishNodeConfig;
  onChange: (updates: Partial<PublishNodeConfig>) => void;
}

const CATEGORIES = [
  { id: '22', label: 'People & Blogs' },
  { id: '28', label: 'Science & Technology' },
  { id: '27', label: 'Education' },
  { id: '24', label: 'Entertainment' },
  { id: '26', label: 'Howto & Style' },
  { id: '20', label: 'Gaming' },
  { id: '10', label: 'Music' },
  { id: '1', label: 'Film & Animation' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
];

export function AdvancedTab({ config, onChange }: Props) {
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  useEffect(() => {
    if (config.addToPlaylist && config.channelId) {
      fetchPlaylists();
    }
  }, [config.addToPlaylist, config.channelId]);

  const fetchPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const res = await fetch(`/api/youtube/playlists?channelId=${config.channelId}`);
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  return (
    <div className="advanced-tab">
      {/* Category & Language */}
      <div className="panel-section">
        <div className="panel-section-title">Classification</div>
        <div className="select-grid">
          <div className="panel-select-wrapper">
            <label className="panel-select-label">Category</label>
            <select
              className="panel-select"
              value={config.category}
              onChange={(e) => onChange({ category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="panel-select-wrapper">
            <label className="panel-select-label">Language</label>
            <select
              className="panel-select"
              value={config.language}
              onChange={(e) => onChange({ language: e.target.value })}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="panel-section">
        <div className="panel-section-title">Compliance</div>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <div className="toggle-row-label">Made for kids</div>
            <div className="toggle-row-description">Content made specifically for children</div>
          </div>
          <label className="toggle-switch accent-publish">
            <input
              type="checkbox"
              checked={config.madeForKids}
              onChange={(e) => onChange({ madeForKids: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>

        {config.madeForKids && (
          <div className="panel-info-box warning">
            <div className="panel-info-box-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="panel-info-box-content">
              <div className="panel-info-box-title">Important</div>
              <div className="panel-info-box-text">
                Setting this incorrectly can result in account penalties. Only enable if your content is specifically made for children.
              </div>
            </div>
          </div>
        )}

        <div className="toggle-row">
          <div className="toggle-row-content">
            <div className="toggle-row-label">Age-restricted (18+)</div>
            <div className="toggle-row-description">Contains mature content</div>
          </div>
          <label className="toggle-switch accent-publish">
            <input
              type="checkbox"
              checked={config.ageRestricted}
              onChange={(e) => onChange({ ageRestricted: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>
      </div>

      {/* Engagement */}
      <div className="panel-section">
        <div className="panel-section-title">Engagement</div>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <div className="toggle-row-label">Allow comments</div>
            <div className="toggle-row-description">Let viewers comment on this video</div>
          </div>
          <label className="toggle-switch accent-publish">
            <input
              type="checkbox"
              checked={config.allowComments}
              onChange={(e) => onChange({ allowComments: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <div className="toggle-row-label">Show likes</div>
            <div className="toggle-row-description">Display like count on video</div>
          </div>
          <label className="toggle-switch accent-publish">
            <input
              type="checkbox"
              checked={config.allowRatings}
              onChange={(e) => onChange({ allowRatings: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>
      </div>

      {/* Video Type */}
      <div className="panel-section">
        <div className="panel-section-title">Video Type</div>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <div className="toggle-row-label">This is a Short</div>
            <div className="toggle-row-description">Vertical video under 60 seconds</div>
          </div>
          <label className="toggle-switch accent-publish">
            <input
              type="checkbox"
              checked={config.isShort}
              onChange={(e) => onChange({ isShort: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>
      </div>

      {/* Playlist */}
      <div className="panel-section">
        <div className="panel-section-title">Playlist</div>

        <div className="toggle-row">
          <div className="toggle-row-content">
            <div className="toggle-row-label">Add to playlist</div>
            <div className="toggle-row-description">Automatically add to a playlist</div>
          </div>
          <label className="toggle-switch accent-publish">
            <input
              type="checkbox"
              checked={config.addToPlaylist}
              onChange={(e) => onChange({ addToPlaylist: e.target.checked })}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>

        {config.addToPlaylist && (
          <div className="panel-select-wrapper playlist-select">
            <select
              className="panel-select"
              value={config.playlistId || ''}
              onChange={(e) => onChange({ playlistId: e.target.value })}
              disabled={loadingPlaylists}
            >
              <option value="">Select playlist...</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.title} ({playlist.itemCount} videos)
                </option>
              ))}
            </select>
            {loadingPlaylists && (
              <span className="panel-input-hint">Loading playlists...</span>
            )}
            {!loadingPlaylists && !config.channelId && (
              <span className="panel-input-hint">Select a channel first</span>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .advanced-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .select-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .toggle-row + .toggle-row {
          margin-top: 8px;
        }

        .toggle-row + .panel-info-box {
          margin-top: 12px;
          margin-bottom: 4px;
        }

        .playlist-select {
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}
