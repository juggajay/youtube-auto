# Script Node Panel (9 Tabs)

## Overview

The Script node panel is the most complex, with 9 configuration tabs:

1. **Archetype** - Visual format picker with structure preview
2. **Structure** - Drag-drop section editor
3. **Hooks** - # to generate, style options
4. **Titles** - # to generate, power words, patterns
5. **Description** - Template editor with variables
6. **Tags** - Auto-extract, required, banned
7. **AI Model** - Claude/GPT selector, temperature
8. **Bible Override** - Per-run channel bible tweaks
9. **Advanced** - Raw prompt injection, debug mode

## Components

```
src/components/nodes/panels/script/
├── ScriptPanel.tsx             # Container with tabs
├── ArchetypeTab.tsx            # Visual archetype picker
├── StructureTab.tsx            # Drag-drop section editor
├── HooksTab.tsx                # Hook generation config
├── TitlesTab.tsx               # Title generation config
├── DescriptionTab.tsx          # Description template
├── TagsTab.tsx                 # Tag configuration
├── AIModelTab.tsx              # Model selection
├── BibleOverrideTab.tsx        # Channel bible overrides
├── AdvancedTab.tsx             # Advanced options
└── index.ts
```

## TypeScript Types

```typescript
// types/nodes/script.ts

export interface ScriptNodeConfig {
  // Archetype
  archetypeId: string;
  archetypeOverrides?: Partial<Archetype>;

  // Structure
  sections: ScriptSection[];
  allowReorder: boolean;

  // Hooks
  hooksToGenerate: number; // 1-5
  hookStyle: 'question' | 'statistic' | 'story' | 'controversy' | 'promise';
  hookTone: 'dramatic' | 'conversational' | 'mysterious';

  // Titles
  titlesToGenerate: number; // 1-10
  titlePatterns: string[];
  powerWords: string[];
  titleMaxLength: number;

  // Description
  descriptionTemplate: string;
  descriptionVariables: Record<string, string>;
  includeTimestamps: boolean;
  includeLinks: boolean;

  // Tags
  autoExtractTags: boolean;
  requiredTags: string[];
  bannedTags: string[];
  maxTags: number;

  // AI Model
  model: 'claude-sonnet' | 'claude-opus' | 'gpt-4' | 'gpt-4-turbo';
  temperature: number; // 0-1
  maxTokens: number;

  // Bible Override
  useBible: boolean;
  bibleOverrides: Partial<ChannelBible>;

  // Advanced
  systemPromptAddition: string;
  debugMode: boolean;
  rawOutput: boolean;
}

export interface ScriptSection {
  id: string;
  name: string;
  type: 'hook' | 'intro' | 'point' | 'story' | 'transition' | 'cta' | 'outro';
  duration: string; // e.g., "30s", "2m"
  instructions: string;
  required: boolean;
}
```

## Task 1: ScriptPanel Container

**Files:**
- Create: `src/components/nodes/panels/script/ScriptPanel.tsx`

```tsx
// src/components/nodes/panels/script/ScriptPanel.tsx
'use client';

import { useState } from 'react';
import { useNodeConfigStore } from '@/stores/nodeConfigStore';
import { ArchetypeTab } from './ArchetypeTab';
import { StructureTab } from './StructureTab';
import { HooksTab } from './HooksTab';
import { TitlesTab } from './TitlesTab';
import { DescriptionTab } from './DescriptionTab';
import { TagsTab } from './TagsTab';
import { AIModelTab } from './AIModelTab';
import { BibleOverrideTab } from './BibleOverrideTab';
import { AdvancedTab } from './AdvancedTab';
import type { ScriptNodeConfig } from '@/types/nodes/script';

const TABS = [
  { id: 'archetype', label: 'Format', icon: '📋' },
  { id: 'structure', label: 'Structure', icon: '🏗️' },
  { id: 'hooks', label: 'Hooks', icon: '🎣' },
  { id: 'titles', label: 'Titles', icon: '✏️' },
  { id: 'description', label: 'Description', icon: '📝' },
  { id: 'tags', label: 'Tags', icon: '🏷️' },
  { id: 'model', label: 'AI Model', icon: '🤖' },
  { id: 'bible', label: 'Bible', icon: '📖' },
  { id: 'advanced', label: 'Advanced', icon: '⚙️' },
] as const;

type TabId = typeof TABS[number]['id'];

export function ScriptPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('archetype');
  const { scriptConfig, updateScriptConfig } = useNodeConfigStore();

  const updateConfig = (updates: Partial<ScriptNodeConfig>) => {
    updateScriptConfig({ ...scriptConfig, ...updates });
  };

  return (
    <div className="node-panel script-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="node-icon script">📜</span>
          <h3>Script Generator</h3>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel-content">
        {activeTab === 'archetype' && (
          <ArchetypeTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'structure' && (
          <StructureTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'hooks' && (
          <HooksTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'titles' && (
          <TitlesTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'description' && (
          <DescriptionTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'tags' && (
          <TagsTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'model' && (
          <AIModelTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'bible' && (
          <BibleOverrideTab config={scriptConfig} onChange={updateConfig} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab config={scriptConfig} onChange={updateConfig} />
        )}
      </div>
    </div>
  );
}
```

## Task 2: ArchetypeTab with Visual Picker

```tsx
// src/components/nodes/panels/script/ArchetypeTab.tsx
'use client';

import archetypes from '@/docs/archetypes.json';
import type { ScriptNodeConfig } from '@/types/nodes/script';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

export function ArchetypeTab({ config, onChange }: Props) {
  const selectedArchetype = archetypes.find(a => a.id === config.archetypeId);

  return (
    <div className="archetype-tab">
      <h4>Video Format</h4>
      <p className="hint">Choose the structure template for your script</p>

      <div className="archetype-grid">
        {archetypes.map((arch) => (
          <button
            key={arch.id}
            className={`archetype-card ${config.archetypeId === arch.id ? 'selected' : ''}`}
            onClick={() => onChange({ archetypeId: arch.id })}
          >
            <span className="archetype-icon">{arch.icon}</span>
            <span className="archetype-name">{arch.name}</span>
            <span className="archetype-duration">{arch.typicalLength}</span>
          </button>
        ))}
      </div>

      {selectedArchetype && (
        <div className="archetype-preview">
          <h5>Structure Preview</h5>
          <p className="archetype-description">{selectedArchetype.description}</p>
          <div className="section-timeline">
            {selectedArchetype.sections.map((section, i) => (
              <div key={i} className="timeline-item">
                <span className="section-number">{i + 1}</span>
                <span className="section-name">{section.name}</span>
                <span className="section-duration">{section.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Task 3: StructureTab with Drag-Drop

```tsx
// src/components/nodes/panels/script/StructureTab.tsx
'use client';

import { useState } from 'react';
import type { ScriptNodeConfig, ScriptSection } from '@/types/nodes/script';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

export function StructureTab({ config, onChange }: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...config.sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedItem);

    onChange({ sections: newSections });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const updateSection = (index: number, updates: Partial<ScriptSection>) => {
    const newSections = config.sections.map((s, i) =>
      i === index ? { ...s, ...updates } : s
    );
    onChange({ sections: newSections });
  };

  const addSection = () => {
    const newSection: ScriptSection = {
      id: crypto.randomUUID(),
      name: 'New Section',
      type: 'point',
      duration: '1m',
      instructions: '',
      required: false,
    };
    onChange({ sections: [...config.sections, newSection] });
  };

  const removeSection = (index: number) => {
    onChange({ sections: config.sections.filter((_, i) => i !== index) });
  };

  return (
    <div className="structure-tab">
      <div className="tab-header">
        <div>
          <h4>Script Structure</h4>
          <p className="hint">Drag to reorder sections, click to edit</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={addSection}>
          + Add Section
        </button>
      </div>

      <div className="sections-list">
        {config.sections.map((section, index) => (
          <div
            key={section.id}
            className={`section-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="drag-handle">⋮⋮</div>

            <div className="section-content">
              <input
                type="text"
                className="section-name-input"
                value={section.name}
                onChange={(e) => updateSection(index, { name: e.target.value })}
              />

              <select
                className="section-type-select"
                value={section.type}
                onChange={(e) => updateSection(index, { type: e.target.value as ScriptSection['type'] })}
              >
                <option value="hook">Hook</option>
                <option value="intro">Intro</option>
                <option value="point">Main Point</option>
                <option value="story">Story</option>
                <option value="transition">Transition</option>
                <option value="cta">CTA</option>
                <option value="outro">Outro</option>
              </select>

              <input
                type="text"
                className="section-duration-input"
                value={section.duration}
                onChange={(e) => updateSection(index, { duration: e.target.value })}
                placeholder="Duration"
              />
            </div>

            <div className="section-actions">
              <label className="required-toggle">
                <input
                  type="checkbox"
                  checked={section.required}
                  onChange={(e) => updateSection(index, { required: e.target.checked })}
                />
                Required
              </label>
              <button
                className="btn-icon danger"
                onClick={() => removeSection(index)}
                title="Remove section"
              >
                🗑️
              </button>
            </div>

            <textarea
              className="section-instructions"
              value={section.instructions}
              onChange={(e) => updateSection(index, { instructions: e.target.value })}
              placeholder="Instructions for this section..."
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Task 4: HooksTab

```tsx
// src/components/nodes/panels/script/HooksTab.tsx
'use client';

import type { ScriptNodeConfig } from '@/types/nodes/script';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const HOOK_STYLES = [
  { id: 'question', label: 'Question', desc: '"Did you know...?" "What if...?"', icon: '❓' },
  { id: 'statistic', label: 'Statistic', desc: '"97% of people fail at..."', icon: '📊' },
  { id: 'story', label: 'Story', desc: '"Last week something crazy happened..."', icon: '📖' },
  { id: 'controversy', label: 'Controversy', desc: '"Everyone is wrong about..."', icon: '🔥' },
  { id: 'promise', label: 'Promise', desc: '"By the end of this video..."', icon: '✨' },
];

const HOOK_TONES = [
  { id: 'dramatic', label: 'Dramatic', desc: 'High stakes, urgent' },
  { id: 'conversational', label: 'Conversational', desc: 'Casual, friendly' },
  { id: 'mysterious', label: 'Mysterious', desc: 'Intriguing, curiosity-driven' },
];

export function HooksTab({ config, onChange }: Props) {
  return (
    <div className="hooks-tab">
      <h4>Hook Generation</h4>
      <p className="hint">Configure how opening hooks are generated</p>

      {/* Number of Hooks */}
      <div className="form-group">
        <label>Hooks to Generate</label>
        <div className="number-selector">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`num-btn ${config.hooksToGenerate === n ? 'selected' : ''}`}
              onClick={() => onChange({ hooksToGenerate: n })}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="hint">You'll choose from these options during review</span>
      </div>

      {/* Hook Style */}
      <div className="form-group">
        <label>Hook Style</label>
        <div className="style-grid">
          {HOOK_STYLES.map((style) => (
            <button
              key={style.id}
              className={`style-card ${config.hookStyle === style.id ? 'selected' : ''}`}
              onClick={() => onChange({ hookStyle: style.id as ScriptNodeConfig['hookStyle'] })}
            >
              <span className="style-icon">{style.icon}</span>
              <span className="style-label">{style.label}</span>
              <span className="style-desc">{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hook Tone */}
      <div className="form-group">
        <label>Hook Tone</label>
        <div className="tone-options">
          {HOOK_TONES.map((tone) => (
            <label key={tone.id} className="radio-card">
              <input
                type="radio"
                name="hookTone"
                checked={config.hookTone === tone.id}
                onChange={() => onChange({ hookTone: tone.id as ScriptNodeConfig['hookTone'] })}
              />
              <span className="radio-label">{tone.label}</span>
              <span className="radio-desc">{tone.desc}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Task 5: TitlesTab

```tsx
// src/components/nodes/panels/script/TitlesTab.tsx
'use client';

import { useState } from 'react';
import type { ScriptNodeConfig } from '@/types/nodes/script';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const DEFAULT_POWER_WORDS = [
  'Secret', 'Shocking', 'Ultimate', 'Proven', 'Instantly',
  'Never', 'Always', 'Hidden', 'Exposed', 'Truth',
];

const TITLE_PATTERNS = [
  { id: 'how-to', label: 'How To X', example: 'How To 10x Your Productivity' },
  { id: 'number-list', label: 'X Things...', example: '7 Things Rich People Never Do' },
  { id: 'why', label: 'Why X...', example: 'Why Most Startups Fail' },
  { id: 'what', label: 'What X...', example: 'What They Don\'t Tell You About...' },
  { id: 'versus', label: 'X vs Y', example: 'iPhone vs Android: The Truth' },
  { id: 'mistake', label: 'X Mistake...', example: 'The #1 Mistake Beginners Make' },
];

export function TitlesTab({ config, onChange }: Props) {
  const [newPowerWord, setNewPowerWord] = useState('');

  const addPowerWord = () => {
    if (newPowerWord.trim() && !config.powerWords.includes(newPowerWord.trim())) {
      onChange({ powerWords: [...config.powerWords, newPowerWord.trim()] });
      setNewPowerWord('');
    }
  };

  const removePowerWord = (word: string) => {
    onChange({ powerWords: config.powerWords.filter(w => w !== word) });
  };

  const togglePattern = (patternId: string) => {
    const patterns = config.titlePatterns.includes(patternId)
      ? config.titlePatterns.filter(p => p !== patternId)
      : [...config.titlePatterns, patternId];
    onChange({ titlePatterns: patterns });
  };

  return (
    <div className="titles-tab">
      <h4>Title Generation</h4>

      {/* Number of Titles */}
      <div className="form-group">
        <label>Titles to Generate</label>
        <input
          type="range"
          min={1}
          max={10}
          value={config.titlesToGenerate}
          onChange={(e) => onChange({ titlesToGenerate: parseInt(e.target.value) })}
        />
        <span className="range-value">{config.titlesToGenerate} titles</span>
      </div>

      {/* Max Length */}
      <div className="form-group">
        <label>Max Title Length</label>
        <input
          type="number"
          min={30}
          max={100}
          value={config.titleMaxLength}
          onChange={(e) => onChange({ titleMaxLength: parseInt(e.target.value) })}
        />
        <span className="hint">YouTube truncates at ~60 chars on mobile</span>
      </div>

      {/* Title Patterns */}
      <div className="form-group">
        <label>Preferred Patterns</label>
        <div className="patterns-grid">
          {TITLE_PATTERNS.map((pattern) => (
            <label key={pattern.id} className="pattern-checkbox">
              <input
                type="checkbox"
                checked={config.titlePatterns.includes(pattern.id)}
                onChange={() => togglePattern(pattern.id)}
              />
              <span className="pattern-label">{pattern.label}</span>
              <span className="pattern-example">{pattern.example}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Power Words */}
      <div className="form-group">
        <label>Power Words</label>
        <p className="hint">High-impact words to include in titles</p>
        <div className="power-words">
          {config.powerWords.map((word) => (
            <span key={word} className="power-word">
              {word}
              <button onClick={() => removePowerWord(word)}>×</button>
            </span>
          ))}
        </div>
        <div className="add-power-word">
          <input
            type="text"
            value={newPowerWord}
            onChange={(e) => setNewPowerWord(e.target.value)}
            placeholder="Add power word"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPowerWord())}
          />
          <button className="btn btn-secondary btn-sm" onClick={addPowerWord}>Add</button>
        </div>
        <div className="suggestions">
          <span className="hint">Suggestions:</span>
          {DEFAULT_POWER_WORDS.filter(w => !config.powerWords.includes(w)).slice(0, 5).map((word) => (
            <button
              key={word}
              className="suggestion-chip"
              onClick={() => onChange({ powerWords: [...config.powerWords, word] })}
            >
              + {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Task 6: AIModelTab

```tsx
// src/components/nodes/panels/script/AIModelTab.tsx
'use client';

import type { ScriptNodeConfig } from '@/types/nodes/script';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const MODELS = [
  { id: 'claude-sonnet', label: 'Claude Sonnet', desc: 'Fast, great for most scripts', cost: '$' },
  { id: 'claude-opus', label: 'Claude Opus', desc: 'Best quality, slower', cost: '$$$' },
  { id: 'gpt-4', label: 'GPT-4', desc: 'OpenAI flagship', cost: '$$' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'Faster GPT-4', cost: '$$' },
];

export function AIModelTab({ config, onChange }: Props) {
  return (
    <div className="ai-model-tab">
      <h4>AI Model Settings</h4>

      {/* Model Selection */}
      <div className="form-group">
        <label>Model</label>
        <div className="model-grid">
          {MODELS.map((model) => (
            <button
              key={model.id}
              className={`model-card ${config.model === model.id ? 'selected' : ''}`}
              onClick={() => onChange({ model: model.id as ScriptNodeConfig['model'] })}
            >
              <span className="model-name">{model.label}</span>
              <span className="model-desc">{model.desc}</span>
              <span className="model-cost">{model.cost}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="form-group">
        <label>
          Temperature
          <span className="value-badge">{config.temperature.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
        />
        <div className="range-labels">
          <span>Focused (0)</span>
          <span>Creative (1)</span>
        </div>
        <p className="hint">Higher = more creative/random, Lower = more consistent/safe</p>
      </div>

      {/* Max Tokens */}
      <div className="form-group">
        <label>Max Output Tokens</label>
        <select
          value={config.maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) })}
        >
          <option value={2000}>2,000 (~1,500 words)</option>
          <option value={4000}>4,000 (~3,000 words)</option>
          <option value={8000}>8,000 (~6,000 words)</option>
          <option value={16000}>16,000 (~12,000 words)</option>
        </select>
        <p className="hint">Longer scripts need more tokens</p>
      </div>
    </div>
  );
}
```
