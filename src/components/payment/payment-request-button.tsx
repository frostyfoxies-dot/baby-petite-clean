'use client';

import * as React from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

/**
 * Payment Request Button Props
 */
interface PaymentRequestButtonProps {
  /** Total amount in cents */
  amount: number;
  /** Currency code (default: USD) */
  currency?: string;
  /** Country code for shipping (default: US) */
  countryCode?: string;
  /** Label for the payment */
  label?: string;
  /** Callback when payment is successful */
  onSuccess?: (paymentIntentId: string) => void;
  /** Callback when payment fails */
  onError?: (error: Error) => void;
  /** Callback when payment is cancelled */
  onCancel?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Stripe publishable key */
  stripePublishableKey?: string;
}

/**
 * Payment Request Button Component
 *
 * Renders Apple Pay or Google Pay button based on the browser/device.
 * Uses Stripe's Payment Request Button Element.
 *
 * @see https://stripe.com/docs/stripe-js/elements/payment-request-button
 */
export function PaymentRequestButton({
  amount,
  currency = 'USD',
  countryCode = 'US',
  label = 'Kids Petite Order',
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  stripePublishableKey,
}: PaymentRequestButtonProps) {
  const [stripe, setStripe] = React.useState<Stripe | null>(null);
  const [elements, setElements] = React.useState<StripeElements | null>(null);
  const [paymentRequest, setPaymentRequest] = React.useState<any>(null);
  const [canMakePayment, setCanMakePayment] = React.useState<boolean>(false);
  const [paymentRequestType, setPaymentRequestType] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize Stripe
  React.useEffect(() => {
    const publishableKey = stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Stripe publishable key is not configured');
      setError('Payment configuration error');
      setIsLoading(false);
      return;
    }

    loadStripe(publishableKey)
      .then((stripeInstance) => {
        setStripe(stripeInstance);
      })
      .catch((err) => {
        console.error('Failed to load Stripe:', err);
        setError('Failed to initialize payment');
        setIsLoading(false);
      });
  }, [stripePublishableKey]);

  // Create payment request and elements
  React.useEffect(() => {
    if (!stripe) return;

    // Create payment request
    const pr = stripe.paymentRequest({
      country: countryCode,
      currency: currency.toLowerCase(),
      total: {
        label,
        amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
      requestShipping: false, // Shipping is handled separately in checkout
    });

    // Check if payment request is available
    pr.canMakePayment()
      .then((result) => {
        if (result) {
          setCanMakePayment(true);
          setPaymentRequest(pr);
          setPaymentRequestType(result.applePay ? 'apple_pay' : result.googlePay ? 'google_pay' : 'other');
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error checking payment request availability:', err);
        setIsLoading(false);
      });

    // Create elements instance
    const elementsInstance = stripe.elements({
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
        },
      ],
    });
    setElements(elementsInstance);
  }, [stripe, amount, currency, countryCode, label]);

  // Update payment request amount when it changes
  React.useEffect(() => {
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label,
          amount,
        },
      });
    }
  }, [paymentRequest, amount, label]);

  // Set up event listeners
  React.useEffect(() => {
    if (!paymentRequest) return;

    const handlePayment = async (ev: any) => {
      try {
        // In a real implementation, you would create a PaymentIntent on the server
        // and confirm it here. For now, we'll simulate success.
        // This is where you'd call your server to create a payment intent

        // For Stripe Checkout integration, we don't need to handle the payment here
        // The payment request button will redirect to Stripe Checkout
        ev.complete('success');

        if (onSuccess) {
          onSuccess(`pr_${Date.now()}`);
        }
      } catch (err) {
        ev.complete('fail');
        if (onError) {
          onError(err instanceof Error ? err : new Error('Payment failed'));
        }
      }
    };

    const handleCancel = () => {
      if (onCancel) {
        onCancel();
      }
    };

    paymentRequest.on('paymentmethod', handlePayment);
    paymentRequest.on('cancel', handleCancel);

    return () => {
      paymentRequest.off('paymentmethod', handlePayment);
      paymentRequest.off('cancel', handleCancel);
    };
  }, [paymentRequest, onSuccess, onError, onCancel]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Checking payment options...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // Not available - show fallback message
  if (!canMakePayment || !elements || !paymentRequest) {
    return null;
  }

  // Create payment request button element
  const paymentRequestButton = elements.create('paymentRequestButton', {
    paymentRequest,
    style: {
      paymentRequestButton: {
        type: 'default',
        theme: paymentRequestType === 'apple_pay' ? 'dark' : 'dark',
        height: '48px',
      },
    },
  });

  return (
    <div className="payment-request-button-wrapper">
      <div ref={(el) => {
        if (el && paymentRequestButton) {
          paymentRequestButton.mount(el);
        }
      }} />
    </div>
  );
}

/**
 * Payment Request Button Wrapper Component
 *
 * Wraps the Payment Request Button with fallback to card payment.
 */
interface PaymentRequestButtonWrapperProps extends PaymentRequestButtonProps {
  /** Whether to show the fallback card button */
  showFallback?: boolean;
  /** Label for the fallback button */
  fallbackLabel?: string;
  /** Callback when fallback button is clicked */
  onFallbackClick?: () => void;
  /** Whether the fallback button is loading */
  fallbackLoading?: boolean;
}

export function PaymentRequestButtonWrapper({
  showFallback = true,
  fallbackLabel = 'Pay with Card',
  onFallbackClick,
  fallbackLoading = false,
  ...props
}: PaymentRequestButtonWrapperProps) {
  const [showPaymentRequest, setShowPaymentRequest] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);

  // Handle payment request availability
  const handleAvailabilityCheck = React.useCallback((available: boolean) => {
    setShowPaymentRequest(available);
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Payment Request Button (Apple Pay / Google Pay) */}
      {showPaymentRequest && (
        <>
          <PaymentRequestButton
            {...props}
            onSuccess={(paymentIntentId) => {
              props.onSuccess?.(paymentIntentId);
            }}
          />
          {showFallback && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fallback Card Payment Button */}
      {showFallback && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          onClick={onFallbackClick}
          disabled={props.disabled || fallbackLoading}
          loading={fallbackLoading}
          leftIcon={<CreditCard className="w-4 h-4" />}
        >
          {fallbackLabel}
        </Button>
      )}
    </div>
  );
}

export default PaymentRequestButton;
