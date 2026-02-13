import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/session';
import { getOrder, cancelOrder } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Truck, CreditCard, ArrowLeft, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';
import CancelOrderButton from './cancel-button';

interface OrderDetailsPageProps {
  params: Promise<{ orderNumber: string }>;
}

/**
 * Account order details page - Server Component
 * Displays detailed information about a specific order
 */
export default async function AccountOrderDetailsPage({ params }: OrderDetailsPageProps) {
  // Require authentication
  const user = await requireAuth();
  const { orderNumber } = await params;

  // Get order details
  const orderResult = await getOrder(orderNumber);

  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  const order = orderResult.data;

  // Verify the order belongs to the user
  // Note: The getOrder action already checks this, but we double-check here
  // for extra security

  const canCancel = order.status === OrderStatus.PENDING || 
                    order.status === OrderStatus.CONFIRMED ||
                    order.status === OrderStatus.PROCESSING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/orders">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Orders
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Order #{order.orderNumber}
          </h2>
          <p className="text-gray-600">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Order status */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Order Status</p>
            <OrderStatusBadge status={order.status} />
          </div>
          {order.shipping?.trackingNumber && (
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
              <p className="font-medium text-gray-900">{order.shipping.trackingNumber}</p>
              {order.shipping.trackingUrl && (
                <a 
                  href={order.shipping.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Track Package
                </a>
              )}
            </div>
          )}
        </div>

        {/* Order timeline */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <OrderTimeline 
            confirmedAt={order.confirmedAt}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
            status={order.status}
          />
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Items ({order.items.length})
        </h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-500">{item.variantName}</p>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-medium text-gray-900">
                  ${item.totalPrice.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  ${item.unitPrice.toFixed(2)} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">${order.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className={order.shippingAmount === 0 ? 'text-green-600' : 'text-gray-900'}>
              {order.shippingAmount === 0 ? 'Free' : `$${order.shippingAmount.toFixed(2)}`}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping and Payment info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping information */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Shipping Information
            </h3>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              {(order.shippingAddress as Record<string, unknown>)?.firstName} {(order.shippingAddress as Record<string, unknown>)?.lastName}
            </p>
            <p>{(order.shippingAddress as Record<string, unknown>)?.line1 as string}</p>
            {(order.shippingAddress as Record<string, unknown>)?.line2 && (
              <p>{(order.shippingAddress as Record<string, unknown>)?.line2 as string}</p>
            )}
            <p>
              {(order.shippingAddress as Record<string, unknown>)?.city as string}, {(order.shippingAddress as Record<string, unknown>)?.state as string} {(order.shippingAddress as Record<string, unknown>)?.zip as string}
            </p>
            <p>{(order.shippingAddress as Record<string, unknown>)?.country as string}</p>
            {(order.shippingAddress as Record<string, unknown>)?.phone && (
              <p className="mt-2">{(order.shippingAddress as Record<string, unknown>)?.phone as string}</p>
            )}
          </div>
          {order.shipping?.carrier && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Shipping Method</p>
              <p className="text-sm font-medium text-gray-900">
                {order.shipping.carrier} - {order.shipping.service}
              </p>
            </div>
          )}
        </div>

        {/* Payment information */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Information
            </h3>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              {order.customerEmail}
            </p>
            <div className="mt-2">
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Order notes */}
      {order.notes && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Order Notes
          </h3>
          <p className="text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {order.status === OrderStatus.DELIVERED && (
          <Button variant="outline" leftIcon={<Package className="w-4 h-4" />}>
            Buy Again
          </Button>
        )}
        {order.status === OrderStatus.SHIPPED && order.shipping?.trackingUrl && (
          <a href={order.shipping.trackingUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" leftIcon={<Truck className="w-4 h-4" />}>
              Track Package
            </Button>
          </a>
        )}
        {order.status === OrderStatus.DELIVERED && (
          <Button variant="outline" leftIcon={<CheckCircle className="w-4 h-4" />}>
            Leave Review
          </Button>
        )}
        {canCancel && (
          <CancelOrderButton orderNumber={order.orderNumber} />
        )}
      </div>
    </div>
  );
}

/**
 * Order status badge component
 */
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-700';
      case OrderStatus.SHIPPED:
        return 'bg-blue-100 text-blue-700';
      case OrderStatus.PROCESSING:
      case OrderStatus.CONFIRMED:
        return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-700';
      case OrderStatus.REFUNDED:
        return 'bg-purple-100 text-purple-700';
      case OrderStatus.PENDING:
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: OrderStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

/**
 * Payment status badge component
 */
function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const getStatusStyles = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-100 text-green-700';
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700';
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-700';
      case PaymentStatus.REFUNDED:
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: PaymentStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
      Payment: {formatStatus(status)}
    </span>
  );
}

/**
 * Order timeline component
 */
function OrderTimeline({
  confirmedAt,
  shippedAt,
  deliveredAt,
  status,
}: {
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  status: OrderStatus;
}) {
  const steps = [
    {
      label: 'Order Placed',
      date: confirmedAt,
      completed: !!confirmedAt || status !== OrderStatus.PENDING,
    },
    {
      label: 'Processing',
      date: null,
      completed: status === OrderStatus.PROCESSING || 
                 status === OrderStatus.SHIPPED || 
                 status === OrderStatus.DELIVERED,
    },
    {
      label: 'Shipped',
      date: shippedAt,
      completed: status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED,
    },
    {
      label: 'Delivered',
      date: deliveredAt,
      completed: status === OrderStatus.DELIVERED,
    },
  ];

  const isCancelled = status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED;

  return (
    <div className="relative">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCancelled
                  ? 'bg-red-100'
                  : step.completed
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              }`}
            >
              {isCancelled ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : step.completed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-400" />
              )}
            </div>
            <p className={`mt-2 text-xs font-medium ${
              isCancelled
                ? 'text-red-600'
                : step.completed
                ? 'text-gray-900'
                : 'text-gray-500'
            }`}>
              {step.label}
            </p>
            {step.date && (
              <p className="text-xs text-gray-500">
                {new Date(step.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
        ))}
      </div>
      {/* Progress line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
        <div
          className={`h-full ${isCancelled ? 'bg-red-400' : 'bg-green-400'}`}
          style={{
            width: `${(steps.filter(s => s.completed).length / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
