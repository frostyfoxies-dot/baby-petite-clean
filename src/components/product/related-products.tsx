'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard, type Product } from './product-card';

/**
 * Related products component props
 */
export interface RelatedProductsProps {
  /**
   * Related products list
   */
  products: Product[];
  /**
   * Section title
   * @default 'You May Also Like'
   */
  title?: string;
  /**
   * Number of products to show per view
   * @default 4
   */
  itemsPerView?: number;
  /**
   * Whether to show navigation arrows
   * @default true
   */
  showNavigation?: boolean;
  /**
   * Callback when quick add is clicked
   */
  onQuickAdd?: (variantId: string) => void;
  /**
   * Callback when wishlist is toggled
   */
  onWishlist?: (productId: string) => void;
  /**
   * Set of wishlisted product IDs
   */
  wishlistedIds?: Set<string>;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Related products carousel
 * 
 * @example
 * ```tsx
 * <RelatedProducts
 *   products={relatedProducts}
 *   title="You May Also Like"
 *   onQuickAdd={(variantId) => addToCart(variantId)}
 *   onWishlist={(productId) => toggleWishlist(productId)}
 *   wishlistedIds={wishlistedIds}
 * />
 * ```
 */
export function RelatedProducts({
  products,
  title = 'You May Also Like',
  itemsPerView = 4,
  showNavigation = true,
  onQuickAdd,
  onWishlist,
  wishlistedIds = new Set(),
  className,
}: RelatedProductsProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const maxIndex = Math.max(0, products.length - itemsPerView);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Reset index when products change
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [products.length, itemsPerView]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {title}
        </h2>
        {showNavigation && products.length > itemsPerView && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              aria-label="Previous products"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === maxIndex}
              aria-label="Next products"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Products carousel */}
      <div className="relative">
        <div
          ref={containerRef}
          className="overflow-hidden"
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                <ProductCard
                  product={product}
                  onQuickAdd={onQuickAdd}
                  onWishlist={onWishlist}
                  isWishlisted={wishlistedIds.has(product.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlays for scroll indication */}
        {currentIndex > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        )}
        {currentIndex < maxIndex && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}

/**
 * Related products grid (alternative to carousel)
 */
export interface RelatedProductsGridProps {
  /**
   * Related products list
   */
  products: Product[];
  /**
   * Section title
   * @default 'You May Also Like'
   */
  title?: string;
  /**
   * Number of columns
   * @default 4
   */
  columns?: 2 | 3 | 4 | 5 | 6;
  /**
   * Callback when quick add is clicked
   */
  onQuickAdd?: (variantId: string) => void;
  /**
   * Callback when wishlist is toggled
   */
  onWishlist?: (productId: string) => void;
  /**
   * Set of wishlisted product IDs
   */
  wishlistedIds?: Set<string>;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Related products in a grid layout
 */
export function RelatedProductsGrid({
  products,
  title = 'You May Also Like',
  columns = 4,
  onQuickAdd,
  onWishlist,
  wishlistedIds = new Set(),
  className,
}: RelatedProductsGridProps) {
  const columnStyles: Record<NonNullable<RelatedProductsGridProps['columns']>, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <h2 className="text-xl font-semibold text-gray-900">
        {title}
      </h2>

      {/* Products grid */}
      <div className={cn(
        'grid gap-3',
        columnStyles[columns]
      )}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickAdd={onQuickAdd}
            onWishlist={onWishlist}
            isWishlisted={wishlistedIds.has(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
