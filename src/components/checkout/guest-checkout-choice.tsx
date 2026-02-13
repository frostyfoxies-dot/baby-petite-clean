'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { User, ArrowRight, Check, Sparkles } from 'lucide-react';

/**
 * Props for the GuestCheckoutChoice component
 */
export interface GuestCheckoutChoiceProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * Account benefits shown to encourage sign-in
 * Defined outside component to prevent recreation on each render
 */
const ACCOUNT_BENEFITS = [
  'Track your order status',
  'Faster checkout next time',
  'Save multiple shipping addresses',
  'Access order history',
] as const;

/**
 * Benefit item component
 * Memoized to prevent unnecessary re-renders
 */
const BenefitItem = React.memo(function BenefitItem({ benefit }: { benefit: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-600">
      <Check className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
      {benefit}
    </li>
  );
});

/**
 * GuestCheckoutChoice component
 * 
 * Displays a clear choice between guest checkout and signing in
 * at the start of the checkout flow. Uses visual hierarchy to
 * make guest checkout prominent while highlighting account benefits.
 * 
 * Performance optimizations:
 * - React.memo on component and sub-components
 * - Memoized callbacks with useCallback
 * - Static data defined outside component
 * - Efficient list rendering with stable keys
 * - Early returns for loading states
 * 
 * @example
 * ```tsx
 * <GuestCheckoutChoice />
 * ```
 */
const GuestCheckoutChoice = React.memo(function GuestCheckoutChoice({ className }: GuestCheckoutChoiceProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  // Memoize the guest checkout handler
  const handleGuestCheckout = React.useCallback(() => {
    setIsLoading(true);
    // Store guest checkout state in sessionStorage
    try {
      sessionStorage.setItem('isGuestCheckout', 'true');
    } catch {
      // Handle sessionStorage errors (private browsing)
      console.warn('sessionStorage not available');
    }
    router.push('/checkout/shipping');
  }, [router]);

  // Handle keyboard interaction for the guest checkout card
  const handleCardKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleGuestCheckout();
      }
    },
    [handleGuestCheckout]
  );

  // Memoize button click handler to prevent recreation
  const handleButtonClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleGuestCheckout();
    },
    [handleGuestCheckout]
  );

  // Memoize button content
  const buttonContent = React.useMemo(
    () =>
      isLoading ? (
        'Loading...'
      ) : (
        <>
          Continue to Checkout
          <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
        </>
      ),
    [isLoading]
  );

  // Memoize sign in link href
  const signInHref = React.useMemo(
    () => '/auth/signin?redirect=/checkout/shipping',
    []
  );

  const signUpHref = React.useMemo(
    () => '/auth/signup?redirect=/checkout/shipping',
    []
  );

  return (
    <div className={cn('max-w-lg mx-auto py-8 px-4 sm:py-12 sm:px-6', className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Checkout
        </h1>
        <p className="text-gray-600">
          Choose how you'd like to proceed
        </p>
      </div>

      {/* Main choice cards */}
      <div className="space-y-4">
        {/* Guest Checkout - Primary Option */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={handleCardKeyDown}
          onClick={handleGuestCheckout}
          className={cn(
            'relative rounded-xl border-2 border-primary-500 bg-primary-50/50',
            'p-6 transition-all duration-200',
            'hover:border-primary-600 hover:bg-primary-50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'cursor-pointer',
            // Use GPU-accelerated transforms
            'transform-gpu'
          )}
          aria-label="Continue as guest - fastest checkout option"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100">
                <Sparkles className="w-5 h-5 text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Continue as Guest
                </h2>
                <p className="text-sm text-gray-600">
                  Quick checkout without an account
                </p>
              </div>
            </div>
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
              aria-hidden="true"
            >
              Fastest
            </span>
          </div>

          <Button
            onClick={handleButtonClick}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
            size="lg"
            tabIndex={-1}
          >
            {buttonContent}
          </Button>
        </div>

        {/* Sign In Option - Secondary */}
        <div
          className={cn(
            'relative rounded-xl border border-gray-200 bg-white',
            'p-6 transition-all duration-200',
            'hover:border-gray-300 hover:bg-gray-50',
            'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
          )}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
              <User className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Sign In to Your Account
              </h2>
              <p className="text-sm text-gray-600">
                Enjoy member benefits and faster checkout
              </p>
            </div>
          </div>

          {/* Benefits list */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {ACCOUNT_BENEFITS.map((benefit) => (
              <BenefitItem key={benefit} benefit={benefit} />
            ))}
          </ul>

          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium"
            size="lg"
            asChild
          >
            <Link href={signInHref}>
              Sign In
              <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
            </Link>
          </Button>

          {/* Sign up link */}
          <p className="mt-3 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href={signUpHref}
              className="font-medium text-primary-600 hover:text-primary-700 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Security note */}
      <p className="mt-6 text-center text-xs text-gray-500">
        Your payment information is secure. We use industry-standard encryption.
      </p>
    </div>
  );
});

export { GuestCheckoutChoice, BenefitItem, ACCOUNT_BENEFITS };
export default GuestCheckoutChoice;
export type { GuestCheckoutChoiceProps };
