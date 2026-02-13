'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Alert variant types
 */
export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert component props
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant of the alert
   * @default 'info'
   */
  variant?: AlertVariant;
  /**
   * Title of the alert
   */
  title?: string;
  /**
   * Whether the alert is dismissible
   * @default false
   */
  dismissible?: boolean;
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
  /**
   * Icon to display (overrides default icon)
   */
  icon?: React.ReactNode;
  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;
}

/**
 * Alert component for displaying messages
 * 
 * @example
 * ```tsx
 * <Alert variant="success" title="Success!">Your changes have been saved.</Alert>
 * <Alert variant="error" dismissible onDismiss={() => setShowAlert(false)}>
 *   Something went wrong. Please try again.
 * </Alert>
 * ```
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      title,
      dismissible = false,
      onDismiss,
      icon,
      showIcon = true,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
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

    const defaultIcons: Record<AlertVariant, React.ReactNode> = {
      success: <CheckCircle2 className="w-5 h-5" />,
      error: <AlertCircle className="w-5 h-5" />,
      warning: <AlertTriangle className="w-5 h-5" />,
      info: <Info className="w-5 h-5" />,
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          // Base styles
          'flex gap-3 p-4 rounded-md border',
          // Variant styles
          variantStyles[variant].container,
          className
        )}
        {...props}
      >
        {showIcon && (
          <div className={cn('flex-shrink-0 mt-0.5', variantStyles[variant].icon)}>
            {icon || defaultIcons[variant]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold mb-1">
              {title}
            </h4>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-sm',
              'hover:bg-black/5',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'transition-colors duration-150'
            )}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
