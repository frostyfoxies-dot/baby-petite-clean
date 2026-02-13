'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

/**
 * Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label text for the input
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  /**
   * Whether the input is required
   * @default false
   */
  required?: boolean;
  /**
   * Icon to display inside the input (left side)
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display inside the input (right side)
   */
  rightIcon?: React.ReactNode;
  /**
   * Container class name for wrapper div
   */
  containerClassName?: string;
}

/**
 * Input component with label, error state, and helper text
 * 
 * @example
 * ```tsx
 * <Input label="Email" type="email" placeholder="Enter your email" />
 * <Input label="Password" type="password" error="Password is required" />
 * <Input label="Search" leftIcon={<Search />} placeholder="Search products..." />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      required = false,
      leftIcon,
      rightIcon,
      containerClassName,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

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
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              // Base styles
              'w-full px-3 py-2 text-sm',
              'bg-white border rounded-md',
              'text-gray-900 placeholder:text-gray-400',
              'transition-colors duration-200',
              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
              // Disabled state
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              // Error state
              error && 'border-red-500 focus:ring-red-500',
              // Left icon padding
              leftIcon && 'pl-10',
              // Right icon padding
              rightIcon && 'pr-10',
              // Default border
              !error && 'border-gray-200',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
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
      </div>
    );
  }
);

Input.displayName = 'Input';
