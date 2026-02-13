'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Order item interface
 */
export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

/**
 * Order status type
 */
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

/**
 * Payment status type
 */
export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

/**
 * Fulfillment status type
 */
export type FulfillmentStatus =
  | 'UNFULFILLED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED';

/**
 * Order address interface
 */
export interface OrderAddress {
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  discountAmount?: number;
  discountCode?: string;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

/**
 * Orders hook return type
 */
interface UseOrdersReturn {
  /** Array of user orders */
  orders: Order[];
  /** Whether orders are being loaded */
  isLoading: boolean;
  /** Error if orders fetch failed */
  error: Error | null;
  /** Refetch orders */
  refetch: () => Promise<void>;
  /** Load more orders (pagination) */
  loadMore: () => Promise<void>;
  /** Whether there are more orders to load */
  hasMore: boolean;
}

/**
 * Default number of orders per page
 */
const DEFAULT_PER_PAGE = 10;

/**
 * Hook for user orders
 *
 * Fetches and manages state for the current user's order history.
 * Supports pagination and refetching.
 *
 * @param perPage - Number of orders per page (default: 10)
 * @returns Orders state and actions
 *
 * @example
 * ```tsx
 * function OrderHistory() {
 *   const { orders, isLoading, refetch } = useOrders();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <div>
 *       <button onClick={refetch}>Refresh</button>
 *       {orders.map(order => (
 *         <OrderCard key={order.id} order={order} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrders(perPage: number = DEFAULT_PER_PAGE): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  /**
   * Fetch orders from API
   */
  const fetchOrders = useCallback(
    async (pageNum: number, append: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          perPage: perPage.toString(),
        });

        const response = await fetch(`/api/orders?${params.toString()}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please sign in to view your orders');
          }
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();

        if (append) {
          setOrders((prev) => [...prev, ...data.orders]);
        } else {
          setOrders(data.orders);
        }

        setTotal(data.total);
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
      } finally {
        setIsLoading(false);
      }
    },
    [perPage]
  );

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchOrders(1, false);
  }, [fetchOrders]);

  /**
   * Refetch orders
   */
  const refetch = useCallback(() => {
    return fetchOrders(1, false);
  }, [fetchOrders]);

  /**
   * Load more orders
   */
  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    await fetchOrders(nextPage, true);
  }, [page, fetchOrders]);

  const hasMore = orders.length < total;

  return {
    orders,
    isLoading,
    error,
    refetch,
    loadMore,
    hasMore,
  };
}

export default useOrders;
