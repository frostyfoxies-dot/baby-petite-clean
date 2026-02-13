'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addToCart } from '@/actions/cart';
import { ShoppingCart, Loader2, Plus } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Product data for cart upsell
 */
export interface CartUpsellProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  images: Array<{
    url: string;
    altText: string | null;
    isPrimary: boolean;
  }>;
  variants: Array<{
    id: string;
    name: string;
    size: string;
    color: string | null;
    price: number;
    inventory: {
      available: number;
      inStock: boolean;
    } | null;
  }>;
}

/**
 * Props for CartUpsell component
 */
export interface CartUpsellProps {
  /**
   * Product IDs currently in cart (to exclude)
   */
  cartProductIds: string[];
  /**
   * Category IDs from cart items (for recommendations)
   */
  categoryIds?: string[];
  /**
   * Number of products to show
   * @default 3
   */
  limit?: number;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Callback when product is added to cart
   */
  onAddToCart?: () => void;
}

// ============================================================================
// HOOK FOR CART UPSELL
// ============================================================================

/**
 * Hook to fetch cart-based recommendations
 */
function useCartUpsell(
  cartProductIds: string[],
  categoryIds: string[],
  limit: number
) {
  const [products, setProducts] = React.useState<CartUpsellProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRecommendations = React.useCallback(async () => {
    if (cartProductIds.length === 0) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the first product in cart to get recommendations
      // In a real app, you'd have a dedicated cart recommendations endpoint
      const response = await fetch(
        `/api/recommendations/cart?productIds=${cartProductIds.join(',')}&categoryIds=${categoryIds.join(',')}&limit=${limit}`
      );

      if (!response.ok) {
        // Fallback: try to get popular products
        const fallbackResponse = await fetch(
          `/api/products?limit=${limit}&sort=popularity`
        );
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const filteredProducts = (data.products || [])
            .filter((p: any) => !cartProductIds.includes(p.id))
            .slice(0, limit);
          setProducts(filteredProducts);
        } else {
          throw new Error('Failed to fetch recommendations');
        }
      } else {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [cartProductIds.join(','), categoryIds.join(','), limit]);

  React.useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { products, isLoading, error, refetch: fetchRecommendations };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function CartUpsellSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
          <Skeleton className="aspect-square w-full rounded-md mb-2" />
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Cart Upsell component
 *
 * Shows recommended products on the cart page based on cart contents.
 * Displays in a horizontal grid layout.
 *
 * @example
 * ```tsx
 * <CartUpsell
 *   cartProductIds={['prod1', 'prod2']}
 *   categoryIds={['cat1']}
 *   onAddToCart={() => refreshCart()}
 * />
 * ```
 */
export function CartUpsell({
  cartProductIds,
  categoryIds = [],
  limit = 3,
  className,
  onAddToCart,
}: CartUpsellProps) {
  const toast = useToast();
  const { products, isLoading, error } = useCartUpsell(
    cartProductIds,
    categoryIds,
    limit
  );

  // Track which product is being added
  const [addingProductId, setAddingProductId] = React.useState<string | null>(null);

  // Handle quick add
  const handleQuickAdd = React.useCallback(
    async (product: CartUpsellProduct) => {
      // Get first available variant
      const variant = product.variants.find(
        (v) => v.inventory?.inStock
      ) || product.variants[0];

      if (!variant) {
        toast.error('This product is not available');
        return;
      }

      setAddingProductId(product.id);

      try {
        const result = await addToCart({
          variantId: variant.id,
          quantity: 1,
        });

        if (result.success) {
          toast.success(`${product.name} added to cart`, {
            title: 'Added to Cart',
          });
          onAddToCart?.();
        } else {
          toast.error(result.error || 'Failed to add to cart');
        }
      } catch (err) {
        toast.error('An unexpected error occurred');
      } finally {
        setAddingProductId(null);
      }
    },
    [toast, onAddToCart]
  );

  // Loading state
  if (isLoading) {
    return (
      <section className={cn('py-6', className)}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          You Might Also Like
        </h3>
        <CartUpsellSkeleton />
      </section>
    );
  }

  // Error or no products state
  if (error || products.length === 0) {
    return null;
  }

  return (
    <section
      className={cn('py-6 border-t border-gray-200', className)}
      aria-labelledby="cart-upsell-heading"
    >
      <h3
        id="cart-upsell-heading"
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        You Might Also Like
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product) => {
          const primaryImage =
            product.images.find((img) => img.isPrimary) || product.images[0];
          const inStock = product.variants.some(
            (v) => v.inventory?.inStock
          );
          const isAdding = addingProductId === product.id;

          return (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden group"
            >
              {/* Product image */}
              <Link
                href={`/products/${product.slug}`}
                className="relative aspect-square block bg-gray-50"
              >
                <Image
                  src={primaryImage?.url || '/images/placeholder.jpg'}
                  alt={primaryImage?.altText || product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Quick add button overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={!inStock || isAdding}
                    onClick={(e) => {
                      e.preventDefault();
                      handleQuickAdd(product);
                    }}
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>

                {/* Sale badge */}
                {product.compareAtPrice && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                    Sale
                  </div>
                )}
              </Link>

              {/* Product info */}
              <div className="p-3">
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm font-medium text-gray-900 hover:text-gray-600 line-clamp-2"
                >
                  {product.name}
                </Link>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(product.basePrice)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Mobile add button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 md:hidden"
                  disabled={!inStock || isAdding}
                  onClick={() => handleQuickAdd(product)}
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
