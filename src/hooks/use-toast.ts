'use client';

import { useCallback } from 'react';
import { useUIStore, type Toast } from '@/store/ui-store';

/**
 * Toast options
 */
interface ToastOptions {
  /** Toast title */
  title?: string;
  /** Toast duration in ms (default: 5000) */
  duration?: number;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast hook return type
 */
interface UseToastReturn {
  /** Array of current toasts */
  toasts: Toast[];
  /** Add a custom toast */
  addToast: (toast: Omit<Toast, 'id'>) => void;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Clear all toasts */
  clearToasts: () => void;
  /** Show a success toast */
  success: (message: string, options?: ToastOptions) => void;
  /** Show an error toast */
  error: (message: string, options?: ToastOptions) => void;
  /** Show a warning toast */
  warning: (message: string, options?: ToastOptions) => void;
  /** Show an info toast */
  info: (message: string, options?: ToastOptions) => void;
}

/**
 * Hook for toast notifications
 *
 * Provides a unified interface for displaying toast notifications.
 * Supports success, error, warning, and info types.
 *
 * @returns Toast state and actions
 *
 * @example
 * ```tsx
 * function Form() {
 *   const toast = useToast();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await submitForm();
 *       toast.success('Form submitted successfully!');
 *     } catch (error) {
 *       toast.error('Failed to submit form. Please try again.');
 *     }
 *   };
 *
 *   return <button onClick={handleSubmit}>Submit</button>;
 * }
 * ```
 */
export function useToast(): UseToastReturn {
  const { toasts, addToast, removeToast, clearToasts } = useUIStore();

  /**
   * Show a success toast
   */
  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'success',
        title: options?.title || 'Success',
        message,
        duration: options?.duration ?? 5000,
        action: options?.action,
      });
    },
    [addToast]
  );

  /**
   * Show an error toast
   */
  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'error',
        title: options?.title || 'Error',
        message,
        duration: options?.duration ?? 7000, // Longer duration for errors
        action: options?.action,
      });
    },
    [addToast]
  );

  /**
   * Show a warning toast
   */
  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'warning',
        title: options?.title || 'Warning',
        message,
        duration: options?.duration ?? 6000,
        action: options?.action,
      });
    },
    [addToast]
  );

  /**
   * Show an info toast
   */
  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      addToast({
        type: 'info',
        title: options?.title || 'Info',
        message,
        duration: options?.duration ?? 5000,
        action: options?.action,
      });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
}

/**
 * Toast provider component
 *
 * Renders toast notifications in a portal.
 * Should be placed at the root of the app.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <MainContent />
 *       <ToastProvider />
 *     </>
 *   );
 * }
 * ```
 */
export function ToastProvider() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`
            pointer-events-auto
            rounded-lg
            shadow-lg
            p-4
            flex
            items-start
            gap-3
            animate-slide-in
            ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border border-red-200' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
          `}
        >
          <div className="flex-1">
            <p className="font-medium text-sm">{toast.title}</p>
            <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default useToast;
