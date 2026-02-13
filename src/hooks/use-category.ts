'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Category } from './use-categories';
import type { Product } from './use-product';

/**
 * Category with products interface
 */
interface CategoryWithProducts extends Category {
  products: Product[];
  productTotal: number;
}

/**
 * Category hook return type
 */
interface UseCategoryReturn {
  /** The category data or null if not found */
  category: CategoryWithProducts | null;
  /** Products in this category */
  products: Product[];
  /** Whether the category is being loaded */
  isLoading: boolean;
  /** Error if category fetch failed */
  error: Error | null;
  /** Refetch the category data */
  refetch: () => Promise<void>;
  /** Load more products */
  loadMoreProducts: () => Promise<void>;
  /** Whether there are more products to load */
  hasMoreProducts: boolean;
}

/**
 * Default number of products per page
 */
const DEFAULT_PRODUCTS_PER_PAGE = 12;

/**
 * Hook for single category with products
 *
 * Fetches and manages state for a single category including
 * its products with pagination support.
 *
 * @param slug - The category slug to fetch
 * @param productsPerPage - Number of products per page (default: 12)
 * @returns Category state and actions
 *
 * @example
 * ```tsx
 * function CategoryPage({ slug }) {
 *   const { category, products, isLoading, loadMoreProducts, hasMoreProducts } = useCategory(slug);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!category) return <NotFound />;
 *
 *   return (
 *     <div>
 *       <h1>{category.name}</h1>
 *       <ProductGrid products={products} />
 *       {hasMoreProducts && (
 *         <button onClick={loadMoreProducts}>Load More</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCategory(
  slug: string | null,
  productsPerPage: number = DEFAULT_PRODUCTS_PER_PAGE
): UseCategoryReturn {
  const [category, setCategory] = useState<CategoryWithProducts | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Fetch category data from API
   */
  const fetchCategory = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (!slug) {
        setCategory(null);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          perPage: productsPerPage.toString(),
        });

        const response = await fetch(`/api/categories/${slug}?${params.toString()}`);

        if (!response.ok) {
          if (response.status === 404) {
            setCategory(null);
            setProducts([]);
            setError(new Error('Category not found'));
          } else {
            throw new Error('Failed to fetch category');
          }
          return;
        }

        const data = await response.json();
        setCategory(data);

        if (append) {
          setProducts((prev) => [...prev, ...data.products]);
        } else {
          setProducts(data.products);
        }

        setCurrentPage(page);
      } catch (err) {
        console.error('Failed to fetch category:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch category'));
        setCategory(null);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [slug, productsPerPage]
  );

  /**
   * Initial fetch
   */
  useEffect(() => {
    setCurrentPage(1);
    fetchCategory(1, false);
  }, [fetchCategory]);

  /**
   * Refetch category data
   */
  const refetch = useCallback(() => {
    return fetchCategory(1, false);
  }, [fetchCategory]);

  /**
   * Load more products
   */
  const loadMoreProducts = useCallback(async () => {
    const nextPage = currentPage + 1;
    await fetchCategory(nextPage, true);
  }, [currentPage, fetchCategory]);

  const hasMoreProducts = category
    ? products.length < category.productTotal
    : false;

  return {
    category,
    products,
    isLoading,
    error,
    refetch,
    loadMoreProducts,
    hasMoreProducts,
  };
}

export default useCategory;
