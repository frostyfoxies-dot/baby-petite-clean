'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product } from './use-product';

/**
 * Recommendation reason type
 */
export type RecommendationReason =
  | 'similar_products'
  | 'frequently_bought_together'
  | 'customers_also_viewed'
  | 'trending'
  | 'new_arrivals'
  | 'personalized'
  | 'registry_based'
  | 'size_based';

/**
 * Recommendations hook return type
 */
interface UseRecommendationsReturn {
  /** Array of recommended products */
  recommendations: Product[];
  /** Whether recommendations are being loaded */
  isLoading: boolean;
  /** Error if recommendations fetch failed */
  error: Error | null;
  /** Reason for recommendations */
  reason: string | null;
  /** Refetch recommendations */
  refetch: () => Promise<void>;
}

/**
 * Recommendations hook options
 */
interface UseRecommendationsOptions {
  /** Product ID to get recommendations for */
  productId?: string;
  /** Category ID to get recommendations for */
  categoryId?: string;
  /** Registry ID for registry-based recommendations */
  registryId?: string;
  /** Maximum number of recommendations */
  limit?: number;
  /** Types of recommendations to include */
  types?: RecommendationReason[];
}

/**
 * Hook for AI-powered recommendations
 *
 * Fetches personalized product recommendations based on various factors
 * including browsing history, purchase history, and product similarity.
 *
 * @param options - Recommendation options
 * @returns Recommendations state and actions
 *
 * @example
 * ```tsx
 * function ProductRecommendations({ productId }) {
 *   const { recommendations, isLoading, reason } = useRecommendations({
 *     productId,
 *     limit: 4,
 *   });
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (recommendations.length === 0) return null;
 *
 *   return (
 *     <div>
 *       <h2>{reason || 'You might also like'}</h2>
 *       <ProductGrid products={recommendations} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecommendations(
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const { productId, categoryId, registryId, limit = 8, types } = options;

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  /**
   * Fetch recommendations from API
   */
  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (productId) params.set('productId', productId);
      if (categoryId) params.set('categoryId', categoryId);
      if (registryId) params.set('registryId', registryId);
      if (limit) params.set('limit', limit.toString());
      if (types?.length) params.set('types', types.join(','));

      const response = await fetch(`/api/recommendations?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.products || []);
      setReason(data.reason || null);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId, categoryId, registryId, limit, types]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    reason,
    refetch: fetchRecommendations,
  };
}

/**
 * Hook for registry-based recommendations
 *
 * Provides personalized recommendations based on registry items
 * and growth tracking data.
 *
 * @param registryId - Registry ID
 * @param limit - Maximum number of recommendations
 * @returns Recommendations state and actions
 *
 * @example
 * ```tsx
 * function RegistryRecommendations({ registryId }) {
 *   const { recommendations, isLoading, reason } = useRegistryRecommendations(registryId);
 *
 *   return (
 *     <div>
 *       <h2>{reason || 'Recommended for your registry'}</h2>
 *       <ProductGrid products={recommendations} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegistryRecommendations(
  registryId: string | null,
  limit: number = 8
): UseRecommendationsReturn {
  return useRecommendations({
    registryId: registryId || undefined,
    limit,
    types: ['registry_based', 'size_based', 'frequently_bought_together'],
  });
}

/**
 * Hook for product page recommendations
 *
 * Shows similar products and items frequently bought together.
 *
 * @param productId - Product ID
 * @param categoryId - Category ID
 * @param limit - Maximum number of recommendations
 * @returns Recommendations state and actions
 */
export function useProductRecommendations(
  productId: string | null,
  categoryId?: string,
  limit: number = 8
): UseRecommendationsReturn {
  return useRecommendations({
    productId: productId || undefined,
    categoryId,
    limit,
    types: ['similar_products', 'frequently_bought_together', 'customers_also_viewed'],
  });
}

/**
 * Hook for homepage recommendations
 *
 * Shows trending, new arrivals, and personalized recommendations.
 *
 * @param limit - Maximum number of recommendations
 * @returns Recommendations state and actions
 */
export function useHomepageRecommendations(
  limit: number = 12
): UseRecommendationsReturn {
  return useRecommendations({
    limit,
    types: ['trending', 'new_arrivals', 'personalized'],
  });
}

export default useRecommendations;
