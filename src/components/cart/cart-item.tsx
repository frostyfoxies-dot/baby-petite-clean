'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { X, Plus, Minus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { CartItemData } from './cart-drawer';

/**
 * Cart item component props
 */
export interface CartItemProps {
  /**
   * Cart item data
   */
  item: CartItemData;
  /**
   * Callback when quantity is updated
   */
  onUpdateQuantity: (quantity: number) => void;
  /**
   * Callback when item is removed
   */
  onRemove: () => void;
  /**
   * Whether the item is being updated
   */
  isUpdating?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Cart item with quantity controls
 * 
 * @example
 * ```tsx
 * <CartItem
 *   item={cartItem}
 *   onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
 *   onRemove={() => removeItem(item.id)}
 * />
 * ```
 */
export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
  className,
}: CartItemProps) {
  const [imageError, setImageError] = React.useState(false);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    const maxQuantity = item.maxQuantity || 99;
    if (newQuantity <= maxQuantity) {
      onUpdateQuantity(newQuantity);
    }
  };

  const displayPrice = item.salePrice || item.price;
  const isOnSale = item.salePrice !== undefined && item.salePrice < item.price;

  return (
    <div
      className={cn(
        'flex gap-3 p-3 bg-gray-50 rounded-md',
        className
      )}
    >
      {/* Product image */}
      <Link
        href={`/products/${item.productSlug}`}
        className="flex-shrink-0 w-20 h-20 bg-white rounded-md overflow-hidden border border-gray-200"
      >
        {!imageError ? (
          <Image
            src={item.productImage}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="80px"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-xs">No image</span>
          </div>
        )}
      </Link>

      {/* Item details */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Product name and remove button */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.productSlug}`}
            className="flex-1 min-w-0"
          >
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:underline">
              {item.productName}
            </h3>
            {item.variantName && (
              <p className="text-xs text-gray-500 mt-0.5">
                {item.variantName}
              </p>
            )}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            disabled={isUpdating}
            className={cn(
              'flex-shrink-0 p-1 rounded-sm',
              'text-gray-400 hover:text-gray-600',
              'hover:bg-gray-200',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Remove item"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2">
          {isOnSale ? (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {formatPrice(displayPrice)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(item.price)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(displayPrice)}
            </span>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-200 rounded-md bg-white">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={item.quantity <= 1 || isUpdating}
              className={cn(
                'px-2 py-1 text-gray-600 hover:bg-gray-50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={
                (item.maxQuantity !== undefined && item.quantity >= item.maxQuantity) ||
                isUpdating
              }
              className={cn(
                'px-2 py-1 text-gray-600 hover:bg-gray-50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Item total */}
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(displayPrice * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
