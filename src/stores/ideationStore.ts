import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { HookStyle } from '@/lib/ideation/types';

// === Generated Item Types with IDs ===

export interface GeneratedHook {
  id: string;
  content: string;
  style: HookStyle;
}

export interface GeneratedTitle {
  id: string;
  content: string;
  hasNumber?: boolean;
  hasPowerWord?: boolean;
  charCount?: number;
}

// === Ideation State ===

export interface IdeationState {
  // Wizard Navigation
  currentStep: number; // 0-4
  completedSteps: number[]; // Which steps are done

  // Step 0: Topic
  topic: string;
  archetype: string | null;

  // Step 1: Hooks
  generatedHooks: GeneratedHook[];
  selectedHookIds: string[]; // Can select multiple
  isGeneratingHooks: boolean;

  // Step 2: Titles
  generatedTitles: GeneratedTitle[];
  selectedTitleIds: string[]; // Can select multiple
  isGeneratingTitles: boolean;

  // Step 3: Description
  generatedDescription: string | null;
  editedDescription: string | null;
  isGeneratingDescription: boolean;

  // Step 4: Thumbnail
  thumbnailConcepts: string[];
  selectedThumbnailConcept: string | null;

  // General
  isLoading: boolean;
  error: string | null;
}

// === Ideation Actions ===

export interface IdeationActions {
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Step 0
  setTopic: (topic: string) => void;
  setArchetype: (archetype: string | null) => void;

  // Step 1
  generateHooks: (count?: number, styles?: HookStyle[]) => Promise<void>;
  toggleHookSelection: (id: string) => void;
  refineHook: (id: string, refinement: string) => Promise<void>;

  // Step 2
  generateTitles: (count?: number) => Promise<void>;
  toggleTitleSelection: (id: string) => void;

  // Step 3
  generateDescription: () => Promise<void>;
  setEditedDescription: (description: string) => void;

  // Step 4
  addThumbnailConcept: (concept: string) => void;
  removeThumbnailConcept: (concept: string) => void;
  setSelectedThumbnailConcept: (concept: string | null) => void;

  // Save to Content Library
  saveSelectedToLibrary: () => Promise<void>;

  // Utilities
  reset: () => void;
  canProceed: () => boolean; // Check if current step is complete
}

// === Combined Store Type ===

export type IdeationStore = IdeationState & IdeationActions;

// === Initial State ===

const initialState: IdeationState = {
  // Wizard Navigation
  currentStep: 0,
  completedSteps: [],

  // Step 0: Topic
  topic: '',
  archetype: null,

  // Step 1: Hooks
  generatedHooks: [],
  selectedHookIds: [],
  isGeneratingHooks: false,

  // Step 2: Titles
  generatedTitles: [],
  selectedTitleIds: [],
  isGeneratingTitles: false,

  // Step 3: Description
  generatedDescription: null,
  editedDescription: null,
  isGeneratingDescription: false,

  // Step 4: Thumbnail
  thumbnailConcepts: [],
  selectedThumbnailConcept: null,

  // General
  isLoading: false,
  error: null,
};

// === Store ===

export const useIdeationStore = create<IdeationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // === Navigation Actions ===

      nextStep: () => {
        const { currentStep, canProceed, completedSteps } = get();
        if (!canProceed()) return;

        // Mark current step as completed if not already
        const newCompletedSteps = completedSteps.includes(currentStep)
          ? completedSteps
          : [...completedSteps, currentStep];

        if (currentStep < 4) {
          set({
            currentStep: currentStep + 1,
            completedSteps: newCompletedSteps,
            error: null,
          });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1, error: null });
        }
      },

      goToStep: (step: number) => {
        if (step >= 0 && step <= 4) {
          set({ currentStep: step, error: null });
        }
      },

      // === Step 0: Topic Actions ===

      setTopic: (topic: string) => {
        set({ topic, error: null });
      },

      setArchetype: (archetype: string | null) => {
        set({ archetype, error: null });
      },

      // === Step 1: Hooks Actions ===

      generateHooks: async (count = 5, styles?: HookStyle[]) => {
        const { topic, archetype } = get();

        if (!topic.trim()) {
          set({ error: 'Topic is required to generate hooks' });
          return;
        }

        set({ isGeneratingHooks: true, isLoading: true, error: null });

        try {
          const response = await fetch('/api/ideation/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'hook',
              topic,
              count,
              style: styles,
              archetype,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate hooks');
          }

          const data = await response.json();

          const generatedHooks: GeneratedHook[] = data.options.map(
            (option: { content: string; style?: HookStyle }) => ({
              id: crypto.randomUUID(),
              content: option.content,
              style: option.style || 'question',
            })
          );

          set({
            generatedHooks,
            isGeneratingHooks: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate hooks',
            isGeneratingHooks: false,
            isLoading: false,
          });
        }
      },

      toggleHookSelection: (id: string) => {
        const { selectedHookIds } = get();
        const newSelectedIds = selectedHookIds.includes(id)
          ? selectedHookIds.filter((hookId) => hookId !== id)
          : [...selectedHookIds, id];
        set({ selectedHookIds: newSelectedIds });
      },

      refineHook: async (id: string, refinement: string) => {
        const { generatedHooks, topic, archetype } = get();
        const hook = generatedHooks.find((h) => h.id === id);

        if (!hook) {
          set({ error: 'Hook not found' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/ideation/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'hook',
              topic: `${topic} - Refine this hook: "${hook.content}" with instruction: ${refinement}`,
              count: 1,
              style: [hook.style],
              archetype,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to refine hook');
          }

          const data = await response.json();

          if (data.options && data.options.length > 0) {
            const refinedHook: GeneratedHook = {
              id: crypto.randomUUID(),
              content: data.options[0].content,
              style: data.options[0].style || hook.style,
            };

            // Replace the old hook with the refined one
            const updatedHooks = generatedHooks.map((h) =>
              h.id === id ? refinedHook : h
            );

            // Update selection if the old hook was selected
            const { selectedHookIds } = get();
            const updatedSelectedIds = selectedHookIds.includes(id)
              ? selectedHookIds.map((hId) => (hId === id ? refinedHook.id : hId))
              : selectedHookIds;

            set({
              generatedHooks: updatedHooks,
              selectedHookIds: updatedSelectedIds,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refine hook',
            isLoading: false,
          });
        }
      },

      // === Step 2: Titles Actions ===

      generateTitles: async (count = 5) => {
        const { topic, archetype, selectedHookIds, generatedHooks } = get();

        if (!topic.trim()) {
          set({ error: 'Topic is required to generate titles' });
          return;
        }

        set({ isGeneratingTitles: true, isLoading: true, error: null });

        try {
          // Include selected hooks as context for title generation
          const selectedHooks = generatedHooks
            .filter((h) => selectedHookIds.includes(h.id))
            .map((h) => h.content);

          const contextTopic =
            selectedHooks.length > 0
              ? `${topic}\n\nSelected hooks for context:\n${selectedHooks.join('\n')}`
              : topic;

          const response = await fetch('/api/ideation/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'title',
              topic: contextTopic,
              count,
              archetype,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate titles');
          }

          const data = await response.json();

          const generatedTitles: GeneratedTitle[] = data.options.map(
            (option: {
              content: string;
              hasNumber?: boolean;
              hasPowerWord?: boolean;
              charCount?: number;
            }) => ({
              id: crypto.randomUUID(),
              content: option.content,
              hasNumber: option.hasNumber,
              hasPowerWord: option.hasPowerWord,
              charCount: option.charCount || option.content.length,
            })
          );

          set({
            generatedTitles,
            isGeneratingTitles: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate titles',
            isGeneratingTitles: false,
            isLoading: false,
          });
        }
      },

      toggleTitleSelection: (id: string) => {
        const { selectedTitleIds } = get();
        const newSelectedIds = selectedTitleIds.includes(id)
          ? selectedTitleIds.filter((titleId) => titleId !== id)
          : [...selectedTitleIds, id];
        set({ selectedTitleIds: newSelectedIds });
      },

      // === Step 3: Description Actions ===

      generateDescription: async () => {
        const {
          topic,
          archetype,
          selectedTitleIds,
          generatedTitles,
          selectedHookIds,
          generatedHooks,
        } = get();

        if (!topic.trim()) {
          set({ error: 'Topic is required to generate description' });
          return;
        }

        set({ isGeneratingDescription: true, isLoading: true, error: null });

        try {
          // Get selected title for context
          const selectedTitle = generatedTitles.find((t) =>
            selectedTitleIds.includes(t.id)
          );

          // Get selected hooks for context
          const selectedHooks = generatedHooks
            .filter((h) => selectedHookIds.includes(h.id))
            .map((h) => h.content);

          let contextTopic = topic;
          if (selectedTitle) {
            contextTopic += `\n\nTitle: ${selectedTitle.content}`;
          }
          if (selectedHooks.length > 0) {
            contextTopic += `\n\nHooks:\n${selectedHooks.join('\n')}`;
          }

          const response = await fetch('/api/ideation/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'description',
              topic: contextTopic,
              count: 1,
              archetype,
              title: selectedTitle?.content,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate description');
          }

          const data = await response.json();

          const description =
            data.options && data.options.length > 0 ? data.options[0].content : null;

          set({
            generatedDescription: description,
            editedDescription: description,
            isGeneratingDescription: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to generate description',
            isGeneratingDescription: false,
            isLoading: false,
          });
        }
      },

      setEditedDescription: (description: string) => {
        set({ editedDescription: description });
      },

      // === Step 4: Thumbnail Actions ===

      addThumbnailConcept: (concept: string) => {
        const { thumbnailConcepts } = get();
        if (!thumbnailConcepts.includes(concept)) {
          set({ thumbnailConcepts: [...thumbnailConcepts, concept] });
        }
      },

      removeThumbnailConcept: (concept: string) => {
        const { thumbnailConcepts, selectedThumbnailConcept } = get();
        set({
          thumbnailConcepts: thumbnailConcepts.filter((c) => c !== concept),
          selectedThumbnailConcept:
            selectedThumbnailConcept === concept ? null : selectedThumbnailConcept,
        });
      },

      setSelectedThumbnailConcept: (concept: string | null) => {
        set({ selectedThumbnailConcept: concept });
      },

      // === Save to Content Library ===

      saveSelectedToLibrary: async () => {
        const {
          topic,
          archetype,
          selectedHookIds,
          generatedHooks,
          selectedTitleIds,
          generatedTitles,
          editedDescription,
          selectedThumbnailConcept,
        } = get();

        set({ isLoading: true, error: null });

        try {
          const items: Array<{
            type: 'hook' | 'title' | 'description' | 'thumbnail_concept';
            content: string;
            metadata?: Record<string, unknown>;
          }> = [];

          // Add selected hooks
          const selectedHooks = generatedHooks.filter((h) =>
            selectedHookIds.includes(h.id)
          );
          for (const hook of selectedHooks) {
            items.push({
              type: 'hook',
              content: hook.content,
              metadata: { style: hook.style, topic, archetype },
            });
          }

          // Add selected titles
          const selectedTitles = generatedTitles.filter((t) =>
            selectedTitleIds.includes(t.id)
          );
          for (const title of selectedTitles) {
            items.push({
              type: 'title',
              content: title.content,
              metadata: {
                hasNumber: title.hasNumber,
                hasPowerWord: title.hasPowerWord,
                charCount: title.charCount,
                topic,
                archetype,
              },
            });
          }

          // Add description if exists
          if (editedDescription) {
            items.push({
              type: 'description',
              content: editedDescription,
              metadata: { topic, archetype },
            });
          }

          // Add thumbnail concept if selected
          if (selectedThumbnailConcept) {
            items.push({
              type: 'thumbnail_concept',
              content: selectedThumbnailConcept,
              metadata: { topic, archetype },
            });
          }

          if (items.length === 0) {
            set({ error: 'No items selected to save', isLoading: false });
            return;
          }

          const response = await fetch('/api/content/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save to library');
          }

          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to save to library',
            isLoading: false,
          });
        }
      },

      // === Utilities ===

      reset: () => {
        set(initialState);
      },

      canProceed: () => {
        const {
          currentStep,
          topic,
          selectedHookIds,
          selectedTitleIds,
          generatedDescription,
          editedDescription,
        } = get();

        switch (currentStep) {
          case 0: // Topic step
            return topic.trim().length > 0;
          case 1: // Hooks step
            return selectedHookIds.length > 0;
          case 2: // Titles step
            return selectedTitleIds.length > 0;
          case 3: // Description step
            return (
              generatedDescription !== null ||
              (editedDescription !== null && editedDescription.trim().length > 0)
            );
          case 4: // Thumbnail step (optional)
            return true;
          default:
            return false;
        }
      },
    }),
    { name: 'ideation-store' }
  )
);
