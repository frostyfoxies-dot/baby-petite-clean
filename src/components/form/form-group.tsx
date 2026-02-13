'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Form group component props
 */
export interface FormGroupProps {
  /**
   * Form group label
   */
  label?: string;
  /**
   * Form group description
   */
  description?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Whether the group is required
   * @default false
   */
  required?: boolean;
  /**
   * Layout direction
   * @default "vertical"
   */
  direction?: 'vertical' | 'horizontal';
  /**
   * Content alignment for horizontal layout
   * @default "start"
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Gap between elements
   * @default "md"
   */
  gap?: 'sm' | 'md' | 'lg';
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Form group children
   */
  children: React.ReactNode;
}

/**
 * Form group wrapper
 * 
 * @example
 * ```tsx
 * <FormGroup
 *   label="Personal Information"
 *   description="Enter your personal details"
 *   required
 * >
 *   <FormField name="firstName" label="First Name" />
 *   <FormField name="lastName" label="Last Name" />
 * </FormGroup>
 * ```
 */
export function FormGroup({
  label,
  description,
  error,
  required = false,
  direction = 'vertical',
  align = 'start',
  gap = 'md',
  className,
  children,
}: FormGroupProps) {
  const groupId = React.useId();
  const errorId = `error-${groupId}`;

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
  };

  return (
    <fieldset className={cn('space-y-3', className)}>
      {(label || description) && (
        <div className="space-y-1">
          {label && (
            <legend className="text-sm font-semibold text-gray-900">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </legend>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}

      <div
        className={cn(
          direction === 'horizontal' ? 'flex flex-wrap' : 'flex flex-col',
          gapClasses[gap],
          direction === 'horizontal' && alignClasses[align]
        )}
      >
        {children}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
