import { create } from 'zustand';

export type AspectRatio = '16:9' | '1:1' | '4:3' | '9:16';

export interface GeneratedImage {
  id: string;
  url: string;           // Base64 or blob URL for preview
  prompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
  references?: string[]; // IDs of images used as references
}

export interface GenerationRequest {
  id: string;
  prompt: string;
  aspectRatio: AspectRatio;
  references: string[];
  status: 'queued' | 'generating' | 'completed' | 'failed';
}

export interface ThumbnailGeneratorState {
  // Prompt state
  prompt: string;
  aspectRatio: AspectRatio;

  // Generated images (most recent first)
  images: GeneratedImage[];

  // Queue for parallel generation
  queue: GenerationRequest[];

  // Reference images (dragged into prompt area)
  referenceImages: string[]; // Image IDs

  // Modal state
  modalOpen: boolean;
  modalImageId: string | null;

  // Loading state
  isGenerating: boolean;

  // Actions
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;

  // Generation
  addToQueue: (count?: number) => void;
  startGeneration: (requestId: string) => void;
  completeGeneration: (requestId: string, imageUrl: string) => void;
  failGeneration: (requestId: string, error: string) => void;

  // References
  addReference: (imageId: string) => void;
  removeReference: (imageId: string) => void;
  clearReferences: () => void;
  insertReferenceToPrompt: (imageId: string) => void;

  // Modal
  openModal: (imageId: string) => void;
  closeModal: () => void;
  navigateModal: (direction: 'prev' | 'next') => void;

  // Image management
  deleteImage: (imageId: string) => void;
  addExternalImage: (url: string, source: 'youtube' | 'upload') => void;
}

export const useThumbnailGeneratorStore = create<ThumbnailGeneratorState>((set, get) => ({
  // Initial state
  prompt: '',
  aspectRatio: '16:9',
  images: [],
  queue: [],
  referenceImages: [],
  modalOpen: false,
  modalImageId: null,
  isGenerating: false,

  // Prompt actions
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),

  // Generation actions
  addToQueue: (count = 1) => {
    const state = get();
    const newRequests: GenerationRequest[] = [];

    for (let i = 0; i < count; i++) {
      const id = `gen-${Date.now()}-${i}`;
      newRequests.push({
        id,
        prompt: state.prompt,
        aspectRatio: state.aspectRatio,
        references: [...state.referenceImages],
        status: 'queued',
      });
    }

    set((state) => ({
      queue: [...newRequests, ...state.queue],
      isGenerating: true,
    }));
  },

  startGeneration: (requestId) => {
    set((state) => ({
      queue: state.queue.map((req) =>
        req.id === requestId ? { ...req, status: 'generating' as const } : req
      ),
    }));
  },

  completeGeneration: (requestId, imageUrl) => {
    const state = get();
    const request = state.queue.find((req) => req.id === requestId);

    if (!request) return;

    const newImage: GeneratedImage = {
      id: requestId,
      url: imageUrl,
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      timestamp: Date.now(),
      status: 'completed',
      references: request.references,
    };

    set((state) => {
      const newQueue = state.queue.filter((req) => req.id !== requestId);
      return {
        queue: newQueue,
        images: [newImage, ...state.images], // Most recent first
        isGenerating: newQueue.some((req) => req.status === 'generating' || req.status === 'queued'),
      };
    });
  },

  failGeneration: (requestId, error) => {
    set((state) => {
      const newQueue = state.queue.filter((req) => req.id !== requestId);
      const request = state.queue.find((req) => req.id === requestId);

      const failedImage: GeneratedImage | null = request
        ? {
            id: requestId,
            url: '',
            prompt: request.prompt,
            aspectRatio: request.aspectRatio,
            timestamp: Date.now(),
            status: 'failed',
            error,
          }
        : null;

      return {
        queue: newQueue,
        images: failedImage ? [failedImage, ...state.images] : state.images,
        isGenerating: newQueue.some((req) => req.status === 'generating' || req.status === 'queued'),
      };
    });
  },

  // Reference actions
  addReference: (imageId) => {
    set((state) => ({
      referenceImages: state.referenceImages.includes(imageId)
        ? state.referenceImages
        : [...state.referenceImages, imageId],
    }));
  },

  removeReference: (imageId) => {
    set((state) => ({
      referenceImages: state.referenceImages.filter((id) => id !== imageId),
    }));
  },

  clearReferences: () => set({ referenceImages: [] }),

  insertReferenceToPrompt: (imageId) => {
    const state = get();
    const image = state.images.find((img) => img.id === imageId);
    if (!image) return;

    // Add reference marker to prompt
    const refMarker = `@ref[${imageId.slice(0, 8)}]`;
    const newPrompt = state.prompt ? `${state.prompt} ${refMarker}` : refMarker;

    set({
      prompt: newPrompt,
      referenceImages: state.referenceImages.includes(imageId)
        ? state.referenceImages
        : [...state.referenceImages, imageId],
    });
  },

  // Modal actions
  openModal: (imageId) => set({ modalOpen: true, modalImageId: imageId }),
  closeModal: () => set({ modalOpen: false, modalImageId: null }),

  navigateModal: (direction) => {
    const state = get();
    if (!state.modalImageId) return;

    const completedImages = state.images.filter((img) => img.status === 'completed');
    const currentIndex = completedImages.findIndex((img) => img.id === state.modalImageId);

    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % completedImages.length;
    } else {
      newIndex = (currentIndex - 1 + completedImages.length) % completedImages.length;
    }

    set({ modalImageId: completedImages[newIndex].id });
  },

  // Image management
  deleteImage: (imageId) => {
    set((state) => ({
      images: state.images.filter((img) => img.id !== imageId),
      referenceImages: state.referenceImages.filter((id) => id !== imageId),
      modalImageId: state.modalImageId === imageId ? null : state.modalImageId,
      modalOpen: state.modalImageId === imageId ? false : state.modalOpen,
    }));
  },

  addExternalImage: (url, source) => {
    const id = `${source}-${Date.now()}`;
    const newImage: GeneratedImage = {
      id,
      url,
      prompt: `Imported from ${source}`,
      aspectRatio: '16:9',
      timestamp: Date.now(),
      status: 'completed',
    };

    set((state) => ({
      images: [newImage, ...state.images],
    }));
  },
}));
