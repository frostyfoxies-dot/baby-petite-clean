'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tooltip position types
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip component props
 */
export interface TooltipProps {
  /**
   * Content to display in the tooltip
   */
  content: React.ReactNode;
  /**
   * Children that trigger the tooltip
   */
  children: React.ReactElement;
  /**
   * Position of the tooltip
   * @default 'top'
   */
  position?: TooltipPosition;
  /**
   * Delay in milliseconds before showing tooltip
   * @default 200
   */
  delay?: number;
  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional class name for the tooltip
   */
  className?: string;
}

/**
 * Tooltip component for displaying additional information on hover
 * 
 * @example
 * ```tsx
 * <Tooltip content="This is a tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const triggerRef = React.useRef<HTMLElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = React.useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-r-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-r-transparent border-t-transparent border-l-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        'aria-describedby': isVisible ? 'tooltip-content' : undefined,
      })}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip-content"
          role="tooltip"
          className={cn(
            // Base styles
            'absolute z-50 px-2.5 py-1.5',
            'bg-gray-900 text-white text-xs',
            'rounded shadow-lg',
            // Animation
            'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-150',
            // Position
            positionStyles[position],
            className
          )}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowStyles[position]
            )}
          />
        </div>
      )}
    </div>
  );
}
