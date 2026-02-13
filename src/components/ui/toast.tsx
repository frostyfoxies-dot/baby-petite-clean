'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast variant types
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast position types
 */
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Toast data type
 */
export interface ToastData {
  /**
   * Unique identifier for the toast
   */
  id: string;
  /**
   * Title of the toast
   */
  title?: string;
  /**
   * Description of the toast
   */
  description?: string;
  /**
   * Visual variant of the toast
   * @default 'info'
   */
  variant?: ToastVariant;
  /**
   * Duration in milliseconds (0 for persistent)
   * @default 5000
   */
  duration?: number;
  /**
   * Callback when toast is dismissed
   */
  onDismiss?: () => void;
}

/**
 * Toast context type
 */
interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

/**
 * Toast provider props
 */
export interface ToastProviderProps {
  /**
   * Children components
   */
  children: React.ReactNode;
  /**
   * Position of the toast container
   * @default 'bottom-right'
   */
  position?: ToastPosition;
  /**
   * Maximum number of toasts to show
   * @default 5
   */
  maxToasts?: number;
}

/**
 * Toast component props
 */
export interface ToastProps {
  /**
   * Toast data
   */
  toast: ToastData;
  /**
   * Callback when toast is dismissed
   */
  onDismiss: (id: string) => void;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Toast provider component
 * 
 * @example
 * ```tsx
 * <ToastProvider position="bottom-right">
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const newToast: ToastData = { ...toast, id };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      return updated.slice(-maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const removeAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastContainer position={position} toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast functionality
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast container component
 */
function ToastContainer({
  position,
  toasts,
  onDismiss,
}: {
  position: ToastPosition;
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const positionStyles: Record<ToastPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 w-full max-w-sm',
        positionStyles[position]
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Individual toast item component
 */
function ToastItem({ toast, onDismiss }: ToastProps) {
  const { id, title, description, variant = 'info', duration = 5000, onDismiss: toastOnDismiss } = toast;

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id]);

  const handleDismiss = () => {
    toastOnDismiss?.();
    onDismiss(id);
  };

  const variantStyles: Record<ToastVariant, { container: string; icon: string }> = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-500',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-500',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-500',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-500',
    },
  };

  const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        // Base styles
        'flex gap-3 p-4 rounded-md border shadow-lg',
        // Animation
        'motion-safe:animate-in motion-safe:slide-in-from-right-full motion-safe:fade-in motion-safe:duration-300',
        // Variant styles
        variantStyles[variant].container
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', variantStyles[variant].icon)}>
        {icons[variant]}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-semibold">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-sm mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className={cn(
          'flex-shrink-0 p-1 rounded-sm',
          'hover:bg-black/5',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'transition-colors duration-150'
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Standalone toast component for manual use
 */
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ toast, onDismiss }, ref) => {
    return <ToastItem toast={toast} onDismiss={onDismiss} />;
  }
);

Toast.displayName = 'Toast';
