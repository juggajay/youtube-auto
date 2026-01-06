import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ContentItem,
  ContentLibraryInsert,
  ContentLibraryUpdate,
  ContentType,
} from '@/types/database';

// ============================================================================
// Content State Types
// ============================================================================

export interface ContentState {
  // Data
  items: ContentItem[];
  selectedItems: string[]; // IDs

  // Filters
  typeFilter: ContentType | 'all';
  tagFilter: string[];
  searchQuery: string;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ContentActions {
  // CRUD
  fetchContent: () => Promise<void>;
  createContent: (data: ContentLibraryInsert) => Promise<ContentItem>;
  updateContent: (id: string, data: ContentLibraryUpdate) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;

  // Selection
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Filters
  setTypeFilter: (type: ContentType | 'all') => void;
  setTagFilter: (tags: string[]) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Utilities
  reset: () => void;
}

export type ContentStore = ContentState & ContentActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: ContentState = {
  // Data
  items: [],
  selectedItems: [],

  // Filters
  typeFilter: 'all',
  tagFilter: [],
  searchQuery: '',

  // UI State
  isLoading: false,
  error: null,

  // Pagination
  page: 1,
  pageSize: 20,
  totalCount: 0,
};

// ============================================================================
// Store
// ============================================================================

export const useContentStore = create<ContentStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // CRUD Actions
      // ========================================================================

      fetchContent: async () => {
        const { typeFilter, tagFilter, searchQuery, page, pageSize } = get();

        set({ isLoading: true, error: null });

        try {
          // Build query parameters
          const params = new URLSearchParams();
          params.set('page', String(page));
          params.set('pageSize', String(pageSize));

          if (typeFilter !== 'all') {
            params.set('type', typeFilter);
          }

          if (tagFilter.length > 0) {
            params.set('tags', tagFilter.join(','));
          }

          if (searchQuery.trim()) {
            params.set('search', searchQuery.trim());
          }

          const response = await fetch(`/api/content?${params.toString()}`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch content');
          }

          const data = await response.json();

          set({
            items: data.items || [],
            totalCount: data.totalCount || 0,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch content';
          set({ error: message, isLoading: false });
        }
      },

      createContent: async (data: ContentLibraryInsert) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create content');
          }

          const newItem: ContentItem = await response.json();

          set((state) => ({
            items: [newItem, ...state.items],
            totalCount: state.totalCount + 1,
            isLoading: false,
          }));

          return newItem;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create content';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      updateContent: async (id: string, data: ContentLibraryUpdate) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/content/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update content');
          }

          const updatedItem: ContentItem = await response.json();

          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? updatedItem : item
            ),
            isLoading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update content';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      deleteContent: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/content/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete content');
          }

          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
            totalCount: state.totalCount - 1,
            isLoading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete content';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      bulkDelete: async (ids: string[]) => {
        if (ids.length === 0) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/content/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete content items');
          }

          const deletedIds = new Set(ids);

          set((state) => ({
            items: state.items.filter((item) => !deletedIds.has(item.id)),
            selectedItems: state.selectedItems.filter((itemId) => !deletedIds.has(itemId)),
            totalCount: state.totalCount - ids.length,
            isLoading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete content items';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // ========================================================================
      // Selection Actions
      // ========================================================================

      selectItem: (id: string) => {
        set((state) => ({
          selectedItems: state.selectedItems.includes(id)
            ? state.selectedItems
            : [...state.selectedItems, id],
        }));
      },

      deselectItem: (id: string) => {
        set((state) => ({
          selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
        }));
      },

      toggleSelection: (id: string) => {
        set((state) => ({
          selectedItems: state.selectedItems.includes(id)
            ? state.selectedItems.filter((itemId) => itemId !== id)
            : [...state.selectedItems, id],
        }));
      },

      selectAll: () => {
        set((state) => ({
          selectedItems: state.items.map((item) => item.id),
        }));
      },

      clearSelection: () => {
        set({ selectedItems: [] });
      },

      // ========================================================================
      // Filter Actions
      // ========================================================================

      setTypeFilter: (type: ContentType | 'all') => {
        set({ typeFilter: type, page: 1 });
      },

      setTagFilter: (tags: string[]) => {
        set({ tagFilter: tags, page: 1 });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query, page: 1 });
      },

      clearFilters: () => {
        set({
          typeFilter: 'all',
          tagFilter: [],
          searchQuery: '',
          page: 1,
        });
      },

      // ========================================================================
      // Pagination Actions
      // ========================================================================

      setPage: (page: number) => {
        set({ page });
      },

      setPageSize: (size: number) => {
        set({ pageSize: size, page: 1 });
      },

      // ========================================================================
      // Utility Actions
      // ========================================================================

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'content-store' }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectContentItems = (state: ContentStore) => state.items;
export const selectSelectedItems = (state: ContentStore) => state.selectedItems;
export const selectIsLoading = (state: ContentStore) => state.isLoading;
export const selectError = (state: ContentStore) => state.error;
export const selectTotalCount = (state: ContentStore) => state.totalCount;
export const selectHasSelection = (state: ContentStore) => state.selectedItems.length > 0;
export const selectSelectionCount = (state: ContentStore) => state.selectedItems.length;
export const selectIsAllSelected = (state: ContentStore) =>
  state.items.length > 0 && state.selectedItems.length === state.items.length;

// Pagination selectors
export const selectPagination = (state: ContentStore) => ({
  page: state.page,
  pageSize: state.pageSize,
  totalCount: state.totalCount,
  totalPages: Math.ceil(state.totalCount / state.pageSize),
});

// Filter selectors
export const selectFilters = (state: ContentStore) => ({
  typeFilter: state.typeFilter,
  tagFilter: state.tagFilter,
  searchQuery: state.searchQuery,
});

export const selectHasActiveFilters = (state: ContentStore) =>
  state.typeFilter !== 'all' ||
  state.tagFilter.length > 0 ||
  state.searchQuery.trim() !== '';
