'use client';

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';

/**
 * Intersection observer hook return type
 */
interface UseIntersectionObserverReturn {
  /** Ref to attach to the target element */
  ref: RefObject<HTMLElement>;
  /** Whether the element is currently intersecting */
  isIntersecting: boolean;
  /** The intersection observer entry */
  entry: IntersectionObserverEntry | null;
}

/**
 * Intersection observer options
 */
interface UseIntersectionObserverOptions {
  /** Root element for intersection (null = viewport) */
  root?: Element | null;
  /** Margin around the root */
  rootMargin?: string;
  /** Visibility threshold(s) to trigger callback */
  threshold?: number | number[];
  /** Whether to disconnect after first intersection */
  triggerOnce?: boolean;
  /** Whether the observer is enabled */
  enabled?: boolean;
}

/**
 * Hook for intersection observer
 *
 * Detects when an element enters or leaves the viewport.
 * Useful for lazy loading, infinite scroll, and scroll-based animations.
 *
 * @param options - Intersection observer configuration
 * @returns Ref, intersection state, and entry
 *
 * @example
 * ```tsx
 * function LazyImage({ src, alt }) {
 *   const { ref, isIntersecting } = useIntersectionObserver({
 *     threshold: 0.1,
 *     triggerOnce: true,
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       {isIntersecting ? (
 *         <img src={src} alt={alt} />
 *       ) : (
 *         <Placeholder />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false,
    enabled = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const hasTriggered = useRef(false);

  const updateEntry = useCallback(
    ([newEntry]: IntersectionObserverEntry[]) => {
      if (!newEntry) return;

      setEntry(newEntry);
      setIsIntersecting(newEntry.isIntersecting);

      // Handle triggerOnce
      if (triggerOnce && newEntry.isIntersecting) {
        hasTriggered.current = true;
      }
    },
    [triggerOnce]
  );

  useEffect(() => {
    const element = ref.current;

    // Don't observe if disabled, no element, or already triggered once
    if (!enabled || !element || (triggerOnce && hasTriggered.current)) {
      return;
    }

    const observer = new IntersectionObserver(updateEntry, {
      root,
      rootMargin,
      threshold,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, root, rootMargin, threshold, triggerOnce, updateEntry]);

  return {
    ref,
    isIntersecting,
    entry,
  };
}

/**
 * Hook for infinite scroll
 *
 * Triggers a callback when the sentinel element intersects.
 *
 * @param onLoadMore - Callback to load more items
 * @param options - Intersection observer options
 * @returns Ref to attach to sentinel element and loading state
 *
 * @example
 * ```tsx
 * function InfiniteList() {
 *   const { sentinelRef, isLoading } = useInfiniteScroll(() => fetchMore());
 *
 *   return (
 *     <div>
 *       {items.map(item => <Item key={item.id} item={item} />)}
 *       <div ref={sentinelRef}>
 *         {isLoading && <LoadingSpinner />}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteScroll(
  onLoadMore: () => Promise<void> | void,
  options: Omit<UseIntersectionObserverOptions, 'triggerOnce'> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    ...options,
    threshold: options.threshold ?? 0.1,
  });

  useEffect(() => {
    if (isIntersecting && !isLoading) {
      setIsLoading(true);
      Promise.resolve(onLoadMore()).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isIntersecting, isLoading, onLoadMore]);

  return {
    sentinelRef: ref,
    isLoading,
  };
}

/**
 * Hook for lazy loading images
 *
 * @param src - Image source to load when intersecting
 * @param options - Intersection observer options
 * @returns Ref, loaded state, and current source
 *
 * @example
 * ```tsx
 * function LazyImage({ src, placeholder, alt }) {
 *   const { ref, isLoaded, currentSrc } = useLazyImage(src);
 *
 *   return (
 *     <img
 *       ref={ref}
 *       src={isLoaded ? currentSrc : placeholder}
 *       alt={alt}
 *     />
 *   );
 * }
 * ```
 */
export function useLazyImage(
  src: string,
  options: Omit<UseIntersectionObserverOptions, 'triggerOnce'> = {}
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  const { ref, isIntersecting } = useIntersectionObserver({
    ...options,
    triggerOnce: true,
  });

  useEffect(() => {
    if (isIntersecting && src && !isLoaded) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
      };
    }
  }, [isIntersecting, src, isLoaded]);

  return {
    ref,
    isLoaded,
    currentSrc,
  };
}

export default useIntersectionObserver;
