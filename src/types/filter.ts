/**
 * Filter types for the Baby Petite e-commerce platform
 */

/**
 * Product filter options
 */
export interface ProductFilters {
  /** Filter by category ID or slug */
  category?: string;
  /** Minimum price filter */
  minPrice?: number;
  /** Maximum price filter */
  maxPrice?: number;
  /** Filter by sizes */
  sizes?: string[];
  /** Filter by colors */
  colors?: string[];
  /** Filter to show only in-stock items */
  inStock?: boolean;
  /** Filter to show only items on sale */
  onSale?: boolean;
  /** Filter by tags */
  tags?: string[];
}

/** Sort option enumeration */
export type SortOption = 
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'popular'
  | 'rating';

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}
