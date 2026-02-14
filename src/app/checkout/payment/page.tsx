'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { OrderSummary } from '@/components/checkout/order-summary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Shield, Loader2, Apple, Wallet } from 'lucide-react';
import { useCheckout } from '@/context/checkout-context';
import { createCheckoutSession } from '@/actions/checkout';
import { PaymentRequestButton } from '@/components/payment';
import { SecurityBadges } from '@/components/ui/security-badges';

/**
 * Checkout payment page component
 */
export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { state, actions } = useCheckout();
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardholderName, setCardholderName] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [saveCard, setSaveCard] = React.useState(false);
  const [useSameBillingAddress, setUseSameBillingAddress] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showPaymentRequest, setShowPaymentRequest] = React.useState(true);
  const [paymentRequestAvailable, setPaymentRequestAvailable] = React.useState(false);

  // Calculate total amount in cents for payment request
  const totalAmountCents = Math.round(
    (state.summary.subtotal + state.summary.shipping + state.summary.tax - (state.discountAmount || 0)) * 100
  );

  // Redirect if no shipping address
  React.useEffect(() => {
    if (!state.shippingAddress) {
      router.push('/checkout/shipping');
    }
  }, [state.shippingAddress, router]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.shippingAddress?.id) {
      setError('Shipping address is required');
      return;
    }

    if (!state.shippingMethod) {
      setError('Shipping method is required');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create checkout session with Stripe
      const result = await createCheckoutSession({
        shippingAddressId: state.shippingAddress.id,
        shippingMethodId: state.shippingMethod.id,
        useSameBillingAddress,
        billingAddressId: undefined,
        discountCode: state.discountCode || undefined,
        isGift: false,
        giftMessage: undefined,
        notes: undefined,
      });

      if (result.success && result.data) {
        // Store session ID
        actions.setCheckoutSessionId(result.data.sessionId);
        
        // Redirect to Stripe checkout
        if (result.data.url) {
          window.location.href = result.data.url;
          return;
        }
        
        // If no URL, go to review page (for testing without Stripe)
        router.push('/checkout/review');
      } else {
        setError(result.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred while processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
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
      {/* Left column - Payment form */}
      <div className="lg:col-span-2 space-y-8">
        {/* Payment method */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Method
          </h2>

          <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-md">
            <Lock className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-600">
              Your payment information is secure and encrypted
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Apple Pay / Google Pay Payment Request Button */}
          {showPaymentRequest && (
            <div className="mb-6">
              <PaymentRequestButton
                amount={totalAmountCents}
                currency="USD"
                label="Baby Petite Order"
                onSuccess={(paymentIntentId) => {
                  console.log('Payment successful:', paymentIntentId);
                  // Payment request button handles the payment flow
                  // Redirect to success page
                  router.push('/checkout/success');
                }}
                onError={(err) => {
                  console.error('Payment error:', err);
                  setError(err.message || 'Payment failed. Please try again.');
                }}
                onCancel={() => {
                  console.log('Payment cancelled');
                }}
              />
              
              {/* Divider between payment request and card payment */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">or pay with card</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card number */}
            <div>
              <label htmlFor="card-number" className="block text-sm font-medium text-gray-900 mb-2">
                Card Number
              </label>
              <div className="relative">
                <Input
                  id="card-number"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  required
                  className="pl-10"
                />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Cardholder name */}
            <div>
              <label htmlFor="cardholder-name" className="block text-sm font-medium text-gray-900 mb-2">
                Cardholder Name
              </label>
              <Input
                id="cardholder-name"
                type="text"
                placeholder="John Doe"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                required
              />
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-900 mb-2">
                  Expiry Date
                </label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label htmlFor="cvc" className="block text-sm font-medium text-gray-900 mb-2">
                  CVC
                </label>
                <Input
                  id="cvc"
                  type="text"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Save card */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="w-4 h-4 text-yellow border-gray-300 rounded focus:ring-yellow"
              />
              <span className="text-sm text-gray-700">
                Save card for future purchases
              </span>
            </label>

            <Separator />

            {/* Billing address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Billing Address
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSameBillingAddress}
                  onChange={(e) => setUseSameBillingAddress(e.target.checked)}
                  className="w-4 h-4 text-yellow border-gray-300 rounded focus:ring-yellow"
                />
                <span className="text-sm text-gray-700">
                  Same as shipping address
                </span>
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isProcessing}
              rightIcon={<Shield className="w-4 h-4" />}
            >
              {isProcessing ? 'Processing...' : 'Continue to Review'}
            </Button>
          </form>

          {/* Payment methods */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">We accept:</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                Visa
              </div>
              <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                MC
              </div>
              <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                Amex
              </div>
              <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                <Apple className="w-4 h-4 text-gray-500" />
              </div>
              <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                <Wallet className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Security badges */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <SecurityBadges 
              variant="compact" 
              size="sm" 
              badges={['ssl', 'pci', 'norton', 'moneyback']}
            />
          </div>
        </div>
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
            showShippingInfo={true}
            showPromoCode={false}
            discountAmount={state.discountAmount || undefined}
          />
        </div>
      </div>
    </div>
  );
}
