'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Product } from './use-product';
import { useDebounce } from './use-debounce';

/**
 * Search result interface
 */
interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  query: string;
}

/**
 * Product search hook return type
 */
interface UseProductSearchReturn {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: Product[];
  /** Total number of results */
  total: number;
  /** Whether search is in progress */
  isLoading: boolean;
  /** Error if search failed */
  error: Error | null;
  /** Perform a search with the given query */
  search: (query: string) => Promise<void>;
  /** Clear search results */
  clearSearch: () => void;
  /** Whether there are results */
  hasResults: boolean;
  /** Whether the query is empty */
  isEmpty: boolean;
}

/**
 * Hook for product search with Algolia
 *
 * Provides search functionality for products with debounced input,
 * loading states, and error handling. Integrates with Algolia for
 * fast, typo-tolerant search.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Search state and actions
 *
 * @example
 * ```tsx
 * function SearchBar() {
 *   const { query, setQuery, results, isLoading } = useProductSearch();
 *
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search products..."
 *       />
 *       {isLoading && <Spinner />}
 *       <SearchResults results={results} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useProductSearch(debounceMs: number = 300): UseProductSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  /**
   * Perform search with the given query
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams({
        q: searchQuery,
      });

      const response = await fetch(`/api/search?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResult = await response.json();
      setResults(data.products);
      setTotal(data.total);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Search error:', err);
      setError(err instanceof Error ? err : new Error('Search failed'));
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search with explicit query
   */
  const search = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      await performSearch(searchQuery);
    },
    [performSearch]
  );

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotal(0);
    setError(null);
  }, []);

  /**
   * Perform search when debounced query changes
   */
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setTotal(0);
    }
  }, [debouncedQuery, performSearch]);

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
    results,
    total,
    isLoading,
    error,
    search,
    clearSearch,
    hasResults: results.length > 0,
    isEmpty: query.trim().length === 0,
  };
}

export default useProductSearch;
