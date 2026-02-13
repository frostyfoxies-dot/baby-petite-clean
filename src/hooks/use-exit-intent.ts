'use client';

import * as React from 'react';

/**
 * Exit intent options
 */
export interface UseExitIntentOptions {
  /**
   * Whether the hook is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Cooldown period in minutes before showing again
   * @default 30
   */
  cooldownMinutes?: number;
  /**
   * Threshold in pixels from top to trigger exit intent
   * @default 20
   */
  threshold?: number;
  /**
   * Whether to detect mobile back button
   * @default true
   */
  detectMobileBackButton?: boolean;
  /**
   * Callback when exit intent is detected
   */
  onExitIntent?: () => void;
}

/**
 * Exit intent state
 */
export interface ExitIntentState {
  /**
   * Whether exit intent has been triggered
   */
  hasTriggered: boolean;
  /**
   * Whether the popup is currently showing
   */
  isShowing: boolean;
  /**
   * Timestamp when exit intent was last triggered
   */
  lastTriggeredAt: number | null;
  /**
   * Number of times exit intent has been triggered this session
   */
  triggerCount: number;
}

/**
 * Storage keys for exit intent
 */
const STORAGE_KEYS = {
  SHOWN: 'exit_intent_shown',
  DISMISSED_AT: 'exit_intent_dismissed_at',
  EMAIL_CAPTURED: 'exit_intent_email_captured',
  TRIGGER_COUNT: 'exit_intent_trigger_count',
} as const;

/**
 * Throttle function to limit how often a function can be called
 * Uses requestAnimationFrame for optimal performance
 */
function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): T {
  let lastCall = 0;
  let rafId: number | null = null;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    } else if (!rafId) {
      // Schedule a call on the next animation frame if within limit
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const nowInner = Date.now();
        if (nowInner - lastCall >= limit) {
          lastCall = nowInner;
          fn(...args);
        }
      });
    }
  }) as T;
}

/**
 * Batch read from localStorage to minimize I/O operations
 */
function batchReadStorage(): {
  shown: boolean;
  dismissedAt: number | null;
  emailCaptured: boolean;
  triggerCount: number;
} {
  if (typeof window === 'undefined') {
    return {
      shown: false,
      dismissedAt: null,
      emailCaptured: false,
      triggerCount: 0,
    };
  }

  // Single batch read - minimize localStorage access
  let shown = false;
  let dismissedAt: number | null = null;
  let emailCaptured = false;
  let triggerCount = 0;

  try {
    shown = localStorage.getItem(STORAGE_KEYS.SHOWN) === 'true';
    const dismissedAtStr = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    dismissedAt = dismissedAtStr ? parseInt(dismissedAtStr, 10) : null;
    emailCaptured = localStorage.getItem(STORAGE_KEYS.EMAIL_CAPTURED) === 'true';
    triggerCount = parseInt(localStorage.getItem(STORAGE_KEYS.TRIGGER_COUNT) || '0', 10);
  } catch {
    // Handle localStorage errors (private browsing, quota exceeded, etc.)
    console.warn('localStorage access failed');
  }

  return { shown, dismissedAt, emailCaptured, triggerCount };
}

/**
 * Batch write to localStorage to minimize I/O operations
 */
function batchWriteStorage(updates: {
  shown?: boolean;
  dismissedAt?: number;
  emailCaptured?: boolean;
  triggerCount?: number;
}): void {
  if (typeof window === 'undefined') return;

  try {
    if (updates.shown !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SHOWN, String(updates.shown));
    }
    if (updates.dismissedAt !== undefined) {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, String(updates.dismissedAt));
    }
    if (updates.emailCaptured !== undefined) {
      localStorage.setItem(STORAGE_KEYS.EMAIL_CAPTURED, String(updates.emailCaptured));
    }
    if (updates.triggerCount !== undefined) {
      localStorage.setItem(STORAGE_KEYS.TRIGGER_COUNT, String(updates.triggerCount));
    }
  } catch {
    console.warn('localStorage write failed');
  }
}

/**
 * Hook to detect exit intent (mouse leaving viewport or mobile back button)
 * 
 * Performance optimizations:
 * - Throttled event handlers to prevent excessive calls
 * - Passive event listeners for better scroll performance
 * - Batched localStorage reads/writes
 * - Memoized callbacks with stable dependencies
 * - Proper cleanup of event listeners and animation frames
 * 
 * @example
 * ```tsx
 * const { isShowing, hasTriggered, triggerCount, reset } = useExitIntent({
 *   onExitIntent: () => setShowModal(true),
 *   cooldownMinutes: 30,
 * });
 * ```
 */
export function useExitIntent(options: UseExitIntentOptions = {}) {
  const {
    enabled = true,
    cooldownMinutes = 30,
    threshold = 20,
    detectMobileBackButton = true,
    onExitIntent,
  } = options;

  // Use refs for values that don't need to trigger re-renders
  const onExitIntentRef = React.useRef(onExitIntent);
  const rafIdRef = React.useRef<number | null>(null);

  // Keep callback ref updated
  React.useEffect(() => {
    onExitIntentRef.current = onExitIntent;
  }, [onExitIntent]);

  const [state, setState] = React.useState<ExitIntentState>(() => {
    const { shown, dismissedAt, triggerCount } = batchReadStorage();

    return {
      hasTriggered: shown,
      isShowing: false,
      lastTriggeredAt: dismissedAt,
      triggerCount,
    };
  });

  // Memoize cooldown calculation
  const cooldownMs = React.useMemo(() => cooldownMinutes * 60 * 1000, [cooldownMinutes]);

  // Check if we should show exit intent based on cooldown
  // Memoized to prevent unnecessary recalculations
  const shouldShow = React.useCallback(() => {
    // Don't show if already shown this session
    if (state.hasTriggered) {
      return false;
    }

    // Don't show if email already captured - use cached value from state
    // Check cooldown period
    if (state.lastTriggeredAt) {
      const timeSinceLastTrigger = Date.now() - state.lastTriggeredAt;
      if (timeSinceLastTrigger < cooldownMs) {
        return false;
      }
    }

    return true;
  }, [state.hasTriggered, state.lastTriggeredAt, cooldownMs]);

  // Handle exit intent trigger - memoized
  const triggerExitIntent = React.useCallback(() => {
    if (!enabled) return;

    // Check email captured status only when triggering
    const { emailCaptured } = batchReadStorage();
    if (emailCaptured) return;

    if (!shouldShow()) {
      return;
    }

    const newTriggerCount = state.triggerCount + 1;
    const now = Date.now();

    setState((prev) => ({
      ...prev,
      hasTriggered: true,
      isShowing: true,
      lastTriggeredAt: now,
      triggerCount: newTriggerCount,
    }));

    // Batch localStorage writes
    batchWriteStorage({
      shown: true,
      dismissedAt: now,
      triggerCount: newTriggerCount,
    });

    // Use ref to avoid stale closure
    onExitIntentRef.current?.();
  }, [enabled, shouldShow, state.triggerCount]);

  // Dismiss the popup - memoized
  const dismiss = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isShowing: false,
    }));
    batchWriteStorage({ dismissedAt: Date.now() });
  }, []);

  // Reset the exit intent state - memoized
  const reset = React.useCallback(() => {
    setState({
      hasTriggered: false,
      isShowing: false,
      lastTriggeredAt: null,
      triggerCount: 0,
    });
    
    // Clear storage keys
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.SHOWN);
        localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
        localStorage.removeItem(STORAGE_KEYS.TRIGGER_COUNT);
      } catch {
        console.warn('localStorage remove failed');
      }
    }
  }, []);

  // Mark email as captured - memoized
  const markEmailCaptured = React.useCallback(() => {
    batchWriteStorage({ emailCaptured: true });
    dismiss();
  }, [dismiss]);

  // Set up exit intent detection with performance optimizations
  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    // Create throttled handler for mouse leave
    // Throttle to max once per 100ms to prevent excessive calls
    const handleMouseLeave = throttle((e: MouseEvent) => {
      // Check if mouse is leaving from the top of the viewport
      if (e.clientY <= threshold && e.movementY < 0) {
        triggerExitIntent();
      }
    }, 100);

    // Mobile: Detect back button via history state
    const handlePopState = () => {
      if (detectMobileBackButton) {
        triggerExitIntent();
      }
    };

    // Add event listeners with passive option for better performance
    // passive: true tells the browser the handler won't call preventDefault
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    
    if (detectMobileBackButton) {
      // Push a state to detect back button
      window.history.pushState({ exitIntent: true }, '', window.location.href);
      window.addEventListener('popstate', handlePopState, { passive: true });
    }

    return () => {
      // Clean up event listeners
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      if (detectMobileBackButton) {
        window.removeEventListener('popstate', handlePopState);
      }

      // Cancel any pending animation frames
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [enabled, threshold, detectMobileBackButton, triggerExitIntent]);

  return {
    ...state,
    dismiss,
    reset,
    markEmailCaptured,
    shouldShow,
  };
}

export default useExitIntent;
