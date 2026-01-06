# Thumbnail Node Panel

## Tabs

1. **Generator** - Gemini/DALL-E/Flux picker
2. **Style** - Template picker, reference images
3. **Text** - Title overlay, font, position
4. **Brand** - Colors, logo placement
5. **Output** - Variations, aspect ratio

## TypeScript Types

```typescript
// types/nodes/thumbnail.ts

export interface ThumbnailNodeConfig {
  // Generator
  generator: 'gemini' | 'dalle' | 'flux' | 'ideogram';
  generatorModel: string; // e.g., 'imagen-3', 'dall-e-3'

  // Style
  stylePreset: string; // 'youtube-standard', 'minimal', 'bold', 'custom'
  referenceImages: string[]; // URLs or base64
  colorScheme: 'auto' | 'light' | 'dark' | 'vibrant';

  // Text
  showTitle: boolean;
  titleOverride?: string;
  titlePosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  fontColor: string;
  fontStroke: boolean;
  fontStrokeColor: string;

  // Brand
  useBrandColors: boolean;
  primaryColor: string;
  secondaryColor: string;
  showLogo: boolean;
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  logoSize: number; // percentage

  // Output
  variations: number; // 1-4
  aspectRatio: '16:9' | '1:1' | '4:3';
  resolution: '1280x720' | '1920x1080';
}
```

## Task 1: GeneratorTab

```tsx
// src/components/nodes/panels/thumbnail/GeneratorTab.tsx
'use client';

import type { ThumbnailNodeConfig } from '@/types/nodes/thumbnail';

interface Props {
  config: ThumbnailNodeConfig;
  onChange: (updates: Partial<ThumbnailNodeConfig>) => void;
}

const GENERATORS = [
  {
    id: 'gemini',
    name: 'Google Imagen',
    models: [
      { id: 'imagen-3', label: 'Imagen 3', desc: 'Latest, best quality' },
      { id: 'imagen-2', label: 'Imagen 2', desc: 'Fast, reliable' },
    ],
    features: ['Photorealistic', 'Text rendering', 'Fast'],
    cost: '$$',
  },
  {
    id: 'dalle',
    name: 'DALL-E',
    models: [
      { id: 'dall-e-3', label: 'DALL-E 3', desc: 'Best prompt following' },
      { id: 'dall-e-2', label: 'DALL-E 2', desc: 'Faster, cheaper' },
    ],
    features: ['Creative', 'Good with concepts', 'Variations'],
    cost: '$$',
  },
  {
    id: 'flux',
    name: 'Flux',
    models: [
      { id: 'flux-pro', label: 'Flux Pro', desc: 'Highest quality' },
      { id: 'flux-schnell', label: 'Flux Schnell', desc: 'Fast generation' },
    ],
    features: ['Photorealistic', 'Excellent faces', 'Consistent style'],
    cost: '$$$',
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    models: [
      { id: 'ideogram-2', label: 'Ideogram 2.0', desc: 'Best text in images' },
    ],
    features: ['Best text rendering', 'Typography', 'Logos'],
    cost: '$$',
  },
];

export function GeneratorTab({ config, onChange }: Props) {
  const selectedGenerator = GENERATORS.find(g => g.id === config.generator);

  return (
    <div className="generator-tab">
      <h4>Image Generator</h4>
      <p className="hint">Choose which AI generates your thumbnails</p>

      <div className="generator-grid">
        {GENERATORS.map((gen) => (
          <button
            key={gen.id}
            className={`generator-card ${config.generator === gen.id ? 'selected' : ''}`}
            onClick={() => onChange({ generator: gen.id as ThumbnailNodeConfig['generator'] })}
          >
            <span className="generator-name">{gen.name}</span>
            <span className="generator-cost">{gen.cost}</span>
            <div className="generator-features">
              {gen.features.map((f, i) => (
                <span key={i} className="feature-tag">{f}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Model Selection */}
      {selectedGenerator && (
        <div className="model-section">
          <h5>Model Version</h5>
          <div className="model-options">
            {selectedGenerator.models.map((model) => (
              <label key={model.id} className="radio-card">
                <input
                  type="radio"
                  name="model"
                  checked={config.generatorModel === model.id}
                  onChange={() => onChange({ generatorModel: model.id })}
                />
                <span className="model-label">{model.label}</span>
                <span className="model-desc">{model.desc}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Task 2: StyleTab with Reference Images

```tsx
// src/components/nodes/panels/thumbnail/StyleTab.tsx
'use client';

import { useState } from 'react';
import type { ThumbnailNodeConfig } from '@/types/nodes/thumbnail';

interface Props {
  config: ThumbnailNodeConfig;
  onChange: (updates: Partial<ThumbnailNodeConfig>) => void;
}

const STYLE_PRESETS = [
  { id: 'youtube-standard', label: 'YouTube Standard', desc: 'Face + bold text + bright colors' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, simple, professional' },
  { id: 'bold', label: 'Bold', desc: 'High contrast, dramatic' },
  { id: 'cinematic', label: 'Cinematic', desc: 'Movie poster style' },
  { id: 'custom', label: 'Custom', desc: 'Define your own style' },
];

export function StyleTab({ config, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          onChange({
            referenceImages: [...config.referenceImages, reader.result as string],
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeReference = (index: number) => {
    onChange({
      referenceImages: config.referenceImages.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="style-tab">
      <h4>Style Settings</h4>

      {/* Style Preset */}
      <div className="form-group">
        <label>Style Preset</label>
        <div className="preset-grid">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`preset-card ${config.stylePreset === preset.id ? 'selected' : ''}`}
              onClick={() => onChange({ stylePreset: preset.id })}
            >
              <span className="preset-label">{preset.label}</span>
              <span className="preset-desc">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reference Images */}
      <div className="form-group">
        <label>Reference Images</label>
        <p className="hint">Upload thumbnails you like - AI will match their style</p>

        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="drop-icon">📷</span>
          <span>Drop images here or click to upload</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(file => {
                const reader = new FileReader();
                reader.onload = () => {
                  onChange({
                    referenceImages: [...config.referenceImages, reader.result as string],
                  });
                };
                reader.readAsDataURL(file);
              });
            }}
          />
        </div>

        {config.referenceImages.length > 0 && (
          <div className="reference-grid">
            {config.referenceImages.map((img, i) => (
              <div key={i} className="reference-item">
                <img src={img} alt={`Reference ${i + 1}`} />
                <button className="remove-btn" onClick={() => removeReference(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Color Scheme */}
      <div className="form-group">
        <label>Color Scheme</label>
        <div className="color-options">
          {[
            { id: 'auto', label: 'Auto', desc: 'Based on content' },
            { id: 'light', label: 'Light', desc: 'Bright background' },
            { id: 'dark', label: 'Dark', desc: 'Dark background' },
            { id: 'vibrant', label: 'Vibrant', desc: 'Bold, saturated' },
          ].map((scheme) => (
            <button
              key={scheme.id}
              className={`scheme-btn ${config.colorScheme === scheme.id ? 'selected' : ''}`}
              onClick={() => onChange({ colorScheme: scheme.id as ThumbnailNodeConfig['colorScheme'] })}
            >
              {scheme.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Task 3: TextTab

```tsx
// src/components/nodes/panels/thumbnail/TextTab.tsx
'use client';

import type { ThumbnailNodeConfig } from '@/types/nodes/thumbnail';

interface Props {
  config: ThumbnailNodeConfig;
  onChange: (updates: Partial<ThumbnailNodeConfig>) => void;
}

const FONTS = [
  'Impact',
  'Bebas Neue',
  'Oswald',
  'Montserrat',
  'Roboto Condensed',
  'Anton',
];

const POSITIONS = [
  { id: 'top-left', label: '↖ Top Left' },
  { id: 'top-right', label: '↗ Top Right' },
  { id: 'center', label: '⬤ Center' },
  { id: 'bottom-left', label: '↙ Bottom Left' },
  { id: 'bottom-right', label: '↘ Bottom Right' },
];

export function TextTab({ config, onChange }: Props) {
  return (
    <div className="text-tab">
      <h4>Text Overlay</h4>

      {/* Show Title Toggle */}
      <div className="form-group">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.showTitle}
            onChange={(e) => onChange({ showTitle: e.target.checked })}
          />
          <span>Add title text to thumbnail</span>
        </label>
      </div>

      {config.showTitle && (
        <>
          {/* Title Override */}
          <div className="form-group">
            <label>Title Text</label>
            <input
              type="text"
              value={config.titleOverride || ''}
              onChange={(e) => onChange({ titleOverride: e.target.value })}
              placeholder="Leave empty to use video title"
            />
            <p className="hint">Override the auto-generated title text</p>
          </div>

          {/* Position */}
          <div className="form-group">
            <label>Position</label>
            <div className="position-grid">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  className={`position-btn ${config.titlePosition === pos.id ? 'selected' : ''}`}
                  onClick={() => onChange({ titlePosition: pos.id as ThumbnailNodeConfig['titlePosition'] })}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="form-group">
            <label>Font</label>
            <select
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
            >
              {FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="form-group">
            <label>Size</label>
            <div className="size-options">
              {(['small', 'medium', 'large', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  className={`size-btn ${config.fontSize === size ? 'selected' : ''}`}
                  onClick={() => onChange({ fontSize: size })}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="form-row">
            <div className="form-group">
              <label>Text Color</label>
              <input
                type="color"
                value={config.fontColor}
                onChange={(e) => onChange({ fontColor: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={config.fontStroke}
                  onChange={(e) => onChange({ fontStroke: e.target.checked })}
                />
                <span>Stroke/Outline</span>
              </label>
              {config.fontStroke && (
                <input
                  type="color"
                  value={config.fontStrokeColor}
                  onChange={(e) => onChange({ fontStrokeColor: e.target.value })}
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

## Task 4: OutputTab

```tsx
// src/components/nodes/panels/thumbnail/OutputTab.tsx
'use client';

import type { ThumbnailNodeConfig } from '@/types/nodes/thumbnail';

interface Props {
  config: ThumbnailNodeConfig;
  onChange: (updates: Partial<ThumbnailNodeConfig>) => void;
}

export function OutputTab({ config, onChange }: Props) {
  return (
    <div className="output-tab">
      <h4>Output Settings</h4>

      {/* Variations */}
      <div className="form-group">
        <label>Variations to Generate</label>
        <div className="variations-selector">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              className={`variation-btn ${config.variations === n ? 'selected' : ''}`}
              onClick={() => onChange({ variations: n })}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="hint">Generate multiple options to choose from</p>
      </div>

      {/* Aspect Ratio */}
      <div className="form-group">
        <label>Aspect Ratio</label>
        <div className="ratio-options">
          {[
            { id: '16:9', label: '16:9', desc: 'YouTube Standard' },
            { id: '1:1', label: '1:1', desc: 'Square (Community)' },
            { id: '4:3', label: '4:3', desc: 'Classic' },
          ].map((ratio) => (
            <button
              key={ratio.id}
              className={`ratio-btn ${config.aspectRatio === ratio.id ? 'selected' : ''}`}
              onClick={() => onChange({ aspectRatio: ratio.id as ThumbnailNodeConfig['aspectRatio'] })}
            >
              <span className="ratio-label">{ratio.label}</span>
              <span className="ratio-desc">{ratio.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resolution */}
      <div className="form-group">
        <label>Resolution</label>
        <select
          value={config.resolution}
          onChange={(e) => onChange({ resolution: e.target.value as ThumbnailNodeConfig['resolution'] })}
        >
          <option value="1280x720">1280×720 (HD)</option>
          <option value="1920x1080">1920×1080 (Full HD)</option>
        </select>
        <p className="hint">YouTube recommends 1280×720 minimum</p>
      </div>
    </div>
  );
}
```
