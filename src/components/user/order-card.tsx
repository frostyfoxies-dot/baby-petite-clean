'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Package, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatDate } from '@/lib/utils';

/**
 * Order status type
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

/**
 * Order data type
 */
export interface OrderData {
  /**
   * Order number
   */
  orderNumber: string;
  /**
   * Order ID
   */
  id: string;
  /**
   * Order date
   */
  date: Date | string;
  /**
   * Order status
   */
  status: OrderStatus;
  /**
   * Total amount
   */
  total: number;
  /**
   * Currency code
   */
  currency?: string;
  /**
   * Number of items
   */
  itemCount: number;
  /**
   * Product names (for preview)
   */
  products?: string[];
}

/**
 * Order card component props
 */
export interface OrderCardProps {
  /**
   * Order data
   */
  order: OrderData;
  /**
   * Callback when view details is clicked
   */
  onViewDetails?: (orderId: string) => void;
  /**
   * Callback when reorder is clicked
   */
  onReorder?: (orderId: string) => void;
  /**
   * Whether to show reorder button
   * @default false
   */
  showReorder?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Compact order card with status
 * 
 * @example
 * ```tsx
 * <OrderCard
 *   order={order}
 *   onViewDetails={(id) => router.push(`/account/orders/${id}`)}
 *   showReorder
 *   onReorder={(id) => reorderItems(id)}
 * />
 * ```
 */
export function OrderCard({
  order,
  onViewDetails,
  onReorder,
  showReorder = false,
  className,
}: OrderCardProps) {
  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
      pending: { variant: 'default', label: 'Pending' },
      processing: { variant: 'info', label: 'Processing' },
      shipped: { variant: 'info', label: 'Shipped' },
      delivered: { variant: 'success', label: 'Delivered' },
      cancelled: { variant: 'error', label: 'Cancelled' },
      refunded: { variant: 'warning', label: 'Refunded' },
    };

    const { variant, label } = styles[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Order info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">
                #{order.orderNumber}
              </p>
              {getStatusBadge(order.status)}
            </div>

            <p className="text-xs text-gray-500 mb-2">
              {formatDate(order.date, 'medium')}
            </p>

            {order.products && order.products.length > 0 && (
              <p className="text-xs text-gray-600 line-clamp-1">
                {order.products.slice(0, 2).join(', ')}
                {order.products.length > 2 && ` +${order.products.length - 2} more`}
              </p>
            )}

            <p className="text-sm font-semibold text-gray-900 mt-2">
              {formatPrice(order.total, order.currency)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(order.id)}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                View
              </Button>
            )}
            {showReorder && onReorder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReorder(order.id)}
                className="text-xs"
              >
                Reorder
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
