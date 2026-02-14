/**
 * Category types for the Baby Petite e-commerce platform
 */

import type { Product } from './product';

/**
 * Represents a product category
 */
export interface Category {
  /** Unique identifier */
  id: string;
  /** Category name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Category description (optional) */
  description?: string;
  /** ID of parent category (optional, for hierarchical categories) */
  parentId?: string;
  /** Parent category (optional, populated on fetch) */
  parent?: Category;
  /** Child categories (optional, populated on fetch) */
  children?: Category[];
  /** Category image URL (optional) */
  imageUrl?: string;
  /** Sort order for display */
  sortOrder: number;
  /** Category creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Category with products and product count
 */
export interface CategoryWithProducts extends Category {
  /** Products in this category */
  products: Product[];
  /** Total number of products in this category */
  productCount: number;
}
