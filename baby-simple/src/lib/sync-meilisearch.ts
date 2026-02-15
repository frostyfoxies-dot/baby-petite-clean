/**
 * Meilisearch Sync Utility for Baby Simple E-commerce
 *
 * This module handles synchronization between Prisma ORM and Meilisearch.
 * It provides:
 * - Automatic sync via Prisma middleware on product CRUD operations
 * - Index initialization with proper settings
 * - Health checking
 * - Full reindexing capability
 */

import { MeiliSearch } from 'meilisearch';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPES & CONFIGURATION
// ============================================

const MEILISEARCH_URL = process.env.MEILISEARCH_URL || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || '';
const INDEX_UID = 'products';

// Interface for product documents sent to Meilisearch
interface ProductDocument {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: string;
  salePrice: string | null;
  categoryId: string;
  categoryName: string;
  collectionId: string | null;
  collectionName: string | null;
  isActive: boolean;
  isFeatured: boolean;
  images: any[]; // JSON array of image objects
  createdAt: string;
  updatedAt: string;
}

// Initialize Meilisearch client
const client = new MeiliSearch({
  host: MEILISEARCH_URL,
  apiKey: MEILISEARCH_API_KEY,
});

// ============================================
// PRISMA MIDDLEWARE
// ============================================

/**
 * Registers Prisma middleware to automatically sync products with Meilisearch.
 * This should be called once during application startup.
 *
 * Usage: In your main app file (e.g., pages/_app.tsx or app/layout.tsx):
 * import { registerProductSyncMiddleware } from '@/lib/sync-meilisearch';
 * registerProductSyncMiddleware();
 */
export function registerProductSyncMiddleware() {
  // Use Prisma middleware to intercept product operations
  prisma.$use(async (params: any, next: any) => {
    // Only handle Product model events
    if (params.model !== 'Product') {
      return next();
    }

    const { action, args } = params;
    const index = client.index(INDEX_UID);

    try {
      switch (action) {
        case 'create':
          await handleProductCreate(args.data, index);
          break;
        case 'update':
          await handleProductUpdate(args.data, index);
          break;
        case 'delete':
          await handleProductDelete(args.where, index);
          break;
        case 'upsert':
          // Upsert can be treated as update or create depending on result
          // We'll handle it after the operation completes
          const result = await next();
          if (result) {
            await syncProductToMeilisearch(result, index);
          }
          return result;
      }

      // Continue with the database operation
      return next();
    } catch (error) {
      console.error('Meilisearch sync error:', error);
      // Don't throw - allow the database operation to succeed even if sync fails
      return next();
    }
  });
}

/**
 * Handles product creation - adds document to Meilisearch index
 */
async function handleProductCreate(data: any, index: any) {
  const document = await buildProductDocument(data);
  await index.addDocuments([document]);
}

/**
 * Handles product update - updates document in Meilisearch index
 */
async function handleProductUpdate(data: any, index: any) {
  const document = await buildProductDocument(data);
  await index.updateDocuments([document]);
}

/**
 * Handles product deletion - removes document from Meilisearch index
 */
async function handleProductDelete(where: any, index: any) {
  // We need to get the product ID; if 'where' has 'id', use it directly
  // Otherwise, we may need to fetch it first (e.g., if deleting by other unique fields)
  const id = where.id;
  if (id) {
    await index.deleteDocument(id);
  }
}

/**
 * Syncs a product to Meilisearch (used by both create and update)
 */
async function syncProductToMeilisearch(product: any, index: any) {
  const document = await buildProductDocument(product);
  await index.updateDocuments([document]);
}

/**
 * Builds a Meilisearch-compatible document from a Prisma product
 * Includes enriched data like category and collection names for better search
 */
async function buildProductDocument(product: any): Promise<ProductDocument> {
  // Fetch related category and collection names for richer search
  let categoryName = '';
  let collectionName = '';

  if (product.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: product.categoryId },
      select: { name: true },
    });
    categoryName = category?.name || '';
  }

  if (product.collectionId) {
    const collection = await prisma.collection.findUnique({
      where: { id: product.collectionId },
      select: { name: true },
    });
    collectionName = collection?.name || '';
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    shortDesc: product.shortDesc || '',
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() || null,
    categoryId: product.categoryId,
    categoryName,
    collectionId: product.collectionId || null,
    collectionName: collectionName || null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    images: product.images || [],
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Initializes the Meilisearch index with optimal settings for product search.
 *
 * - Sets searchable attributes: name, description, shortDesc, categoryName, collectionName
 * - Sets filterable attributes: isActive, isFeatured, categoryId, collectionId, price
 * - Sets sortable attributes: price, createdAt, updatedAt, position
 * - Sets distinct attribute: id
 *
 * Call this during app startup to ensure the index exists with proper configuration.
 */
export async function initializeIndex(): Promise<void> {
  try {
    // Create index if it doesn't exist (Meilisearch auto-creates on first add, but we can be explicit)
    await client.createIndex(INDEX_UID, { primaryKey: 'id' });

    const index = client.index(INDEX_UID);

    // Wait for index to be available
    await waitForIndexReady(index);

    // Configure searchable attributes - fields that will be full-text searched
    await index.updateSearchableAttributes([
      'name',
      'description',
      'shortDesc',
      'categoryName',
      'collectionName',
    ]);

    // Configure filterable attributes - fields that can be used in facet filters
    await index.updateFilterableAttributes([
      'isActive',
      'isFeatured',
      'categoryId',
      'collectionId',
      'price',
    ]);

    // Configure sortable attributes - fields that can be used for ordering
    await index.updateSortableAttributes([
      'price',
      'createdAt',
      'updatedAt',
    ]);

    // Configure distinct attribute - ensures unique results by id
    await index.updateDistinctAttribute('id');

    // Optional: Configure pagination settings via settings update
    await index.updateSettings({
      pagination: { maxTotalHits: 1000 },
    });

    console.log(`✅ Meilisearch index '${INDEX_UID}' initialized successfully`);
  } catch (error) {
    console.error('❌ Failed to initialize Meilisearch index:', error);
    throw error;
  }
}

/**
 * Checks the health of the Meilisearch instance.
 *
 * @returns {Promise<{healthy: boolean, message: string}>}
 */
export async function healthCheck(): Promise<{ healthy: boolean; message: string }> {
  try {
    const health = await client.health();
    if (health.status === 'available') {
      return {
        healthy: true,
        message: `Meilisearch is healthy`,
      };
    }
    return {
      healthy: false,
      message: `Meilisearch returned status: ${health.status}`,
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: `Meilisearch connection failed: ${error.message}`,
    };
  }
}

/**
 * Performs a full reindex of all products from the database.
 *
 * This function:
 * 1. Fetches all active products from the database
 * 2. Builds enriched documents with category/collection names
 * 3. Clears the existing Meilisearch index (or uses incremental update)
 * 4. Uploads all documents in batches
 *
 * @param {Object} options - Optional parameters
 * @param {number} options.batchSize - Number of documents to send per batch (default: 1000)
 * @param {boolean} options.onlyActive - Only index active products (default: true)
 */
export async function reindexAll(options: {
  batchSize?: number;
  onlyActive?: boolean;
} = {}): Promise<{ total: number; success: boolean }> {
  const { batchSize = 1000, onlyActive = true } = options;
  const index = client.index(INDEX_UID);

  try {
    console.log('🔄 Starting full reindex of products...');

    // Build query for fetching products
    const where: any = onlyActive ? { isActive: true } : {};
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDesc: true,
        price: true,
        salePrice: true,
        categoryId: true,
        collectionId: true,
        isActive: true,
        isFeatured: true,
        images: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = products.length;
    console.log(`📦 Found ${total} products to index`);

    // Build documents with enriched data
    const documents: ProductDocument[] = [];
    for (const product of products) {
      const doc = await buildProductDocument(product);
      documents.push(doc);
    }

    // Clear existing index (optional - depends on your strategy)
    // For a full reindex, we typically want to replace all data
    console.log('🗑️  Clearing existing index...');
    await index.deleteAllDocuments();

    // Add documents in batches
    console.log(`📤 Uploading ${total} documents in batches of ${batchSize}...`);
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await index.addDocuments(batch);
      console.log(`   Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
    }

    console.log(`✅ Reindex complete! ${total} products indexed.`);
    return { total, success: true };
  } catch (error) {
    console.error('❌ Reindex failed:', error);
    return { total: 0, success: false };
  }
}

/**
 * Helper function to wait for Meilisearch index to be ready
 */
async function waitForIndexReady(index: any, timeoutMs: number = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const task = await index.getTasks();
    if (task.status !== 'enqueued' && task.status !== 'processing') {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Timeout waiting for index to be ready');
}

// ============================================
// EXPORTS
// ============================================

export { client, INDEX_UID, reindexAll as syncAllToMeilisearch };
