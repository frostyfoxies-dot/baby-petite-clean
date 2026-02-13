'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';

/**
 * Stock status type
 */
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

/**
 * Stock indicator variant
 */
export type StockIndicatorVariant = 'badge' | 'text' | 'progress';

/**
 * Stock indicator size
 */
export type StockIndicatorSize = 'sm' | 'md' | 'lg';

/**
 * Stock indicator props
 */
export interface StockIndicatorProps {
  /**
   * Available stock quantity
   */
  available: number;
  /**
   * Low stock threshold
   * @default 10
   */
  threshold?: number;
  /**
   * Critical low stock threshold (creates urgency)
   * @default 5
   */
  criticalThreshold?: number;
  /**
   * Display variant
   * @default 'badge'
   */
  variant?: StockIndicatorVariant;
  /**
   * Size
   * @default 'md'
   */
  size?: StockIndicatorSize;
  /**
   * Whether to show the exact count
   * @default true for low stock
   */
  showCount?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Determine stock status based on quantity
 * Pure function - memoization not needed as it's called with primitive values
 */
function getStockStatus(
  available: number,
  threshold: number,
  criticalThreshold: number
): StockStatus {
  if (available === 0) {
    return 'out-of-stock';
  }
  if (available <= criticalThreshold) {
    return 'low-stock';
  }
  if (available <= threshold) {
    return 'low-stock';
  }
  return 'in-stock';
}

/**
 * Status configuration
 * Defined outside component to prevent recreation on each render
 * Icons are created once and reused
 */
const STATUS_CONFIG = {
  'in-stock': {
    icon: CheckCircle,
    label: 'In Stock',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  'low-stock': {
    icon: AlertTriangle,
    label: 'Low Stock',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  'out-of-stock': {
    icon: XCircle,
    label: 'Out of Stock',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
} as const;

/**
 * Size classes
 * Defined outside component to prevent recreation on each render
 */
const SIZE_CLASSES = {
  sm: {
    container: 'gap-1 px-2 py-0.5',
    icon: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    container: 'gap-1.5 px-2.5 py-1',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  lg: {
    container: 'gap-2 px-3 py-1.5',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
} as const;

/**
 * Stock indicator badge component
 * Memoized to prevent unnecessary re-renders
 */
const StockBadge = React.memo(function StockBadge({
  status,
  available,
  showCount,
  size,
  className,
}: {
  status: StockStatus;
  available: number;
  showCount: boolean;
  size: StockIndicatorSize;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const sizeClass = SIZE_CLASSES[size];
  const Icon = config.icon;
  
  // Memoize the display text
  const displayText = React.useMemo(() => {
    const shouldShowCount = showCount && status === 'low-stock' && available > 0;
    if (shouldShowCount) {
      return (
        <>
          Only <span className="font-bold">{available}</span> left!
        </>
      );
    }
    return config.label;
  }, [showCount, status, available, config.label]);
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border font-medium',
        config.bgColor,
        config.borderColor,
        config.textColor,
        sizeClass.container,
        // Respect prefers-reduced-motion for animations
        status === 'low-stock' && 'motion-safe:animate-pulse',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn(config.color, sizeClass.icon)}>
        <Icon className="w-full h-full" aria-hidden="true" />
      </div>
      <span className={sizeClass.text}>
        {displayText}
      </span>
    </div>
  );
});

/**
 * Stock text component
 * Memoized to prevent unnecessary re-renders
 */
const StockText = React.memo(function StockText({
  status,
  available,
  showCount,
  size,
  className,
}: {
  status: StockStatus;
  available: number;
  showCount: boolean;
  size: StockIndicatorSize;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const sizeClass = SIZE_CLASSES[size];
  
  // Memoize the display text
  const displayText = React.useMemo(() => {
    const shouldShowCount = showCount && status === 'low-stock' && available > 0;
    if (shouldShowCount) {
      return (
        <>
          Only <span className="font-semibold">{available}</span> left!
        </>
      );
    }
    return config.label;
  }, [showCount, status, available, config.label]);
  
  // Memoize dot color class
  const dotColorClass = React.useMemo(() => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-500';
      case 'low-stock':
        return 'bg-amber-500';
      case 'out-of-stock':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }, [status]);
  
  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-live="polite"
    >
      {/* Status indicator dot - decorative, status is conveyed via text */}
      <span
        className={cn('w-2 h-2 rounded-full', dotColorClass)}
        aria-hidden="true"
      />
      <span className={cn(config.textColor, sizeClass.text)}>
        {displayText}
      </span>
    </div>
  );
});

/**
 * Stock progress bar component
 * Memoized to prevent unnecessary re-renders
 */
const StockProgress = React.memo(function StockProgress({
  status,
  available,
  maxStock,
  size,
  className,
}: {
  status: StockStatus;
  available: number;
  maxStock: number;
  size: StockIndicatorSize;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const sizeClass = SIZE_CLASSES[size];
  
  // Memoize percentage calculation
  const percentage = React.useMemo(
    () => Math.min(100, Math.max(0, (available / maxStock) * 100)),
    [available, maxStock]
  );
  
  // Memoize display text
  const displayText = React.useMemo(() => {
    if (status === 'out-of-stock') {
      return 'Out of Stock';
    }
    if (status === 'low-stock') {
      return (
        <>
          Only <span className="font-semibold">{available}</span> left
        </>
      );
    }
    return `${available} in stock`;
  }, [status, available]);
  
  // Memoize progress bar color
  const progressColorClass = React.useMemo(() => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-500';
      case 'low-stock':
        return 'bg-amber-500';
      case 'out-of-stock':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }, [status]);
  
  return (
    <div className={cn('space-y-1.5', className)} role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-1.5', sizeClass.icon)}>
          <Package className="w-full h-full" aria-hidden="true" />
          <span className={cn(config.textColor, sizeClass.text)}>
            {displayText}
          </span>
        </div>
      </div>
      {/* Progress bar - decorative, status is conveyed via text */}
      <div 
        className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            // Use GPU-accelerated transforms
            'transform-gpu',
            progressColorClass
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

/**
 * Stock indicator component
 * Displays stock level with visual indicators and urgency messaging
 * 
 * Performance optimizations:
 * - React.memo on all sub-components
 * - Memoized calculations and display text
 * - Static configuration objects defined outside components
 * - Efficient status determination with early returns
 * 
 * @example
 * ```tsx
 * <StockIndicator available={5} variant="badge" />
 * <StockIndicator available={0} variant="text" />
 * <StockIndicator available={25} variant="progress" />
 * ```
 */
const StockIndicator = React.memo(function StockIndicator({
  available,
  threshold = 10,
  criticalThreshold = 5,
  variant = 'badge',
  size = 'md',
  showCount = true,
  className,
}: StockIndicatorProps) {
  // Memoize status calculation
  const status = React.useMemo(
    () => getStockStatus(available, threshold, criticalThreshold),
    [available, threshold, criticalThreshold]
  );
  
  // For progress variant, we need a max stock value
  // Memoize to prevent recalculation
  const maxStock = React.useMemo(
    () => Math.max(threshold * 3, available),
    [threshold, available]
  );
  
  if (variant === 'progress') {
    return (
      <StockProgress
        status={status}
        available={available}
        maxStock={maxStock}
        size={size}
        className={className}
      />
    );
  }
  
  if (variant === 'text') {
    return (
      <StockText
        status={status}
        available={available}
        showCount={showCount}
        size={size}
        className={className}
      />
    );
  }
  
  return (
    <StockBadge
      status={status}
      available={available}
      showCount={showCount}
      size={size}
      className={className}
    />
  );
});

/**
 * Compact stock badge for product cards
 * Memoized to prevent unnecessary re-renders
 */
const StockBadgeCompact = React.memo(function StockBadgeCompact({
  available,
  threshold = 10,
  className,
}: {
  available: number;
  threshold?: number;
  className?: string;
}) {
  const status = React.useMemo(
    () => getStockStatus(available, threshold, Math.floor(threshold / 2)),
    [available, threshold]
  );
  const config = STATUS_CONFIG[status];
  
  if (status === 'in-stock') {
    return null; // Don't show for in-stock items in compact mode
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
        config.bgColor,
        config.textColor,
        // Respect prefers-reduced-motion for animations
        status === 'low-stock' && 'motion-safe:animate-pulse',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === 'out-of-stock' ? (
        'Out of Stock'
      ) : (
        <>
          Only {available} left!
        </>
      )}
    </span>
  );
});

/**
 * Stock level urgency indicator for checkout
 * Memoized to prevent unnecessary re-renders
 */
const StockUrgencyIndicator = React.memo(function StockUrgencyIndicator({
  available,
  threshold = 10,
  className,
}: {
  available: number;
  threshold?: number;
  className?: string;
}) {
  const status = React.useMemo(
    () => getStockStatus(available, threshold, Math.floor(threshold / 2)),
    [available, threshold]
  );
  
  if (status !== 'low-stock' || available === 0) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md',
        'bg-amber-50 border border-amber-200',
        'text-amber-800 text-sm',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        <strong>Only {available} left in stock</strong> - order soon!
      </span>
    </div>
  );
});

export { 
  StockIndicator, 
  StockBadgeCompact, 
  StockUrgencyIndicator,
  getStockStatus,
  STATUS_CONFIG,
  SIZE_CLASSES 
};
export default StockIndicator;
export type { StockStatus, StockIndicatorVariant, StockIndicatorSize, StockIndicatorProps };
