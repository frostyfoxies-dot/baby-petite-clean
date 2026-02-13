'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { CartItemData, CartSummaryData } from '../cart/cart-drawer';

/**
 * Order summary component props
 */
export interface OrderSummaryProps {
  /**
   * Cart items
   */
  items: CartItemData[];
  /**
   * Cart summary
   */
  summary: CartSummaryData;
  /**
   * Shipping address (optional)
   */
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /**
   * Shipping method (optional)
   */
  shippingMethod?: {
    name: string;
    estimatedDays?: string;
  };
  /**
   * Whether to show shipping info
   * @default true
   */
  showShippingInfo?: boolean;
  /**
   * Whether to show promo code input
   * @default false
   */
  showPromoCode?: boolean;
  /**
   * Callback when promo code is applied
   */
  onApplyPromoCode?: (code: string) => void;
  /**
   * Promo code error message
   */
  promoCodeError?: string;
  /**
   * Applied promo code
   */
  appliedPromoCode?: string;
  /**
   * Discount amount
   */
  discountAmount?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Clean order review summary
 * 
 * @example
 * ```tsx
 * <OrderSummary
 *   items={cartItems}
 *   summary={cartSummary}
 *   shippingAddress={shippingAddress}
 *   shippingMethod={selectedShippingMethod}
 *   showPromoCode={true}
 *   onApplyPromoCode={(code) => applyPromoCode(code)}
 * />
 * ```
 */
export function OrderSummary({
  items,
  summary,
  shippingAddress,
  shippingMethod,
  showShippingInfo = true,
  showPromoCode = false,
  onApplyPromoCode,
  promoCodeError,
  appliedPromoCode,
  discountAmount,
  className,
}: OrderSummaryProps) {
  const [promoCode, setPromoCode] = React.useState('');

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim() && onApplyPromoCode) {
      onApplyPromoCode(promoCode.trim());
    }
  };

  const { subtotal, tax, shipping, total, currency } = summary;
  const finalTotal = discountAmount ? total - discountAmount : total;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Items */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Order Items ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item) => {
            const displayPrice = item.salePrice || item.price;
            return (
              <div key={item.id} className="flex gap-3">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    width={64}
                    height={64}
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
                    {formatPrice(displayPrice * item.quantity, currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Shipping info */}
      {showShippingInfo && shippingAddress && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Shipping Address
          </h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">{shippingAddress.name}</p>
            <p>{shippingAddress.address}</p>
            <p>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            </p>
            <p>{shippingAddress.country}</p>
          </div>
        </div>
      )}

      {showShippingInfo && shippingMethod && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Shipping Method
          </h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">{shippingMethod.name}</p>
            {shippingMethod.estimatedDays && (
              <p className="text-xs">
                Estimated delivery: {shippingMethod.estimatedDays} business days
              </p>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Promo code */}
      {showPromoCode && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Promo Code
          </h3>
          {appliedPromoCode ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {appliedPromoCode}
                </p>
                {discountAmount && (
                  <p className="text-xs text-green-600">
                    -{formatPrice(discountAmount, currency)} discount applied
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplyPromoCode} className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
              />
              <Button type="submit" size="sm">
                Apply
              </Button>
            </form>
          )}
          {promoCodeError && (
            <p className="text-xs text-red-600 mt-1">{promoCodeError}</p>
          )}
        </div>
      )}

      <Separator />

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">
            {formatPrice(subtotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="text-gray-900">
            {formatPrice(tax, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className={cn(
            'text-gray-900',
            shipping === 0 && 'text-green-600'
          )}>
            {shipping === 0 ? 'Free' : formatPrice(shipping, currency)}
          </span>
        </div>
        {discountAmount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="text-green-600">
              -{formatPrice(discountAmount, currency)}
            </span>
          </div>
        )}
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">
            Total
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(finalTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
