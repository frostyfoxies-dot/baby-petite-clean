'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Separator orientation types
 */
export type SeparatorOrientation = 'horizontal' | 'vertical';

/**
 * Separator component props
 */
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Orientation of the separator
   * @default 'horizontal'
   */
  orientation?: SeparatorOrientation;
  /**
   * Whether the separator is decorative (no semantic meaning)
   * @default true
   */
  decorative?: boolean;
}

/**
 * Horizontal/vertical separator component
 * 
 * @example
 * ```tsx
 * <Separator />
 * <Separator orientation="vertical" className="h-8" />
 * <Separator className="my-4" />
 * ```
 */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      orientation = 'horizontal',
      decorative = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={orientation}
        className={cn(
          // Base styles
          'shrink-0 bg-gray-200',
          // Orientation
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';
