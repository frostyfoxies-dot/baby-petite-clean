'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Package,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/status-badge';
import { CopyButton } from '@/components/admin/copy-button';
import { Button } from '@/components/ui/button';
import type { DropshipOrder, Order, DropshipOrderItem, ProductSource, Category, User, Variant } from '@prisma/client';

/**
 * Full order type with relations
 */
interface OrderWithRelations extends DropshipOrder {
  order: Order & {
    items: Array<{
      id: string;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number | string;
      totalPrice: number | string;
      variant?: Variant | null;
    }>;
    user?: User | null;
  };
  items: Array<DropshipOrderItem & {
    productSource: ProductSource & {
      category?: Category | null;
    };
  }>;
}

/**
 * Props for the OrderDetailClient component
 */
export interface OrderDetailClientProps {
  dropshipOrder: OrderWithRelations;
}

/**
 * OrderDetailClient Component
 * 
 * Displays detailed information about a dropship order including:
 * - Order summary
 * - Customer shipping address
 * - Items list with AliExpress links
 * - Tracking input form
 * - Status update buttons
 * - Order timeline
 * 
 * @example
 * ```tsx
 * <OrderDetailClient dropshipOrder={order} />
 * ```
 */
export function OrderDetailClient({ dropshipOrder }: OrderDetailClientProps) {
  const [trackingNumber, setTrackingNumber] = useState(dropshipOrder.trackingNumber || '');
  const [carrier, setCarrier] = useState(dropshipOrder.carrier || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Parse shipping address
  const shippingAddress = dropshipOrder.shippingAddress as {
    firstName?: string;
    lastName?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };

  // Format full address
  const fullAddress = [
    shippingAddress.line1,
    shippingAddress.line2,
    `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}`,
    shippingAddress.country,
  ].filter(Boolean).join('\n');

  // Map status to badge status
  const getBadgeStatus = () => {
    switch (dropshipOrder.status) {
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

  // Timeline events
  const timelineEvents = [
    { status: 'PENDING', label: 'Order Created', date: dropshipOrder.createdAt },
    { status: 'PLACED', label: 'Placed on AliExpress', date: dropshipOrder.placedAt },
    { status: 'SHIPPED', label: 'Shipped', date: dropshipOrder.shippedAt },
    { status: 'DELIVERED', label: 'Delivered', date: dropshipOrder.deliveredAt },
  ].filter(event => event.date);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    // In a real implementation, this would call a server action
    console.log('Updating status to:', newStatus);
    setIsUpdating(false);
  };

  // Handle tracking update
  const handleTrackingUpdate = async () => {
    setIsUpdating(true);
    // In a real implementation, this would call a server action
    console.log('Updating tracking:', { trackingNumber, carrier });
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/admin/fulfillment"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Fulfillment
      </Link>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order {dropshipOrder.order.orderNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            Dropship Order ID: {dropshipOrder.id}
          </p>
        </div>
        <StatusBadge status={getBadgeStatus()} size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items ({dropshipOrder.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {dropshipOrder.items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.productSource.productSlug}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        AliExpress SKU: {item.aliExpressSku}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm text-gray-600">
                          Unit Cost: {formatPrice(Number(item.unitCost))}
                        </span>
                        <span className="text-sm font-medium">
                          Total: {formatPrice(Number(item.totalCost))}
                        </span>
                      </div>
                    </div>
                    <a
                      href={item.productSource.aliExpressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      View on AliExpress
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Form */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Tracking Information
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                    Carrier
                  </label>
                  <select
                    id="carrier"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow"
                  >
                    <option value="">Select carrier...</option>
                    <option value="dhl">DHL</option>
                    <option value="fedex">FedEx</option>
                    <option value="ups">UPS</option>
                    <option value="usps">USPS</option>
                    <option value="aliexpress">AliExpress Shipping</option>
                    <option value="china-post">China Post</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleTrackingUpdate}
                  loading={isUpdating}
                  disabled={!trackingNumber || trackingNumber === dropshipOrder.trackingNumber}
                >
                  Update Tracking
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order Timeline
              </h2>
            </div>
            <div className="p-4">
              <div className="relative">
                {timelineEvents.map((event, index) => (
                  <div key={event.status} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        index === timelineEvents.length - 1
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      )}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      {index < timelineEvents.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{event.label}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.date, 'long')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Actions</h3>
            {dropshipOrder.status === 'PENDING' && (
              <Button fullWidth>
                Mark as Placed on AliExpress
              </Button>
            )}
            {dropshipOrder.status === 'PLACED' && (
              <Button fullWidth>
                Mark as Shipped
              </Button>
            )}
            {dropshipOrder.status === 'SHIPPED' && (
              <Button fullWidth>
                Mark as Delivered
              </Button>
            )}
            {dropshipOrder.status !== 'ISSUE' && (
              <Button variant="outline" fullWidth>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            )}
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>
            <div className="space-y-2 text-sm">
              {shippingAddress.firstName && (
                <p className="font-medium">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
              )}
              <p className="text-gray-600 whitespace-pre-line">{fullAddress}</p>
              {shippingAddress.phone && (
                <p className="text-gray-600 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {shippingAddress.phone}
                </p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <CopyButton 
                text={fullAddress} 
                label="Copy address" 
                showLabel 
                size="sm" 
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5" />
              Customer
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">
                {dropshipOrder.order.user?.firstName} {dropshipOrder.order.user?.lastName}
              </p>
              <p className="text-gray-600">{dropshipOrder.customerEmail}</p>
              {dropshipOrder.customerPhone && (
                <p className="text-gray-600">{dropshipOrder.customerPhone}</p>
              )}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Cost Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Cost</span>
                <span>{formatPrice(Number(dropshipOrder.totalCost))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatPrice(Number(dropshipOrder.shippingCost))}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-medium">
                <span>Total</span>
                <span>
                  {formatPrice(Number(dropshipOrder.totalCost) + Number(dropshipOrder.shippingCost))}
                </span>
              </div>
            </div>
          </div>

          {/* AliExpress Order Info */}
          {dropshipOrder.aliExpressOrderId && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">AliExpress Order</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Order ID: </span>
                  <span className="font-mono">{dropshipOrder.aliExpressOrderId}</span>
                </div>
                {dropshipOrder.aliExpressOrderStatus && (
                  <div>
                    <span className="text-gray-600">Status: </span>
                    <span>{dropshipOrder.aliExpressOrderStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
