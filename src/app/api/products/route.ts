import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AppError, BadRequestError, InternalServerError } from '@/lib/errors';
import { Prisma } from '@prisma/client';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating']).default('newest'),
  search: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isOnSale: z.coerce.boolean().optional(),
});

export type ProductQueryParams = z.infer<typeof productQuerySchema>;

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
  }>;
  variants: Array<{
    id: string;
    name: string;
    size: string;
    color: string | null;
    price: number;
    inStock: boolean;
  }>;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  popularityScore: number;
  createdAt: Date;
}

export interface PaginatedProductsResponse {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    categories: Array<{ id: string; name: string; slug: string; count: number }>;
    colors: Array<{ name: string; count: number }>;
    sizes: Array<{ name: string; count: number }>;
    priceRange: { min: number; max: number };
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':
      return { basePrice: 'asc' };
    case 'price_desc':
      return { basePrice: 'desc' };
    case 'popular':
      return { popularityScore: 'desc' };
    case 'rating':
      return { popularityScore: 'desc' }; // Using popularityScore as rating proxy
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

// ============================================================================
// GET /api/products - List products with pagination, filtering, sorting
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = productQuerySchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      size: searchParams.get('size') || undefined,
      color: searchParams.get('color') || undefined,
      sort: searchParams.get('sort') || undefined,
      search: searchParams.get('search') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      isFeatured: searchParams.get('isFeatured') || undefined,
      isOnSale: searchParams.get('isOnSale') || undefined,
    });

    if (!queryParams.success) {
      throw new BadRequestError('Invalid query parameters', queryParams.error.flatten());
    }

    const { page, limit, category, minPrice, maxPrice, size, color, sort, search, inStock, isFeatured, isOnSale } = queryParams.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Category filter
    if (category) {
      where.category = {
        slug: category,
      };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) {
        where.basePrice.gte = new Prisma.Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        where.basePrice.lte = new Prisma.Decimal(maxPrice);
      }
    }

    // Variant filters (size, color, stock)
    if (size || color || inStock) {
      where.variants = {
        some: {
          isActive: true,
          ...(size && { size }),
          ...(color && { color }),
          ...(inStock && {
            inventory: {
              available: { gt: 0 },
            },
          }),
        },
      };
    }

    // Featured filter
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    // Sale filter
    if (isOnSale !== undefined) {
      where.isOnSale = isOnSale;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Execute queries in parallel
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: getOrderBy(sort),
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            select: { id: true, url: true, altText: true, isPrimary: true },
            orderBy: { sortOrder: 'asc' },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              size: true,
              color: true,
              price: true,
              inventory: {
                select: { available: true },
              },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Transform products for response
    const transformedProducts: ProductListItem[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      basePrice: product.basePrice.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() || null,
      category: product.category,
      images: product.images,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        size: v.size,
        color: v.color,
        price: v.price.toNumber(),
        inStock: (v.inventory?.available || 0) > 0,
      })),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      popularityScore: product.popularityScore,
      createdAt: product.createdAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    // Get filter options (facets)
    const [categories, colors, sizes, priceStats] = await Promise.all([
      // Get categories with product counts
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      }),
      // Get distinct colors
      prisma.variant.findMany({
        where: { isActive: true, color: { not: null } },
        select: { color: true },
        distinct: ['color'],
      }),
      // Get distinct sizes
      prisma.variant.findMany({
        where: { isActive: true },
        select: { size: true },
        distinct: ['size'],
      }),
      // Get price range
      prisma.product.aggregate({
        where: { isActive: true },
        _min: { basePrice: true },
        _max: { basePrice: true },
      }),
    ]);

    // Get product counts per category
    const categoryCounts = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        count: await prisma.product.count({
          where: { categoryId: cat.id, isActive: true },
        }),
      }))
    );

    const response: PaginatedProductsResponse = {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        categories: categoryCounts.filter((c) => c.count > 0),
        colors: colors
          .filter((c) => c.color)
          .map((c) => ({ name: c.color!, count: 0 })), // Count would need separate query
        sizes: sizes.map((s) => ({ name: s.size, count: 0 })),
        priceRange: {
          min: priceStats._min.basePrice?.toNumber() || 0,
          max: priceStats._max.basePrice?.toNumber() || 0,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
