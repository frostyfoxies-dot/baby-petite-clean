'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Radio option type
 */
export interface RadioOption {
  /**
   * Value of the radio option
   */
  value: string;
  /**
   * Display label for the option
   */
  label: string;
  /**
   * Optional description for the option
   */
  description?: string;
  /**
   * Whether the option is disabled
   */
  disabled?: boolean;
}

/**
 * Radio group component props
 */
export interface RadioGroupProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /**
   * Label for the radio group
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below the radio group
   */
  helperText?: string;
  /**
   * Whether the radio group is required
   * @default false
   */
  required?: boolean;
  /**
   * Options to display
   */
  options: RadioOption[];
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Callback when selection changes
   */
  onChange?: (value: string) => void;
  /**
   * Name attribute for the radio inputs
   */
  name?: string;
  /**
   * Layout direction for options
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';
  /**
   * Size of the radio buttons
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Radio group component with label, error state, and helper text
 * 
 * @example
 * ```tsx
 * <RadioGroup
 *   label="Size"
 *   options={[
 *     { value: 's', label: 'Small' },
 *     { value: 'm', label: 'Medium' },
 *     { value: 'l', label: 'Large' }
 *   ]}
 *   value={selectedSize}
 *   onChange={setSelectedSize}
 * />
 * ```
 */
export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      required = false,
      options,
      value,
      onChange,
      name,
      direction = 'vertical',
      size = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    const groupId = React.useId();
    const errorId = `${groupId}-error`;
    const helperId = `${groupId}-helper`;
    const radioName = name || groupId;

    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const dotSize = {
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
    };

    return (
      <fieldset
        ref={ref}
        disabled={disabled}
        className={cn('flex flex-col gap-1.5', className)}
        {...props}
      >
        {label && (
          <legend className={cn('text-sm font-medium text-gray-900', disabled && 'text-gray-400')}>
            {label}
            {required && <span className="text-yellow ml-0.5">*</span>}
          </legend>
        )}
        <div
          className={cn(
            'flex gap-3',
            direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
          )}
          role="radiogroup"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            error && errorId,
            helperText && !error && helperId
          )}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-2 cursor-pointer select-none',
                disabled && 'cursor-not-allowed opacity-50',
                option.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <div className="relative flex items-center">
                <input
                  type="radio"
                  name={radioName}
                  value={option.value}
                  checked={value === option.value}
                  disabled={disabled || option.disabled}
                  onChange={(e) => onChange?.(e.target.value)}
                  className={cn(
                    // Base styles
                    'peer appearance-none border rounded-full',
                    'bg-white transition-all duration-200',
                    // Focus states
                    'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
                    // Disabled state
                    'disabled:bg-gray-50 disabled:border-gray-200',
                    // Error state
                    error && 'border-red-500 focus:ring-red-500',
                    // Default border
                    !error && 'border-gray-300',
                    // Checked state
                    'checked:border-yellow',
                    sizeStyles[size]
                  )}
                />
                {/* Inner dot */}
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center pointer-events-none',
                    'bg-gray-900 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity',
                    dotSize[size]
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-sm text-gray-900',
                    (disabled || option.disabled) && 'text-gray-400'
                  )}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span
                    className={cn(
                      'text-xs text-gray-500',
                      (disabled || option.disabled) && 'text-gray-400'
                    )}
                  >
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          ))}
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
      </fieldset>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

/**
 * Individual radio button component
 * Used within a RadioGroup or standalone with proper styling
 */
export const Radio = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="radio"
          ref={ref}
          className={cn(
            'peer appearance-none border rounded-full bg-white transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
            'disabled:bg-gray-50 disabled:border-gray-200',
            'border-gray-300',
            'checked:border-yellow',
            'w-5 h-5',
            className
          )}
          {...props}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gray-900 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
    );
  }
);
Radio.displayName = 'Radio';
