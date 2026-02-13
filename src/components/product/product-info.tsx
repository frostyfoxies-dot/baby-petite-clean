'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils';
import type { Product, ProductVariant } from './product-card';

/**
 * Product info component props
 */
export interface ProductInfoProps {
  /**
   * Product data
   */
  product: Product;
  /**
   * Selected variant
   */
  selectedVariant?: ProductVariant;
  /**
   * Callback when add to cart is clicked
   */
  onAddToCart?: (variantId: string, quantity: number) => void;
  /**
   * Callback when wishlist is toggled
   */
  onWishlist?: (productId: string) => void;
  /**
   * Whether product is wishlisted
   */
  isWishlisted?: boolean;
  /**
   * Whether product is out of stock
   */
  isOutOfStock?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Product name, price, description, and variants display
 * 
 * @example
 * ```tsx
 * <ProductInfo
 *   product={product}
 *   selectedVariant={selectedVariant}
 *   onAddToCart={(variantId, quantity) => addToCart(variantId, quantity)}
 *   onWishlist={(productId) => toggleWishlist(productId)}
 *   isWishlisted={isWishlisted}
 * />
 * ```
 */
export function ProductInfo({
  product,
  selectedVariant,
  onAddToCart,
  onWishlist,
  isWishlisted = false,
  isOutOfStock = false,
  className,
}: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);

  const displayPrice = selectedVariant?.price || product.price;
  const displaySalePrice = selectedVariant?.salePrice || product.salePrice;
  const isOnSale = displaySalePrice !== undefined && displaySalePrice < displayPrice;

  const discountPercent = isOnSale
    ? calculateDiscountPercentage(displayPrice, displaySalePrice)
    : 0;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    const variantId = selectedVariant?.id || product.variants?.[0]?.id || product.id;
    onAddToCart?.(variantId, quantity);
  };

  const handleWishlist = () => {
    onWishlist?.(product.id);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {product.isNew && (
          <Badge variant="primary">New Arrival</Badge>
        )}
        {isOnSale && (
          <Badge variant="error">-{discountPercent}% Off</Badge>
        )}
        {isOutOfStock && (
          <Badge variant="secondary">Out of Stock</Badge>
        )}
      </div>

      {/* Product name */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {product.name}
        </h1>
        {product.category && (
          <p className="text-sm text-gray-500 mt-1">
            {product.category}
          </p>
        )}
      </div>

      {/* Rating */}
      {product.rating !== undefined && (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < Math.round(product.rating!)
                    ? 'fill-yellow text-yellow'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating.toFixed(1)}
          </span>
          {product.reviewCount !== undefined && (
            <>
              <span className="text-gray-300">|</span>
              <a
                href="#reviews"
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                {product.reviewCount} reviews
              </a>
            </>
          )}
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        {isOnSale ? (
          <>
            <span className="text-3xl font-semibold text-gray-900">
              {formatPrice(displaySalePrice)}
            </span>
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(displayPrice)}
            </span>
          </>
        ) : (
          <span className="text-3xl font-semibold text-gray-900">
            {formatPrice(displayPrice)}
          </span>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Description
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      <Separator />

      {/* Quantity selector */}
      {!isOutOfStock && (
        <div>
          <label className="text-sm font-medium text-gray-900 mb-2 block">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-md">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className={cn(
                  'px-3 py-2 text-gray-600 hover:bg-gray-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-200'
                )}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-12 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!isOutOfStock ? (
          <Button
            size="lg"
            fullWidth
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            disabled
          >
            Out of Stock
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Star
            className={cn(
              'w-5 h-5',
              isWishlisted && 'fill-red-500 text-red-500'
            )}
          />
        </Button>
      </div>

      {/* Features */}
      <div className="space-y-3 pt-4">
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Free Shipping
            </p>
            <p className="text-xs text-gray-500">
              On orders over $50
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Secure Payment
            </p>
            <p className="text-xs text-gray-500">
              100% secure payment
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Easy Returns
            </p>
            <p className="text-xs text-gray-500">
              30-day return policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
