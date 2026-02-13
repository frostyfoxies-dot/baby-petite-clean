'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product } from './use-product';

/**
 * Product filters interface
 */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  inStock?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
}

/**
 * Sort options for products
 */
export type ProductSortOption =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'bestseller'
  | 'name-asc'
  | 'name-desc';

/**
 * Products hook return type
 */
interface UseProductsReturn {
  /** Array of products */
  products: Product[];
  /** Total number of products matching filters */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of products per page */
  perPage: number;
  /** Whether products are being loaded */
  isLoading: boolean;
  /** Error if products fetch failed */
  error: Error | null;
  /** Fetch the next page of products */
  fetchMore: () => Promise<void>;
  /** Whether there are more products to load */
  hasMore: boolean;
  /** Refetch products with new filters */
  refetch: (newFilters?: ProductFilters) => Promise<void>;
}

/**
 * Default number of products per page
 */
const DEFAULT_PER_PAGE = 12;

/**
 * Hook for product listing with pagination
 *
 * Fetches and manages state for a paginated list of products.
 * Supports filtering, sorting, and infinite scroll loading.
 *
 * @param initialFilters - Initial filter values
 * @param sort - Sort option for products
 * @param initialPage - Starting page number
 * @param perPage - Number of products per page
 * @returns Products state and actions
 *
 * @example
 * ```tsx
 * function ProductList() {
 *   const { products, isLoading, fetchMore, hasMore } = useProducts({
 *     category: 'dresses',
 *   }, 'newest');
 *
 *   return (
 *     <div>
 *       {products.map(product => (
 *         <ProductCard key={product.id} product={product} />
 *       ))}
 *       {hasMore && (
 *         <button onClick={fetchMore} disabled={isLoading}>
 *           Load More
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProducts(
  initialFilters: ProductFilters = {},
  sort: ProductSortOption = 'newest',
  initialPage: number = 1,
  perPage: number = DEFAULT_PER_PAGE
): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  /**
   * Build query string from filters and pagination
   */
  const buildQueryString = useCallback(
    (pageNum: number, currentFilters: ProductFilters) => {
      const params = new URLSearchParams();

      params.set('page', pageNum.toString());
      params.set('perPage', perPage.toString());
      params.set('sort', sort);

      if (currentFilters.category) {
        params.set('category', currentFilters.category);
      }
      if (currentFilters.minPrice !== undefined) {
        params.set('minPrice', currentFilters.minPrice.toString());
      }
      if (currentFilters.maxPrice !== undefined) {
        params.set('maxPrice', currentFilters.maxPrice.toString());
      }
      if (currentFilters.sizes?.length) {
        params.set('sizes', currentFilters.sizes.join(','));
      }
      if (currentFilters.colors?.length) {
        params.set('colors', currentFilters.colors.join(','));
      }
      if (currentFilters.tags?.length) {
        params.set('tags', currentFilters.tags.join(','));
      }
      if (currentFilters.inStock) {
        params.set('inStock', 'true');
      }
      if (currentFilters.onSale) {
        params.set('onSale', 'true');
      }
      if (currentFilters.isNew) {
        params.set('isNew', 'true');
      }
      if (currentFilters.isBestSeller) {
        params.set('isBestSeller', 'true');
      }

      return params.toString();
    },
    [perPage, sort]
  );

  /**
   * Fetch products from API
   */
  const fetchProducts = useCallback(
    async (pageNum: number, currentFilters: ProductFilters, append: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const queryString = buildQueryString(pageNum, currentFilters);
        const response = await fetch(`/api/products?${queryString}`);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();

        if (append) {
          setProducts((prev) => [...prev, ...data.products]);
        } else {
          setProducts(data.products);
        }

        setTotal(data.total);
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      } finally {
        setIsLoading(false);
      }
    },
    [buildQueryString]
  );

  /**
   * Initial fetch and when filters/sort change
   */
  useEffect(() => {
    setProducts([]);
    fetchProducts(1, filters, false);
  }, [filters, sort, fetchProducts]);

  /**
   * Fetch more products (next page)
   */
  const fetchMore = useCallback(async () => {
    const nextPage = page + 1;
    await fetchProducts(nextPage, filters, true);
  }, [page, filters, fetchProducts]);

  /**
   * Refetch with optional new filters
   */
  const refetch = useCallback(
    async (newFilters?: ProductFilters) => {
      if (newFilters) {
        setFilters(newFilters);
      } else {
        await fetchProducts(1, filters, false);
      }
    },
    [filters, fetchProducts]
  );

  const hasMore = products.length < total;

  return {
    products,
    total,
    page,
    perPage,
    isLoading,
    error,
    fetchMore,
    hasMore,
    refetch,
  };
}

export default useProducts;
