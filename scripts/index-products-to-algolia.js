/**
 * Index Products to Algolia
 * Plain JavaScript (CommonJS) – no TypeScript, no tsx
 */

const algoliasearch = require('algoliasearch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function indexProducts() {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_KEY;

  if (!appId || !adminKey) {
    console.error('Missing Algolia credentials. Set NEXT_PUBLIC_ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY.');
    process.exit(1);
  }

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex('products');

  console.log('Fetching products from database...');

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      variants: {
        where: { isActive: true },
        select: {
          color: true,
          size: true,
          inventory: {
            select: { available: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  console.log(`Fetched ${products.length} products. Transforming...`);

  const records = products.map((product) => {
    const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
    const sizes = [...new Set(product.variants.map(v => v.size))];
    const inStock = product.variants.some(v => v.inventory?.available && v.inventory.available > 0);

    return {
      objectID: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      basePrice: parseFloat(product.basePrice.toFixed(2)),
      compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toFixed(2)) : null,
      category: product.category.name,
      categoryId: product.category.id,
      categorySlug: product.category.slug,
      colors,
      sizes,
      inStock,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      updatedAt: product.updatedAt.getTime(),
    };
  });

  console.log(`Uploading ${records.length} records to Algolia...`);

  const batchSize = 1000;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const result = await index.saveObjects(batch);
    console.log(`Batch ${Math.floor(i / batchSize) + 1} uploaded. Task ID: ${result.taskID}`);
  }

  console.log('✅ Indexing complete!');

  const stats = await index.getStats();
  console.log('Index stats:', {
    entries: stats.entries,
    pendingTasks: stats.pendingTasks,
  });

  await prisma.$disconnect();
}

indexProducts().catch(err => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
