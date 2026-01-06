# Publish Node Panel

## Tabs

1. **Platform** - YouTube channel selector, visibility
2. **Metadata** - Title, description, tags
3. **Schedule** - Publish time, premiere
4. **Advanced** - Category, monetization, shorts

## TypeScript Types

```typescript
// types/nodes/publish.ts

export interface PublishNodeConfig {
  // Platform
  channelId: string;
  channelName: string;
  visibility: 'public' | 'unlisted' | 'private';

  // Metadata
  titleSource: 'generated' | 'override';
  titleOverride?: string;
  descriptionTemplate: string;
  descriptionVariables: Record<string, string>;
  tags: string[];
  autoGenerateTags: boolean;
  maxTags: number;

  // Schedule
  publishMode: 'immediate' | 'scheduled' | 'premiere';
  scheduledTime?: string; // ISO datetime
  premiereCountdown: number; // minutes

  // Advanced
  category: string;
  language: string;
  madeForKids: boolean;
  ageRestricted: boolean;
  allowComments: boolean;
  allowRatings: boolean;
  isShort: boolean;

  // Playlist
  addToPlaylist: boolean;
  playlistId?: string;

  // Notifications
  notifySubscribers: boolean;
}
```

## Task 1: PlatformTab

```tsx
// src/components/nodes/panels/publish/PlatformTab.tsx
'use client';

import { useState, useEffect } from 'react';
import type { PublishNodeConfig } from '@/types/nodes/publish';

interface Props {
  config: PublishNodeConfig;
  onChange: (updates: Partial<PublishNodeConfig>) => void;
}

interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
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
          ⚠️ No YouTube channels connected.
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
            { id: 'public', label: 'Public', desc: 'Anyone can search and view', icon: '🌍' },
            { id: 'unlisted', label: 'Unlisted', desc: 'Only people with link', icon: '🔗' },
            { id: 'private', label: 'Private', desc: 'Only you can view', icon: '🔒' },
          ].map((vis) => (
            <button
              key={vis.id}
              className={`visibility-btn ${config.visibility === vis.id ? 'selected' : ''}`}
              onClick={() => onChange({ visibility: vis.id as PublishNodeConfig['visibility'] })}
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
```

## Task 2: MetadataTab

```tsx
// src/components/nodes/panels/publish/MetadataTab.tsx
'use client';

import { useState } from 'react';
import type { PublishNodeConfig } from '@/types/nodes/publish';

interface Props {
  config: PublishNodeConfig;
  onChange: (updates: Partial<PublishNodeConfig>) => void;
}

const DESCRIPTION_VARIABLES = [
  { key: '{{video_title}}', desc: 'Video title' },
  { key: '{{channel_name}}', desc: 'Channel name' },
  { key: '{{timestamps}}', desc: 'Auto-generated timestamps' },
  { key: '{{social_links}}', desc: 'Your social media links' },
  { key: '{{affiliate_links}}', desc: 'Affiliate links section' },
];

export function MetadataTab({ config, onChange }: Props) {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !config.tags.includes(newTag.trim())) {
      onChange({ tags: [...config.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    onChange({ tags: config.tags.filter(t => t !== tag) });
  };

  return (
    <div className="metadata-tab">
      <h4>Video Metadata</h4>

      {/* Title */}
      <div className="form-group">
        <label>Title</label>
        <div className="title-source">
          <label className="radio-inline">
            <input
              type="radio"
              checked={config.titleSource === 'generated'}
              onChange={() => onChange({ titleSource: 'generated' })}
            />
            Use AI-generated title
          </label>
          <label className="radio-inline">
            <input
              type="radio"
              checked={config.titleSource === 'override'}
              onChange={() => onChange({ titleSource: 'override' })}
            />
            Custom title
          </label>
        </div>
        {config.titleSource === 'override' && (
          <input
            type="text"
            value={config.titleOverride || ''}
            onChange={(e) => onChange({ titleOverride: e.target.value })}
            placeholder="Enter custom title..."
            maxLength={100}
          />
        )}
        <span className="char-count">
          {(config.titleOverride?.length || 0)}/100
        </span>
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description Template</label>
        <textarea
          value={config.descriptionTemplate}
          onChange={(e) => onChange({ descriptionTemplate: e.target.value })}
          rows={8}
          placeholder="Enter description template..."
        />
        <div className="variable-chips">
          <span className="hint">Insert variable:</span>
          {DESCRIPTION_VARIABLES.map((v) => (
            <button
              key={v.key}
              className="variable-chip"
              onClick={() => onChange({
                descriptionTemplate: config.descriptionTemplate + ' ' + v.key
              })}
              title={v.desc}
            >
              {v.key}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="form-group">
        <label>Tags</label>
        <div className="tags-section">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.autoGenerateTags}
              onChange={(e) => onChange({ autoGenerateTags: e.target.checked })}
            />
            <span>Auto-generate tags from content</span>
          </label>

          <div className="tags-list">
            {config.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
          </div>

          <div className="add-tag">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
          </div>

          <div className="tag-count">
            {config.tags.length}/{config.maxTags} tags
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Task 3: ScheduleTab

```tsx
// src/components/nodes/panels/publish/ScheduleTab.tsx
'use client';

import type { PublishNodeConfig } from '@/types/nodes/publish';

interface Props {
  config: PublishNodeConfig;
  onChange: (updates: Partial<PublishNodeConfig>) => void;
}

export function ScheduleTab({ config, onChange }: Props) {
  return (
    <div className="schedule-tab">
      <h4>Publish Schedule</h4>

      {/* Publish Mode */}
      <div className="form-group">
        <label>When to publish</label>
        <div className="mode-options">
          {[
            { id: 'immediate', label: 'Immediately', desc: 'Publish right after approval', icon: '🚀' },
            { id: 'scheduled', label: 'Scheduled', desc: 'Publish at specific time', icon: '📅' },
            { id: 'premiere', label: 'Premiere', desc: 'Public countdown before release', icon: '🎬' },
          ].map((mode) => (
            <button
              key={mode.id}
              className={`mode-btn ${config.publishMode === mode.id ? 'selected' : ''}`}
              onClick={() => onChange({ publishMode: mode.id as PublishNodeConfig['publishMode'] })}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-label">{mode.label}</span>
              <span className="mode-desc">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Time */}
      {config.publishMode === 'scheduled' && (
        <div className="form-group">
          <label>Schedule for</label>
          <input
            type="datetime-local"
            value={config.scheduledTime || ''}
            onChange={(e) => onChange({ scheduledTime: e.target.value })}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="hint">Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
      )}

      {/* Premiere Countdown */}
      {config.publishMode === 'premiere' && (
        <>
          <div className="form-group">
            <label>Premiere starts at</label>
            <input
              type="datetime-local"
              value={config.scheduledTime || ''}
              onChange={(e) => onChange({ scheduledTime: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="form-group">
            <label>Countdown duration (minutes)</label>
            <select
              value={config.premiereCountdown}
              onChange={(e) => onChange({ premiereCountdown: parseInt(e.target.value) })}
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            <p className="hint">How long viewers can join before the premiere starts</p>
          </div>
        </>
      )}
    </div>
  );
}
```

## Task 4: AdvancedTab

```tsx
// src/components/nodes/panels/publish/AdvancedTab.tsx
'use client';

import type { PublishNodeConfig } from '@/types/nodes/publish';

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

export function AdvancedTab({ config, onChange }: Props) {
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
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="pt">Portuguese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
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
        <p className="hint warning">⚠️ Setting this incorrectly can result in account penalties</p>

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
          >
            <option value="">Select playlist...</option>
            {/* Populated from API */}
          </select>
        )}
      </div>
    </div>
  );
}
```
