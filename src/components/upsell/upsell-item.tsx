'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import type { FrequentlyBoughtProduct } from '@/hooks/use-frequently-bought';
import { getPrimaryImage, getFirstAvailableVariant } from '@/hooks/use-frequently-bought';

// ============================================================================
// TYPES
// ============================================================================

export interface UpsellItemProps {
  /**
   * Product data
   */
  product: FrequentlyBoughtProduct;
  /**
   * Whether this product is selected
   */
  isSelected: boolean;
  /**
   * Callback when selection changes
   */
  onSelectionChange: (productId: string, selected: boolean) => void;
  /**
   * Whether to show the checkbox
   * @default true
   */
  showCheckbox?: boolean;
  /**
   * Whether this is the main product (not selectable)
   * @default false
   */
  isMainProduct?: boolean;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Whether to show compact layout
   * @default false
   */
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Individual product item for the frequently bought together component
 * Displays product image, name, price, and selection checkbox
 *
 * @example
 * ```tsx
 * <UpsellItem
 *   product={product}
 *   isSelected={selectedIds.has(product.id)}
 *   onSelectionChange={handleSelectionChange}
 * />
 * ```
 */
export const UpsellItem = React.memo(function UpsellItem({
  product,
  isSelected,
  onSelectionChange,
  showCheckbox = true,
  isMainProduct = false,
  className,
  compact = false,
}: UpsellItemProps) {
  const primaryImage = getPrimaryImage(product);
  const variant = getFirstAvailableVariant(product);
  const inStock = variant?.inventory?.inStock ?? false;

  const handleCheckboxChange = React.useCallback(
    (checked: boolean) => {
      onSelectionChange(product.id, checked);
    },
    [product.id, onSelectionChange]
  );

  // Calculate display price
  const displayPrice = product.compareAtPrice || product.basePrice;
  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > product.basePrice;

  return (
    <div
      className={cn(
        'relative group',
        !isMainProduct && !inStock && 'opacity-50',
        className
      )}
    >
      <div
        className={cn(
          'flex gap-3 p-3 rounded-lg transition-all duration-200',
          isSelected && !isMainProduct && 'bg-yellow/5 ring-1 ring-yellow',
          !isSelected && !isMainProduct && 'hover:bg-gray-50',
          isMainProduct && 'bg-gray-50'
        )}
      >
        {/* Checkbox */}
        {showCheckbox && !isMainProduct && (
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={isSelected}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              disabled={!inStock}
              aria-label={`Select ${product.name}`}
              size={compact ? 'sm' : 'md'}
            />
          </div>
        )}

        {/* Product image */}
        <div
          className={cn(
            'relative flex-shrink-0 overflow-hidden rounded-md bg-gray-100',
            compact ? 'w-16 h-16' : 'w-20 h-20 md:w-24 md:h-24'
          )}
        >
          <Link href={`/products/${product.slug}`}>
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              fill
              sizes="(max-width: 768px) 80px, 96px"
              className={cn(
                'object-cover transition-transform duration-200',
                'group-hover:scale-105'
              )}
            />
          </Link>

          {/* Main product badge */}
          {isMainProduct && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow text-xs font-medium text-gray-900 rounded">
              Main
            </div>
          )}

          {/* Out of stock overlay */}
          {!inStock && !isMainProduct && (
            <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
              <span className="text-xs font-medium text-white bg-gray-900/70 px-2 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${product.slug}`}
            className={cn(
              'font-medium text-gray-900 hover:text-gray-600 transition-colors line-clamp-2',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {product.name}
          </Link>

          {/* Category */}
          {!compact && (
            <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
          )}

          {/* Variant info */}
          {variant && (
            <p className="text-xs text-gray-400 mt-0.5">
              {variant.color ? `${variant.color} / ` : ''}
              {variant.size}
            </p>
          )}

          {/* Price */}
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                'font-semibold text-gray-900',
                compact ? 'text-sm' : 'text-base'
              )}
            >
              {formatPrice(product.basePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(displayPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selection indicator for accessibility */}
      {isSelected && !isMainProduct && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 bg-yellow rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            className="w-3 h-3 text-gray-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
});
