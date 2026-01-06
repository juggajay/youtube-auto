# Assembly Node Panel

## Tabs

1. **Visual Source** - Stock/AI/Text Cards picker
2. **Structure** - Intro, outro, transitions
3. **Captions** - Style, position, animation
4. **Music** - Library browser, volume
5. **Output** - Resolution, format, quality

## TypeScript Types

```typescript
// types/nodes/assembly.ts

export interface AssemblyNodeConfig {
  // Visual Source
  visualSource: 'stock' | 'ai-generated' | 'text-cards' | 'mixed';
  stockProvider: 'pexels' | 'pixabay' | 'storyblocks';
  aiImageStyle: string;
  textCardStyle: string;

  // Structure
  includeIntro: boolean;
  introTemplate: string;
  introDuration: number; // seconds
  includeOutro: boolean;
  outroTemplate: string;
  outroDuration: number;
  transitionStyle: 'cut' | 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration: number; // ms

  // Captions
  includeCaptions: boolean;
  captionStyle: 'standard' | 'highlighted' | 'karaoke' | 'minimal';
  captionPosition: 'bottom' | 'top' | 'center';
  captionFont: string;
  captionFontSize: number;
  captionColor: string;
  captionBackground: boolean;
  captionBackgroundColor: string;

  // Music
  includeMusic: boolean;
  musicTrackId?: string;
  musicVolume: number; // 0-100
  musicFadeIn: boolean;
  musicFadeOut: boolean;
  ducking: boolean; // Lower music during speech
  duckingAmount: number; // percentage to reduce

  // Output
  resolution: '720p' | '1080p' | '4k';
  frameRate: 24 | 30 | 60;
  format: 'mp4' | 'mov' | 'webm';
  quality: 'draft' | 'standard' | 'high';
}
```

## Task 1: VisualSourceTab

```tsx
// src/components/nodes/panels/assembly/VisualSourceTab.tsx
'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const VISUAL_SOURCES = [
  {
    id: 'stock',
    label: 'Stock Footage',
    desc: 'Auto-matched from Pexels, Pixabay, etc.',
    icon: '🎬',
  },
  {
    id: 'ai-generated',
    label: 'AI Generated',
    desc: 'Create visuals from script descriptions',
    icon: '🤖',
  },
  {
    id: 'text-cards',
    label: 'Text Cards',
    desc: 'Animated text on backgrounds',
    icon: '📝',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    desc: 'Combine all sources intelligently',
    icon: '🎨',
  },
];

const STOCK_PROVIDERS = [
  { id: 'pexels', label: 'Pexels', desc: 'Free, high quality' },
  { id: 'pixabay', label: 'Pixabay', desc: 'Free, large library' },
  { id: 'storyblocks', label: 'Storyblocks', desc: 'Premium, unlimited' },
];

export function VisualSourceTab({ config, onChange }: Props) {
  return (
    <div className="visual-source-tab">
      <h4>Visual Source</h4>
      <p className="hint">Where should the video visuals come from?</p>

      <div className="source-grid">
        {VISUAL_SOURCES.map((source) => (
          <button
            key={source.id}
            className={`source-card ${config.visualSource === source.id ? 'selected' : ''}`}
            onClick={() => onChange({ visualSource: source.id as AssemblyNodeConfig['visualSource'] })}
          >
            <span className="source-icon">{source.icon}</span>
            <span className="source-label">{source.label}</span>
            <span className="source-desc">{source.desc}</span>
          </button>
        ))}
      </div>

      {/* Stock Provider */}
      {(config.visualSource === 'stock' || config.visualSource === 'mixed') && (
        <div className="form-group">
          <label>Stock Provider</label>
          <div className="provider-options">
            {STOCK_PROVIDERS.map((provider) => (
              <label key={provider.id} className="radio-card">
                <input
                  type="radio"
                  name="stockProvider"
                  checked={config.stockProvider === provider.id}
                  onChange={() => onChange({ stockProvider: provider.id as AssemblyNodeConfig['stockProvider'] })}
                />
                <span className="provider-label">{provider.label}</span>
                <span className="provider-desc">{provider.desc}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* AI Image Style */}
      {(config.visualSource === 'ai-generated' || config.visualSource === 'mixed') && (
        <div className="form-group">
          <label>AI Image Style</label>
          <select
            value={config.aiImageStyle}
            onChange={(e) => onChange({ aiImageStyle: e.target.value })}
          >
            <option value="realistic">Realistic</option>
            <option value="cinematic">Cinematic</option>
            <option value="illustration">Illustration</option>
            <option value="3d-render">3D Render</option>
            <option value="anime">Anime</option>
          </select>
        </div>
      )}

      {/* Text Card Style */}
      {(config.visualSource === 'text-cards' || config.visualSource === 'mixed') && (
        <div className="form-group">
          <label>Text Card Style</label>
          <select
            value={config.textCardStyle}
            onChange={(e) => onChange({ textCardStyle: e.target.value })}
          >
            <option value="minimal">Minimal</option>
            <option value="gradient">Gradient Background</option>
            <option value="animated">Animated</option>
            <option value="kinetic">Kinetic Typography</option>
          </select>
        </div>
      )}
    </div>
  );
}
```

## Task 2: CaptionsTab

```tsx
// src/components/nodes/panels/assembly/CaptionsTab.tsx
'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

const CAPTION_STYLES = [
  { id: 'standard', label: 'Standard', desc: 'Simple text overlay', preview: '📝' },
  { id: 'highlighted', label: 'Highlighted', desc: 'Word-by-word highlight', preview: '🔆' },
  { id: 'karaoke', label: 'Karaoke', desc: 'Bouncing ball effect', preview: '🎤' },
  { id: 'minimal', label: 'Minimal', desc: 'Small, unobtrusive', preview: '✨' },
];

export function CaptionsTab({ config, onChange }: Props) {
  return (
    <div className="captions-tab">
      <h4>Captions</h4>

      {/* Enable Captions */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.includeCaptions}
            onChange={(e) => onChange({ includeCaptions: e.target.checked })}
          />
          <span>Include burned-in captions</span>
        </label>
        <p className="hint">Captions increase engagement by 80% on mobile</p>
      </div>

      {config.includeCaptions && (
        <>
          {/* Style */}
          <div className="form-group">
            <label>Caption Style</label>
            <div className="style-grid">
              {CAPTION_STYLES.map((style) => (
                <button
                  key={style.id}
                  className={`style-card ${config.captionStyle === style.id ? 'selected' : ''}`}
                  onClick={() => onChange({ captionStyle: style.id as AssemblyNodeConfig['captionStyle'] })}
                >
                  <span className="style-preview">{style.preview}</span>
                  <span className="style-label">{style.label}</span>
                  <span className="style-desc">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="form-group">
            <label>Position</label>
            <div className="position-options">
              {['top', 'center', 'bottom'].map((pos) => (
                <button
                  key={pos}
                  className={`position-btn ${config.captionPosition === pos ? 'selected' : ''}`}
                  onClick={() => onChange({ captionPosition: pos as AssemblyNodeConfig['captionPosition'] })}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Settings */}
          <div className="form-row">
            <div className="form-group">
              <label>Font</label>
              <select
                value={config.captionFont}
                onChange={(e) => onChange({ captionFont: e.target.value })}
              >
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>

            <div className="form-group">
              <label>Size</label>
              <input
                type="number"
                value={config.captionFontSize}
                onChange={(e) => onChange({ captionFontSize: parseInt(e.target.value) })}
                min={12}
                max={72}
              />
            </div>
          </div>

          {/* Colors */}
          <div className="form-row">
            <div className="form-group">
              <label>Text Color</label>
              <input
                type="color"
                value={config.captionColor}
                onChange={(e) => onChange({ captionColor: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={config.captionBackground}
                  onChange={(e) => onChange({ captionBackground: e.target.checked })}
                />
                <span>Background</span>
              </label>
              {config.captionBackground && (
                <input
                  type="color"
                  value={config.captionBackgroundColor}
                  onChange={(e) => onChange({ captionBackgroundColor: e.target.value })}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

## Task 3: MusicTab

```tsx
// src/components/nodes/panels/assembly/MusicTab.tsx
'use client';

import { useState, useEffect } from 'react';
import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  mood: string;
  previewUrl: string;
}

export function MusicTab({ config, onChange }: Props) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [filter, setFilter] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    // Fetch music library
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    // TODO: Implement music library API
    setTracks([
      { id: '1', name: 'Upbeat Corporate', artist: 'Stock Music', duration: '2:30', mood: 'energetic', previewUrl: '' },
      { id: '2', name: 'Inspiring Piano', artist: 'Stock Music', duration: '3:15', mood: 'inspiring', previewUrl: '' },
      { id: '3', name: 'Chill Lo-Fi', artist: 'Stock Music', duration: '4:00', mood: 'relaxed', previewUrl: '' },
    ]);
  };

  return (
    <div className="music-tab">
      <h4>Background Music</h4>

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
      </div>

      {config.includeMusic && (
        <>
          {/* Track Selection */}
          <div className="form-group">
            <label>Select Track</label>
            <input
              type="text"
              placeholder="Search music..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <div className="track-list">
              {tracks.filter(t => t.name.toLowerCase().includes(filter.toLowerCase())).map((track) => (
                <div
                  key={track.id}
                  className={`track-item ${config.musicTrackId === track.id ? 'selected' : ''}`}
                  onClick={() => onChange({ musicTrackId: track.id })}
                >
                  <div className="track-info">
                    <span className="track-name">{track.name}</span>
                    <span className="track-artist">{track.artist}</span>
                  </div>
                  <span className="track-mood">{track.mood}</span>
                  <span className="track-duration">{track.duration}</span>
                  <button
                    className="preview-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaying(playing === track.id ? null : track.id);
                    }}
                  >
                    {playing === track.id ? '⏹️' : '▶️'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="form-group">
            <label>
              Volume
              <span className="value-badge">{config.musicVolume}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={config.musicVolume}
              onChange={(e) => onChange({ musicVolume: parseInt(e.target.value) })}
            />
          </div>

          {/* Fade Options */}
          <div className="form-row">
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
          <div className="form-group">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={config.ducking}
                onChange={(e) => onChange({ ducking: e.target.checked })}
              />
              <span>Auto-duck during speech</span>
            </label>
            {config.ducking && (
              <>
                <p className="hint">Lower music volume when voice is speaking</p>
                <label>
                  Duck Amount
                  <span className="value-badge">{config.duckingAmount}%</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={80}
                  value={config.duckingAmount}
                  onChange={(e) => onChange({ duckingAmount: parseInt(e.target.value) })}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

## Task 4: OutputTab

```tsx
// src/components/nodes/panels/assembly/OutputTab.tsx
'use client';

import type { AssemblyNodeConfig } from '@/types/nodes/assembly';

interface Props {
  config: AssemblyNodeConfig;
  onChange: (updates: Partial<AssemblyNodeConfig>) => void;
}

export function OutputTab({ config, onChange }: Props) {
  return (
    <div className="output-tab">
      <h4>Output Settings</h4>

      {/* Resolution */}
      <div className="form-group">
        <label>Resolution</label>
        <div className="resolution-options">
          {[
            { id: '720p', label: '720p', desc: '1280×720' },
            { id: '1080p', label: '1080p', desc: '1920×1080' },
            { id: '4k', label: '4K', desc: '3840×2160' },
          ].map((res) => (
            <button
              key={res.id}
              className={`res-btn ${config.resolution === res.id ? 'selected' : ''}`}
              onClick={() => onChange({ resolution: res.id as AssemblyNodeConfig['resolution'] })}
            >
              <span className="res-label">{res.label}</span>
              <span className="res-desc">{res.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate */}
      <div className="form-group">
        <label>Frame Rate</label>
        <div className="fps-options">
          {[
            { id: 24, label: '24 fps', desc: 'Cinematic' },
            { id: 30, label: '30 fps', desc: 'Standard' },
            { id: 60, label: '60 fps', desc: 'Smooth' },
          ].map((fps) => (
            <button
              key={fps.id}
              className={`fps-btn ${config.frameRate === fps.id ? 'selected' : ''}`}
              onClick={() => onChange({ frameRate: fps.id as AssemblyNodeConfig['frameRate'] })}
            >
              <span className="fps-label">{fps.label}</span>
              <span className="fps-desc">{fps.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="form-group">
        <label>Format</label>
        <select
          value={config.format}
          onChange={(e) => onChange({ format: e.target.value as AssemblyNodeConfig['format'] })}
        >
          <option value="mp4">MP4 (H.264) - Best compatibility</option>
          <option value="mov">MOV (ProRes) - Best quality</option>
          <option value="webm">WebM (VP9) - Web optimized</option>
        </select>
      </div>

      {/* Quality */}
      <div className="form-group">
        <label>Quality Preset</label>
        <div className="quality-options">
          {[
            { id: 'draft', label: 'Draft', desc: 'Fast preview, lower quality' },
            { id: 'standard', label: 'Standard', desc: 'Balanced quality/speed' },
            { id: 'high', label: 'High', desc: 'Best quality, slower' },
          ].map((q) => (
            <button
              key={q.id}
              className={`quality-btn ${config.quality === q.id ? 'selected' : ''}`}
              onClick={() => onChange({ quality: q.id as AssemblyNodeConfig['quality'] })}
            >
              <span className="quality-label">{q.label}</span>
              <span className="quality-desc">{q.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```
