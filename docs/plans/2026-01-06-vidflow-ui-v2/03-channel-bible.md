# Channel Bible Editor

## Components

```
src/components/settings/
├── ChannelBibleEditor.tsx      # Full editor page
├── ToneSliders.tsx             # 4 tone dimension sliders
├── VocabularySection.tsx       # Terms, banned words, phrases
├── ExampleScriptsSection.tsx   # CRITICAL - paste best scripts
└── ContentDefaultsSection.tsx  # Length, hook style, CTA
```

## Task 1: ToneSliders Component

**Files:**
- Create: `src/components/settings/ToneSliders.tsx`

```tsx
// src/components/settings/ToneSliders.tsx
'use client';

interface ToneValues {
  casualProfessional: number;
  humorLevel: number;
  energyLevel: number;
  educationalEntertainment: number;
}

interface Props {
  values: ToneValues;
  onChange: (values: ToneValues) => void;
}

const TONE_CONFIGS = [
  {
    key: 'casualProfessional',
    label: 'Tone',
    leftLabel: 'Casual',
    rightLabel: 'Professional',
    leftDesc: 'Conversational, friendly, like talking to a friend',
    rightDesc: 'Polished, authoritative, expert voice',
  },
  {
    key: 'humorLevel',
    label: 'Humor',
    leftLabel: 'Serious',
    rightLabel: 'Playful',
    leftDesc: 'Straightforward, no jokes',
    rightDesc: 'Witty, uses humor and memes',
  },
  {
    key: 'energyLevel',
    label: 'Energy',
    leftLabel: 'Calm',
    rightLabel: 'High Energy',
    leftDesc: 'Relaxed pace, thoughtful',
    rightDesc: 'Fast-paced, enthusiastic, excited',
  },
  {
    key: 'educationalEntertainment',
    label: 'Focus',
    leftLabel: 'Educational',
    rightLabel: 'Entertainment',
    leftDesc: 'Teaching, explaining, informing',
    rightDesc: 'Engaging, storytelling, captivating',
  },
];

export function ToneSliders({ values, onChange }: Props) {
  const handleChange = (key: keyof ToneValues, value: number) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="tone-sliders">
      <h3>Voice & Tone</h3>
      <p className="hint">Set the personality dimensions for your channel's voice</p>

      {TONE_CONFIGS.map((config) => (
        <div key={config.key} className="tone-slider-row">
          <div className="slider-labels">
            <span className="label-left">
              <strong>{config.leftLabel}</strong>
              <small>{config.leftDesc}</small>
            </span>
            <span className="label-right">
              <strong>{config.rightLabel}</strong>
              <small>{config.rightDesc}</small>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={values[config.key as keyof ToneValues]}
            onChange={(e) => handleChange(config.key as keyof ToneValues, parseInt(e.target.value))}
            className="tone-slider"
          />
          <div className="slider-value">{values[config.key as keyof ToneValues]}%</div>
        </div>
      ))}
    </div>
  );
}
```

## Task 2: ExampleScriptsSection (CRITICAL)

**Files:**
- Create: `src/components/settings/ExampleScriptsSection.tsx`

```tsx
// src/components/settings/ExampleScriptsSection.tsx
'use client';

import { useState } from 'react';

interface ExampleScript {
  id: string;
  title: string;
  script: string;
  notes?: string;
}

interface Props {
  scripts: ExampleScript[];
  onChange: (scripts: ExampleScript[]) => void;
}

export function ExampleScriptsSection({ scripts, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newScript, setNewScript] = useState({ title: '', script: '', notes: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const addScript = () => {
    if (!newScript.title || !newScript.script) return;

    const script: ExampleScript = {
      id: crypto.randomUUID(),
      ...newScript,
    };
    onChange([...scripts, script]);
    setNewScript({ title: '', script: '', notes: '' });
    setShowAddForm(false);
  };

  const removeScript = (id: string) => {
    onChange(scripts.filter(s => s.id !== id));
  };

  const updateScript = (id: string, updates: Partial<ExampleScript>) => {
    onChange(scripts.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="example-scripts-section">
      <div className="section-header">
        <div>
          <h3>Example Scripts</h3>
          <p className="hint critical">
            🎯 CRITICAL: Paste 2-3 of your best scripts. The AI learns your voice from these examples, not descriptions.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
          + Add Script
        </button>
      </div>

      {scripts.length === 0 && !showAddForm && (
        <div className="empty-state">
          <p>No example scripts yet.</p>
          <p>Adding your best scripts dramatically improves AI output quality.</p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            Add Your First Script
          </button>
        </div>
      )}

      {/* Script List */}
      <div className="scripts-list">
        {scripts.map((script) => (
          <div key={script.id} className="script-card">
            {editingId === script.id ? (
              // Edit Mode
              <div className="script-edit">
                <input
                  type="text"
                  value={script.title}
                  onChange={(e) => updateScript(script.id, { title: e.target.value })}
                  placeholder="Script title"
                />
                <textarea
                  value={script.script}
                  onChange={(e) => updateScript(script.id, { script: e.target.value })}
                  rows={10}
                  placeholder="Paste your script here..."
                />
                <input
                  type="text"
                  value={script.notes || ''}
                  onChange={(e) => updateScript(script.id, { notes: e.target.value })}
                  placeholder="Notes (e.g., 'This one went viral', 'Great hook')"
                />
                <div className="edit-actions">
                  <button className="btn btn-primary" onClick={() => setEditingId(null)}>
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="script-view">
                <div className="script-header">
                  <h4>{script.title}</h4>
                  <div className="script-actions">
                    <button className="btn-icon" onClick={() => setEditingId(script.id)}>✏️</button>
                    <button className="btn-icon" onClick={() => removeScript(script.id)}>🗑️</button>
                  </div>
                </div>
                <pre className="script-preview">{script.script.slice(0, 500)}...</pre>
                {script.notes && <p className="script-notes">📝 {script.notes}</p>}
                <span className="word-count">{script.script.split(/\s+/).length} words</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="script-add-form">
          <h4>Add Example Script</h4>
          <input
            type="text"
            value={newScript.title}
            onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
            placeholder="Script title (e.g., 'Why I Quit My Job')"
          />
          <textarea
            value={newScript.script}
            onChange={(e) => setNewScript({ ...newScript, script: e.target.value })}
            rows={12}
            placeholder="Paste the full script here. Include hooks, transitions, CTAs - everything."
          />
          <input
            type="text"
            value={newScript.notes}
            onChange={(e) => setNewScript({ ...newScript, notes: e.target.value })}
            placeholder="Notes about this script (optional)"
          />
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addScript} disabled={!newScript.title || !newScript.script}>
              Add Script
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Task 3: VocabularySection

**Files:**
- Create: `src/components/settings/VocabularySection.tsx`

```tsx
// src/components/settings/VocabularySection.tsx
'use client';

import { useState } from 'react';

interface Props {
  preferredTerms: string[];
  bannedWords: string[];
  signaturePhrases: string[];
  onChange: (field: 'preferredTerms' | 'bannedWords' | 'signaturePhrases', values: string[]) => void;
}

export function VocabularySection({ preferredTerms, bannedWords, signaturePhrases, onChange }: Props) {
  return (
    <div className="vocabulary-section">
      <h3>Vocabulary</h3>

      {/* Preferred Terms */}
      <div className="vocab-group">
        <label>
          <strong>Preferred Terms</strong>
          <span className="hint">Words/phrases you want the AI to use</span>
        </label>
        <TagInput
          values={preferredTerms}
          onChange={(values) => onChange('preferredTerms', values)}
          placeholder="e.g., 'game-changer', 'let's dive in', 'here's the thing'"
        />
      </div>

      {/* Banned Words */}
      <div className="vocab-group">
        <label>
          <strong>Banned Words</strong>
          <span className="hint">Words/phrases the AI should never use</span>
        </label>
        <TagInput
          values={bannedWords}
          onChange={(values) => onChange('bannedWords', values)}
          placeholder="e.g., 'utilize', 'synergy', 'at the end of the day'"
          variant="negative"
        />
      </div>

      {/* Signature Phrases */}
      <div className="vocab-group">
        <label>
          <strong>Signature Phrases</strong>
          <span className="hint">Your catchphrases and recurring lines</span>
        </label>
        <TagInput
          values={signaturePhrases}
          onChange={(values) => onChange('signaturePhrases', values)}
          placeholder="e.g., 'And that's the tea', 'Let me know in the comments'"
          variant="accent"
        />
      </div>
    </div>
  );
}

// Reusable TagInput component
function TagInput({
  values,
  onChange,
  placeholder,
  variant = 'default',
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  variant?: 'default' | 'negative' | 'accent';
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="tag-input-wrapper">
      <div className="tags">
        {values.map((tag, i) => (
          <span key={i} className={`tag tag-${variant}`}>
            {tag}
            <button onClick={() => removeTag(i)}>×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
        placeholder={placeholder}
      />
    </div>
  );
}
```

## Task 4: Full ChannelBibleEditor

**Files:**
- Create: `src/components/settings/ChannelBibleEditor.tsx`

```tsx
// src/components/settings/ChannelBibleEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { ToneSliders } from './ToneSliders';
import { VocabularySection } from './VocabularySection';
import { ExampleScriptsSection } from './ExampleScriptsSection';
import { createBrowserClient } from '@/lib/db/client';
import type { ChannelBible } from '@/types/database';

export function ChannelBibleEditor() {
  const [bible, setBible] = useState<ChannelBible | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'tone' | 'vocabulary' | 'defaults' | 'examples'>('identity');

  useEffect(() => {
    loadBible();
  }, []);

  const loadBible = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('channel_bibles')
      .select('*')
      .single();

    if (data) {
      setBible(data);
    } else {
      // Initialize empty bible
      setBible({
        id: '',
        user_id: '',
        channel_name: '',
        niche: '',
        target_audience: '',
        tone_casual_professional: 50,
        tone_humor_level: 50,
        tone_energy_level: 50,
        tone_educational_entertainment: 50,
        preferred_terms: [],
        banned_words: [],
        signature_phrases: [],
        typical_length_minutes: 10,
        hook_style: 'question',
        cta_approach: '',
        example_scripts: [],
        primary_color: '#FF0000',
        secondary_color: '#FFFFFF',
        font_preference: '',
        logo_url: '',
      });
    }
  };

  const saveBible = async () => {
    if (!bible) return;
    setSaving(true);

    const supabase = createBrowserClient();
    await supabase
      .from('channel_bibles')
      .upsert(bible);

    setSaving(false);
  };

  if (!bible) return <div className="loading">Loading...</div>;

  const tabs = [
    { id: 'identity', label: 'Identity' },
    { id: 'tone', label: 'Tone & Voice' },
    { id: 'vocabulary', label: 'Vocabulary' },
    { id: 'defaults', label: 'Defaults' },
    { id: 'examples', label: 'Example Scripts' },
  ];

  return (
    <div className="channel-bible-editor">
      <div className="editor-header">
        <h2>Channel Bible</h2>
        <p>Define your channel's identity, voice, and style. The AI uses this for every script.</p>
        <button className="btn btn-primary" onClick={saveBible} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="editor-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="editor-content">
        {activeTab === 'identity' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Channel Name</label>
              <input
                type="text"
                value={bible.channel_name || ''}
                onChange={(e) => setBible({ ...bible, channel_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Niche</label>
              <input
                type="text"
                value={bible.niche || ''}
                onChange={(e) => setBible({ ...bible, niche: e.target.value })}
                placeholder="e.g., Tech Reviews, Personal Finance, Fitness"
              />
            </div>
            <div className="form-group">
              <label>Target Audience</label>
              <textarea
                value={bible.target_audience || ''}
                onChange={(e) => setBible({ ...bible, target_audience: e.target.value })}
                placeholder="Describe your ideal viewer..."
                rows={3}
              />
            </div>
          </div>
        )}

        {activeTab === 'tone' && (
          <ToneSliders
            values={{
              casualProfessional: bible.tone_casual_professional,
              humorLevel: bible.tone_humor_level,
              energyLevel: bible.tone_energy_level,
              educationalEntertainment: bible.tone_educational_entertainment,
            }}
            onChange={(values) => setBible({
              ...bible,
              tone_casual_professional: values.casualProfessional,
              tone_humor_level: values.humorLevel,
              tone_energy_level: values.energyLevel,
              tone_educational_entertainment: values.educationalEntertainment,
            })}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularySection
            preferredTerms={bible.preferred_terms}
            bannedWords={bible.banned_words}
            signaturePhrases={bible.signature_phrases}
            onChange={(field, values) => setBible({ ...bible, [field]: values })}
          />
        )}

        {activeTab === 'defaults' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Typical Video Length (minutes)</label>
              <input
                type="number"
                value={bible.typical_length_minutes}
                onChange={(e) => setBible({ ...bible, typical_length_minutes: parseInt(e.target.value) })}
                min={1}
                max={60}
              />
            </div>
            <div className="form-group">
              <label>Hook Style</label>
              <select
                value={bible.hook_style || ''}
                onChange={(e) => setBible({ ...bible, hook_style: e.target.value })}
              >
                <option value="question">Question Hook</option>
                <option value="statistic">Statistic/Fact Hook</option>
                <option value="story">Story Hook</option>
                <option value="controversy">Controversy Hook</option>
                <option value="promise">Promise Hook</option>
              </select>
            </div>
            <div className="form-group">
              <label>CTA Approach</label>
              <textarea
                value={bible.cta_approach || ''}
                onChange={(e) => setBible({ ...bible, cta_approach: e.target.value })}
                placeholder="How do you typically end videos and ask for engagement?"
                rows={3}
              />
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <ExampleScriptsSection
            scripts={bible.example_scripts}
            onChange={(scripts) => setBible({ ...bible, example_scripts: scripts })}
          />
        )}
      </div>
    </div>
  );
}
```
