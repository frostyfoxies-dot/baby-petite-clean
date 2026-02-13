'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, Tag } from 'lucide-react';
import type { FrequentlyBoughtProduct } from '@/hooks/use-frequently-bought';
import { calculateTotalPrice, calculateBundleSavings } from '@/hooks/use-frequently-bought';

// ============================================================================
// TYPES
// ============================================================================

export interface BundleSummaryProps {
  /**
   * All products in the bundle (including main product)
   */
  products: FrequentlyBoughtProduct[];
  /**
   * IDs of selected products
   */
  selectedIds: Set<string>;
  /**
   * Bundle discount percentage (0 = no discount)
   * @default 0
   */
  discountPercent?: number;
  /**
   * Callback when add to cart is clicked
   */
  onAddToCart: () => Promise<void>;
  /**
   * Whether the add to cart action is in progress
   */
  isAddingToCart?: boolean;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Whether to show compact layout
   * @default false
   */
  compact?: boolean;
  /**
   * Custom button text
   */
  buttonText?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Bundle summary component showing total price and add to cart button
 *
 * @example
 * ```tsx
 * <BundleSummary
 *   products={products}
 *   selectedIds={selectedIds}
 *   discountPercent={10}
 *   onAddToCart={handleAddToCart}
 * />
 * ```
 */
export const BundleSummary = React.memo(function BundleSummary({
  products,
  selectedIds,
  discountPercent = 0,
  onAddToCart,
  isAddingToCart = false,
  className,
  compact = false,
  buttonText,
}: BundleSummaryProps) {
  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  // Calculate prices
  const totalPrice = calculateTotalPrice(products, selectedIds);
  const savings = calculateBundleSavings(products, selectedIds, discountPercent);
  const finalPrice = totalPrice - savings;

  // Get selected products for display
  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  if (!hasSelection) {
    return (
      <div
        className={cn(
          'p-4 bg-gray-50 rounded-lg text-center',
          className
        )}
      >
        <p className="text-sm text-gray-500">
          Select products to add to your cart
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 bg-gray-50 rounded-lg',
        className
      )}
    >
      {/* Selected items summary */}
      {!compact && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Selected Items ({selectedCount})
          </h4>
          <ul className="space-y-1">
            {selectedProducts.map((product) => (
              <li
                key={product.id}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-600 truncate max-w-[60%]">
                  {product.name}
                </span>
                <span className="text-gray-900 font-medium">
                  {formatPrice(product.basePrice)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price breakdown */}
      <div className="space-y-2 border-t border-gray-200 pt-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(totalPrice)}</span>
        </div>

        {/* Bundle discount */}
        {savings > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <Tag className="w-3 h-3" />
              Bundle Discount ({discountPercent}%)
            </span>
            <span className="text-green-600 font-medium">
              -{formatPrice(savings)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <div className="text-right">
            {savings > 0 && (
              <span className="text-sm text-gray-400 line-through mr-2">
                {formatPrice(totalPrice)}
              </span>
            )}
            <span className="text-gray-900">{formatPrice(finalPrice)}</span>
          </div>
        </div>

        {/* Savings callout */}
        {savings > 0 && (
          <div className="bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded text-center">
            You save {formatPrice(savings)} with this bundle!
          </div>
        )}
      </div>

      {/* Add to cart button */}
      <Button
        onClick={onAddToCart}
        disabled={isAddingToCart || !hasSelection}
        className={cn(
          'w-full mt-4',
          compact ? 'h-10' : 'h-12'
        )}
        size={compact ? 'md' : 'lg'}
      >
        {isAddingToCart ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {buttonText || `Add ${selectedCount} Item${selectedCount !== 1 ? 's' : ''} to Cart`}
          </>
        )}
      </Button>

      {/* Trust badges */}
      {!compact && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>Free shipping over $50</span>
          <span>•</span>
          <span>30-day returns</span>
        </div>
      )}
    </div>
  );
});
