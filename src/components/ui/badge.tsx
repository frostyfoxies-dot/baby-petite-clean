'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/**
 * Badge variant types
 */
export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Badge size types
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Badge component props
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant of the badge
   * @default 'default'
   */
  variant?: BadgeVariant;
  /**
   * Size of the badge
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Whether the badge is removable
   * @default false
   */
  removable?: boolean;
  /**
   * Callback when remove button is clicked
   */
  onRemove?: () => void;
  /**
   * Icon to display before the text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after the text
   */
  rightIcon?: React.ReactNode;
}

/**
 * Badge component for tags, status indicators, and labels
 * 
 * @example
 * ```tsx
 * <Badge variant="success">In Stock</Badge>
 * <Badge variant="warning">Low Stock</Badge>
 * <Badge variant="error">Out of Stock</Badge>
 * <Badge removable onRemove={handleRemove}>Tag</Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      removable = false,
      onRemove,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<BadgeVariant, string> = {
      default: 'bg-gray-100 text-gray-700 border-gray-200',
      primary: 'bg-yellow/10 text-gray-900 border-yellow/30',
      secondary: 'bg-gray-50 text-gray-600 border-gray-200',
      success: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      error: 'bg-red-50 text-red-700 border-red-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    const sizeStyles: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center gap-1.5 font-medium rounded-md border',
          'transition-colors duration-200',
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'flex-shrink-0 rounded-sm',
              'hover:bg-black/5',
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-1',
              'transition-colors duration-150'
            )}
            aria-label="Remove badge"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
