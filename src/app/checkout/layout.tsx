import { ReactNode } from 'react';
import Link from 'next/link';
import { CheckoutSteps } from '@/components/checkout/checkout-steps';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { CheckoutProvider } from '@/context/checkout-context';

/**
 * Checkout layout component
 */
export default function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  const steps = [
    { id: 'shipping', title: 'Shipping' },
    { id: 'payment', title: 'Payment' },
    { id: 'review', title: 'Review' },
  ];

  // Determine current step based on path
  const getCurrentStep = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/shipping')) return 0;
      if (path.includes('/payment')) return 1;
      if (path.includes('/review')) return 2;
    }
    return 0;
  };

  const currentStep = getCurrentStep();

  return (
    <CheckoutProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/cart">
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Cart
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout steps */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <CheckoutSteps
              steps={steps}
              currentStep={currentStep}
              completedSteps={currentStep > 0 ? [0] : []}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </CheckoutProvider>
  );
}
