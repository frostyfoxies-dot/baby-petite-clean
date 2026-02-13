/**
 * Sanity CMS Integration
 *
 * This module exports all Sanity-related functionality for the Kids Petite e-commerce platform.
 *
 * @example
 * ```ts
 * import { getProducts, getProductBySlug, urlFor } from '@/lib/sanity';
 *
 * // Fetch all products
 * const products = await getProducts();
 *
 * // Fetch a single product
 * const product = await getProductBySlug('baby-onesie');
 *
 * // Build an image URL
 * const imageUrl = urlFor(product.featuredImage).width(800).url();
 * ```
 */

// Client
export { sanityClient, sanityPreviewClient, getSanityClient, sanityConfig } from './client';
export type { SanityImageSource } from './client';

// Image URL builder
export {
  urlFor,
  imageSizes,
  buildImageUrl,
  buildSrcSet,
  buildPlaceholderUrl,
  getDominantColor,
  buildImageProps,
  isSanityImage,
} from './image';
export type { ImageFit } from './image';

// GROQ Queries
export {
  // Product queries
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
  
  // Category queries
  CATEGORIES_QUERY,
  TOP_LEVEL_CATEGORIES_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  CATEGORIES_WITH_COUNT_QUERY,
  
  // Collection queries
  COLLECTIONS_QUERY,
  COLLECTION_BY_SLUG_QUERY,
  FEATURED_COLLECTIONS_QUERY,
  
  // Banner queries
  BANNERS_QUERY,
  HERO_BANNERS_QUERY,
  
  // Page content queries
  PAGE_CONTENT_QUERY,
  HOMEPAGE_CONTENT_QUERY,
  
  // Site settings queries
  SITE_SETTINGS_QUERY,
  NAVIGATION_QUERY,
  
  // Combined queries
  HOMEPAGE_DATA_QUERY,
} from './queries';

// Query parameter types
export type {
  ProductQueryParams,
  PaginatedQueryParams,
  SearchQueryParams,
  CategoryQueryParams,
  CollectionQueryParams,
  TagQueryParams,
  NavigationQueryParams,
  PageQueryParams,
} from './queries';

// API Functions
export {
  // Product API
  getProducts,
  getProductsPaginated,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getNewArrivals,
  getBestsellers,
  searchProducts,
  getProductsByCategory,
  getProductsByCollection,
  getProductsByTag,
  
  // Category API
  getCategories,
  getTopLevelCategories,
  getCategoryBySlug,
  getCategoriesWithCount,
  
  // Collection API
  getCollections,
  getCollectionBySlug,
  getFeaturedCollections,
  
  // Banner API
  getBanners,
  getHeroBanners,
  
  // Page Content API
  getPageContent,
  getHomepageContent,
  
  // Site Settings API
  getSiteSettings,
  getNavigation,
  
  // Combined API
  getHomepageData,
} from './api';

// API types
export type {
  FetchOptions,
  HomepageData,
} from './api';

// Document types (re-exported from schemas)
export type {
  ProductDocument,
  CategoryDocument,
  CollectionDocument,
  BannerDocument,
  PageContentDocument,
  SiteSettingsDocument,
  NavigationDocument,
} from './api';
