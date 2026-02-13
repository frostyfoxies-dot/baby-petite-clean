/**
 * Sanity API Utilities
 *
 * High-level API functions for fetching content from Sanity CMS.
 * These functions wrap the GROQ queries and provide a clean interface
 * for use throughout the application.
 *
 * Features:
 * - Automatic caching with revalidation
 * - Error handling
 * - TypeScript types
 * - Preview mode support
 */

import { sanityClient, sanityPreviewClient } from './client';
import {
  PRODUCTS_QUERY,
  PRODUCTS_PAGINATED_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_BY_ID_QUERY,
  FEATURED_PRODUCTS_QUERY,
  NEW_ARRIVALS_QUERY,
  BESTSELLERS_QUERY,
  SEARCH_PRODUCTS_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
  PRODUCTS_BY_COLLECTION_QUERY,
  PRODUCTS_BY_TAG_QUERY,
  CATEGORIES_QUERY,
  TOP_LEVEL_CATEGORIES_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  CATEGORIES_WITH_COUNT_QUERY,
  COLLECTIONS_QUERY,
  COLLECTION_BY_SLUG_QUERY,
  FEATURED_COLLECTIONS_QUERY,
  BANNERS_QUERY,
  HERO_BANNERS_QUERY,
  PAGE_CONTENT_QUERY,
  HOMEPAGE_CONTENT_QUERY,
  SITE_SETTINGS_QUERY,
  NAVIGATION_QUERY,
  HOMEPAGE_DATA_QUERY,
  type ProductQueryParams,
  type PaginatedQueryParams,
  type SearchQueryParams,
  type CategoryQueryParams,
  type CollectionQueryParams,
  type TagQueryParams,
  type NavigationQueryParams,
  type PageQueryParams,
} from './queries';
import type { ProductDocument } from '../../../sanity/schemas/product';
import type { CategoryDocument } from '../../../sanity/schemas/category';
import type { CollectionDocument } from '../../../sanity/schemas/collection';
import type { BannerDocument } from '../../../sanity/schemas/banner';
import type { PageContentDocument } from '../../../sanity/schemas/pageContent';
import type { SiteSettingsDocument } from '../../../sanity/schemas/siteSettings';
import type { NavigationDocument } from '../../../sanity/schemas/navigation';

// ===========================================
// Types
// ===========================================

/**
 * Options for API fetch functions
 */
interface FetchOptions {
  preview?: boolean;
  revalidate?: number | false;
  tags?: string[];
}

/**
 * Homepage data response type
 */
export interface HomepageData {
  hero: BannerDocument[];
  featuredProducts: ProductDocument[];
  newArrivals: ProductDocument[];
  bestsellers: ProductDocument[];
  categories: CategoryDocument[];
  collections: CollectionDocument[];
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Execute a GROQ query with error handling
 */
async function fetchQuery<T>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {}
): Promise<T | null> {
  const { preview = false } = options;
  const client = preview ? sanityPreviewClient : sanityClient;

  try {
    const result = await client.fetch<T>(query, params);
    return result;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    return null;
  }
}

// ===========================================
// Product API
// ===========================================

/**
 * Get all products
 */
export async function getProducts(options?: FetchOptions): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(PRODUCTS_QUERY, {}, options);
  return result || [];
}

/**
 * Get products with pagination
 */
export async function getProductsPaginated(
  start: number,
  limit: number,
  options?: FetchOptions
): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(
    PRODUCTS_PAGINATED_QUERY,
    { start, limit } as PaginatedQueryParams,
    options
  );
  return result || [];
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(
  slug: string,
  options?: FetchOptions
): Promise<ProductDocument | null> {
  return fetchQuery<ProductDocument>(
    PRODUCT_BY_SLUG_QUERY,
    { slug } as ProductQueryParams,
    options
  );
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  id: string,
  options?: FetchOptions
): Promise<ProductDocument | null> {
  return fetchQuery<ProductDocument>(
    PRODUCT_BY_ID_QUERY,
    { id },
    options
  );
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(options?: FetchOptions): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(FEATURED_PRODUCTS_QUERY, {}, options);
  return result || [];
}

/**
 * Get new arrivals
 */
export async function getNewArrivals(options?: FetchOptions): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(NEW_ARRIVALS_QUERY, {}, options);
  return result || [];
}

/**
 * Get bestsellers
 */
export async function getBestsellers(options?: FetchOptions): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(BESTSELLERS_QUERY, {}, options);
  return result || [];
}

/**
 * Search products by name, description, or tags
 */
export async function searchProducts(
  searchTerm: string,
  options?: FetchOptions
): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(
    SEARCH_PRODUCTS_QUERY,
    { searchTerm: `${searchTerm}*` } as SearchQueryParams,
    options
  );
  return result || [];
}

/**
 * Get products by category slug
 */
export async function getProductsByCategory(
  categorySlug: string,
  options?: FetchOptions
): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(
    PRODUCTS_BY_CATEGORY_QUERY,
    { categorySlug } as CategoryQueryParams,
    options
  );
  return result || [];
}

/**
 * Get products by collection slug
 */
export async function getProductsByCollection(
  collectionSlug: string,
  options?: FetchOptions
): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(
    PRODUCTS_BY_COLLECTION_QUERY,
    { collectionSlug } as CollectionQueryParams,
    options
  );
  return result || [];
}

/**
 * Get products by tag
 */
export async function getProductsByTag(
  tag: string,
  options?: FetchOptions
): Promise<ProductDocument[]> {
  const result = await fetchQuery<ProductDocument[]>(
    PRODUCTS_BY_TAG_QUERY,
    { tag } as TagQueryParams,
    options
  );
  return result || [];
}

// ===========================================
// Category API
// ===========================================

/**
 * Get all categories
 */
export async function getCategories(options?: FetchOptions): Promise<CategoryDocument[]> {
  const result = await fetchQuery<CategoryDocument[]>(CATEGORIES_QUERY, {}, options);
  return result || [];
}

/**
 * Get top-level categories (no parent)
 */
export async function getTopLevelCategories(options?: FetchOptions): Promise<CategoryDocument[]> {
  const result = await fetchQuery<CategoryDocument[]>(TOP_LEVEL_CATEGORIES_QUERY, {}, options);
  return result || [];
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(
  slug: string,
  options?: FetchOptions
): Promise<CategoryDocument | null> {
  return fetchQuery<CategoryDocument>(
    CATEGORY_BY_SLUG_QUERY,
    { slug } as ProductQueryParams,
    options
  );
}

/**
 * Get categories with product count
 */
export async function getCategoriesWithCount(options?: FetchOptions): Promise<Array<CategoryDocument & { productCount: number }>> {
  const result = await fetchQuery<Array<CategoryDocument & { productCount: number }>>(
    CATEGORIES_WITH_COUNT_QUERY,
    {},
    options
  );
  return result || [];
}

// ===========================================
// Collection API
// ===========================================

/**
 * Get all active collections
 */
export async function getCollections(options?: FetchOptions): Promise<CollectionDocument[]> {
  const result = await fetchQuery<CollectionDocument[]>(COLLECTIONS_QUERY, {}, options);
  return result || [];
}

/**
 * Get collection by slug
 */
export async function getCollectionBySlug(
  slug: string,
  options?: FetchOptions
): Promise<CollectionDocument | null> {
  return fetchQuery<CollectionDocument>(
    COLLECTION_BY_SLUG_QUERY,
    { slug } as ProductQueryParams,
    options
  );
}

/**
 * Get featured collections
 */
export async function getFeaturedCollections(options?: FetchOptions): Promise<CollectionDocument[]> {
  const result = await fetchQuery<CollectionDocument[]>(FEATURED_COLLECTIONS_QUERY, {}, options);
  return result || [];
}

// ===========================================
// Banner/Hero API
// ===========================================

/**
 * Get all active banners
 */
export async function getBanners(options?: FetchOptions): Promise<BannerDocument[]> {
  const result = await fetchQuery<BannerDocument[]>(BANNERS_QUERY, {}, options);
  return result || [];
}

/**
 * Get hero banners for homepage
 */
export async function getHeroBanners(options?: FetchOptions): Promise<BannerDocument[]> {
  const result = await fetchQuery<BannerDocument[]>(HERO_BANNERS_QUERY, {}, options);
  return result || [];
}

// ===========================================
// Page Content API
// ===========================================

/**
 * Get page content by slug
 */
export async function getPageContent(
  slug: string,
  options?: FetchOptions
): Promise<PageContentDocument | null> {
  return fetchQuery<PageContentDocument>(
    PAGE_CONTENT_QUERY,
    { slug } as PageQueryParams,
    options
  );
}

/**
 * Get homepage content
 */
export async function getHomepageContent(options?: FetchOptions): Promise<PageContentDocument | null> {
  return fetchQuery<PageContentDocument>(HOMEPAGE_CONTENT_QUERY, {}, options);
}

// ===========================================
// Site Settings API
// ===========================================

/**
 * Get site settings
 */
export async function getSiteSettings(options?: FetchOptions): Promise<SiteSettingsDocument | null> {
  return fetchQuery<SiteSettingsDocument>(SITE_SETTINGS_QUERY, {}, options);
}

/**
 * Get navigation menu by name
 */
export async function getNavigation(
  name: string,
  options?: FetchOptions
): Promise<NavigationDocument | null> {
  return fetchQuery<NavigationDocument>(
    NAVIGATION_QUERY,
    { name } as NavigationQueryParams,
    options
  );
}

// ===========================================
// Combined API
// ===========================================

/**
 * Get all homepage data in a single query
 * This is more efficient than multiple queries
 */
export async function getHomepageData(options?: FetchOptions): Promise<HomepageData | null> {
  return fetchQuery<HomepageData>(HOMEPAGE_DATA_QUERY, {}, options);
}

// ===========================================
// Re-export Types
// ===========================================

export type {
  ProductDocument,
  CategoryDocument,
  CollectionDocument,
  BannerDocument,
  PageContentDocument,
  SiteSettingsDocument,
  NavigationDocument,
};
