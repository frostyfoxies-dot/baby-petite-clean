'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Check, Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

/**
 * Registry item status type
 */
export type RegistryItemStatus = 'available' | 'purchased' | 'reserved';

/**
 * Registry item data type
 */
export interface RegistryItemData {
  /**
   * Item ID
   */
  id: string;
  /**
   * Product ID
   */
  productId: string;
  /**
   * Product name
   */
  productName: string;
  /**
   * Product slug
   */
  productSlug: string;
  /**
   * Product image
   */
  productImage: string;
  /**
   * Variant name (e.g., size/color)
   */
  variantName?: string;
  /**
   * Price
   */
  price: number;
  /**
   * Quantity requested
   */
  quantity: number;
  /**
   * Quantity purchased
   */
  quantityPurchased: number;
  /**
   * Item status
   */
  status: RegistryItemStatus;
  /**
   * Purchaser name (if purchased)
   */
  purchaserName?: string;
  /**
   * Purchase date (if purchased)
   */
  purchaseDate?: Date | string;
  /**
   * Priority level
   */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Registry item component props
 */
export interface RegistryItemProps {
  /**
   * Registry item data
   */
  item: RegistryItemData;
  /**
   * Callback when add to cart is clicked
   */
  onAddToCart?: (itemId: string) => void;
  /**
   * Callback when remove is clicked (owner only)
   */
  onRemove?: (itemId: string) => void;
  /**
   * Whether the user is the registry owner
   */
  isOwner?: boolean;
  /**
   * Whether to show purchaser info
   * @default true
   */
  showPurchaserInfo?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Compact registry item with purchase status
 * 
 * @example
 * ```tsx
 * <RegistryItem
 *   item={registryItem}
 *   onAddToCart={(itemId) => addToCart(itemId)}
 *   isOwner={false}
 * />
 * ```
 */
export function RegistryItem({
  item,
  onAddToCart,
  onRemove,
  isOwner = false,
  showPurchaserInfo = true,
  className,
}: RegistryItemProps) {
  const [imageError, setImageError] = React.useState(false);

  const isFullyPurchased = item.quantityPurchased >= item.quantity;
  const remainingQuantity = item.quantity - item.quantityPurchased;
  const isAvailable = item.status === 'available' && remainingQuantity > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(item.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    onRemove?.(item.id);
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'purchased':
        return <Badge variant="success">Purchased</Badge>;
      case 'reserved':
        return <Badge variant="warning">Reserved</Badge>;
      default:
        return <Badge variant="default">Available</Badge>;
    }
  };

  const getPriorityBadge = () => {
    if (!item.priority) return null;
    const colors = {
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      low: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return (
      <Badge variant="default" className={colors[item.priority]}>
        {item.priority} priority
      </Badge>
    );
  };

  return (
    <Link
      href={`/products/${item.productSlug}`}
      className={cn(
        'group block',
        className
      )}
    >
      <div className="flex gap-3 p-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors">
        {/* Product image */}
        <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-md overflow-hidden">
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
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Name and badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                {item.productName}
              </h3>
              {item.variantName && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.variantName}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {getStatusBadge()}
              {getPriorityBadge()}
            </div>
          </div>

          {/* Quantity and price */}
          <div className="mt-auto pt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {isFullyPurchased ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  All {item.quantity} purchased
                </span>
              ) : (
                <span>
                  {remainingQuantity} of {item.quantity} remaining
                </span>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(item.price)}
            </span>
          </div>

          {/* Purchaser info */}
          {showPurchaserInfo && item.purchaserName && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <Gift className="w-3 h-3 inline mr-1" />
                Gifted by {item.purchaserName}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex gap-2">
            {isAvailable && onAddToCart && (
              <Button
                size="sm"
                fullWidth
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            )}
            {isOwner && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
