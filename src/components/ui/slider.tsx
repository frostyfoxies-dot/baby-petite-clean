'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Slider component props
 */
export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /**
   * Label text for the slider
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below the slider
   */
  helperText?: string;
  /**
   * Current value of the slider
   */
  value: number;
  /**
   * Callback when value changes
   */
  onChange: (value: number) => void;
  /**
   * Minimum value
   * @default 0
   */
  min?: number;
  /**
   * Maximum value
   * @default 100
   */
  max?: number;
  /**
   * Step increment
   * @default 1
   */
  step?: number;
  /**
   * Whether to show the current value
   * @default true
   */
  showValue?: boolean;
  /**
   * Format function for displaying the value
   */
  formatValue?: (value: number) => string;
  /**
   * Container class name for wrapper div
   */
  containerClassName?: string;
}

/**
 * Range slider component for filtering and numeric input
 * 
 * @example
 * ```tsx
 * <Slider 
 *   label="Price Range" 
 *   value={price} 
 *   onChange={setPrice}
 *   min={0}
 *   max={500}
 *   formatValue={(v) => `$${v}`}
 * />
 * ```
 */
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      showValue = true,
      formatValue,
      containerClassName,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const sliderId = id || React.useId();
    const errorId = `${sliderId}-error`;
    const helperId = `${sliderId}-helper`;
    const valueId = `${sliderId}-value`;

    // Calculate percentage for visual positioning
    const percentage = ((value - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      onChange(newValue);
    };

    const displayValue = formatValue ? formatValue(value) : String(value);

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={sliderId}
              className={cn(
                'text-sm font-medium text-gray-900',
                disabled && 'text-gray-400'
              )}
            >
              {label}
            </label>
          )}
          {showValue && (
            <span
              id={valueId}
              className={cn(
                'text-sm font-medium text-gray-900',
                disabled && 'text-gray-400'
              )}
            >
              {displayValue}
            </span>
          )}
        </div>
        <div className="relative pt-1 pb-4">
          <input
            ref={ref}
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={handleChange}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error && errorId,
              helperText && !error && helperId,
              showValue && valueId
            )}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            className={cn(
              // Base styles - visually hidden but accessible
              'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
              'disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {/* Track */}
          <div
            className={cn(
              'absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full',
              'bg-gray-200',
              disabled && 'bg-gray-100'
            )}
            aria-hidden="true"
          >
            {/* Filled track */}
            <div
              className="h-full bg-yellow rounded-full transition-all duration-150"
              style={{ width: `${percentage}%` }}
              aria-hidden="true"
            />
          </div>
          {/* Thumb */}
          <div
            className={cn(
              'absolute top-1/2 w-4 h-4 -translate-y-1/2 -translate-x-1/2 rounded-full',
              'bg-white border-2 border-yellow shadow-sm',
              'transition-all duration-150',
              'pointer-events-none',
              disabled && 'bg-gray-100 border-gray-300',
              !disabled && 'hover:scale-110'
            )}
            style={{ left: `${percentage}%` }}
            aria-hidden="true"
          />
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

Slider.displayName = 'Slider';
