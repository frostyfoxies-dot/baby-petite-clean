import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchProducts, searchCategories, getProductSuggestions } from '@/lib/algolia';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
} from '@/lib/errors';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'products', 'categories', 'collections']).default('all'),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export interface SearchResultProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  inStock: boolean;
}

export interface SearchResultCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

export interface SearchResultCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

export interface GlobalSearchResponse {
  query: string;
  products: SearchResultProduct[];
  categories: SearchResultCategory[];
  collections: SearchResultCollection[];
  suggestions: string[];
  totalResults: number;
}

// ============================================================================
// GET /api/search - Global search (products, categories, collections)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = searchQuerySchema.safeParse({
      q: searchParams.get('q') || undefined,
      type: searchParams.get('type') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!queryParams.success) {
      throw new BadRequestError('Invalid search parameters', queryParams.error.flatten());
    }

    const { q: query, type, limit } = queryParams.data;

    // Initialize results
    let products: SearchResultProduct[] = [];
    let categories: SearchResultCategory[] = [];
    let collections: SearchResultCollection[] = [];
    let suggestions: string[] = [];

    // Search products
    if (type === 'all' || type === 'products') {
      try {
        // Try Algolia search first
        const algoliaResults = await searchProducts(query, {
          hitsPerPage: limit,
        });

        // Get full product details
        const productIds = algoliaResults.hits.map((h) => h.objectID);
        if (productIds.length > 0) {
          const dbProducts = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: {
              images: {
                where: { isPrimary: true },
                select: { url: true, altText: true, isPrimary: true },
                take: 1,
              },
              category: {
                select: { id: true, name: true, slug: true },
              },
              variants: {
                where: { isActive: true },
                include: {
                  inventory: {
                    select: { available: true },
                  },
                },
              },
            },
          });

          products = dbProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            basePrice: p.basePrice.toNumber(),
            compareAtPrice: p.compareAtPrice?.toNumber() || null,
            images: p.images,
            category: p.category,
            inStock: p.variants.some((v) => (v.inventory?.available || 0) > 0),
          }));
        }

        // Get suggestions
        const algoliaSuggestions = await getProductSuggestions(query, 5);
        suggestions = algoliaSuggestions.map((s) => s.name);
      } catch (algoliaError) {
        console.error('Algolia search failed, falling back to database:', algoliaError);
        
        // Fallback to database search
        const dbProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } },
            ],
          },
          take: limit,
          include: {
            images: {
              where: { isPrimary: true },
              select: { url: true, altText: true, isPrimary: true },
              take: 1,
            },
            category: {
              select: { id: true, name: true, slug: true },
            },
            variants: {
              where: { isActive: true },
              include: {
                inventory: {
                  select: { available: true },
                },
              },
            },
          },
        });

        products = dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          basePrice: p.basePrice.toNumber(),
          compareAtPrice: p.compareAtPrice?.toNumber() || null,
          images: p.images,
          category: p.category,
          inStock: p.variants.some((v) => (v.inventory?.available || 0) > 0),
        }));
      }
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      try {
        // Try Algolia search first
        const algoliaCategories = await searchCategories(query, {
          hitsPerPage: limit,
        });

        const categoryIds = algoliaCategories.hits.map((h) => h.objectID);
        if (categoryIds.length > 0) {
          const dbCategories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              imageUrl: true,
            },
          });

          // Get product counts
          const productCounts = await prisma.product.groupBy({
            by: ['categoryId'],
            where: { isActive: true },
            _count: { id: true },
          });

          const countMap = new Map(productCounts.map((c) => [c.categoryId, c._count.id]));

          categories = dbCategories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            imageUrl: c.imageUrl,
            productCount: countMap.get(c.id) || 0,
          }));
        }
      } catch {
        // Fallback to database search
        const dbCategories = await prisma.category.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            imageUrl: true,
            _count: {
              select: { products: { where: { isActive: true } } },
            },
          },
        });

        categories = dbCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
          productCount: c._count.products,
        }));
      }
    }

    // Search collections (from Sanity CMS)
    if (type === 'all' || type === 'collections') {
      try {
        // Collections are stored in Sanity, so we'd query Sanity here
        // For now, we'll return empty array as collections are managed in CMS
        // In production, this would use the Sanity client to search collections
        collections = [];
      } catch (error) {
        console.error('Collection search failed:', error);
        collections = [];
      }
    }

    const totalResults = products.length + categories.length + collections.length;

    const response: GlobalSearchResponse = {
      query,
      products,
      categories,
      collections,
      suggestions,
      totalResults,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
