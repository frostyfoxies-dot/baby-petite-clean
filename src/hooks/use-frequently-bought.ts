'use client';

import * as React from 'react';
import type { FrequentlyBoughtResponse } from '@/app/api/products/[slug]/related/route';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Product data for frequently bought together display
 */
export interface FrequentlyBoughtProduct {
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
  purchaseCount: number;
}

/**
 * Hook return type
 */
export interface UseFrequentlyBoughtResult {
  products: FrequentlyBoughtProduct[];
  isLoading: boolean;
  error: string | null;
  algorithm: 'order-based' | 'category-based' | null;
  refetch: () => Promise<void>;
}

/**
 * Hook options
 */
export interface UseFrequentlyBoughtOptions {
  /**
   * Number of products to fetch
   * @default 3
   */
  limit?: number;
  /**
   * Whether to fetch on mount
   * @default true
   */
  enabled?: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching frequently bought together products
 *
 * @param productSlug - The slug of the current product
 * @param options - Hook options
 * @returns Products, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { products, isLoading, error } = useFrequentlyBought('baby-onesie');
 * ```
 */
export function useFrequentlyBought(
  productSlug: string | null | undefined,
  options: UseFrequentlyBoughtOptions = {}
): UseFrequentlyBoughtResult {
  const { limit = 3, enabled = true } = options;

  const [products, setProducts] = React.useState<FrequentlyBoughtProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [algorithm, setAlgorithm] = React.useState<'order-based' | 'category-based' | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!productSlug || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/products/${productSlug}/related?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data: FrequentlyBoughtResponse = await response.json();
      setProducts(data.products);
      setAlgorithm(data.algorithm);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setProducts([]);
      setAlgorithm(null);
    } finally {
      setIsLoading(false);
    }
  }, [productSlug, limit, enabled]);

  // Fetch on mount and when dependencies change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    products,
    isLoading,
    error,
    algorithm,
    refetch: fetchData,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the first available variant for a product
 */
export function getFirstAvailableVariant(
  product: FrequentlyBoughtProduct
): FrequentlyBoughtProduct['variants'][0] | null {
  return (
    product.variants.find((v) => v.inventory?.inStock) || product.variants[0] || null
  );
}

/**
 * Get the primary image for a product
 */
export function getPrimaryImage(
  product: FrequentlyBoughtProduct
): { url: string; altText: string | null } {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  return {
    url: primaryImage?.url || '/images/placeholder.jpg',
    altText: primaryImage?.altText || product.name,
  };
}

/**
 * Calculate the total price for selected products
 */
export function calculateTotalPrice(
  products: FrequentlyBoughtProduct[],
  selectedIds: Set<string>
): number {
  return products
    .filter((p) => selectedIds.has(p.id))
    .reduce((total, product) => total + product.basePrice, 0);
}

/**
 * Calculate savings if there's a bundle discount
 */
export function calculateBundleSavings(
  products: FrequentlyBoughtProduct[],
  selectedIds: Set<string>,
  discountPercent: number = 0
): number {
  if (discountPercent <= 0) return 0;

  const total = calculateTotalPrice(products, selectedIds);
  return total * (discountPercent / 100);
}
