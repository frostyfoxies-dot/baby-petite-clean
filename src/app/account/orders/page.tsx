import Link from 'next/link';
import { requireAuth } from '@/lib/session';
import { getUserOrders } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import { Package, Search, Filter, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OrderStatus } from '@prisma/client';

/**
 * Force dynamic rendering - page requires session/auth
 */
export const dynamic = 'force-dynamic';

/**
 * Account orders page - Server Component
 * Displays user's order history
 */
export default async function AccountOrdersPage() {
  // Require authentication
  await requireAuth();

  // Get user orders
  const ordersResult = await getUserOrders({ limit: 20 });
  const orders = ordersResult.success ? ordersResult.data.orders : [];
  const totalOrders = ordersResult.success ? ordersResult.data.total : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Order History
        </h2>
        <p className="text-gray-600">
          View and track your past orders.
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filter
        </Button>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-4">
            Start shopping to see your orders here.
          </p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.orderNumber} className="bg-white rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="font-medium text-gray-900">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })} · {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <p className="font-medium text-gray-900">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order status progress */}
              <div className="mb-4">
                <OrderStatusProgress status={order.status} />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/account/orders/${order.orderNumber}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View Details
                  </Button>
                </Link>
                {order.status === OrderStatus.DELIVERED && (
                  <Button variant="ghost" size="sm">
                    Buy Again
                  </Button>
                )}
                {order.status === OrderStatus.SHIPPED && (
                  <Button variant="ghost" size="sm">
                    Track Order
                  </Button>
                )}
                {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {orders.length > 0 && totalOrders > orders.length && (
        <div className="text-center">
          <Button variant="outline">Load More Orders</Button>
        </div>
      )}
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
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

/**
 * Order status progress component
 */
function OrderStatusProgress({ status }: { status: OrderStatus }) {
  const steps = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepStatus = (stepKey: string) => {
    const statusOrder: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    
    // Map step to status
    const stepStatusMap: Record<string, OrderStatus[]> = {
      confirmed: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      processing: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      shipped: [OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      delivered: [OrderStatus.DELIVERED],
    };

    if (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) {
      return 'cancelled';
    }

    return stepStatusMap[stepKey]?.includes(status) ? 'completed' : 'pending';
  };

  // Don't show progress for cancelled/refunded orders
  if (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) {
    return (
      <p className={`text-sm ${status === OrderStatus.CANCELLED ? 'text-red-600' : 'text-purple-600'}`}>
        Order {status.toLowerCase()}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.key);
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  stepStatus === 'completed'
                    ? 'bg-green-500'
                    : stepStatus === 'cancelled'
                    ? 'bg-red-500'
                    : 'bg-gray-300'
                }`}
              />
              <span className={`text-xs ${
                stepStatus === 'completed'
                  ? 'text-green-700 font-medium'
                  : stepStatus === 'cancelled'
                  ? 'text-red-700'
                  : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${
                stepStatus === 'completed' ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
