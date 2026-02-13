'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Local storage hook return type
 */
interface UseLocalStorageReturn<T> {
  /** Current stored value */
  value: T;
  /** Set a new value */
  setValue: (value: T | ((prev: T) => T)) => void;
  /** Remove the value from storage */
  removeValue: () => void;
  /** Whether the value is being loaded (SSR safety) */
  isLoading: boolean;
}

/**
 * Hook for local storage with SSR support
 *
 * Persists state to localStorage with automatic serialization.
 * Handles SSR by returning default value during server rendering.
 *
 * @typeParam T - Value type
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Stored value and setters
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { value: theme, setValue: setTheme } = useLocalStorage('theme', 'light');
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Current: {theme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setValueState(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  /**
   * Set a new value
   */
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        // Allow function updates
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;

        // Save to state
        setValueState(valueToStore);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, value]
  );

  /**
   * Remove value from storage
   */
  const removeValue = useCallback(() => {
    try {
      setValueState(defaultValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return {
    value,
    setValue,
    removeValue,
    isLoading,
  };
}

/**
 * Hook for session storage with SSR support
 *
 * Same as useLocalStorage but uses sessionStorage instead.
 *
 * @typeParam T - Value type
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Stored value and setters
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        setValueState(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  /**
   * Set a new value
   */
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;

        setValueState(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, value]
  );

  /**
   * Remove value from storage
   */
  const removeValue = useCallback(() => {
    try {
      setValueState(defaultValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return {
    value,
    setValue,
    removeValue,
    isLoading,
  };
}

export default useLocalStorage;
