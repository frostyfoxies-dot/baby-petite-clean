'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Package, MapPin, CreditCard, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice, formatDate } from '@/lib/utils';

/**
 * Order status type
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

/**
 * Order item type
 */
export interface OrderItem {
  /**
   * Item ID
   */
  id: string;
  /**
   * Product name
   */
  name: string;
  /**
   * Product slug
   */
  slug?: string;
  /**
   * Product image URL
   */
  image?: string;
  /**
   * Variant (size, color)
   */
  variant?: string;
  /**
   * Quantity
   */
  quantity: number;
  /**
   * Unit price
   */
  price: number;
  /**
   * Currency code
   */
  currency?: string;
}

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
   * Subtotal amount
   */
  subtotal: number;
  /**
   * Shipping amount
   */
  shipping: number;
  /**
   * Tax amount
   */
  tax: number;
  /**
   * Discount amount
   */
  discount?: number;
  /**
   * Total amount
   */
  total: number;
  /**
   * Currency code
   */
  currency?: string;
  /**
   * Order items
   */
  items: OrderItem[];
  /**
   * Shipping address
   */
  shippingAddress?: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /**
   * Billing address
   */
  billingAddress?: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /**
   * Payment method
   */
  paymentMethod?: {
    type: string;
    last4?: string;
  };
  /**
   * Shipping method
   */
  shippingMethod?: {
    name: string;
    estimatedDelivery?: Date | string;
  };
  /**
   * Tracking number
   */
  trackingNumber?: string;
  /**
   * Tracking URL
   */
  trackingUrl?: string;
}

/**
 * Order details component props
 */
export interface OrderDetailsProps {
  /**
   * Order data
   */
  order: OrderData;
  /**
   * Callback when reorder is clicked
   */
  onReorder?: (orderId: string) => void;
  /**
   * Callback when cancel is clicked
   */
  onCancel?: (orderId: string) => void;
  /**
   * Callback when return is clicked
   */
  onReturn?: (orderId: string) => void;
  /**
   * Whether to show reorder button
   * @default true
   */
  showReorder?: boolean;
  /**
   * Whether to show cancel button
   * @default true
   */
  showCancel?: boolean;
  /**
   * Whether to show return button
   * @default true
   */
  showReturn?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Detailed order view
 * 
 * @example
 * ```tsx
 * <OrderDetails
 *   order={order}
 *   onReorder={(id) => reorderItems(id)}
 *   onCancel={(id) => cancelOrder(id)}
 *   onReturn={(id) => initiateReturn(id)}
 * />
 * ```
 */
export function OrderDetails({
  order,
  onReorder,
  onCancel,
  onReturn,
  showReorder = true,
  showCancel = true,
  showReturn = true,
  className,
}: OrderDetailsProps) {
  const getStatusInfo = (status: OrderStatus) => {
    const info: Record<OrderStatus, { icon: React.ReactNode; label: string; color: string }> = {
      pending: { icon: <Clock className="w-5 h-5" />, label: 'Pending', color: 'text-gray-600' },
      processing: { icon: <RefreshCw className="w-5 h-5" />, label: 'Processing', color: 'text-blue-600' },
      shipped: { icon: <Truck className="w-5 h-5" />, label: 'Shipped', color: 'text-blue-600' },
      delivered: { icon: <CheckCircle className="w-5 h-5" />, label: 'Delivered', color: 'text-green-600' },
      cancelled: { icon: <XCircle className="w-5 h-5" />, label: 'Cancelled', color: 'text-red-600' },
      refunded: { icon: <RefreshCw className="w-5 h-5" />, label: 'Refunded', color: 'text-orange-600' },
    };

    return info[status];
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Order header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {formatDate(order.date, 'long')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('flex items-center gap-2 text-sm font-medium', statusInfo.color)}>
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {showReorder && onReorder && (
              <Button
                variant="outline"
                onClick={() => onReorder(order.id)}
              >
                Reorder
              </Button>
            )}
            {showCancel && order.status === 'pending' && onCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel(order.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Cancel Order
              </Button>
            )}
            {showReturn && order.status === 'delivered' && onReturn && (
              <Button
                variant="outline"
                onClick={() => onReturn(order.id)}
              >
                Return Items
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {/* Product image */}
                {item.image && (
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.variant && (
                    <p className="text-sm text-gray-500">{item.variant}</p>
                  )}
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity, order.currency)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.price, order.currency)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            {order.discount && order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span>{formatPrice(order.shipping, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span>{formatPrice(order.tax, order.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total, order.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping info */}
      {order.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
            {order.shippingMethod && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-900">{order.shippingMethod.name}</p>
                {order.shippingMethod.estimatedDelivery && (
                  <p className="text-sm text-gray-500">
                    Estimated: {formatDate(order.shippingMethod.estimatedDelivery, 'medium')}
                  </p>
                )}
              </div>
            )}
            {order.trackingNumber && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Tracking: {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {order.trackingNumber}
                    </a>
                  ) : (
                    order.trackingNumber
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment info */}
      {order.paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.paymentMethod.type}</p>
              {order.paymentMethod.last4 && (
                <p>•••• {order.paymentMethod.last4}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
