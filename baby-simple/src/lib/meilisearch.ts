import { MeiliSearch } from 'meilisearch';

// Initialize Meilisearch client
const meilisearchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export const PRODUCT_INDEX = 'products';

export const meilisearch = {
  // Search products
  async searchProducts(query: string, options?: {
    limit?: number;
    offset?: number;
    filter?: string;
    sort?: string[];
  }) {
    const index = meilisearchClient.index(PRODUCT_INDEX);
    const searchResult = await index.search(query, {
      limit: options?.limit ?? 20,
      offset: options?.offset ?? 0,
      filter: options?.filter,
      sort: options?.sort,
    });
    return {
      hits: searchResult.hits,
      total: searchResult.estimatedTotalHits,
      processingTimeMs: searchResult.processingTimeMs,
    };
  },

  // Get product by ID
  async getProduct(id: string) {
    const index = meilisearchClient.index(PRODUCT_INDEX);
    const document = await index.getDocument(id);
    return document;
  },

  // Add or update a single product
  async upsertProduct(product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    slug: string;
    sku?: string;
    inventory: number;
    isActive: boolean;
    images?: string[];
  }) {
    const index = meilisearchClient.index(PRODUCT_INDEX);
    const result = await index.addDocuments([product]);
    return result;
  },

  // Add or update multiple products
  async upsertProducts(products: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    slug: string;
    sku?: string;
    inventory: number;
    isActive: boolean;
    images?: string[];
  }>) {
    const index = meilisearchClient.index(PRODUCT_INDEX);
    const result = await index.addDocuments(products);
    return result;
  },

  // Delete a product
  async deleteProduct(id: string) {
    const index = meilisearchClient.index(PRODUCT_INDEX);
    const result = await index.deleteDocument(id);
    return result;
  },

  // Create the index with settings
  async initializeIndex() {
    try {
      // Create index if it doesn't exist
      await meilisearchClient.createIndex(PRODUCT_INDEX, { primaryKey: 'id' });

      // Configure searchable attributes
      await meilisearchClient.index(PRODUCT_INDEX).updateSearchableAttributes([
        'name',
        'description',
        'sku',
        'category',
      ]);

      // Configure filterable attributes
      await meilisearchClient.index(PRODUCT_INDEX).updateFilterableAttributes([
        'isActive',
        'inventory',
        'category',
        'price',
      ]);

      // Configure sortable attributes
      await meilisearchClient.index(PRODUCT_INDEX).updateSortableAttributes([
        'price',
        'createdAt',
        'name',
      ]);
    } catch (error) {
      // Index might already exist
      console.log('Index already exists or created successfully');
    }
  },

  // Get client instance for advanced operations
  getClient() {
    return meilisearchClient;
  },
};

export default meilisearch;