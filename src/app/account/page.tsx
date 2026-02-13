import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Heart, MapPin, Package, ArrowRight } from 'lucide-react';
import { requireAuth } from '@/lib/session';
import { getUserProfile } from '@/actions/user';
import { getUserOrders } from '@/actions/orders';
import { getUserAddresses } from '@/actions/addresses';

/**
 * Account dashboard page component
 * Displays user profile, recent orders, and quick actions
 */
export default async function AccountDashboardPage() {
  // Require authentication
  const user = await requireAuth();

  // Fetch user data in parallel
  const [profileResult, ordersResult, addressesResult] = await Promise.all([
    getUserProfile(),
    getUserOrders({ limit: 3 }),
    getUserAddresses(),
  ]);

  // Extract data from results
  const profile = profileResult.success ? profileResult.data : null;
  const orders = ordersResult.success ? ordersResult.data.orders : [];
  const addresses = addressesResult.success ? addressesResult.data.addresses : [];

  // Get default address
  const defaultAddress = addresses.find(addr => addr.isDefault);

  // Get user's display name
  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.email || user.email;

  // Quick actions
  const quickActions = [
    {
      name: 'View Orders',
      description: 'Track and manage your orders',
      href: '/account/orders',
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Manage Addresses',
      description: 'Add and edit shipping addresses',
      href: '/account/addresses',
      icon: MapPin,
      color: 'bg-green-100 text-green-600',
    },
    {
      name: 'Wishlist',
      description: 'View your saved items',
      href: '/account/wishlist',
      icon: Heart,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      name: 'Edit Profile',
      description: 'Update your account details',
      href: '/account/profile',
      icon: ShoppingBag,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome back, {profile?.firstName || 'there'}!
        </h2>
        <p className="text-gray-600">
          From your account dashboard you can view your recent orders, manage your shipping addresses, and edit your password and account details.
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {action.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Orders
          </h3>
          <Link href="/account/orders">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No orders yet</p>
              <Link href="/products" className="inline-block mt-4">
                <Button size="sm">Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.orderNumber} className="p-6">
                  <div className="flex items-center justify-between">
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
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link href={`/account/orders/${order.orderNumber}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {order.status === 'DELIVERED' && (
                      <Button variant="ghost" size="sm">
                        Buy Again
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Contact</p>
            <p className="font-medium text-gray-900">{displayName}</p>
            <p className="text-gray-600">{profile?.email || user.email}</p>
            {profile?.phone && (
              <p className="text-gray-600">{profile.phone}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Default Address</p>
            {defaultAddress ? (
              <>
                <p className="text-gray-600">
                  {defaultAddress.firstName} {defaultAddress.lastName}
                </p>
                <p className="text-gray-600">
                  {defaultAddress.line1}
                  {defaultAddress.line2 && `, ${defaultAddress.line2}`}
                </p>
                <p className="text-gray-600">
                  {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}
                </p>
              </>
            ) : (
              <p className="text-gray-500 italic">
                No default address set
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link href="/account/profile">
            <Button variant="outline" size="sm">
              Edit Account Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Order status badge component
 */
function OrderStatusBadge({ status }: { status: string }) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-700';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
      {formatStatus(status)}
    </span>
  );
}
