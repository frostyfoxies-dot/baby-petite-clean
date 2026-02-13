'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Minus } from 'lucide-react';

/**
 * Checkbox component props
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text for the checkbox
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below the checkbox
   */
  helperText?: string;
  /**
   * Whether the checkbox is in indeterminate state
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Size of the checkbox
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Container class name for wrapper div
   */
  containerClassName?: string;
}

/**
 * Checkbox component with label, error state, and indeterminate state
 * 
 * @example
 * ```tsx
 * <Checkbox label="I agree to the terms" />
 * <Checkbox label="Subscribe to newsletter" helperText="Get updates on new products" />
 * <Checkbox indeterminate label="Select all" />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      indeterminate = false,
      size = 'md',
      containerClassName,
      id,
      disabled,
      checked,
      onChange,
      ...props
    },
    ref
  ) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Handle indeterminate state
    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Merge refs
    React.useImperativeHandle(ref, () => checkboxRef.current!);

    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const iconSize = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        <div className="flex items-start gap-2">
          <div className="relative flex items-center">
            <input
              ref={checkboxRef}
              id={inputId}
              type="checkbox"
              disabled={disabled}
              checked={checked}
              onChange={onChange}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={cn(
                error && errorId,
                helperText && !error && helperId
              )}
              className={cn(
                // Base styles
                'peer appearance-none border rounded',
                'bg-white transition-all duration-200',
                // Focus states
                'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
                // Disabled state
                'disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed',
                // Error state
                error && 'border-red-500 focus:ring-red-500',
                // Default border
                !error && 'border-gray-300',
                // Checked state
                'checked:bg-yellow checked:border-yellow',
                // Hover state
                'hover:border-gray-400',
                sizeStyles[size],
                className
              )}
              {...props}
            />
            {/* Check icon */}
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center pointer-events-none',
                'text-gray-900',
                iconSize[size]
              )}
            >
              {checked && !indeterminate && <Check className="w-full h-full" />}
              {indeterminate && <Minus className="w-full h-full" />}
            </div>
          </div>
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'text-sm leading-tight cursor-pointer select-none',
                'text-gray-900',
                disabled && 'text-gray-400 cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
