'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Clock, 
  Truck, 
  AlertTriangle,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import type { DropshipOrder, Order, DropshipOrderItem, ProductSource } from '@prisma/client';

/**
 * Full order type with relations
 */
interface OrderWithRelations extends DropshipOrder {
  order: Order & {
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
    }>;
  };
  items: Array<DropshipOrderItem & {
    productSource: ProductSource;
  }>;
}

/**
 * Props for the FulfillmentClient component
 */
export interface FulfillmentClientProps {
  orders: OrderWithRelations[];
  counts: {
    pending: number;
    placed: number;
    shipped: number;
    issues: number;
  };
}

/**
 * Tab configuration
 */
const tabs = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'placed', label: 'Placed', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'issues', label: 'Issues', icon: AlertTriangle },
] as const;

type TabId = typeof tabs[number]['id'];

/**
 * FulfillmentClient Component
 * 
 * Dashboard for managing dropship order fulfillment with tabs for different statuses.
 * 
 * @example
 * ```tsx
 * <FulfillmentClient orders={orders} counts={counts} />
 * ```
 */
export function FulfillmentClient({ orders, counts }: FulfillmentClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('pending');

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case 'pending':
        return order.status === 'PENDING';
      case 'placed':
        return order.status === 'PLACED' || order.status === 'CONFIRMED';
      case 'shipped':
        return order.status === 'SHIPPED' || order.status === 'DELIVERED';
      case 'issues':
        return order.status === 'ISSUE' || order.status === 'CANCELLED' || order.status === 'REFUNDED';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fulfillment</h1>
        <p className="text-gray-600 mt-1">
          Manage dropship order fulfillment
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'p-4 rounded-lg border-2 text-left transition-colors',
            activeTab === 'pending'
              ? 'border-yellow bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{counts.pending}</p>
        </button>

        <button
          onClick={() => setActiveTab('placed')}
          className={cn(
            'p-4 rounded-lg border-2 text-left transition-colors',
            activeTab === 'placed'
              ? 'border-yellow bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-sm">Placed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{counts.placed}</p>
        </button>

        <button
          onClick={() => setActiveTab('shipped')}
          className={cn(
            'p-4 rounded-lg border-2 text-left transition-colors',
            activeTab === 'shipped'
              ? 'border-yellow bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Truck className="w-4 h-4" />
            <span className="text-sm">Shipped</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{counts.shipped}</p>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={cn(
            'p-4 rounded-lg border-2 text-left transition-colors',
            activeTab === 'issues'
              ? 'border-yellow bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Issues</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{counts.issues}</p>
        </button>
      </div>

      {/* Tabs for mobile */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-yellow text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-300 text-gray-700'
              )}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No {activeTab} orders
            </h3>
            <p className="text-gray-500">
              {activeTab === 'pending' 
                ? 'New orders will appear here when customers place them.'
                : `Orders that are ${activeTab} will appear here.`}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Order Card Component
 */
function OrderCard({ order }: { order: OrderWithRelations }) {
  // Map status to badge status
  const getBadgeStatus = () => {
    switch (order.status) {
      case 'PENDING':
        return 'pending';
      case 'PLACED':
      case 'CONFIRMED':
        return 'placed';
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      case 'ISSUE':
        return 'issue';
      default:
        return 'pending';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium text-gray-900">
            {order.order.orderNumber}
          </span>
          <StatusBadge status={getBadgeStatus()} size="sm" />
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(order.createdAt, 'short')}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer info */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Customer</p>
            <p className="font-medium text-gray-900">{order.customerEmail}</p>
            {order.customerPhone && (
              <p className="text-sm text-gray-600">{order.customerPhone}</p>
            )}
          </div>

          {/* Items count */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Items</p>
            <p className="font-medium text-gray-900">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-600">
              Total qty: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>

          {/* Cost */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Cost</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {formatPrice(Number(order.totalCost))}
            </p>
            {order.shippingCost && Number(order.shippingCost) > 0 && (
              <p className="text-sm text-gray-600">
                + {formatPrice(Number(order.shippingCost))} shipping
              </p>
            )}
          </div>
        </div>

        {/* Tracking info if available */}
        {order.trackingNumber && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Tracking</p>
            <p className="font-mono text-sm">{order.trackingNumber}</p>
            {order.carrier && (
              <p className="text-sm text-gray-600">{order.carrier}</p>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
        <Link href={`/admin/fulfillment/${order.id}`}>
          <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
