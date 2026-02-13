'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce hook return type
 */
interface UseDebounceReturn<T> {
  /** The debounced value */
  debouncedValue: T;
  /** Whether the value is currently being debounced */
  isDebouncing: boolean;
}

/**
 * Hook for debouncing a value
 *
 * Delays updating a value until a specified time has passed
 * since the last change. Useful for search inputs, resize handlers,
 * and other frequently firing events.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced value and debouncing state
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [query, setQuery] = useState('');
 *   const { debouncedValue, isDebouncing } = useDebounce(query, 300);
 *
 *   useEffect(() => {
 *     if (debouncedValue) {
 *       // Perform search with debounced value
 *       searchProducts(debouncedValue);
 *     }
 *   }, [debouncedValue]);
 *
 *   return (
 *     <input
 *       value={query}
 *       onChange={(e) => setQuery(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): UseDebounceReturn<T> {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return {
    debouncedValue,
    isDebouncing,
  };
}

/**
 * Simple version that just returns the debounced value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * function Component() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounceValue(search, 500);
 *
 *   // debouncedSearch will be updated 500ms after search changes
 * }
 * ```
 */
export function useDebounceValue<T>(value: T, delay: number = 300): T {
  const { debouncedValue } = useDebounce(value, delay);
  return debouncedValue;
}

export default useDebounce;
