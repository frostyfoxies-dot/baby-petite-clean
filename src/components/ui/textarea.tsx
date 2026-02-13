'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

/**
 * Textarea component props
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Label text for the textarea
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below the textarea
   */
  helperText?: string;
  /**
   * Whether the textarea is required
   * @default false
   */
  required?: boolean;
  /**
   * Maximum character count
   */
  maxLength?: number;
  /**
   * Whether to show character count
   * @default false
   */
  showCount?: boolean;
  /**
   * Container class name for wrapper div
   */
  containerClassName?: string;
}

/**
 * Textarea component with label, error state, and character count
 * 
 * @example
 * ```tsx
 * <Textarea label="Description" placeholder="Enter description" rows={4} />
 * <Textarea 
 *   label="Review" 
 *   maxLength={500} 
 *   showCount 
 *   placeholder="Write your review..." 
 * />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      required = false,
      maxLength,
      showCount = false,
      containerClassName,
      id,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const countId = `${inputId}-count`;

    const characterCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength !== undefined && characterCount > maxLength;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-gray-900',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {required && <span className="text-yellow ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error && errorId,
              helperText && !error && helperId,
              showCount && countId
            )}
            className={cn(
              // Base styles
              'w-full px-3 py-2 text-sm',
              'bg-white border rounded-md',
              'text-gray-900 placeholder:text-gray-400',
              'transition-colors duration-200',
              'resize-y min-h-[80px]',
              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
              // Disabled state
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:resize-none',
              // Error state
              error && 'border-red-500 focus:ring-red-500',
              // Default border
              !error && 'border-gray-200',
              className
            )}
            {...props}
          />
        </div>
        <div className="flex items-center justify-between">
          {error && (
            <p id={errorId} className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={helperId} className="text-xs text-gray-500">
              {helperText}
            </p>
          )}
          {showCount && maxLength && (
            <p
              id={countId}
              className={cn(
                'text-xs ml-auto',
                isOverLimit ? 'text-red-600' : 'text-gray-400'
              )}
            >
              {characterCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
