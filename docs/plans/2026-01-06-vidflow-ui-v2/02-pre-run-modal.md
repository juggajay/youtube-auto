# Pre-Run Modal

## Components

```
src/components/run/
├── RunInitiationModal.tsx      # Main modal container
├── VideoIdeaForm.tsx           # Topic + expandable details
├── ArchetypeSelector.tsx       # Visual archetype picker
├── InterventionCheckboxes.tsx  # Review control checkboxes
├── CostEstimator.tsx           # Real-time cost breakdown
└── index.ts
```

## Task 1: RunInitiationModal Container

**Files:**
- Create: `src/components/run/RunInitiationModal.tsx`
- Create: `src/stores/runInitStore.ts`

**Step 1: Create Zustand store**

```typescript
// src/stores/runInitStore.ts
import { create } from 'zustand';

interface VideoIdea {
  topic: string;
  angle: string;
  targetAudience: string;
  mustInclude: string[];
  mustAvoid: string[];
  referenceUrl: string;
}

interface InterventionSettings {
  reviewScript: boolean;
  reviewThumbnail: boolean;
  reviewBeforePublish: boolean;
}

interface RunInitState {
  isOpen: boolean;
  step: 'idea' | 'archetype' | 'review';
  videoIdea: VideoIdea;
  archetypeId: string | null;
  interventions: InterventionSettings;
  selectedTemplate: string | null;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: RunInitState['step']) => void;
  updateVideoIdea: (updates: Partial<VideoIdea>) => void;
  setArchetype: (id: string) => void;
  setInterventions: (settings: Partial<InterventionSettings>) => void;
  loadTemplate: (templateId: string) => void;
  reset: () => void;
}

const initialVideoIdea: VideoIdea = {
  topic: '',
  angle: '',
  targetAudience: '',
  mustInclude: [],
  mustAvoid: [],
  referenceUrl: '',
};

const initialInterventions: InterventionSettings = {
  reviewScript: false,
  reviewThumbnail: false,
  reviewBeforePublish: true, // Default ON for safety
};

export const useRunInitStore = create<RunInitState>((set) => ({
  isOpen: false,
  step: 'idea',
  videoIdea: initialVideoIdea,
  archetypeId: null,
  interventions: initialInterventions,
  selectedTemplate: null,

  openModal: () => set({ isOpen: true, step: 'idea' }),
  closeModal: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  updateVideoIdea: (updates) => set((s) => ({
    videoIdea: { ...s.videoIdea, ...updates }
  })),
  setArchetype: (id) => set({ archetypeId: id }),
  setInterventions: (settings) => set((s) => ({
    interventions: { ...s.interventions, ...settings }
  })),
  loadTemplate: (templateId) => {
    // TODO: Fetch template and populate state
  },
  reset: () => set({
    step: 'idea',
    videoIdea: initialVideoIdea,
    archetypeId: null,
    interventions: initialInterventions,
    selectedTemplate: null,
  }),
}));
```

**Step 2: Create modal component**

```tsx
// src/components/run/RunInitiationModal.tsx
'use client';

import { useRunInitStore } from '@/stores/runInitStore';
import { VideoIdeaForm } from './VideoIdeaForm';
import { ArchetypeSelector } from './ArchetypeSelector';
import { InterventionCheckboxes } from './InterventionCheckboxes';
import { CostEstimator } from './CostEstimator';

export function RunInitiationModal() {
  const { isOpen, step, closeModal, setStep } = useRunInitStore();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content run-init-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Video Run</h2>
          <button className="btn-icon" onClick={closeModal}>×</button>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step === 'idea' ? 'active' : ''}`}>1. Video Idea</div>
          <div className={`step ${step === 'archetype' ? 'active' : ''}`}>2. Format</div>
          <div className={`step ${step === 'review' ? 'active' : ''}`}>3. Review</div>
        </div>

        <div className="modal-body">
          {step === 'idea' && <VideoIdeaForm onNext={() => setStep('archetype')} />}
          {step === 'archetype' && <ArchetypeSelector onNext={() => setStep('review')} onBack={() => setStep('idea')} />}
          {step === 'review' && (
            <>
              <InterventionCheckboxes />
              <CostEstimator />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Task 2: VideoIdeaForm with Expandable Details

**Files:**
- Create: `src/components/run/VideoIdeaForm.tsx`

```tsx
// src/components/run/VideoIdeaForm.tsx
'use client';

import { useState } from 'react';
import { useRunInitStore } from '@/stores/runInitStore';

interface Props {
  onNext: () => void;
}

export function VideoIdeaForm({ onNext }: Props) {
  const { videoIdea, updateVideoIdea } = useRunInitStore();
  const [showDetails, setShowDetails] = useState(false);
  const [newMustInclude, setNewMustInclude] = useState('');
  const [newMustAvoid, setNewMustAvoid] = useState('');

  const canProceed = videoIdea.topic.trim().length > 0;

  const addMustInclude = () => {
    if (newMustInclude.trim()) {
      updateVideoIdea({ mustInclude: [...videoIdea.mustInclude, newMustInclude.trim()] });
      setNewMustInclude('');
    }
  };

  const addMustAvoid = () => {
    if (newMustAvoid.trim()) {
      updateVideoIdea({ mustAvoid: [...videoIdea.mustAvoid, newMustAvoid.trim()] });
      setNewMustAvoid('');
    }
  };

  return (
    <div className="video-idea-form">
      {/* Main Topic - Always Visible */}
      <div className="form-group">
        <label>What's your video about?</label>
        <textarea
          className="input-lg"
          placeholder="e.g., Why most productivity advice is wrong and what actually works..."
          value={videoIdea.topic}
          onChange={(e) => updateVideoIdea({ topic: e.target.value })}
          rows={3}
        />
        <span className="char-count">{videoIdea.topic.length} characters</span>
      </div>

      {/* Expandable Details */}
      <button
        className="btn-text expand-toggle"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? '− Hide details' : '+ Add details (angle, audience, requirements)'}
      </button>

      {showDetails && (
        <div className="expanded-details">
          {/* Angle */}
          <div className="form-group">
            <label>Angle / Hook</label>
            <input
              type="text"
              placeholder="e.g., Contrarian take, Personal story, Data-driven..."
              value={videoIdea.angle}
              onChange={(e) => updateVideoIdea({ angle: e.target.value })}
            />
          </div>

          {/* Target Audience */}
          <div className="form-group">
            <label>Target Audience</label>
            <input
              type="text"
              placeholder="e.g., Entrepreneurs aged 25-40 struggling with time management"
              value={videoIdea.targetAudience}
              onChange={(e) => updateVideoIdea({ targetAudience: e.target.value })}
            />
          </div>

          {/* Must Include */}
          <div className="form-group">
            <label>Must Include</label>
            <div className="tag-input">
              <div className="tags">
                {videoIdea.mustInclude.map((item, i) => (
                  <span key={i} className="tag">
                    {item}
                    <button onClick={() => updateVideoIdea({
                      mustInclude: videoIdea.mustInclude.filter((_, j) => j !== i)
                    })}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add requirement and press Enter"
                value={newMustInclude}
                onChange={(e) => setNewMustInclude(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMustInclude())}
              />
            </div>
          </div>

          {/* Must Avoid */}
          <div className="form-group">
            <label>Must Avoid</label>
            <div className="tag-input">
              <div className="tags">
                {videoIdea.mustAvoid.map((item, i) => (
                  <span key={i} className="tag tag-negative">
                    {item}
                    <button onClick={() => updateVideoIdea({
                      mustAvoid: videoIdea.mustAvoid.filter((_, j) => j !== i)
                    })}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add thing to avoid and press Enter"
                value={newMustAvoid}
                onChange={(e) => setNewMustAvoid(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMustAvoid())}
              />
            </div>
          </div>

          {/* Reference URL */}
          <div className="form-group">
            <label>Reference Video URL (optional)</label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoIdea.referenceUrl}
              onChange={(e) => updateVideoIdea({ referenceUrl: e.target.value })}
            />
            <span className="hint">AI will analyze this video's style and structure</span>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          className="btn btn-primary"
          disabled={!canProceed}
          onClick={onNext}
        >
          Choose Format →
        </button>
      </div>
    </div>
  );
}
```

## Task 3: InterventionCheckboxes

**Files:**
- Create: `src/components/run/InterventionCheckboxes.tsx`

```tsx
// src/components/run/InterventionCheckboxes.tsx
'use client';

import { useRunInitStore } from '@/stores/runInitStore';

export function InterventionCheckboxes() {
  const { interventions, setInterventions } = useRunInitStore();

  return (
    <div className="intervention-checkboxes">
      <h3>Review Points</h3>
      <p className="hint">Check where you want the pipeline to pause for your approval</p>

      <label className="checkbox-card">
        <input
          type="checkbox"
          checked={interventions.reviewScript}
          onChange={(e) => setInterventions({ reviewScript: e.target.checked })}
        />
        <div className="checkbox-content">
          <span className="checkbox-title">Review Script</span>
          <span className="checkbox-desc">
            Pause after script generation to review, edit, and approve before voice generation
          </span>
        </div>
      </label>

      <label className="checkbox-card">
        <input
          type="checkbox"
          checked={interventions.reviewThumbnail}
          onChange={(e) => setInterventions({ reviewThumbnail: e.target.checked })}
        />
        <div className="checkbox-content">
          <span className="checkbox-title">Review Thumbnail Options</span>
          <span className="checkbox-desc">
            Pause to select from generated thumbnails or request more variations
          </span>
        </div>
      </label>

      <label className="checkbox-card recommended">
        <input
          type="checkbox"
          checked={interventions.reviewBeforePublish}
          onChange={(e) => setInterventions({ reviewBeforePublish: e.target.checked })}
        />
        <div className="checkbox-content">
          <span className="checkbox-title">Review Before Publish</span>
          <span className="checkbox-desc">
            Final review of video, metadata, and settings before uploading to YouTube
          </span>
          <span className="badge">Recommended</span>
        </div>
      </label>

      <div className="autonomy-indicator">
        {!interventions.reviewScript && !interventions.reviewThumbnail && !interventions.reviewBeforePublish ? (
          <span className="autonomy-full">⚡ Fully Autonomous - Pipeline runs without interruption</span>
        ) : (
          <span className="autonomy-careful">
            🛑 {[interventions.reviewScript, interventions.reviewThumbnail, interventions.reviewBeforePublish].filter(Boolean).length} review point(s) - Pipeline will pause for your input
          </span>
        )}
      </div>
    </div>
  );
}
```

## Task 4: ArchetypeSelector

**Files:**
- Create: `src/components/run/ArchetypeSelector.tsx`

```tsx
// src/components/run/ArchetypeSelector.tsx
'use client';

import { useRunInitStore } from '@/stores/runInitStore';
import archetypes from '@/docs/archetypes.json';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function ArchetypeSelector({ onNext, onBack }: Props) {
  const { archetypeId, setArchetype } = useRunInitStore();

  return (
    <div className="archetype-selector">
      <h3>Choose Video Format</h3>
      <p className="hint">Select the structure that best fits your content</p>

      <div className="archetype-grid">
        {archetypes.map((arch) => (
          <button
            key={arch.id}
            className={`archetype-card ${archetypeId === arch.id ? 'selected' : ''}`}
            onClick={() => setArchetype(arch.id)}
          >
            <div className="archetype-icon">{arch.icon}</div>
            <div className="archetype-name">{arch.name}</div>
            <div className="archetype-desc">{arch.shortDescription}</div>
            <div className="archetype-meta">
              <span>~{arch.typicalLength}</span>
              <span>{arch.tone}</span>
            </div>
          </button>
        ))}
      </div>

      {archetypeId && (
        <div className="archetype-preview">
          <h4>Structure Preview</h4>
          <ol className="structure-list">
            {archetypes.find(a => a.id === archetypeId)?.sections.map((section, i) => (
              <li key={i}>{section.name} ({section.duration})</li>
            ))}
          </ol>
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          disabled={!archetypeId}
          onClick={onNext}
        >
          Review & Start →
        </button>
      </div>
    </div>
  );
}
```

## Task 5: CostEstimator

**Files:**
- Create: `src/components/run/CostEstimator.tsx`

```tsx
// src/components/run/CostEstimator.tsx
'use client';

import { useMemo } from 'react';
import { useRunInitStore } from '@/stores/runInitStore';

const COST_ESTIMATES = {
  script: { min: 5, max: 15, unit: 'cents', provider: 'Claude API' },
  voice: { min: 50, max: 200, unit: 'cents', provider: 'ElevenLabs' },
  thumbnail: { min: 10, max: 40, unit: 'cents', provider: 'Gemini/DALL-E' },
  assembly: { min: 0, max: 0, unit: 'cents', provider: 'Local FFmpeg' },
  publish: { min: 0, max: 0, unit: 'cents', provider: 'YouTube API' },
};

export function CostEstimator() {
  const { videoIdea } = useRunInitStore();

  const estimate = useMemo(() => {
    // Rough estimate based on topic length
    const lengthMultiplier = Math.max(1, videoIdea.topic.length / 100);

    let totalMin = 0;
    let totalMax = 0;

    Object.values(COST_ESTIMATES).forEach(({ min, max }) => {
      totalMin += min * lengthMultiplier;
      totalMax += max * lengthMultiplier;
    });

    return {
      min: Math.round(totalMin),
      max: Math.round(totalMax),
      breakdown: COST_ESTIMATES,
    };
  }, [videoIdea.topic]);

  return (
    <div className="cost-estimator">
      <h3>Estimated Cost</h3>

      <div className="cost-total">
        <span className="cost-range">
          ${(estimate.min / 100).toFixed(2)} - ${(estimate.max / 100).toFixed(2)}
        </span>
        <span className="cost-label">estimated for this run</span>
      </div>

      <details className="cost-breakdown">
        <summary>View breakdown</summary>
        <table>
          <tbody>
            {Object.entries(estimate.breakdown).map(([node, cost]) => (
              <tr key={node}>
                <td className="node-name">{node}</td>
                <td className="provider">{cost.provider}</td>
                <td className="cost">
                  {cost.min === 0 && cost.max === 0
                    ? 'Free'
                    : `${cost.min}-${cost.max}¢`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <div className="form-actions">
        <button className="btn btn-primary btn-lg">
          🚀 Start Pipeline
        </button>
      </div>
    </div>
  );
}
```
