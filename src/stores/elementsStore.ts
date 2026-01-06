import { create } from 'zustand';
import { ElementType, ElementWithUrl, ElementUpdate } from '@/types/database';

// =============================================================================
// TYPES
// =============================================================================

export interface ElementsFilter {
  type: ElementType | 'all';
  search: string;
}

export interface ElementsState {
  // State
  elements: ElementWithUrl[];
  isLoading: boolean;
  error: string | null;
  filter: ElementsFilter;
  total: number;
  hasMore: boolean;

  // Tag autocomplete cache
  allTags: string[];
  isLoadingTags: boolean;

  // UI State (for modals)
  uploadModalOpen: boolean;
  editModalOpen: boolean;
  pickerModalOpen: boolean;
  selectedElement: ElementWithUrl | null;
  uploadProgress: number;

  // Actions - Element CRUD
  fetchElements: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilter: (filter: Partial<ElementsFilter>) => void;
  uploadElement: (
    file: File,
    name: string,
    type: ElementType,
    tags: string[]
  ) => Promise<ElementWithUrl>;
  updateElement: (id: string, updates: ElementUpdate) => Promise<void>;
  deleteElement: (id: string) => Promise<void>;

  // Actions - Tags
  fetchTags: () => Promise<void>;

  // Actions - UI State
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openEditModal: (element: ElementWithUrl) => void;
  closeEditModal: () => void;
  openPickerModal: () => void;
  closePickerModal: () => void;
  setUploadProgress: (progress: number) => void;

  // Actions - Reset
  reset: () => void;

  // Getters
  getFilteredElements: () => ElementWithUrl[];
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialFilter: ElementsFilter = {
  type: 'all',
  search: '',
};

// =============================================================================
// HELPERS
// =============================================================================

const ELEMENTS_PAGE_SIZE = 20;

async function fetchElementsApi(
  filter: ElementsFilter,
  offset: number = 0
): Promise<{ elements: ElementWithUrl[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams();

  if (filter.type !== 'all') {
    params.set('type', filter.type);
  }
  if (filter.search.trim()) {
    params.set('search', filter.search.trim());
  }
  params.set('limit', String(ELEMENTS_PAGE_SIZE));
  params.set('offset', String(offset));

  const response = await fetch(`/api/elements?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to fetch elements');
  }

  return response.json();
}

// =============================================================================
// STORE
// =============================================================================

export const useElementsStore = create<ElementsState>((set, get) => ({
  // Initial state
  elements: [],
  isLoading: false,
  error: null,
  filter: { ...initialFilter },
  total: 0,
  hasMore: false,
  allTags: [],
  isLoadingTags: false,

  // UI state
  uploadModalOpen: false,
  editModalOpen: false,
  pickerModalOpen: false,
  selectedElement: null,
  uploadProgress: 0,

  // Fetch elements with current filter (reset = true to start fresh)
  fetchElements: async (reset = true) => {
    const { filter, elements } = get();
    const offset = reset ? 0 : elements.length;

    set({ isLoading: true, error: null });

    try {
      const result = await fetchElementsApi(filter, offset);

      set({
        elements: reset ? result.elements : [...elements, ...result.elements],
        total: result.total,
        hasMore: result.hasMore,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch elements',
        isLoading: false,
      });
    }
  },

  // Load more elements (pagination)
  loadMore: async () => {
    const { hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    await get().fetchElements(false);
  },

  // Update filter and refetch
  setFilter: (newFilter) => {
    const { filter } = get();
    const updatedFilter = { ...filter, ...newFilter };

    set({ filter: updatedFilter });

    // Refetch with new filter
    get().fetchElements(true);
  },

  // Upload a new element
  uploadElement: async (file, name, type, tags) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });

    try {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('type', type);
      formData.append('tags', JSON.stringify(tags));

      // Use XMLHttpRequest for progress tracking
      const element = await new Promise<ElementWithUrl>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            set({ uploadProgress: progress });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.element);
            } catch {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || 'Failed to upload element'));
            } catch {
              reject(new Error('Failed to upload element'));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.open('POST', '/api/elements');
        xhr.send(formData);
      });

      // Add to beginning of list
      set((state) => ({
        elements: [element, ...state.elements],
        total: state.total + 1,
        isLoading: false,
        uploadProgress: 100,
        uploadModalOpen: false,
      }));

      // Refresh tags in background
      get().fetchTags();

      return element;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to upload element',
        isLoading: false,
        uploadProgress: 0,
      });
      throw error;
    }
  },

  // Update element metadata
  updateElement: async (id, updates) => {
    set({ error: null });

    try {
      const response = await fetch(`/api/elements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to update element');
      }

      const { element } = await response.json();

      // Update in local state
      set((state) => ({
        elements: state.elements.map((el) => (el.id === id ? element : el)),
        editModalOpen: false,
        selectedElement: null,
      }));

      // Refresh tags if tags were updated
      if (updates.tags !== undefined) {
        get().fetchTags();
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update element',
      });
      throw error;
    }
  },

  // Delete element
  deleteElement: async (id) => {
    set({ error: null });

    try {
      const response = await fetch(`/api/elements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to delete element');
      }

      // Remove from local state
      set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
        total: Math.max(0, state.total - 1),
        editModalOpen: false,
        selectedElement: null,
      }));

      // Refresh tags in background
      get().fetchTags();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete element',
      });
      throw error;
    }
  },

  // Fetch all unique tags
  fetchTags: async () => {
    set({ isLoadingTags: true });

    try {
      const response = await fetch('/api/elements/tags');

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const { tags } = await response.json();

      set({
        allTags: tags,
        isLoadingTags: false,
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      set({ isLoadingTags: false });
    }
  },

  // UI State actions
  openUploadModal: () => set({ uploadModalOpen: true, uploadProgress: 0 }),
  closeUploadModal: () => set({ uploadModalOpen: false, uploadProgress: 0 }),
  openEditModal: (element) => set({ editModalOpen: true, selectedElement: element }),
  closeEditModal: () => set({ editModalOpen: false, selectedElement: null }),
  openPickerModal: () => set({ pickerModalOpen: true }),
  closePickerModal: () => set({ pickerModalOpen: false }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),

  // Reset store to initial state
  reset: () => {
    set({
      elements: [],
      isLoading: false,
      error: null,
      filter: { ...initialFilter },
      total: 0,
      hasMore: false,
      allTags: [],
      isLoadingTags: false,
      uploadModalOpen: false,
      editModalOpen: false,
      pickerModalOpen: false,
      selectedElement: null,
      uploadProgress: 0,
    });
  },

  // Get filtered elements (for local filtering when needed)
  getFilteredElements: () => {
    const { elements, filter } = get();

    return elements.filter((elem) => {
      // Filter by type
      if (filter.type !== 'all' && elem.type !== filter.type) {
        return false;
      }

      // Filter by search query (name or tags)
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const nameMatch = elem.name.toLowerCase().includes(query);
        const tagMatch = query.startsWith('@')
          ? elem.tags.some((tag) => tag.toLowerCase().includes(query.slice(1)))
          : elem.tags.some((tag) => tag.toLowerCase().includes(query));

        return nameMatch || tagMatch;
      }

      return true;
    });
  },
}));

// =============================================================================
// SELECTORS
// =============================================================================

export const selectElements = (state: ElementsState) => state.elements;
export const selectIsLoading = (state: ElementsState) => state.isLoading;
export const selectError = (state: ElementsState) => state.error;
export const selectFilter = (state: ElementsState) => state.filter;
export const selectHasMore = (state: ElementsState) => state.hasMore;
export const selectTotal = (state: ElementsState) => state.total;
export const selectAllTags = (state: ElementsState) => state.allTags;
export const selectUploadModalOpen = (state: ElementsState) => state.uploadModalOpen;
export const selectEditModalOpen = (state: ElementsState) => state.editModalOpen;
export const selectPickerModalOpen = (state: ElementsState) => state.pickerModalOpen;
export const selectSelectedElement = (state: ElementsState) => state.selectedElement;
export const selectUploadProgress = (state: ElementsState) => state.uploadProgress;

// Filter elements by type (useful for type-specific views)
export const selectElementsByType = (type: ElementType) => (state: ElementsState) =>
  state.elements.filter((el) => el.type === type);

// Get element by ID
export const selectElementById = (id: string) => (state: ElementsState) =>
  state.elements.find((el) => el.id === id);
