'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Empty cart component props
 */
export interface EmptyCartProps {
  /**
   * Title text
   * @default 'Your cart is empty'
   */
  title?: string;
  /**
   * Description text
   * @default 'Looks like you haven\'t added anything to your cart yet.'
   */
  description?: string;
  /**
   * Button text
   * @default 'Start Shopping'
   */
  buttonText?: string;
  /**
   * Button link
   * @default '/shop'
   */
  buttonLink?: string;
  /**
   * Callback when close is clicked
   */
  onClose?: () => void;
  /**
   * Whether to show close button
   * @default false
   */
  showCloseButton?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Empty cart state
 * 
 * @example
 * ```tsx
 * <EmptyCart
 *   onClose={() => setIsOpen(false)}
 *   showCloseButton={true}
 * />
 * ```
 */
export function EmptyCart({
  title = 'Your cart is empty',
  description = "Looks like you haven't added anything to your cart yet.",
  buttonText = 'Start Shopping',
  buttonLink = '/shop',
  onClose,
  showCloseButton = false,
  className,
}: EmptyCartProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <ShoppingBag className="w-8 h-8 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button asChild fullWidth>
          <Link href={buttonLink}>
            {buttonText}
          </Link>
        </Button>
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
