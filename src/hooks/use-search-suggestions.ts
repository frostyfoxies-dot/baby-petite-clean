'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './use-debounce';
import { useLocalStorage } from './use-local-storage';

/**
 * Search suggestion product type
 */
export interface SearchSuggestionProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  inStock: boolean;
}

/**
 * Search suggestion category type
 */
export interface SearchSuggestionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

/**
 * Search suggestions response type
 */
export interface SearchSuggestionsResponse {
  query: string;
  products: SearchSuggestionProduct[];
  categories: SearchSuggestionCategory[];
  suggestions: string[];
  totalResults: number;
}

/**
 * Recent search item
 */
export interface RecentSearch {
  query: string;
  timestamp: number;
}

/**
 * Search suggestions hook options
 */
export interface UseSearchSuggestionsOptions {
  /** Minimum characters before searching (default: 2) */
  minChars?: number;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Maximum number of suggestions to show (default: 8) */
  maxSuggestions?: number;
  /** Maximum recent searches to store (default: 5) */
  maxRecentSearches?: number;
  /** Enable recent searches (default: true) */
  enableRecentSearches?: boolean;
}

/**
 * Search suggestions hook return type
 */
export interface UseSearchSuggestionsReturn {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Product suggestions */
  products: SearchSuggestionProduct[];
  /** Category suggestions */
  categories: SearchSuggestionCategory[];
  /** Query suggestions */
  suggestions: string[];
  /** Recent searches */
  recentSearches: RecentSearch[];
  /** Total results count */
  totalResults: number;
  /** Whether search is in progress */
  isLoading: boolean;
  /** Whether debouncing is in progress */
  isDebouncing: boolean;
  /** Error if search failed */
  error: Error | null;
  /** Whether to show suggestions dropdown */
  showSuggestions: boolean;
  /** Clear search and suggestions */
  clearSearch: () => void;
  /** Add a search to recent searches */
  addRecentSearch: (query: string) => void;
  /** Clear all recent searches */
  clearRecentSearches: () => void;
  /** Remove a single recent search */
  removeRecentSearch: (query: string) => void;
}

const RECENT_SEARCHES_KEY = 'kids-petite-recent-searches';

/**
 * Hook for fetching search suggestions with debouncing and caching
 *
 * Provides autocomplete functionality for search with:
 * - Debounced API calls
 * - Recent searches stored in localStorage
 * - Loading and error states
 * - Minimum character threshold
 *
 * @param options - Configuration options
 * @returns Search suggestions state and actions
 *
 * @example
 * ```tsx
 * function SearchAutocomplete() {
 *   const {
 *     query,
 *     setQuery,
 *     products,
 *     isLoading,
 *     showSuggestions,
 *     recentSearches,
 *   } = useSearchSuggestions({ minChars: 2, maxSuggestions: 8 });
 *
 *   return (
 *     <div>
 *       <input
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search products..."
 *       />
 *       {showSuggestions && (
 *         <SuggestionsDropdown
 *           products={products}
 *           recentSearches={recentSearches}
 *           isLoading={isLoading}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSearchSuggestions(
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsReturn {
  const {
    minChars = 2,
    debounceMs = 300,
    maxSuggestions = 8,
    maxRecentSearches = 5,
    enableRecentSearches = true,
  } = options;

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchSuggestionProduct[]>([]);
  const [categories, setCategories] = useState<SearchSuggestionCategory[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Recent searches from localStorage
  const {
    value: recentSearches,
    setValue: setRecentSearches,
  } = useLocalStorage<RecentSearch[]>(RECENT_SEARCHES_KEY, []);

  // Debounce the query
  const { debouncedValue, isDebouncing } = useDebounce(query, debounceMs);

  // Determine if we should show suggestions
  const showSuggestions = query.trim().length >= minChars || 
    (query.trim().length === 0 && recentSearches.length > 0 && enableRecentSearches);

  /**
   * Fetch suggestions from API
   */
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery.trim() || searchQuery.trim().length < minChars) {
      setProducts([]);
      setCategories([]);
      setSuggestions([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: 'all',
        limit: maxSuggestions.toString(),
      });

      const response = await fetch(`/api/search?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchSuggestionsResponse = await response.json();
      
      setProducts(data.products.slice(0, maxSuggestions));
      setCategories(data.categories.slice(0, 3));
      setSuggestions(data.suggestions.slice(0, 5));
      setTotalResults(data.totalResults);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Search suggestions error:', err);
      setError(err instanceof Error ? err : new Error('Search failed'));
      setProducts([]);
      setCategories([]);
      setSuggestions([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [minChars, maxSuggestions]);

  /**
   * Clear search and suggestions
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setProducts([]);
    setCategories([]);
    setSuggestions([]);
    setTotalResults(0);
    setError(null);
  }, []);

  /**
   * Add a search to recent searches
   */
  const addRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim() || !enableRecentSearches) return;

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const newSearch: RecentSearch = {
      query: searchQuery.trim(),
      timestamp: Date.now(),
    };

    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== normalizedQuery
      );
      // Add new search at the beginning and limit count
      return [newSearch, ...filtered].slice(0, maxRecentSearches);
    });
  }, [enableRecentSearches, maxRecentSearches, setRecentSearches]);

  /**
   * Clear all recent searches
   */
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  /**
   * Remove a single recent search
   */
  const removeRecentSearch = useCallback((searchQuery: string) => {
    const normalizedQuery = searchQuery.toLowerCase();
    setRecentSearches((prev) =>
      prev.filter((item) => item.query.toLowerCase() !== normalizedQuery)
    );
  }, [setRecentSearches]);

  /**
   * Fetch suggestions when debounced query changes
   */
  useEffect(() => {
    if (debouncedValue.trim().length >= minChars) {
      fetchSuggestions(debouncedValue);
    } else {
      setProducts([]);
      setCategories([]);
      setSuggestions([]);
      setTotalResults(0);
    }
  }, [debouncedValue, minChars, fetchSuggestions]);

  /**
   * Cleanup abort controller on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    products,
    categories,
    suggestions,
    recentSearches,
    totalResults,
    isLoading,
    isDebouncing,
    error,
    showSuggestions,
    clearSearch,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}

export default useSearchSuggestions;
