'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Product variant interface
 */
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  inventory: {
    available: number;
    lowStock: boolean;
  };
  options: Record<string, string>;
}

/**
 * Product interface
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  variants: ProductVariant[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
}

/**
 * Product hook return type
 */
interface UseProductReturn {
  /** The product data or null if not found */
  product: Product | null;
  /** Whether the product is being loaded */
  isLoading: boolean;
  /** Error if product fetch failed */
  error: Error | null;
  /** Refetch the product data */
  refetch: () => Promise<void>;
}

/**
 * Hook for single product data
 *
 * Fetches and manages state for a single product by slug.
 * Includes loading states, error handling, and refetch capability.
 *
 * @param slug - The product slug to fetch
 * @returns Product state and actions
 *
 * @example
 * ```tsx
 * function ProductPage({ slug }) {
 *   const { product, isLoading, error } = useProduct(slug);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!product) return <NotFound />;
 *
 *   return <ProductDetails product={product} />;
 * }
 * ```
 */
export function useProduct(slug: string | null): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setProduct(null);
          setError(new Error('Product not found'));
        } else {
          throw new Error('Failed to fetch product');
        }
        return;
      }

      const data = await response.json();
      setProduct(data);
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch product'));
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}

export default useProduct;
