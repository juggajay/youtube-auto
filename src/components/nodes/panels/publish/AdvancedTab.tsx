'use client';

import { useState, useEffect } from 'react';
import type { PublishPanelConfig, YouTubePlaylist } from '@/types/nodes/publish';

interface Props {
  config: PublishPanelConfig;
  onChange: (updates: Partial<PublishPanelConfig>) => void;
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
      <h4>Advanced Settings</h4>

      {/* Category */}
      <div className="form-group">
        <label>Category</label>
        <select
          value={config.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div className="form-group">
        <label>Video Language</label>
        <select
          value={config.language}
          onChange={(e) => onChange({ language: e.target.value })}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>

      {/* Audience */}
      <div className="form-group">
        <label>Audience</label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.madeForKids}
            onChange={(e) => onChange({ madeForKids: e.target.checked })}
          />
          <span>Made for kids</span>
        </label>
        <p className="hint warning">Warning: Setting this incorrectly can result in account penalties</p>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.ageRestricted}
            onChange={(e) => onChange({ ageRestricted: e.target.checked })}
          />
          <span>Age-restricted (18+)</span>
        </label>
      </div>

      {/* Interactions */}
      <div className="form-group">
        <label>Interactions</label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.allowComments}
            onChange={(e) => onChange({ allowComments: e.target.checked })}
          />
          <span>Allow comments</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.allowRatings}
            onChange={(e) => onChange({ allowRatings: e.target.checked })}
          />
          <span>Show likes</span>
        </label>
      </div>

      {/* Shorts */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.isShort}
            onChange={(e) => onChange({ isShort: e.target.checked })}
          />
          <span>This is a Short</span>
        </label>
        <p className="hint">Enable for vertical videos under 60 seconds</p>
      </div>

      {/* Playlist */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.addToPlaylist}
            onChange={(e) => onChange({ addToPlaylist: e.target.checked })}
          />
          <span>Add to playlist</span>
        </label>
        {config.addToPlaylist && (
          <select
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
        )}
      </div>
    </div>
  );
}
