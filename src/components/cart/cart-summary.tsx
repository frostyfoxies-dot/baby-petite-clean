'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { CartSummaryData } from './cart-drawer';

/**
 * Cart summary component props
 */
export interface CartSummaryProps {
  /**
   * Cart summary data
   */
  summary: CartSummaryData;
  /**
   * Whether to show tax breakdown
   * @default true
   */
  showTax?: boolean;
  /**
   * Whether to show shipping
   * @default true
   */
  showShipping?: boolean;
  /**
   * Tax label
   * @default 'Tax'
   */
  taxLabel?: string;
  /**
   * Shipping label
   * @default 'Shipping'
   */
  shippingLabel?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Minimal cart totals display
 * 
 * @example
 * ```tsx
 * <CartSummary
 *   summary={{
 *     subtotal: 99.99,
 *     tax: 8.00,
 *     shipping: 0,
 *     total: 107.99
 *   }}
 * />
 * ```
 */
export function CartSummary({
  summary,
  showTax = true,
  showShipping = true,
  taxLabel = 'Tax',
  shippingLabel = 'Shipping',
  className,
}: CartSummaryProps) {
  const { subtotal, tax, shipping, total, currency } = summary;

  return (
    <div className={cn('space-y-3', className)}>
      <Separator />

      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-900">
          {formatPrice(subtotal, currency)}
        </span>
      </div>

      {/* Tax */}
      {showTax && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{taxLabel}</span>
          <span className="text-gray-900">
            {formatPrice(tax, currency)}
          </span>
        </div>
      )}

      {/* Shipping */}
      {showShipping && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{shippingLabel}</span>
          <span className={cn(
            'text-gray-900',
            shipping === 0 && 'text-green-600'
          )}>
            {shipping === 0 ? 'Free' : formatPrice(shipping, currency)}
          </span>
        </div>
      )}

      <Separator />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900">
          Total
        </span>
        <span className="text-lg font-bold text-gray-900">
          {formatPrice(total, currency)}
        </span>
      </div>
    </div>
  );
}
