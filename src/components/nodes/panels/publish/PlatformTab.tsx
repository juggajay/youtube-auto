'use client';

import { useState, useEffect } from 'react';
import type { PublishPanelConfig, YouTubeChannel } from '@/types/nodes/publish';

interface Props {
  config: PublishPanelConfig;
  onChange: (updates: Partial<PublishPanelConfig>) => void;
}

export function PlatformTab({ config, onChange }: Props) {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/youtube/channels');
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="platform-tab">
      <h4>YouTube Channel</h4>

      {/* No Channels Warning */}
      {!loading && channels.length === 0 && (
        <div className="warning-banner">
          <span className="warning-icon">!</span>
          No YouTube channels connected.
          <a href="/settings/integrations" className="btn btn-link">Connect YouTube</a>
        </div>
      )}

      {/* Channel Selector */}
      <div className="form-group">
        <label>Publish to</label>
        <div className="channel-grid">
          {loading ? (
            <div className="loading">Loading channels...</div>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.id}
                className={`channel-card ${config.channelId === channel.id ? 'selected' : ''}`}
                onClick={() => onChange({ channelId: channel.id, channelName: channel.title })}
              >
                <img src={channel.thumbnail} alt={channel.title} className="channel-avatar" />
                <div className="channel-info">
                  <span className="channel-name">{channel.title}</span>
                  <span className="channel-subs">{channel.subscriberCount} subscribers</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Visibility */}
      <div className="form-group">
        <label>Visibility</label>
        <div className="visibility-options">
          {[
            { id: 'public', label: 'Public', desc: 'Anyone can search and view', icon: 'globe' },
            { id: 'unlisted', label: 'Unlisted', desc: 'Only people with link', icon: 'link' },
            { id: 'private', label: 'Private', desc: 'Only you can view', icon: 'lock' },
          ].map((vis) => (
            <button
              key={vis.id}
              className={`visibility-btn ${config.visibility === vis.id ? 'selected' : ''}`}
              onClick={() => onChange({ visibility: vis.id as PublishPanelConfig['visibility'] })}
            >
              <span className="vis-icon">{vis.icon}</span>
              <span className="vis-label">{vis.label}</span>
              <span className="vis-desc">{vis.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notify Subscribers */}
      {config.visibility === 'public' && (
        <div className="form-group">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.notifySubscribers}
              onChange={(e) => onChange({ notifySubscribers: e.target.checked })}
            />
            <span>Notify subscribers</span>
          </label>
          <p className="hint">Send notification to your subscribers when published</p>
        </div>
      )}
    </div>
  );
}
