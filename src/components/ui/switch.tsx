'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Switch component props
 */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text for the switch
   */
  label?: string;
  /**
   * Description text to display below the label
   */
  description?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Size of the switch
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Container class name for wrapper div
   */
  containerClassName?: string;
}

/**
 * Toggle switch component with label and description
 * 
 * @example
 * ```tsx
 * <Switch label="Email notifications" />
 * <Switch 
 *   label="Dark mode" 
 *   description="Enable dark theme for the application"
 *   checked={darkMode}
 *   onChange={setDarkMode}
 * />
 * ```
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      error,
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
    const switchId = id || React.useId();
    const errorId = `${switchId}-error`;

    const sizeStyles = {
      sm: {
        track: 'w-9 h-5',
        thumb: 'w-3 h-3 translate-x-0.5',
        thumbChecked: 'translate-x-4',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-4 h-4 translate-x-0.5',
        thumbChecked: 'translate-x-5',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'w-5 h-5 translate-x-0.5',
        thumbChecked: 'translate-x-7',
      },
    };

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              ref={ref}
              id={switchId}
              type="checkbox"
              role="switch"
              disabled={disabled}
              checked={checked}
              onChange={onChange}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error && errorId}
              className={cn(
                // Base styles - visually hidden but accessible
                'peer sr-only',
                className
              )}
              {...props}
            />
            {/* Track */}
            <div
              className={cn(
                // Base styles
                'rounded-full transition-all duration-200',
                'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow peer-focus:ring-offset-2',
                // Disabled state
                'disabled:bg-gray-200 disabled:cursor-not-allowed',
                // Unchecked state
                'peer-checked:bg-yellow',
                'bg-gray-300',
                sizeStyles[size].track
              )}
              aria-hidden="true"
            >
              {/* Thumb */}
              <div
                className={cn(
                  // Base styles
                  'absolute top-0.5 left-0 bg-white rounded-full shadow-sm',
                  'transition-transform duration-200',
                  // Disabled state
                  'disabled:bg-gray-400',
                  sizeStyles[size].thumb,
                  checked && sizeStyles[size].thumbChecked
                )}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  'text-sm font-medium text-gray-900 cursor-pointer select-none',
                  disabled && 'text-gray-400 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-xs text-gray-500',
                  disabled && 'text-gray-400'
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
