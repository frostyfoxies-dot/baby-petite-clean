'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Heart, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils';
import { StockBadgeCompact } from '@/components/product/stock-indicator';

/**
 * Product variant type
 */
export interface ProductVariant {
  /**
   * Variant ID
   */
  id: string;
  /**
   * Variant name (e.g., size/color)
   */
  name: string;
  /**
   * Price override (optional)
   */
  price?: number;
  /**
   * Sale price override (optional)
   */
  salePrice?: number;
  /**
   * Stock quantity
   */
  stock: number;
}

/**
 * Product type
 */
export interface Product {
  /**
   * Product ID
   */
  id: string;
  /**
   * Product name
   */
  name: string;
  /**
   * Product slug for URL
   */
  slug: string;
  /**
   * Product description
   */
  description?: string;
  /**
   * Product images
   */
  images: Array<{
    url: string;
    alt?: string;
  }>;
  /**
   * Base price
   */
  price: number;
  /**
   * Sale price (optional)
   */
  salePrice?: number;
  /**
   * Product variants
   */
  variants?: ProductVariant[];
  /**
   * Average rating (0-5)
   */
  rating?: number;
  /**
   * Number of reviews
   */
  reviewCount?: number;
  /**
   * Whether product is new
   */
  isNew?: boolean;
  /**
   * Whether product is on sale
   */
  isOnSale?: boolean;
  /**
   * Whether product is out of stock
   */
  isOutOfStock?: boolean;
  /**
   * Category name
   */
  category?: string;
}

/**
 * Product card component props
 */
export interface ProductCardProps {
  /**
   * Product data
   */
  product: Product;
  /**
   * Selected variant (optional)
   */
  variant?: ProductVariant;
  /**
   * Callback when quick add is clicked
   */
  onQuickAdd?: (variantId: string) => void;
  /**
   * Callback when wishlist is toggled
   */
  onWishlist?: (productId: string) => void;
  /**
   * Whether product is wishlisted
   */
  isWishlisted?: boolean;
  /**
   * Whether to show quick add button
   * @default true
   */
  showQuickAdd?: boolean;
  /**
   * Whether to show wishlist button
   * @default true
   */
  showWishlist?: boolean;
  /**
   * Whether to show rating
   * @default true
   */
  showRating?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Product card with image, name, price, and add to cart
 * High-density grid layout
 * 
 * @example
 * ```tsx
 * <ProductCard
 *   product={product}
 *   onQuickAdd={(variantId) => addToCart(variantId)}
 *   onWishlist={(productId) => toggleWishlist(productId)}
 *   isWishlisted={isWishlisted}
 * />
 * ```
 */
export function ProductCard({
  product,
  variant,
  onQuickAdd,
  onWishlist,
  isWishlisted = false,
  showQuickAdd = true,
  showWishlist = true,
  showRating = true,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const displayPrice = variant?.price || product.price;
  const displaySalePrice = variant?.salePrice || product.salePrice;
  const isOnSale = displaySalePrice !== undefined && displaySalePrice < displayPrice;
  const isOutOfStock = variant?.stock === 0 || product.isOutOfStock;

  const discountPercent = isOnSale
    ? calculateDiscountPercentage(displayPrice, displaySalePrice)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variantId = variant?.id || product.variants?.[0]?.id || product.id;
    onQuickAdd?.(variantId);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWishlist?.(product.id);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group block',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-md">
        {/* Product image */}
        {!imageError && product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            fill
            className={cn(
              'object-cover transition-transform duration-300',
              isHovered && 'scale-105'
            )}
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-sm">No image</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge variant="primary" size="sm">
              New
            </Badge>
          )}
          {isOnSale && (
            <Badge variant="error" size="sm">
              -{discountPercent}%
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" size="sm">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        {showWishlist && (
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-sm',
              'bg-white/90 hover:bg-white',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2'
            )}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={cn(
                'w-4 h-4',
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
          </button>
        )}

        {/* Quick add button */}
        {showQuickAdd && !isOutOfStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className={cn(
              'absolute bottom-0 left-0 right-0',
              'bg-yellow hover:bg-yellow-dark text-gray-900',
              'text-xs font-medium py-2.5',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            )}
            aria-label="Quick add to cart"
          >
            <span className="flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" />
              Quick Add
            </span>
          </button>
        )}
      </div>

      {/* Product info */}
      <div className="mt-2 space-y-1">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-gray-500">
            {product.category}
          </p>
        )}

        {/* Product name */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        {showRating && product.rating !== undefined && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < Math.round(product.rating!)
                      ? 'fill-yellow text-yellow'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            {product.reviewCount !== undefined && (
              <span className="text-xs text-gray-500">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          {isOnSale ? (
            <>
              <span className="text-sm font-semibold text-gray-900">
                {formatPrice(displaySalePrice)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(displayPrice)}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(displayPrice)}
            </span>
          )}
        </div>

        {/* Stock indicator */}
        {variant?.stock !== undefined && (
          <StockBadgeCompact available={variant.stock} />
        )}
      </div>
    </Link>
  );
}
