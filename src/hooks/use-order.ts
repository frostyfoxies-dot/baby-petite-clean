'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import type { Order } from './use-orders';
import { cancelOrder as cancelOrderAction } from '@/actions/orders';

/**
 * Order hook return type
 */
interface UseOrderReturn {
  /** The order data or null if not found */
  order: Order | null;
  /** Whether the order is being loaded */
  isLoading: boolean;
  /** Error if order fetch failed */
  error: Error | null;
  /** Refetch the order data */
  refetch: () => Promise<void>;
  /** Cancel the order */
  cancelOrder: () => Promise<{ success: boolean; error?: string }>;
  /** Whether the order is being cancelled */
  isCancelling: boolean;
}

/**
 * Hook for single order
 *
 * Fetches and manages state for a single order by order number.
 * Includes the ability to cancel the order if eligible.
 *
 * @param orderNumber - The order number to fetch
 * @returns Order state and actions
 *
 * @example
 * ```tsx
 * function OrderDetail({ orderNumber }) {
 *   const { order, isLoading, cancelOrder, isCancelling } = useOrder(orderNumber);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!order) return <NotFound />;
 *
 *   return (
 *     <div>
 *       <h1>Order {order.orderNumber}</h1>
 *       {order.status === 'PENDING' && (
 *         <button onClick={cancelOrder} disabled={isCancelling}>
 *           Cancel Order
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrder(orderNumber: string | null): UseOrderReturn {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { addToast } = useUIStore();

  /**
   * Fetch order from API
   */
  const fetchOrder = useCallback(async () => {
    if (!orderNumber) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderNumber}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError(new Error('Order not found'));
          setOrder(null);
        } else if (response.status === 401) {
          setError(new Error('Please sign in to view this order'));
          setOrder(null);
        } else {
          throw new Error('Failed to fetch order');
        }
        return;
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch order'));
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /**
   * Cancel the order
   */
  const cancelOrder = useCallback(async () => {
    if (!orderNumber) {
      return { success: false, error: 'No order number provided' };
    }

    setIsCancelling(true);

    try {
      const result = await cancelOrderAction(orderNumber);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Order cancelled',
          message: 'Your order has been cancelled successfully.',
        });
        // Refetch order to get updated status
        await fetchOrder();
      } else {
        addToast({
          type: 'error',
          title: 'Cancellation failed',
          message: result.error || 'Unable to cancel order. Please try again.',
        });
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (err) {
      console.error('Cancel order error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      addToast({
        type: 'error',
        title: 'Cancellation failed',
        message: errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsCancelling(false);
    }
  }, [orderNumber, fetchOrder, addToast]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
    cancelOrder,
    isCancelling,
  };
}

export default useOrder;
