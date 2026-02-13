/**
 * Product types for the Kids Petite e-commerce platform
 */

import type { Category } from './category';
import type { Review, ReviewSummary } from './review';
import type { Inventory } from './inventory';

/**
 * Represents a product in the catalog
 */
export interface Product {
  /** Unique identifier */
  id: string;
  /** Stock Keeping Unit (SKU) */
  sku: string;
  /** Product name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Product description */
  description: string;
  /** ID of the category this product belongs to */
  categoryId: string;
  /** Category this product belongs to (optional, populated on fetch) */
  category?: Category;
  /** Current selling price */
  price: number;
  /** Original price for sale comparison (optional) */
  compareAtPrice?: number;
  /** Cost price for margin calculation (optional) */
  costPrice?: number;
  /** Whether the product is active and visible */
  isActive: boolean;
  /** Whether the product is featured */
  isFeatured: boolean;
  /** Array of tags for filtering and search */
  tags: string[];
  /** SEO title (optional) */
  seoTitle?: string;
  /** SEO description (optional) */
  seoDescription?: string;
  /** Product variants (size/color combinations) */
  variants: ProductVariant[];
  /** Product images */
  images: ProductImage[];
  /** Product creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents a product variant (size/color combination)
 */
export interface ProductVariant {
  /** Unique identifier */
  id: string;
  /** ID of the product this variant belongs to */
  productId: string;
  /** Stock Keeping Unit (SKU) for this variant */
  sku: string;
  /** Variant name/display name */
  name: string;
  /** Size (e.g., '0-3M', '3-6M', 'S', 'M', 'L') */
  size: string;
  /** Color name */
  color: string;
  /** Hex color code for display (optional) */
  colorCode?: string;
  /** Override price for this variant (optional) */
  price?: number;
  /** Override compare-at price for this variant (optional) */
  compareAtPrice?: number;
  /** Whether this variant is active and available */
  isActive: boolean;
  /** Sort order for display */
  sortOrder: number;
  /** Inventory information (optional, populated on fetch) */
  inventory?: Inventory;
  /** Variant creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents a product image
 */
export interface ProductImage {
  /** Unique identifier */
  id: string;
  /** ID of the product this image belongs to */
  productId: string;
  /** ID of the variant this image is associated with (optional) */
  variantId?: string;
  /** Image URL */
  url: string;
  /** Alt text for accessibility */
  altText: string;
  /** Whether this is the primary/hero image */
  isPrimary: boolean;
  /** Sort order for display */
  sortOrder: number;
  /** Image creation timestamp */
  createdAt: Date;
}

/**
 * Product with all related details populated
 */
export interface ProductWithDetails extends Product {
  /** Category this product belongs to */
  category: Category;
  /** Product variants */
  variants: ProductVariant[];
  /** Product images */
  images: ProductImage[];
  /** Product reviews */
  reviews: Review[];
  /** Aggregated review summary */
  reviewSummary: ReviewSummary;
}
