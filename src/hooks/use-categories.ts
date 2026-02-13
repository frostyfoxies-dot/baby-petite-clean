'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Category interface
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  productCount: number;
}

/**
 * Categories hook return type
 */
interface UseCategoriesReturn {
  /** Array of categories in tree structure */
  categories: Category[];
  /** Whether categories are being loaded */
  isLoading: boolean;
  /** Error if categories fetch failed */
  error: Error | null;
  /** Get a category by its slug */
  getCategoryBySlug: (slug: string) => Category | undefined;
  /** Get a category by its ID */
  getCategoryById: (id: string) => Category | undefined;
  /** Get all descendant categories of a parent */
  getDescendants: (parentId: string) => Category[];
  /** Refetch categories */
  refetch: () => Promise<void>;
}

/**
 * Hook for category tree
 *
 * Fetches and manages state for the category tree structure.
 * Provides helper functions for finding and navigating categories.
 *
 * @returns Categories state and helper functions
 *
 * @example
 * ```tsx
 * function CategoryNav() {
 *   const { categories, isLoading, getCategoryBySlug } = useCategories();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <nav>
 *       {categories.map(category => (
 *         <CategoryItem key={category.id} category={category} />
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);

  /**
   * Flatten category tree for easy lookup
   */
  const flattenCategories = useCallback((cats: Category[]): Category[] => {
    return cats.reduce<Category[]>((acc, cat) => {
      acc.push(cat);
      if (cat.children?.length) {
        acc.push(...flattenCategories(cat.children));
      }
      return acc;
    }, []);
  }, []);

  /**
   * Fetch categories from API
   */
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
      setFlatCategories(flattenCategories(data));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      setCategories([]);
      setFlatCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [flattenCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Get a category by its slug
   */
  const getCategoryBySlug = useCallback(
    (slug: string): Category | undefined => {
      return flatCategories.find((cat) => cat.slug === slug);
    },
    [flatCategories]
  );

  /**
   * Get a category by its ID
   */
  const getCategoryById = useCallback(
    (id: string): Category | undefined => {
      return flatCategories.find((cat) => cat.id === id);
    },
    [flatCategories]
  );

  /**
   * Get all descendants of a category
   */
  const getDescendants = useCallback(
    (parentId: string): Category[] => {
      const descendants: Category[] = [];
      const parent = getCategoryById(parentId);

      if (parent?.children?.length) {
        const addChildAndDescendants = (children: Category[]) => {
          for (const child of children) {
            descendants.push(child);
            if (child.children?.length) {
              addChildAndDescendants(child.children);
            }
          }
        };
        addChildAndDescendants(parent.children);
      }

      return descendants;
    },
    [getCategoryById]
  );

  return {
    categories,
    isLoading,
    error,
    getCategoryBySlug,
    getCategoryById,
    getDescendants,
    refetch: fetchCategories,
  };
}

export default useCategories;
