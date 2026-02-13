'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Scroll direction type
 */
export type ScrollDirection = 'up' | 'down' | null;

/**
 * Scroll position hook return type
 */
interface UseScrollPositionReturn {
  /** Horizontal scroll position */
  scrollX: number;
  /** Vertical scroll position */
  scrollY: number;
  /** Scroll direction (up/down/null) */
  direction: ScrollDirection;
}

/**
 * Hook for tracking scroll position
 *
 * Tracks the current scroll position and direction.
 * Useful for sticky headers, scroll-based animations, and lazy loading.
 *
 * @returns Scroll position and direction
 *
 * @example
 * ```tsx
 * function StickyHeader() {
 *   const { scrollY, direction } = useScrollPosition();
 *   const isHidden = scrollY > 100 && direction === 'down';
 *
 *   return (
 *     <header className={isHidden ? 'hidden' : 'visible'}>
 *       Navigation
 *     </header>
 *   );
 * }
 * ```
 */
export function useScrollPosition(): UseScrollPositionReturn {
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentScrollX = window.scrollX || window.pageXOffset;
    const currentScrollY = window.scrollY || window.pageYOffset;

    setScrollX(currentScrollX);
    setScrollY(currentScrollY);

    // Determine scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 0) {
      setDirection('down');
    } else if (currentScrollY < lastScrollY) {
      setDirection('up');
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial position
    setScrollX(window.scrollX || window.pageXOffset);
    setScrollY(window.scrollY || window.pageYOffset);
    setLastScrollY(window.scrollY || window.pageYOffset);

    // Use passive event listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    scrollX,
    scrollY,
    direction,
  };
}

/**
 * Hook for checking if user has scrolled past a threshold
 *
 * @param threshold - Scroll threshold in pixels
 * @returns Whether the user has scrolled past the threshold
 *
 * @example
 * ```tsx
 * function BackToTop() {
 *   const hasScrolled = useScrolledPast(300);
 *
 *   if (!hasScrolled) return null;
 *
 *   return <button onClick={() => window.scrollTo(0, 0)}>Back to Top</button>;
 * }
 * ```
 */
export function useScrolledPast(threshold: number): boolean {
  const { scrollY } = useScrollPosition();
  return scrollY > threshold;
}

/**
 * Hook for scroll-to-top functionality
 *
 * @returns Object with scrollToTop function and hasScrolled boolean
 *
 * @example
 * ```tsx
 * function ScrollToTopButton() {
 *   const { scrollToTop, hasScrolled } = useScrollToTop();
 *
 *   if (!hasScrolled) return null;
 *
 *   return <button onClick={scrollToTop}>Back to Top</button>;
 * }
 * ```
 */
export function useScrollToTop(threshold: number = 300) {
  const { scrollY } = useScrollPosition();

  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return {
    scrollToTop,
    hasScrolled: scrollY > threshold,
  };
}

export default useScrollPosition;
