'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Select option type
 */
export interface SelectOption {
  /**
   * Value of the option
   */
  value: string;
  /**
   * Display label for the option
   */
  label: string;
  /**
   * Whether the option is disabled
   */
  disabled?: boolean;
}

/**
 * Select component props
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Label text for the select
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below the select
   */
  helperText?: string;
  /**
   * Whether the select is required
   * @default false
   */
  required?: boolean;
  /**
   * Options to display in the dropdown
   */
  options: SelectOption[];
  /**
   * Placeholder text for empty selection
   */
  placeholder?: string;
  /**
   * Container class name for wrapper div
   */
  containerClassName?: string;
}

/**
 * Select dropdown component with label, error state, and helper text
 * 
 * @example
 * ```tsx
 * <Select 
 *   label="Size" 
 *   options={[
 *     { value: 's', label: 'Small' },
 *     { value: 'm', label: 'Medium' },
 *     { value: 'l', label: 'Large' }
 *   ]} 
 *   placeholder="Select a size"
 * />
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      required = false,
      options,
      placeholder,
      containerClassName,
      id,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error && errorId,
              helperText && !error && helperId
            )}
            className={cn(
              // Base styles
              'w-full px-3 py-2 pr-10 text-sm appearance-none',
              'bg-white border rounded-md',
              'text-gray-900',
              'transition-colors duration-200',
              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
              // Disabled state
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              // Error state
              error && 'border-red-500 focus:ring-red-500',
              // Default border
              !error && 'border-gray-200',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none',
              'w-4 h-4 text-gray-400',
              disabled && 'text-gray-300'
            )}
            aria-hidden="true"
          />
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

Select.displayName = 'Select';
