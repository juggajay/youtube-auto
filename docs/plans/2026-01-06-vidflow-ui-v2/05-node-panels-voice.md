# Voice Node Panel

## Tabs

1. **Voice Selection** - ElevenLabs picker, preview, clone
2. **Speech Settings** - Speed, stability, clarity
3. **Pronunciation** - Custom dictionary
4. **Output** - Format, sample rate, chunking

## Components

```
src/components/nodes/panels/voice/
├── VoicePanel.tsx
├── VoiceSelectionTab.tsx
├── SpeechSettingsTab.tsx
├── PronunciationTab.tsx
└── OutputTab.tsx
```

## TypeScript Types

```typescript
// types/nodes/voice.ts

export interface VoiceNodeConfig {
  // Voice Selection
  voiceId: string;
  voiceName: string;
  voicePreviewUrl?: string;
  useClonedVoice: boolean;
  clonedVoiceId?: string;

  // Speech Settings
  speed: number; // 0.5 - 2.0
  stability: number; // 0 - 1
  clarity: number; // 0 - 1
  styleExaggeration: number; // 0 - 1

  // Pronunciation
  pronunciationDict: Array<{
    word: string;
    pronunciation: string; // IPA or phonetic
  }>;

  // Output
  format: 'mp3' | 'wav' | 'ogg';
  sampleRate: 22050 | 44100 | 48000;
  chunkByParagraph: boolean;
}
```

## Task 1: VoiceSelectionTab

```tsx
// src/components/nodes/panels/voice/VoiceSelectionTab.tsx
'use client';

import { useState, useEffect } from 'react';
import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string;
  category: string;
  labels: Record<string, string>;
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
          ⚠️ No voices found. Please add your ElevenLabs API key in Settings.
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
                {playing === voice.voice_id ? '⏹️' : '▶️'}
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
```

## Task 2: SpeechSettingsTab

```tsx
// src/components/nodes/panels/voice/SpeechSettingsTab.tsx
'use client';

import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

export function SpeechSettingsTab({ config, onChange }: Props) {
  return (
    <div className="speech-settings-tab">
      <h4>Speech Settings</h4>

      {/* Speed */}
      <div className="form-group">
        <label>
          Speed
          <span className="value-badge">{config.speed.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.1}
          value={config.speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Slow (0.5x)</span>
          <span>Normal (1x)</span>
          <span>Fast (2x)</span>
        </div>
      </div>

      {/* Stability */}
      <div className="form-group">
        <label>
          Stability
          <span className="value-badge">{Math.round(config.stability * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.stability}
          onChange={(e) => onChange({ stability: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Variable</span>
          <span>Stable</span>
        </div>
        <p className="hint">Higher = more consistent, Lower = more expressive</p>
      </div>

      {/* Clarity + Similarity Enhancement */}
      <div className="form-group">
        <label>
          Clarity
          <span className="value-badge">{Math.round(config.clarity * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.clarity}
          onChange={(e) => onChange({ clarity: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Natural</span>
          <span>Enhanced</span>
        </div>
      </div>

      {/* Style Exaggeration */}
      <div className="form-group">
        <label>
          Style Intensity
          <span className="value-badge">{Math.round(config.styleExaggeration * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.styleExaggeration}
          onChange={(e) => onChange({ styleExaggeration: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Subtle</span>
          <span>Dramatic</span>
        </div>
        <p className="hint">How much the voice adapts to the emotional content</p>
      </div>

      {/* Presets */}
      <div className="presets">
        <h5>Quick Presets</h5>
        <div className="preset-buttons">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onChange({ stability: 0.5, clarity: 0.75, styleExaggeration: 0.3 })}
          >
            Conversational
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onChange({ stability: 0.7, clarity: 0.9, styleExaggeration: 0.5 })}
          >
            Professional
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onChange({ stability: 0.3, clarity: 0.6, styleExaggeration: 0.8 })}
          >
            Dramatic
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Task 3: PronunciationTab

```tsx
// src/components/nodes/panels/voice/PronunciationTab.tsx
'use client';

import { useState } from 'react';
import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

export function PronunciationTab({ config, onChange }: Props) {
  const [newWord, setNewWord] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');

  const addEntry = () => {
    if (!newWord.trim() || !newPronunciation.trim()) return;

    const entry = {
      word: newWord.trim(),
      pronunciation: newPronunciation.trim(),
    };

    onChange({
      pronunciationDict: [...config.pronunciationDict, entry],
    });
    setNewWord('');
    setNewPronunciation('');
  };

  const removeEntry = (index: number) => {
    onChange({
      pronunciationDict: config.pronunciationDict.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="pronunciation-tab">
      <h4>Pronunciation Dictionary</h4>
      <p className="hint">
        Define custom pronunciations for brand names, technical terms, or words the AI mispronounces.
      </p>

      {/* Existing Entries */}
      <div className="pronunciation-list">
        {config.pronunciationDict.length === 0 ? (
          <div className="empty-state">
            No custom pronunciations yet. Add words the AI might mispronounce.
          </div>
        ) : (
          <table className="pronunciation-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Pronunciation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {config.pronunciationDict.map((entry, i) => (
                <tr key={i}>
                  <td>{entry.word}</td>
                  <td className="pronunciation">{entry.pronunciation}</td>
                  <td>
                    <button className="btn-icon" onClick={() => removeEntry(i)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add New */}
      <div className="add-pronunciation">
        <h5>Add Entry</h5>
        <div className="add-form">
          <input
            type="text"
            placeholder="Word (e.g., GIF)"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
          />
          <input
            type="text"
            placeholder="Pronunciation (e.g., JIF or /dʒɪf/)"
            value={newPronunciation}
            onChange={(e) => setNewPronunciation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          />
          <button className="btn btn-primary btn-sm" onClick={addEntry}>Add</button>
        </div>
        <p className="hint">
          Use phonetic spelling or IPA notation. Examples: "gif → jif", "nginx → engine-x"
        </p>
      </div>

      {/* Common Suggestions */}
      <div className="suggestions">
        <h5>Common Tech Terms</h5>
        <div className="suggestion-chips">
          {[
            { word: 'API', pronunciation: 'A-P-I' },
            { word: 'SQL', pronunciation: 'sequel' },
            { word: 'OAuth', pronunciation: 'oh-auth' },
            { word: 'async', pronunciation: 'a-sink' },
          ].filter(s => !config.pronunciationDict.some(e => e.word === s.word)).map((suggestion) => (
            <button
              key={suggestion.word}
              className="suggestion-chip"
              onClick={() => onChange({
                pronunciationDict: [...config.pronunciationDict, suggestion],
              })}
            >
              + {suggestion.word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Task 4: OutputTab

```tsx
// src/components/nodes/panels/voice/OutputTab.tsx
'use client';

import type { VoiceNodeConfig } from '@/types/nodes/voice';

interface Props {
  config: VoiceNodeConfig;
  onChange: (updates: Partial<VoiceNodeConfig>) => void;
}

export function OutputTab({ config, onChange }: Props) {
  return (
    <div className="output-tab">
      <h4>Output Settings</h4>

      {/* Format */}
      <div className="form-group">
        <label>Audio Format</label>
        <div className="format-options">
          {[
            { id: 'mp3', label: 'MP3', desc: 'Compressed, smaller files' },
            { id: 'wav', label: 'WAV', desc: 'Lossless, best quality' },
            { id: 'ogg', label: 'OGG', desc: 'Open format, good compression' },
          ].map((format) => (
            <label key={format.id} className="radio-card">
              <input
                type="radio"
                name="format"
                checked={config.format === format.id}
                onChange={() => onChange({ format: format.id as VoiceNodeConfig['format'] })}
              />
              <span className="format-label">{format.label}</span>
              <span className="format-desc">{format.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sample Rate */}
      <div className="form-group">
        <label>Sample Rate</label>
        <select
          value={config.sampleRate}
          onChange={(e) => onChange({ sampleRate: parseInt(e.target.value) as VoiceNodeConfig['sampleRate'] })}
        >
          <option value={22050}>22,050 Hz (Good for speech)</option>
          <option value={44100}>44,100 Hz (CD Quality)</option>
          <option value={48000}>48,000 Hz (Video Standard)</option>
        </select>
        <p className="hint">Higher = better quality but larger files. 44.1kHz recommended for YouTube.</p>
      </div>

      {/* Chunking */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.chunkByParagraph}
            onChange={(e) => onChange({ chunkByParagraph: e.target.checked })}
          />
          <span>Generate audio per paragraph</span>
        </label>
        <p className="hint">
          Splits script into chunks for easier editing. Useful if you want to re-record sections.
        </p>
      </div>
    </div>
  );
}
```
