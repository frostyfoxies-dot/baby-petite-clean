'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, Gift, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Exit intent modal variant
 */
export type ExitIntentModalVariant = 'discount' | 'email_capture' | 'save_cart';

/**
 * Exit intent modal props
 */
export interface ExitIntentModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
  /**
   * Modal variant
   * @default 'discount'
   */
  variant?: ExitIntentModalVariant;
  /**
   * Discount percentage to show
   * @default 10
   */
  discountPercent?: number;
  /**
   * Callback when email is submitted
   */
  onEmailSubmit?: (email: string) => Promise<void>;
  /**
   * Callback when continue shopping is clicked
   */
  onContinueShopping?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Email validation regex - compiled once
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Get variant-specific content
 * Memoized to prevent recalculation on every render
 */
function getVariantContent(
  variant: ExitIntentModalVariant,
  discountPercent: number
): {
  title: string;
  description: React.ReactNode;
} {
  switch (variant) {
    case 'discount':
      return {
        title: `Wait! Get ${discountPercent}% Off`,
        description: (
          <>
            Sign up for our newsletter and get{' '}
            <span className="font-semibold text-gray-900">{discountPercent}% off</span>{' '}
            your first order plus exclusive access to sales and new arrivals.
          </>
        ),
      };
    case 'email_capture':
      return {
        title: "Don't Miss Out!",
        description: (
          <>
            Join our community for exclusive offers, early access to sales, 
            and personalized recommendations.
          </>
        ),
      };
    case 'save_cart':
      return {
        title: 'Save Your Cart',
        description: (
          <>
            Enter your email to save your cart and receive a{' '}
            <span className="font-semibold text-gray-900">{discountPercent}% discount</span>{' '}
            code for your next visit.
          </>
        ),
      };
    default:
      return {
        title: `Wait! Get ${discountPercent}% Off`,
        description: (
          <>
            Sign up for our newsletter and get{' '}
            <span className="font-semibold text-gray-900">{discountPercent}% off</span>{' '}
            your first order.
          </>
        ),
      };
  }
}

/**
 * Exit intent modal component
 * Displays a modal when exit intent is detected to capture email or offer discount
 * 
 * Performance optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - useCallback for all event handlers
 * - useMemo for expensive calculations
 * - Passive event listeners where possible
 * - Proper cleanup of event listeners
 * - CSS transforms for GPU-accelerated animations
 * 
 * @example
 * ```tsx
 * <ExitIntentModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   variant="discount"
 *   discountPercent={10}
 *   onEmailSubmit={async (email) => console.log(email)}
 * />
 * ```
 */
const ExitIntentModal = React.memo(function ExitIntentModal({
  isOpen,
  onClose,
  variant = 'discount',
  discountPercent = 10,
  onEmailSubmit,
  onContinueShopping,
  className,
}: ExitIntentModalProps) {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Memoize variant content to prevent recalculation
  const variantContent = React.useMemo(
    () => getVariantContent(variant, discountPercent),
    [variant, discountPercent]
  );

  // Memoize button text
  const buttonText = React.useMemo(
    () => (isSubmitting ? 'Signing Up...' : `Get My ${discountPercent}% Off`),
    [isSubmitting, discountPercent]
  );

  // Handle focus trap and initial focus
  React.useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    // Focus the close button when modal opens
    // Use requestAnimationFrame for better timing
    const rafId = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    // Handle focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleTab, { passive: false });
    
    return () => {
      document.removeEventListener('keydown', handleTab);
      cancelAnimationFrame(rafId);
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Handle escape key - memoized callback
  const handleEscape = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Handle click outside - memoized callback
  const handleBackdropClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle email change - memoized callback
  const handleEmailChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      // Clear error when user starts typing
      if (error) setError(null);
    },
    [error]
  );

  // Handle form submission - memoized callback
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }

      if (!EMAIL_REGEX.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await onEmailSubmit?.(email);
        setIsSuccess(true);
        setEmail('');
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, onEmailSubmit]
  );

  // Handle continue shopping - memoized callback
  const handleContinueShopping = React.useCallback(() => {
    onClose();
    onContinueShopping?.();
  }, [onClose, onContinueShopping]);

  // Handle close button click - memoized callback
  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  // Don't render if not open - early return for performance
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        // Use GPU-accelerated animations with CSS transforms
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-md mx-4',
          'bg-white rounded-2xl shadow-2xl',
          // Use GPU-accelerated transforms for smooth animations
          'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-4 motion-safe:duration-300',
          // Use will-change sparingly for animations
          'motion-safe:will-change-[transform,opacity]',
          className
        )}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-full',
            'text-gray-400 hover:text-gray-600',
            'hover:bg-gray-100 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
          )}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {isSuccess ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-green-600" aria-hidden="true" />
              </div>
              <h2
                id="exit-intent-title"
                className="text-2xl font-bold text-gray-900"
              >
                You're All Set!
              </h2>
              <p className="text-gray-600">
                Check your inbox for your exclusive discount code.
              </p>
              <Button
                onClick={handleContinueShopping}
                fullWidth
                size="lg"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            // Default state
            <>
              {/* Header */}
              <div className="text-center space-y-3 mb-6">
                <div className="w-16 h-16 mx-auto bg-yellow/20 rounded-full flex items-center justify-center">
                  <Gift className="w-8 h-8 text-yellow-600" aria-hidden="true" />
                </div>
                <h2
                  id="exit-intent-title"
                  className="text-2xl font-bold text-gray-900"
                >
                  {variantContent.title}
                </h2>
                <p className="text-gray-600">
                  {variantContent.description}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label htmlFor="exit-email" className="sr-only">
                    Email address
                  </label>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <Input
                    id="exit-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className="pl-10"
                    aria-describedby={error ? 'email-error' : 'email-hint'}
                    autoComplete="email"
                  />
                </div>

                <p id="email-hint" className="sr-only">
                  Enter your email to receive your discount code
                </p>

                {error && (
                  <p id="email-error" className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                >
                  {buttonText}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleContinueShopping}
                  className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
                >
                  No thanks, I'll pay full price
                </button>
              </div>

              {/* Trust badges */}
              <p className="mt-4 text-xs text-center text-gray-400">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default ExitIntentModal;
export { ExitIntentModal };
export type { ExitIntentModalProps, ExitIntentModalVariant };
