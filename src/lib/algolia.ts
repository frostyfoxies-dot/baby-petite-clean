import { algoliasearch, type SearchClient } from 'algoliasearch';

/**
 * Algolia Search Client Configuration
 *
 * Provides a configured Algolia client and helper functions for search indexing.
 * Used for product search, category browsing, and autocomplete functionality.
 *
 * @see https://www.algolia.com/doc/api-client/getting-started/what-is-the-api-client/javascript/
 */

// Lazy-initialized client
let algoliaClientInstance: SearchClient | null = null;

function getAlgoliaClient(): SearchClient {
  if (!algoliaClientInstance) {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;
    
    if (!appId || !adminKey) {
      throw new Error('Algolia environment variables are not set');
    }
    
    algoliaClientInstance = algoliasearch(appId, adminKey);
  }
  return algoliaClientInstance;
}

// Export the client getter for use in the application
export const algoliaClient: SearchClient = new Proxy({} as SearchClient, {
  get(_target, prop) {
    return getAlgoliaClient()[prop as keyof SearchClient];
  },
});

// Index names as constants for consistency
export const INDEX_NAMES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  COLLECTIONS: 'collections',
} as const;

/**
 * Product document structure for Algolia indexing
 */
export interface AlgoliaProduct {
  objectID: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  category: string;
  categoryId: string;
  categorySlug: string;
  brand?: string | null;
  tags: string[];
  colors: string[];
  sizes: string[];
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
  _geoloc?: { lat: number; lng: number };
}

/**
 * Category document structure for Algolia indexing
 */
export interface AlgoliaCategory {
  objectID: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  productCount: number;
  image?: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Collection document structure for Algolia indexing
 */
export interface AlgoliaCollection {
  objectID: string;
  name: string;
  slug: string;
  description?: string | null;
  productCount: number;
  image?: string | null;
  isFeatured: boolean;
  startDate?: number | null;
  endDate?: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Search result with pagination info
 */
export interface SearchResult<T> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
}

/**
 * Indexes a single product in Algolia
 * @param product - Product data to index
 * @returns Algolia response
 */
export async function indexProduct(product: AlgoliaProduct): Promise<{ objectID: string }> {
  try {
    const result = await algoliaClient.saveObject({
      indexName: INDEX_NAMES.PRODUCTS,
      body: product,
    });
    return { objectID: result.objectID };
  } catch (error) {
    console.error('Failed to index product:', error);
    throw new Error(`Failed to index product ${product.objectID}`);
  }
}

/**
 * Indexes multiple products in batch
 * @param products - Array of products to index
 * @returns Algolia batch response
 */
export async function indexProducts(
  products: AlgoliaProduct[]
): Promise<{ objectIDs: string[] }> {
  try {
    const result = await algoliaClient.saveObjects({
      indexName: INDEX_NAMES.PRODUCTS,
      objects: products,
    });
    return { objectIDs: result.objectIDs };
  } catch (error) {
    console.error('Failed to index products batch:', error);
    throw new Error('Failed to index products batch');
  }
}

/**
 * Deletes a product from the Algolia index
 * @param productId - Product ID to delete
 * @returns Algolia response
 */
export async function deleteProduct(productId: string): Promise<{ deletedAt: string }> {
  try {
    await algoliaClient.deleteObject({
      indexName: INDEX_NAMES.PRODUCTS,
      objectID: productId,
    });
    return { deletedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw new Error(`Failed to delete product ${productId}`);
  }
}

/**
 * Deletes multiple products from the Algolia index
 * @param productIds - Array of product IDs to delete
 * @returns Algolia batch response
 */
export async function deleteProducts(productIds: string[]): Promise<{ deletedCount: number }> {
  try {
    await algoliaClient.deleteObjects({
      indexName: INDEX_NAMES.PRODUCTS,
      objectIDs: productIds,
    });
    return { deletedCount: productIds.length };
  } catch (error) {
    console.error('Failed to delete products batch:', error);
    throw new Error('Failed to delete products batch');
  }
}

/**
 * Searches for products with filters and pagination
 * @param query - Search query string
 * @param options - Search options
 * @returns Search results
 */
export async function searchProducts(
  query: string,
  options: {
    page?: number;
    hitsPerPage?: number;
    filters?: string;
    facetFilters?: string[][];
    facets?: string[];
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  } = {}
): Promise<SearchResult<AlgoliaProduct>> {
  const {
    page = 0,
    hitsPerPage = 20,
    filters,
    facetFilters,
    facets,
    sort,
  } = options;

  // Select index based on sort option
  let indexName = INDEX_NAMES.PRODUCTS;
  if (sort === 'price_asc') {
    indexName = `${INDEX_NAMES.PRODUCTS}_price_asc`;
  } else if (sort === 'price_desc') {
    indexName = `${INDEX_NAMES.PRODUCTS}_price_desc`;
  } else if (sort === 'newest') {
    indexName = `${INDEX_NAMES.PRODUCTS}_created_desc`;
  } else if (sort === 'rating') {
    indexName = `${INDEX_NAMES.PRODUCTS}_rating_desc`;
  }

  const searchParams: Record<string, unknown> = {
    page,
    hitsPerPage,
  };

  if (filters) {
    searchParams.filters = filters;
  }

  if (facetFilters) {
    searchParams.facetFilters = facetFilters;
  }

  if (facets) {
    searchParams.facets = facets;
  }

  try {
    const result = await algoliaClient.search<AlgoliaProduct>({
      requests: [{
        indexName,
        query,
        ...searchParams,
      }],
    });
    
    const firstResult = result.results[0];
    return {
      hits: firstResult.hits,
      nbHits: firstResult.nbHits,
      page: firstResult.page,
      nbPages: firstResult.nbPages,
      hitsPerPage: firstResult.hitsPerPage,
      processingTimeMS: firstResult.processingTimeMS,
      query,
    };
  } catch (error) {
    console.error('Product search failed:', error);
    throw new Error('Failed to search products');
  }
}

/**
 * Searches for categories
 * @param query - Search query string
 * @param options - Search options
 * @returns Search results
 */
export async function searchCategories(
  query: string,
  options: {
    page?: number;
    hitsPerPage?: number;
  } = {}
): Promise<SearchResult<AlgoliaCategory>> {
  const { page = 0, hitsPerPage = 20 } = options;

  try {
    const result = await algoliaClient.search<AlgoliaCategory>({
      requests: [{
        indexName: INDEX_NAMES.CATEGORIES,
        query,
        page,
        hitsPerPage,
      }],
    });
    
    const firstResult = result.results[0];
    return {
      hits: firstResult.hits,
      nbHits: firstResult.nbHits,
      page: firstResult.page,
      nbPages: firstResult.nbPages,
      hitsPerPage: firstResult.hitsPerPage,
      processingTimeMS: firstResult.processingTimeMS,
      query,
    };
  } catch (error) {
    console.error('Category search failed:', error);
    throw new Error('Failed to search categories');
  }
}

/**
 * Indexes a single category in Algolia
 * @param category - Category data to index
 * @returns Algolia response
 */
export async function indexCategory(category: AlgoliaCategory): Promise<{ objectID: string }> {
  try {
    const result = await algoliaClient.saveObject({
      indexName: INDEX_NAMES.CATEGORIES,
      body: category,
    });
    return { objectID: result.objectID };
  } catch (error) {
    console.error('Failed to index category:', error);
    throw new Error(`Failed to index category ${category.objectID}`);
  }
}

/**
 * Indexes a single collection in Algolia
 * @param collection - Collection data to index
 * @returns Algolia response
 */
export async function indexCollection(
  collection: AlgoliaCollection
): Promise<{ objectID: string }> {
  try {
    const result = await algoliaClient.saveObject({
      indexName: INDEX_NAMES.COLLECTIONS,
      body: collection,
    });
    return { objectID: result.objectID };
  } catch (error) {
    console.error('Failed to index collection:', error);
    throw new Error(`Failed to index collection ${collection.objectID}`);
  }
}

/**
 * Gets autocomplete suggestions for products
 * @param query - Partial search query
 * @param limit - Maximum number of suggestions
 * @returns Array of product suggestions
 */
export async function getProductSuggestions(
  query: string,
  limit: number = 5
): Promise<AlgoliaProduct[]> {
  try {
    const result = await algoliaClient.search<AlgoliaProduct>({
      requests: [{
        indexName: INDEX_NAMES.PRODUCTS,
        query,
        hitsPerPage: limit,
        attributesToRetrieve: ['objectID', 'name', 'slug', 'price', 'images', 'category'],
      }],
    });
    
    return result.results[0].hits;
  } catch (error) {
    console.error('Failed to get product suggestions:', error);
    return [];
  }
}

/**
 * Gets facet values for filtering
 * @param facetName - Name of the facet
 * @param query - Search query (optional)
 * @returns Facet values with counts
 */
export async function getFacetValues(
  facetName: string,
  query: string = ''
): Promise<Record<string, number>> {
  try {
    const result = await productsIndex.searchForFacetValues(facetName, query);
    return result.facetHits.reduce(
      (acc, hit) => {
        acc[hit.value] = hit.count;
        return acc;
      },
      {} as Record<string, number>
    );
  } catch (error) {
    console.error('Failed to get facet values:', error);
    return {};
  }
}

/**
 * Clears all objects from an index (use with caution!)
 * @param indexName - Name of the index to clear
 */
export async function clearIndex(indexName: string): Promise<void> {
  try {
    const index = algoliaClient.initIndex(indexName);
    await index.clearObjects();
  } catch (error) {
    console.error(`Failed to clear index ${indexName}:`, error);
    throw new Error(`Failed to clear index ${indexName}`);
  }
}

/**
 * Sets index settings for better search relevance
 * @param indexName - Name of the index
 * @param settings - Index settings
 */
export async function setIndexSettings(
  indexName: string,
  settings: Record<string, unknown>
): Promise<void> {
  try {
    const index = algoliaClient.initIndex(indexName);
    await index.setSettings(settings);
  } catch (error) {
    console.error(`Failed to set settings for index ${indexName}:`, error);
    throw new Error(`Failed to set settings for index ${indexName}`);
  }
}

/**
 * Configures the products index with optimal settings
 * Should be called during initial setup or when settings need updating
 */
export async function configureProductsIndex(): Promise<void> {
  await setIndexSettings(INDEX_NAMES.PRODUCTS, {
    searchableAttributes: [
      'name',
      'brand',
      'category',
      'tags',
      'description',
      'colors',
      'sizes',
    ],
    attributesForFaceting: [
      'category',
      'categorySlug',
      'brand',
      'tags',
      'colors',
      'sizes',
      'inStock',
      'price',
      'rating',
    ],
    customRanking: ['desc(rating)', 'desc(createdAt)'],
    ranking: ['typo', 'geo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    hitsPerPage: 20,
    maxValuesPerFacet: 100,
  });
}

/**
 * Configures the categories index with optimal settings
 */
export async function configureCategoriesIndex(): Promise<void> {
  await setIndexSettings(INDEX_NAMES.CATEGORIES, {
    searchableAttributes: ['name', 'parentName', 'description'],
    attributesForFaceting: ['parentId'],
    customRanking: ['desc(productCount)'],
    ranking: ['typo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    hitsPerPage: 20,
  });
}

export default algoliaClient;
