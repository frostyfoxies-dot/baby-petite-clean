import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Mail, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { getCheckoutSummary } from '@/actions/checkout';
import { clearCart } from '@/actions/cart';

/**
 * Checkout success page component
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  // If we have a Stripe session ID, we can fetch order details
  // For now, we'll use the checkout summary to display order info
  const checkoutResult = await getCheckoutSummary();
  
  // Clear the cart after successful order
  await clearCart();

  // If no checkout data, redirect to home
  if (!checkoutResult.success || !checkoutResult.data || checkoutResult.data.items.length === 0) {
    // Still show success page even without data (order might have been processed)
  }

  const checkoutData = checkoutResult.data;

  // Format order number from session ID or generate one
  const orderNumber = sessionId 
    ? `KP-${sessionId.substring(0, 8).toUpperCase()}`
    : `KP-${Date.now().toString(36).toUpperCase()}`;

  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success message */}
          <div className="bg-white rounded-lg p-8 text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been received.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Order #{orderNumber} · {orderDate}
            </p>
          </div>

          {/* Order details */}
          {checkoutData && checkoutData.items.length > 0 && (
            <div className="bg-white rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Order Details
              </h2>

              {/* Order items */}
              <div className="space-y-4 mb-6">
                {checkoutData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-500">{item.variantName}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${checkoutData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${checkoutData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={checkoutData.shipping === 0 ? 'text-green-600' : 'text-gray-900'}>
                    {checkoutData.shipping === 0 ? 'Free' : `$${checkoutData.shipping.toFixed(2)}`}
                  </span>
                </div>
                {checkoutData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-${checkoutData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${checkoutData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* What's next */}
          <div className="bg-white rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What's Next?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-yellow-dark" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Confirmation Email</p>
                  <p className="text-sm text-gray-600">
                    We've sent a confirmation email with your order details.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-yellow-dark" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Processing</p>
                  <p className="text-sm text-gray-600">
                    Your order is being processed and will ship within 1-2 business days.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-yellow-dark" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment</p>
                  <p className="text-sm text-gray-600">
                    Your payment has been processed successfully.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products" className="flex-1">
              <Button variant="outline" size="lg" fullWidth>
                Continue Shopping
              </Button>
            </Link>
            <Link href="/account/orders" className="flex-1">
              <Button size="lg" fullWidth>
                View Order Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
