'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFrequentlyBought, getFirstAvailableVariant } from '@/hooks/use-frequently-bought';
import { UpsellItem } from './upsell-item';
import { BundleSummary } from './bundle-summary';
import { addToCart } from '@/actions/cart';
import { Package, Sparkles } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Main product data passed from the product page
 */
export interface MainProductData {
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
  category: {
    id: string;
    name: string;
    slug: string;
  };
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
 * Props for the FrequentlyBoughtTogether component
 */
export interface FrequentlyBoughtTogetherProps {
  /**
   * The main product being viewed
   */
  mainProduct: MainProductData;
  /**
   * Number of recommended products to show
   * @default 3
   */
  limit?: number;
  /**
   * Bundle discount percentage
   * @default 0
   */
  bundleDiscount?: number;
  /**
   * Whether to show the main product in the list
   * @default true
   */
  showMainProduct?: boolean;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Callback when products are added to cart
   */
  onAddToCart?: () => void;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function FrequentlyBoughtSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Products skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-gray-200">
            <div className="flex gap-3">
              <Skeleton className="w-20 h-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary skeleton */}
      <Skeleton className="h-32 w-full max-w-sm ml-auto rounded-lg" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Frequently Bought Together component
 *
 * Shows the main product plus recommended products that are frequently
 * purchased together. Allows users to select which products to add to cart.
 *
 * @example
 * ```tsx
 * <FrequentlyBoughtTogether
 *   mainProduct={product}
 *   bundleDiscount={10}
 *   onAddToCart={() => console.log('Added to cart')}
 * />
 * ```
 */
export function FrequentlyBoughtTogether({
  mainProduct,
  limit = 3,
  bundleDiscount = 0,
  showMainProduct = true,
  className,
  onAddToCart,
}: FrequentlyBoughtTogetherProps) {
  const toast = useToast();
  const { products, isLoading, error, algorithm } = useFrequentlyBought(
    mainProduct.slug,
    { limit }
  );

  // Track selected product IDs (main product is always selected if shown)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(showMainProduct ? [mainProduct.id] : [])
  );

  // Track adding to cart state
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);

  // Reset selection when products change
  React.useEffect(() => {
    const newSelectedIds = new Set<string>();
    if (showMainProduct) {
      newSelectedIds.add(mainProduct.id);
    }
    // Pre-select all recommended products
    products.forEach((p) => {
      const variant = getFirstAvailableVariant(p);
      if (variant?.inventory?.inStock) {
        newSelectedIds.add(p.id);
      }
    });
    setSelectedIds(newSelectedIds);
  }, [products, mainProduct.id, showMainProduct]);

  // Handle selection change
  const handleSelectionChange = React.useCallback(
    (productId: string, selected: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
    },
    []
  );

  // Handle add to cart
  const handleAddToCart = React.useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsAddingToCart(true);

    try {
      // Get variant IDs for selected products
      const itemsToAdd: Array<{ variantId: string; quantity: number }> = [];

      // Add main product if selected
      if (selectedIds.has(mainProduct.id)) {
        const mainVariant = getFirstAvailableVariant(mainProduct as any);
        if (mainVariant) {
          itemsToAdd.push({ variantId: mainVariant.id, quantity: 1 });
        }
      }

      // Add recommended products
      for (const product of products) {
        if (selectedIds.has(product.id)) {
          const variant = getFirstAvailableVariant(product);
          if (variant) {
            itemsToAdd.push({ variantId: variant.id, quantity: 1 });
          }
        }
      }

      // Add all items to cart
      const results = await Promise.all(
        itemsToAdd.map((item) => addToCart(item))
      );

      // Check for errors
      const errors = results.filter((r) => !r.success);
      if (errors.length > 0) {
        toast.error(
          errors[0].error || 'Failed to add some items to cart',
          { title: 'Error' }
        );
      } else {
        toast.success(
          `Added ${itemsToAdd.length} item${itemsToAdd.length !== 1 ? 's' : ''} to your cart`,
          { title: 'Added to Cart' }
        );
        onAddToCart?.();
      }
    } catch (error) {
      toast.error('An unexpected error occurred', { title: 'Error' });
    } finally {
      setIsAddingToCart(false);
    }
  }, [selectedIds, mainProduct, products, toast, onAddToCart]);

  // Loading state
  if (isLoading) {
    return (
      <section className={cn('py-8', className)}>
        <FrequentlyBoughtSkeleton />
      </section>
    );
  }

  // Error or no products state
  if (error || products.length === 0) {
    return null;
  }

  // Combine main product with recommended products
  const allProducts = showMainProduct
    ? [
        {
          ...mainProduct,
          purchaseCount: 0,
        },
        ...products,
      ]
    : products;

  return (
    <section
      className={cn('py-8', className)}
      aria-labelledby="frequently-bought-heading"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-yellow" aria-hidden="true" />
        <h2
          id="frequently-bought-heading"
          className="text-xl font-semibold text-gray-900"
        >
          Frequently Bought Together
        </h2>
        {algorithm === 'order-based' && (
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Based on customer purchases
          </span>
        )}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product list */}
        <div className="space-y-3">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            role="group"
            aria-label="Select products to add to cart"
          >
            {allProducts.map((product, index) => (
              <UpsellItem
                key={product.id}
                product={product}
                isSelected={selectedIds.has(product.id)}
                onSelectionChange={handleSelectionChange}
                isMainProduct={showMainProduct && index === 0}
              />
            ))}
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-4">
            Select the products you want to add to your cart. Prices shown are for
            individual items.
          </p>
        </div>

        {/* Bundle summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BundleSummary
            products={allProducts}
            selectedIds={selectedIds}
            discountPercent={bundleDiscount}
            onAddToCart={handleAddToCart}
            isAddingToCart={isAddingToCart}
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CART VERSION (Compact)
// ============================================================================

/**
 * Compact version for cart page
 */
export interface FrequentlyBoughtTogetherCartProps {
  /**
   * Product IDs currently in cart (to exclude from recommendations)
   */
  cartProductIds?: string[];
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
   * Callback when products are added to cart
   */
  onAddToCart?: () => void;
}

/**
 * Compact version of Frequently Bought Together for cart page
 * Shows horizontal layout with simplified UI
 */
export function FrequentlyBoughtTogetherCart({
  cartProductIds = [],
  limit = 3,
  className,
  onAddToCart,
}: FrequentlyBoughtTogetherCartProps) {
  // For cart page, we'd need to fetch recommendations based on cart contents
  // This is a simplified version that would need the cart context

  return (
    <section
      className={cn('py-6 border-t border-gray-200', className)}
      aria-labelledby="cart-upsell-heading"
    >
      <h3
        id="cart-upsell-heading"
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        Customers Also Bought
      </h3>

      {/* This would need cart context integration */}
      <p className="text-sm text-gray-500">
        Add more items to your order and save on shipping!
      </p>
    </section>
  );
}
