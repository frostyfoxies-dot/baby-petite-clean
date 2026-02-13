'use client';

import * as React from 'react';
import { useExitIntent } from '@/hooks/use-exit-intent';
import { ExitIntentModal } from './exit-intent-modal';

/**
 * Exit intent context value
 */
export interface ExitIntentContextValue {
  /**
   * Whether the modal is currently showing
   */
  isShowing: boolean;
  /**
   * Whether exit intent has been triggered
   */
  hasTriggered: boolean;
  /**
   * Dismiss the modal
   */
  dismiss: () => void;
  /**
   * Reset the exit intent state
   */
  reset: () => void;
  /**
   * Mark email as captured
   */
  markEmailCaptured: () => void;
  /**
   * Manually trigger the exit intent
   */
  trigger: () => void;
}

/**
 * Exit intent provider props
 */
export interface ExitIntentProviderProps {
  /**
   * Child components
   */
  children: React.ReactNode;
  /**
   * Whether the provider is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Cooldown period in minutes before showing again
   * @default 30
   */
  cooldownMinutes?: number;
  /**
   * Routes where exit intent should be enabled
   * If not specified, enabled on all routes
   */
  enabledRoutes?: string[];
  /**
   * Routes where exit intent should be disabled
   */
  disabledRoutes?: string[];
  /**
   * Modal variant
   * @default 'discount'
   */
  variant?: 'discount' | 'email_capture' | 'save_cart';
  /**
   * Discount percentage to show
   * @default 10
   */
  discountPercent?: number;
  /**
   * Callback when email is submitted
   */
  onEmailSubmit?: (email: string) => Promise<void>;
}

// Create context
const ExitIntentContext = React.createContext<ExitIntentContextValue | null>(null);

/**
 * Hook to access exit intent context
 */
export function useExitIntentContext() {
  const context = React.useContext(ExitIntentContext);
  if (!context) {
    throw new Error('useExitIntentContext must be used within an ExitIntentProvider');
  }
  return context;
}

/**
 * Check if current path matches any route pattern
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (route === pathname) {
      return true;
    }
    // Prefix match for routes ending with *
    if (route.endsWith('*')) {
      const prefix = route.slice(0, -1);
      return pathname.startsWith(prefix);
    }
    return false;
  });
}

/**
 * Exit intent provider component
 * Wraps the application to provide exit intent detection and modal display
 * 
 * @example
 * ```tsx
 * <ExitIntentProvider
 *   variant="discount"
 *   discountPercent={10}
 *   onEmailSubmit={async (email) => subscribeToNewsletter(email)}
 * >
 *   <App />
 * </ExitIntentProvider>
 * ```
 */
export function ExitIntentProvider({
  children,
  enabled = true,
  cooldownMinutes = 30,
  enabledRoutes,
  disabledRoutes = [],
  variant = 'discount',
  discountPercent = 10,
  onEmailSubmit,
}: ExitIntentProviderProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [pathname, setPathname] = React.useState('');

  // Get current pathname on client
  React.useEffect(() => {
    setPathname(window.location.pathname);
    
    // Listen for route changes
    const handleRouteChange = () => {
      setPathname(window.location.pathname);
    };
    
    // This is a simplified approach - in a real app you might use Next.js router events
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Check if exit intent should be enabled on current route
  const isEnabledOnRoute = React.useMemo(() => {
    // Check disabled routes first
    if (disabledRoutes.length > 0 && matchesRoute(pathname, disabledRoutes)) {
      return false;
    }
    
    // Check enabled routes if specified
    if (enabledRoutes && enabledRoutes.length > 0) {
      return matchesRoute(pathname, enabledRoutes);
    }
    
    return true;
  }, [pathname, enabledRoutes, disabledRoutes]);

  // Use exit intent hook
  const exitIntent = useExitIntent({
    enabled: enabled && isEnabledOnRoute,
    cooldownMinutes,
    onExitIntent: () => {
      setIsModalOpen(true);
    },
  });

  // Handle modal close
  const handleClose = React.useCallback(() => {
    setIsModalOpen(false);
    exitIntent.dismiss();
  }, [exitIntent]);

  // Handle email submit
  const handleEmailSubmit = React.useCallback(
    async (email: string) => {
      try {
        await onEmailSubmit?.(email);
        exitIntent.markEmailCaptured();
      } catch (error) {
        console.error('Failed to submit email:', error);
        throw error;
      }
    },
    [onEmailSubmit, exitIntent]
  );

  // Handle continue shopping
  const handleContinueShopping = React.useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Manual trigger function
  const trigger = React.useCallback(() => {
    if (isEnabledOnRoute && exitIntent.shouldShow()) {
      setIsModalOpen(true);
    }
  }, [isEnabledOnRoute, exitIntent]);

  // Context value
  const contextValue: ExitIntentContextValue = {
    isShowing: isModalOpen,
    hasTriggered: exitIntent.hasTriggered,
    dismiss: handleClose,
    reset: exitIntent.reset,
    markEmailCaptured: exitIntent.markEmailCaptured,
    trigger,
  };

  return (
    <ExitIntentContext.Provider value={contextValue}>
      {children}
      <ExitIntentModal
        isOpen={isModalOpen}
        onClose={handleClose}
        variant={variant}
        discountPercent={discountPercent}
        onEmailSubmit={handleEmailSubmit}
        onContinueShopping={handleContinueShopping}
      />
    </ExitIntentContext.Provider>
  );
}

export default ExitIntentProvider;
