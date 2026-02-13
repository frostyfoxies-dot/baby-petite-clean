'use client';

import { cn } from '@/lib/utils';

/**
 * Status types for the admin interface
 */
export type StatusType = 
  | 'pending' 
  | 'placed' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'issue'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'available'
  | 'low_stock'
  | 'out_of_stock';

/**
 * Props for the StatusBadge component
 */
export interface StatusBadgeProps {
  /** The status to display */
  status: StatusType;
  /** Optional custom label (defaults to title-cased status) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Status color configuration
 */
const statusConfig: Record<StatusType, { bg: string; text: string; dot: string }> = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    dot: 'bg-yellow-400',
  },
  placed: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-400',
  },
  shipped: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    dot: 'bg-purple-400',
  },
  delivered: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-400',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-400',
  },
  issue: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-400',
  },
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-400',
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-400',
  },
  suspended: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-400',
  },
  available: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-400',
  },
  low_stock: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    dot: 'bg-yellow-400',
  },
  out_of_stock: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-400',
  },
};

/**
 * Size configuration
 */
const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Format status for display
 */
function formatStatus(status: StatusType): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * StatusBadge Component
 * 
 * Displays a color-coded status indicator with a dot and label.
 * Used throughout the admin interface for order status, supplier status, etc.
 * 
 * @example
 * ```tsx
 * <StatusBadge status="pending" />
 * <StatusBadge status="shipped" label="In Transit" size="lg" />
 * <StatusBadge status="low_stock" className="ml-2" />
 * ```
 */
export function StatusBadge({ 
  status, 
  label, 
  className,
  size = 'md',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || formatStatus(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        config.bg,
        config.text,
        sizeConfig[size],
        className
      )}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      <span 
        className={cn('w-2 h-2 rounded-full', config.dot)}
        aria-hidden="true"
      />
      {displayLabel}
    </span>
  );
}
