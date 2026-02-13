import { create } from 'zustand';

/**
 * Search filters interface
 */
export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
}

/**
 * Sort options for search results
 */
export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular';

/**
 * Search store interface with state and actions
 */
interface SearchStore {
  // State
  query: string;
  filters: SearchFilters;
  sort: SortOption;
  results: any[];
  totalResults: number;
  page: number;
  perPage: number;
  isLoading: boolean;

  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: SortOption) => void;
  setResults: (results: any[], total: number) => void;
  setPage: (page: number) => void;
  setIsLoading: (loading: boolean) => void;
  resetSearch: () => void;
}

/**
 * Search store using Zustand
 * Manages search query, filters, results, and pagination
 */
export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial state
  query: '',
  filters: {},
  sort: 'relevance',
  results: [],
  totalResults: 0,
  page: 1,
  perPage: 12,
  isLoading: false,

  /**
   * Set the search query
   * Resets page to 1 when query changes
   */
  setQuery: (query) => {
    set({ query, page: 1 });
  },

  /**
   * Update search filters
   * Merges new filters with existing ones
   * Resets page to 1 when filters change
   */
  setFilters: (filters) => {
    set({
      filters: { ...get().filters, ...filters },
      page: 1,
    });
  },

  /**
   * Clear all search filters
   */
  clearFilters: () => {
    set({
      filters: {},
      page: 1,
    });
  },

  /**
   * Set the sort option
   * Resets page to 1 when sort changes
   */
  setSort: (sort) => {
    set({ sort, page: 1 });
  },

  /**
   * Set search results and total count
   */
  setResults: (results, total) => {
    set({ results, totalResults: total });
  },

  /**
   * Set the current page
   */
  setPage: (page) => {
    set({ page: Math.max(1, page) });
  },

  /**
   * Set the loading state
   */
  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  /**
   * Reset all search state to initial values
   */
  resetSearch: () => {
    set({
      query: '',
      filters: {},
      sort: 'relevance',
      results: [],
      totalResults: 0,
      page: 1,
      isLoading: false,
    });
  },
}));
