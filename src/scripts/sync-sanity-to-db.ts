/**
 * Sync Products from Sanity CMS to PostgreSQL
 *
 * This script fetches all published products from Sanity and upserts them into the PostgreSQL database.
 * It ensures the local DB has a mirror of product data for fast queries, while Sanity remains the source of truth.
 *
 * Usage:
 *   npx tsx src/scripts/sync-sanity-to-db.ts
 *
 * Requirements:
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - SANITY_API_TOKEN (with Editor role)
 *   - DATABASE_URL
 */

import { createClient } from '@sanity/client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Sanity client configuration
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01', // Use current date or fixed version
  useCdn: false, // Get latest data, not cached
  token: process.env.SANITY_API_TOKEN, // For write access (needed for draft queries)
});

// GROQ query to fetch all products with necessary fields
const PRODUCTS_QUERY = `
  *[_type == "product" && !(_id in path("drafts.**"))] {
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
    // Compliance fields
    minAge,
    maxAge,
    chokingHazard,
    chokingHazardText,
    certifications,
    countryOfOrigin,
    careInstructions
  }
`;

async function syncProducts() {
  console.log('Fetching products from Sanity...');

  const products = await client.fetch(PRODUCTS_QUERY);

  console.log(`Fetched ${products.length} products from Sanity.`);

  for (const product of products) {
    // Upsert category first (assuming categories already exist; otherwise create them)
    for (const cat of product.categories || []) {
      await prisma.category.upsert({
        where: { id: cat._id },
        update: {
          name: cat.name,
          slug: cat.slug,
        },
        create: {
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
          isActive: true,
        },
      });
    }

    // Upsert product
    const dbProduct = await prisma.product.upsert({
      where: { id: product._id },
      update: {
        name: product.name,
        slug: product.slug.current || product.slug,
        description: product.description?.[0]?.children?.map((c: any) => c.text).join('\n') || '',
        shortDescription: product.shortDescription,
        basePrice: product.price || 0,
        compareAtPrice: product.compareAtPrice || null,
        sku: product.sku,
        costPrice: product.sourceData?.originalPrice ? product.sourceData.originalPrice / 100 : null,
        categoryId: product.categories[0]?._id || null,
        tags: [], // TODO: map tags if present
        isActive: true,
        isFeatured: product.isFeatured || false,
        isNew: product.isNew || false,
        isOnSale: !!product.compareAtPrice,
        metaTitle: product.seo?.title || null,
        metaDescription: product.seo?.description || null,
        metaKeywords: product.seo?.keywords?.join(', ') || null,
        // Compliance
        minAge: product.minAge ?? null,
        maxAge: product.maxAge ?? null,
        chokingHazard: product.chokingHazard || false,
        chokingHazardText: product.chokingHazardText || null,
        certifications: product.certifications || [],
        countryOfOrigin: product.countryOfOrigin || null,
        careInstructions: typeof product.careInstructions === 'string'
          ? product.careInstructions
          : JSON.stringify(product.careInstructions),
        // AI fields
        popularityScore: 0,
        aiTags: [],
      },
      create: {
        id: product._id,
        name: product.name,
        slug: product.slug.current || product.slug,
        description: product.description?.[0]?.children?.map((c: any) => c.text).join('\n') || '',
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
        careInstructions: typeof product.careInstructions === 'string'
          ? product.careInstructions
          : JSON.stringify(product.careInstructions),
        popularityScore: 0,
        aiTags: [],
      },
    });

    // Delete old images/variants and recreate (simplified sync)
    await prisma.productImage.deleteMany({ where: { productId: dbProduct.id } });
    await prisma.variant.deleteMany({ where: { productId: dbProduct.id } });

    // Insert images
    for (const img of product.images || []) {
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

    // Insert variants
    for (const variant of product.variants || []) {
      const variantRecord = await prisma.variant.create({
        data: {
          id: `${dbProduct.id}-${variant._key}`,
          productId: dbProduct.id,
          name: variant.name,
          size: variant.size,
          color: variant.color || null,
          colorCode: variant.colorCode || null,
          price: variant.price / 100,
          compareAtPrice: variant.compareAtPrice ? variant.compareAtPrice / 100 : null,
          sku: variant.sku,
          barcode: variant.barcode || null,
          weight: variant.weight || null,
          dimensions: variant.dimensions ? JSON.stringify(variant.dimensions) : null,
          isActive: variant.isActive,
        },
      });

      // Create inventory record (initial stock from Sanity)
      await prisma.inventory.create({
        data: {
          variantId: variantRecord.id,
          quantity: product.stock || 0,
          reservedQuantity: 0,
          available: product.stock || 0,
          lowStockThreshold: product.lowStockThreshold || 10,
          reorderPoint: 20,
          reorderQuantity: 50,
        },
      });
    }

    console.log(`Synced product: ${product.name} (${dbProduct.id})`);
  }

  console.log('✅ Sanity → PostgreSQL sync complete!');
}

syncProducts()
  .then(() => {
    console.log('Closing Prisma connection...');
    prisma.$disconnect();
  })
  .catch((err) => {
    console.error('Sync failed:', err);
    prisma.$disconnect();
    process.exit(1);
  });
