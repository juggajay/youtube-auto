import { create } from 'zustand';

// === Video Idea Types ===

export interface VideoIdea {
  topic: string;
  angle: string;
  targetAudience: string;
  mustInclude: string[];
  mustAvoid: string[];
  referenceUrl: string;
}

// === Intervention Settings ===

export interface InterventionSettings {
  reviewScript: boolean;
  reviewThumbnail: boolean;
  reviewBeforePublish: boolean;
}

// === Run Init Modal Steps ===

export type RunInitStep = 'idea' | 'archetype' | 'review';

// === Run Init State ===

export interface RunInitState {
  // Modal state
  isOpen: boolean;
  step: RunInitStep;

  // Video idea data
  videoIdea: VideoIdea;

  // Archetype selection
  archetypeId: string | null;

  // Intervention points
  interventions: InterventionSettings;

  // Template selection
  selectedTemplate: string | null;

  // Cost estimate (updated as user configures)
  estimatedCostCents: number;

  // Validation
  isValid: boolean;
  validationErrors: string[];

  // Actions
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: RunInitStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Video idea actions
  updateVideoIdea: (updates: Partial<VideoIdea>) => void;
  addMustInclude: (item: string) => void;
  removeMustInclude: (index: number) => void;
  addMustAvoid: (item: string) => void;
  removeMustAvoid: (index: number) => void;

  // Archetype actions
  setArchetype: (id: string) => void;

  // Intervention actions
  setInterventions: (settings: Partial<InterventionSettings>) => void;
  toggleIntervention: (key: keyof InterventionSettings) => void;

  // Template actions
  loadTemplate: (templateId: string) => Promise<void>;
  clearTemplate: () => void;

  // Cost estimation
  updateCostEstimate: (costCents: number) => void;

  // Validation
  validate: () => boolean;

  // Reset
  reset: () => void;
}

// === Initial Values ===

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

// === Step Order ===

const STEP_ORDER: RunInitStep[] = ['idea', 'archetype', 'review'];

// === Store ===

export const useRunInitStore = create<RunInitState>((set, get) => ({
  // Initial state
  isOpen: false,
  step: 'idea',
  videoIdea: initialVideoIdea,
  archetypeId: null,
  interventions: initialInterventions,
  selectedTemplate: null,
  estimatedCostCents: 0,
  isValid: false,
  validationErrors: [],

  // Modal actions
  openModal: () => set({ isOpen: true, step: 'idea' }),
  closeModal: () => set({ isOpen: false }),

  // Step navigation
  setStep: (step) => set({ step }),

  nextStep: () => {
    const { step } = get();
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ step: STEP_ORDER[currentIndex + 1] });
    }
  },

  prevStep: () => {
    const { step } = get();
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      set({ step: STEP_ORDER[currentIndex - 1] });
    }
  },

  // Video idea actions
  updateVideoIdea: (updates) =>
    set((state) => ({
      videoIdea: { ...state.videoIdea, ...updates },
    })),

  addMustInclude: (item) =>
    set((state) => ({
      videoIdea: {
        ...state.videoIdea,
        mustInclude: [...state.videoIdea.mustInclude, item],
      },
    })),

  removeMustInclude: (index) =>
    set((state) => ({
      videoIdea: {
        ...state.videoIdea,
        mustInclude: state.videoIdea.mustInclude.filter((_, i) => i !== index),
      },
    })),

  addMustAvoid: (item) =>
    set((state) => ({
      videoIdea: {
        ...state.videoIdea,
        mustAvoid: [...state.videoIdea.mustAvoid, item],
      },
    })),

  removeMustAvoid: (index) =>
    set((state) => ({
      videoIdea: {
        ...state.videoIdea,
        mustAvoid: state.videoIdea.mustAvoid.filter((_, i) => i !== index),
      },
    })),

  // Archetype actions
  setArchetype: (id) => set({ archetypeId: id }),

  // Intervention actions
  setInterventions: (settings) =>
    set((state) => ({
      interventions: { ...state.interventions, ...settings },
    })),

  toggleIntervention: (key) =>
    set((state) => ({
      interventions: {
        ...state.interventions,
        [key]: !state.interventions[key],
      },
    })),

  // Template actions
  loadTemplate: async (templateId) => {
    // TODO: Fetch template from API and populate state
    set({ selectedTemplate: templateId });

    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error('Failed to load template');

      const template = await response.json();

      set((state) => ({
        videoIdea: {
          ...state.videoIdea,
          ...template.videoIdea,
        },
        archetypeId: template.archetypeId || state.archetypeId,
        interventions: {
          ...state.interventions,
          ...template.interventions,
        },
      }));
    } catch (error) {
      console.error('Failed to load template:', error);
      // Keep selectedTemplate set to indicate attempted load
    }
  },

  clearTemplate: () => set({ selectedTemplate: null }),

  // Cost estimation
  updateCostEstimate: (costCents) => set({ estimatedCostCents: costCents }),

  // Validation
  validate: () => {
    const { videoIdea, archetypeId } = get();
    const errors: string[] = [];

    // Topic is required
    if (!videoIdea.topic.trim()) {
      errors.push('Video topic is required');
    }

    // Topic should have meaningful content
    if (videoIdea.topic.trim().length < 10) {
      errors.push('Video topic should be more descriptive (at least 10 characters)');
    }

    // Archetype is required for step 2+
    if (!archetypeId) {
      errors.push('Please select a video format');
    }

    const isValid = errors.length === 0;
    set({ isValid, validationErrors: errors });

    return isValid;
  },

  // Reset
  reset: () =>
    set({
      step: 'idea',
      videoIdea: initialVideoIdea,
      archetypeId: null,
      interventions: initialInterventions,
      selectedTemplate: null,
      estimatedCostCents: 0,
      isValid: false,
      validationErrors: [],
    }),
}));
