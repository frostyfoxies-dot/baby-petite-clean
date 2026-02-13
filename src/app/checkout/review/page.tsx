'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { OrderSummary } from '@/components/checkout/order-summary';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, CreditCard, Truck, CheckCircle, Loader2 } from 'lucide-react';
import { useCheckout } from '@/context/checkout-context';
import { createCheckoutSession } from '@/actions/checkout';

/**
 * Checkout review page component
 */
export default function CheckoutReviewPage() {
  const router = useRouter();
  const { state, actions } = useCheckout();
  
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Redirect if no shipping address or payment info
  React.useEffect(() => {
    if (!state.shippingAddress) {
      router.push('/checkout/shipping');
    }
  }, [state.shippingAddress, router]);

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!agreedToTerms) return;
    
    if (!state.shippingAddress?.id) {
      setError('Shipping address is required');
      return;
    }

    if (!state.shippingMethod) {
      setError('Shipping method is required');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      // Create checkout session with Stripe
      const result = await createCheckoutSession({
        shippingAddressId: state.shippingAddress.id,
        shippingMethodId: state.shippingMethod.id,
        useSameBillingAddress: true,
        billingAddressId: undefined,
        discountCode: state.discountCode || undefined,
        isGift: false,
        giftMessage: undefined,
        notes: undefined,
      });

      if (result.success && result.data) {
        // Store session ID
        actions.setCheckoutSessionId(result.data.sessionId);
        
        // Redirect to Stripe checkout or success page
        if (result.data.url) {
          window.location.href = result.data.url;
          return;
        }
        
        // If no URL, go to success page (for testing without Stripe)
        router.push('/checkout/success');
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setError('An error occurred while placing your order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Transform items for OrderSummary component
  const orderSummaryItems = state.items.map((item) => ({
    id: item.id,
    productId: item.variantId,
    productSlug: item.productSlug,
    productName: item.productName,
    productImage: item.productImage,
    variantName: item.variantName,
    price: item.price,
    salePrice: item.salePrice,
    quantity: item.quantity,
    maxQuantity: 99,
  }));

  // Format shipping address for display
  const shippingAddressDisplay = state.shippingAddress ? {
    name: `${state.shippingAddress.firstName} ${state.shippingAddress.lastName}`,
    address: state.shippingAddress.line1 + (state.shippingAddress.line2 ? `, ${state.shippingAddress.line2}` : ''),
    city: state.shippingAddress.city,
    state: state.shippingAddress.state,
    postalCode: state.shippingAddress.zip,
    country: state.shippingAddress.country,
  } : undefined;

  const shippingMethodDisplay = state.shippingMethod ? {
    name: state.shippingMethod.name,
    estimatedDays: state.shippingMethod.estimatedDays,
  } : undefined;

  if (!state.shippingAddress) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left column - Review details */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Shipping address */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Shipping Address
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/checkout/shipping')}
            >
              Edit
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">{shippingAddressDisplay?.name}</p>
            <p>{shippingAddressDisplay?.address}</p>
            <p>
              {shippingAddressDisplay?.city}, {shippingAddressDisplay?.state} {shippingAddressDisplay?.postalCode}
            </p>
            <p>{shippingAddressDisplay?.country}</p>
          </div>
        </div>

        {/* Shipping method */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Shipping Method
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/checkout/shipping')}
            >
              Edit
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">{shippingMethodDisplay?.name}</p>
            <p className="text-xs">
              Estimated delivery: {shippingMethodDisplay?.estimatedDays}
            </p>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Method
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/checkout/payment')}
            >
              Edit
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              {state.paymentMethod?.type || 'Credit Card'}
              {state.paymentMethod?.lastFour && ` ending in ${state.paymentMethod.lastFour}`}
            </p>
            <p className="text-xs text-gray-500">
              Secure payment processed by Stripe
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items ({state.items.length})
          </h2>
          <div className="space-y-4">
            {state.items.map((item) => {
              const displayPrice = item.salePrice || item.price;
              return (
                <div key={item.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-gray-500">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${(displayPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terms and conditions */}
        <div className="bg-white rounded-lg p-6">
          <Checkbox
            label="I agree to the Terms of Service and Privacy Policy"
            checked={agreedToTerms}
            onChange={setAgreedToTerms}
          />
        </div>

        {/* Place order button */}
        <Button
          size="lg"
          fullWidth
          onClick={handlePlaceOrder}
          disabled={!agreedToTerms || isPlacingOrder}
          loading={isPlacingOrder}
          rightIcon={<CheckCircle className="w-4 h-4" />}
        >
          {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>

      {/* Right column - Order summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg p-6 sticky top-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>

          <OrderSummary
            items={orderSummaryItems}
            summary={{
              subtotal: state.summary.subtotal,
              tax: state.summary.tax,
              shipping: state.summary.shipping,
              total: state.summary.subtotal + state.summary.shipping + state.summary.tax - state.discountAmount,
              currency: state.summary.currency,
            }}
            shippingAddress={shippingAddressDisplay}
            shippingMethod={shippingMethodDisplay}
            showShippingInfo={false}
            showPromoCode={false}
            discountAmount={state.discountAmount || undefined}
          />
        </div>
      </div>
    </div>
  );
}
