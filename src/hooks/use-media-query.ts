'use client';

import { useState, useEffect } from 'react';

/**
 * Media query hook return type
 */
interface UseMediaQueryReturn {
  /** Whether the media query matches */
  matches: boolean;
}

/**
 * Hook for responsive media queries
 *
 * Evaluates a CSS media query and returns whether it matches.
 * Updates automatically when the viewport changes.
 *
 * @param query - CSS media query string
 * @returns Whether the media query matches
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { matches: isMobile } = useMediaQuery('(max-width: 768px)');
 *   const { matches: prefersReducedMotion } = useMediaQuery('(prefers-reduced-motion: reduce)');
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileLayout /> : <DesktopLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): UseMediaQueryReturn {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return { matches };
}

/**
 * Predefined breakpoint hooks
 */

/**
 * Check if viewport is mobile (< 640px)
 */
export function useIsMobile(): boolean {
  const { matches } = useMediaQuery('(max-width: 639px)');
  return matches;
}

/**
 * Check if viewport is tablet (640px - 1023px)
 */
export function useIsTablet(): boolean {
  const { matches } = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  return matches;
}

/**
 * Check if viewport is desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  const { matches } = useMediaQuery('(min-width: 1024px)');
  return matches;
}

/**
 * Check if viewport is large desktop (>= 1280px)
 */
export function useIsLargeDesktop(): boolean {
  const { matches } = useMediaQuery('(min-width: 1280px)');
  return matches;
}

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const { matches } = useMediaQuery('(prefers-reduced-motion: reduce)');
  return matches;
}

/**
 * Check if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  const { matches } = useMediaQuery('(prefers-color-scheme: dark)');
  return matches;
}

export default useMediaQuery;
