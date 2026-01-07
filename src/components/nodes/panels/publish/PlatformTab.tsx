'use client';

import { useState, useEffect } from 'react';
import type { PublishNodeConfig } from '@/stores/nodeConfigStore';

interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
}

interface Props {
  config: PublishNodeConfig;
  onChange: (updates: Partial<PublishNodeConfig>) => void;
}

const VISIBILITY_OPTIONS = [
  {
    id: 'public' as const,
    label: 'Public',
    description: 'Anyone can search and view',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  },
  {
    id: 'unlisted' as const,
    label: 'Unlisted',
    description: 'Only people with link',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  },
  {
    id: 'private' as const,
    label: 'Private',
    description: 'Only you can view',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
  },
];

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
      {/* Channel Selection */}
      <div className="panel-section">
        <div className="panel-section-title">YouTube Channel</div>

        {/* No Channels Warning */}
        {!loading && channels.length === 0 && (
          <div className="panel-info-box warning">
            <div className="panel-info-box-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="panel-info-box-content">
              <div className="panel-info-box-title">No channels connected</div>
              <div className="panel-info-box-text">
                Connect your YouTube account to publish videos.
                <a href="/settings/integrations" className="info-link">Connect YouTube</a>
              </div>
            </div>
          </div>
        )}

        {/* Channel List */}
        <div className="channel-list">
          {loading ? (
            <div className="loading-state">Loading channels...</div>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.id}
                className={`channel-item ${config.channelId === channel.id ? 'selected' : ''}`}
                onClick={() => onChange({ channelId: channel.id, channelName: channel.title })}
              >
                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  className="channel-avatar"
                />
                <div className="channel-info">
                  <span className="channel-name">{channel.title}</span>
                  <span className="channel-subs">{channel.subscriberCount} subscribers</span>
                </div>
                <div className="channel-check">
                  {config.channelId === channel.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Visibility */}
      <div className="panel-section">
        <div className="panel-section-title">Visibility</div>
        <div className="radio-options">
          {VISIBILITY_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`radio-option accent-publish ${config.visibility === option.id ? 'selected' : ''}`}
              onClick={() => onChange({ visibility: option.id })}
            >
              <div className="radio-option-indicator" />
              <span className="radio-option-icon">{option.icon}</span>
              <div className="radio-option-content">
                <div className="radio-option-label">{option.label}</div>
                <div className="radio-option-description">{option.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notify Subscribers */}
      {config.visibility === 'public' && (
        <div className="panel-section">
          <div className="toggle-row">
            <div className="toggle-row-content">
              <div className="toggle-row-label">Notify subscribers</div>
              <div className="toggle-row-description">Send notification when published</div>
            </div>
            <label className="toggle-switch accent-publish">
              <input
                type="checkbox"
                checked={config.notifySubscribers}
                onChange={(e) => onChange({ notifySubscribers: e.target.checked })}
              />
              <span className="toggle-switch-track" />
            </label>
          </div>
        </div>
      )}

      <style jsx>{`
        .platform-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .channel-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .loading-state {
          padding: 20px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .channel-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          text-align: left;
        }

        .channel-item:hover {
          border-color: var(--border-bright);
          background: var(--bg-hover);
        }

        .channel-item.selected {
          border-color: var(--node-publish);
          background: rgba(255, 0, 0, 0.04);
        }

        .channel-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .channel-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .channel-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .channel-subs {
          font-size: 12px;
          color: var(--text-muted);
        }

        .channel-check {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--node-publish);
        }

        .info-link {
          display: inline-block;
          margin-top: 8px;
          font-size: 12px;
          color: var(--node-publish);
          text-decoration: none;
        }

        .info-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
