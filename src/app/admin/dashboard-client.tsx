'use client';

import Link from 'next/link';
import { 
  Package, 
  Users, 
  Clock, 
  TrendingUp,
  Import,
  Truck,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import type { DropshipOrder, Order, ProductSource, SourceStatus } from '@prisma/client';

/**
 * Stats type
 */
interface DashboardStats {
  totalProducts: number;
  totalSuppliers: number;
  pendingOrders: number;
  recentImports: number;
  pendingFulfillment: number;
}

/**
 * Recent order type
 */
interface RecentOrder extends DropshipOrder {
  order: Pick<Order, 'orderNumber'>;
}

/**
 * Recent product type
 */
interface RecentProduct extends Pick<ProductSource, 'id' | 'productSlug' | 'aliExpressProductId' | 'createdAt' | 'sourceStatus'> {}

/**
 * Props for the DashboardClient component
 */
export interface DashboardClientProps {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  recentProducts: RecentProduct[];
}

/**
 * DashboardClient Component
 * 
 * Main admin dashboard with overview statistics and quick actions.
 * 
 * @example
 * ```tsx
 * <DashboardClient stats={stats} recentOrders={orders} recentProducts={products} />
 * ```
 */
export function DashboardClient({ 
  stats, 
  recentOrders, 
  recentProducts 
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the Kids Petite admin dashboard
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Imported Products"
          value={stats.totalProducts}
          icon={Package}
          href="/admin/import"
          trend={stats.recentImports > 0 ? `+${stats.recentImports} this week` : undefined}
        />
        <StatCard
          title="Active Suppliers"
          value={stats.totalSuppliers}
          icon={Users}
          href="/admin/suppliers"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Clock}
          href="/admin/fulfillment"
          variant={stats.pendingOrders > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Awaiting Fulfillment"
          value={stats.pendingFulfillment}
          icon={Truck}
          href="/admin/fulfillment"
          variant={stats.pendingFulfillment > 5 ? 'danger' : stats.pendingFulfillment > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/import">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-yellow hover:bg-yellow-50 transition-colors cursor-pointer">
              <Import className="w-8 h-8 text-yellow mb-2" />
              <h3 className="font-medium text-gray-900">Import Product</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add a new product from AliExpress
              </p>
            </div>
          </Link>
          <Link href="/admin/fulfillment">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-yellow hover:bg-yellow-50 transition-colors cursor-pointer">
              <Truck className="w-8 h-8 text-yellow mb-2" />
              <h3 className="font-medium text-gray-900">Fulfill Orders</h3>
              <p className="text-sm text-gray-500 mt-1">
                Process pending dropship orders
              </p>
            </div>
          </Link>
          <Link href="/admin/suppliers">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-yellow hover:bg-yellow-50 transition-colors cursor-pointer">
              <Users className="w-8 h-8 text-yellow mb-2" />
              <h3 className="font-medium text-gray-900">Manage Suppliers</h3>
              <p className="text-sm text-gray-500 mt-1">
                View and manage your suppliers
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link 
              href="/admin/fulfillment"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No recent orders</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/fulfillment/${order.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {order.order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createdAt, 'short')}
                      </p>
                    </div>
                    <StatusBadge 
                      status={order.status.toLowerCase() as 'pending' | 'placed' | 'shipped'} 
                      size="sm" 
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Imports */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Imports</h2>
            <Link 
              href="/admin/import"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Import more
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Import className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No products imported yet</p>
              </div>
            ) : (
              recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.productSlug}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        AE ID: {product.aliExpressProductId}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge 
                        status={product.sourceStatus.toLowerCase() as 'active' | 'unavailable'} 
                        size="sm" 
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(product.createdAt, 'short')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats.pendingFulfillment > 5 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">High Order Volume</h3>
            <p className="text-sm text-red-700 mt-1">
              You have {stats.pendingFulfillment} orders awaiting fulfillment. 
              Consider processing them to avoid delays.
            </p>
            <Link href="/admin/fulfillment">
              <Button variant="secondary" size="sm" className="mt-2">
                View Orders
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
  variant = 'default',
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  trend?: string;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  const iconStyles = {
    default: 'text-gray-400',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  return (
    <Link href={href}>
      <div className={cn(
        'rounded-lg border p-4 hover:shadow-md transition-shadow',
        variantStyles[variant]
      )}>
        <div className="flex items-center justify-between">
          <Icon className={cn('w-5 h-5', iconStyles[variant])} />
          {trend && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{title}</p>
        </div>
      </div>
    </Link>
  );
}
