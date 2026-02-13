'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton component props
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show a pulse animation
   * @default true
   */
  pulse?: boolean;
}

/**
 * Loading skeleton component for showing placeholder content
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-32" />
 * <Skeleton className="h-24 w-full rounded-md" />
 * ```
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, pulse = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'bg-gray-200',
          // Animation
          pulse && 'motion-safe:animate-pulse',
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Skeleton card component for product cards
 */
export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show image skeleton
   * @default true
   */
  showImage?: boolean;
  /**
   * Whether to show title skeleton
   * @default true
   */
  showTitle?: boolean;
  /**
   * Whether to show price skeleton
   * @default true
   */
  showPrice?: boolean;
}

/**
 * Skeleton card for product loading state
 */
export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      showImage = true,
      showTitle = true,
      showPrice = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-gray-200 rounded-md overflow-hidden',
          className
        )}
        {...props}
      >
        {showImage && (
          <div className="aspect-square bg-gray-200 motion-safe:animate-pulse" />
        )}
        <div className="p-3 space-y-2">
          {showTitle && (
            <Skeleton className="h-4 w-3/4" />
          )}
          {showPrice && (
            <Skeleton className="h-4 w-1/2" />
          )}
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Skeleton list component for lists of items
 */
export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of items to show
   * @default 3
   */
  count?: number;
  /**
   * Whether to show avatar
   * @default false
   */
  showAvatar?: boolean;
}

/**
 * Skeleton list for loading list items
 */
export const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ className, count = 3, showAvatar = false, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            {showAvatar && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
);

SkeletonList.displayName = 'SkeletonList';
