/**
 * Sync Products from Sanity CMS to PostgreSQL
 * Plain JavaScript (CommonJS) – no TypeScript, no tsx
 */

const { createClient } = require('@sanity/client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const PRODUCTS_QUERY = `*[_type == "product" && !(_id in path("drafts.**"))] {
  _id,
  name,
  slug,
  description,
  "shortDescription": coalesce(description[0].children[0].text, ""),
  price,
  compareAtPrice,
  sku,
  stock,
  lowStockThreshold,
  categories[]->{ _id, name, slug },
  "images": images[] {
    _key,
    "url": asset->url,
    alt,
    hotspot,
    isPrimary
  },
  variants[] {
    _key,
    name,
    size,
    color,
    colorCode,
    price,
    compareAtPrice,
    sku,
    barcode,
    weight,
    dimensions,
    isActive
  },
  isNew,
  isFeatured,
  isBestseller,
  seo,
  "sourceData": sourceData {
    aliExpressProductId,
    aliExpressUrl,
    supplierId,
    originalPrice,
    originalCurrency,
    lastSynced,
    sourceStatus
  },
  "variantMapping": variantMapping[] {
    localVariantSku,
    aliExpressSku,
    aliExpressVariantName
  },
  minAge,
  maxAge,
  chokingHazard,
  chokingHazardText,
  certifications,
  countryOfOrigin,
  careInstructions
}`;

async function syncProducts() {
  console.log('Fetching products from Sanity...');
  const products = await client.fetch(PRODUCTS_QUERY);
  console.log(`Fetched ${products.length} products from Sanity.`);

  for (const product of products) {
    for (const cat of (product.categories || [])) {
      await prisma.category.upsert({
        where: { id: cat._id },
        update: { name: cat.name, slug: cat.slug },
        create: { id: cat._id, name: cat.name, slug: cat.slug, isActive: true },
      });
    }

    const slug = typeof product.slug === 'string' ? product.slug : (product.slug?.current || product.slug);
    const description = product.description?.[0]?.children?.map(c => c.text).join('\n') || '';

    const dbProduct = await prisma.product.upsert({
      where: { id: product._id },
      update: {
        name: product.name,
        slug,
        description,
        shortDescription: product.shortDescription,
        basePrice: product.price || 0,
        compareAtPrice: product.compareAtPrice || null,
        sku: product.sku,
        categoryId: product.categories[0]?._id || null,
        isActive: true,
        isFeatured: product.isFeatured || false,
        isNew: product.isNew || false,
        isOnSale: !!product.compareAtPrice,
        metaTitle: product.seo?.title || null,
        metaDescription: product.seo?.description || null,
        metaKeywords: product.seo?.keywords?.join(', ') || null,
        minAge: product.minAge ?? null,
        maxAge: product.maxAge ?? null,
        chokingHazard: product.chokingHazard || false,
        chokingHazardText: product.chokingHazardText || null,
        certifications: product.certifications || [],
        countryOfOrigin: product.countryOfOrigin || null,
        careInstructions: typeof product.careInstructions === 'string' ? product.careInstructions : JSON.stringify(product.careInstructions),
        popularityScore: 0,
        aiTags: [],
      },
      create: {
        id: product._id,
        name: product.name,
        slug,
        description,
        shortDescription: product.shortDescription,
        basePrice: product.price || 0,
        compareAtPrice: product.compareAtPrice || null,
        sku: product.sku,
        categoryId: product.categories[0]?._id || null,
        isActive: true,
        isFeatured: product.isFeatured || false,
        isNew: product.isNew || false,
        isOnSale: !!product.compareAtPrice,
        metaTitle: product.seo?.title || null,
        metaDescription: product.seo?.description || null,
        metaKeywords: product.seo?.keywords?.join(', ') || null,
        minAge: product.minAge ?? null,
        maxAge: product.maxAge ?? null,
        chokingHazard: product.chokingHazard || false,
        chokingHazardText: product.chokingHazardText || null,
        certifications: product.certifications || [],
        countryOfOrigin: product.countryOfOrigin || null,
        careInstructions: typeof product.careInstructions === 'string' ? product.careInstructions : JSON.stringify(product.careInstructions),
        popularityScore: 0,
        aiTags: [],
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: dbProduct.id } });
    await prisma.variant.deleteMany({ where: { productId: dbProduct.id } });

    for (const img of (product.images || [])) {
      await prisma.productImage.create({
        data: {
          id: `${dbProduct.id}-${img._key}`,
          productId: dbProduct.id,
          url: img.url,
          altText: img.alt || product.name,
          width: 0,
          height: 0,
          sortOrder: 0,
          isPrimary: img.isPrimary || false,
        },
      });
    }

    for (const v of (product.variants || [])) {
      await prisma.variant.create({
        data: {
          id: `${dbProduct.id}-${v._key}`,
          productId: dbProduct.id,
          name: v.name,
          size: v.size,
          color: v.color,
          colorCode: v.colorCode,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price || 0,
          compareAtPrice: v.compareAtPrice || null,
          weight: v.weight ? parseFloat(v.weight) : null,
          dimensions: typeof v.dimensions === 'string' ? v.dimensions : JSON.stringify(v.dimensions),
          isActive: v.isActive !== false,
        },
      });
    }

    console.log(`Synced product: ${product.name}`);
  }

  console.log('✅ Sanity → PostgreSQL sync complete!');
  await prisma.$disconnect();
}

syncProducts().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
