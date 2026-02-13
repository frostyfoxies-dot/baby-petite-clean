import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).default('newest'),
});

export interface CategoryDetailResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    productCount: number;
  }>;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  products: {
    items: Array<{
      id: string;
      name: string;
      slug: string;
      shortDescription: string | null;
      basePrice: number;
      compareAtPrice: number | null;
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
      isFeatured: boolean;
      isOnSale: boolean;
    }>;
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
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
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

// ============================================================================
// GET /api/categories/[slug] - Get category by slug with products
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = productQuerySchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sort: searchParams.get('sort') || undefined,
    });

    if (!queryParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryParams.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, sort } = queryParams.data;
    const skip = (page - 1) * limit;

    // Get category with parent and children
    const category = await prisma.category.findUnique({
      where: { slug, isActive: true },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, imageUrl: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Get products in this category with pagination
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: category.id,
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: getOrderBy(sort),
        include: {
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
      prisma.product.count({
        where: {
          categoryId: category.id,
          isActive: true,
        },
      }),
    ]);

    // Get product counts for child categories
    const childCounts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: { in: category.children.map((c) => c.id) },
        isActive: true,
      },
      _count: { id: true },
    });

    const childCountMap = new Map(
      childCounts.map((item) => [item.categoryId, item._count.id])
    );

    // Transform products
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      basePrice: product.basePrice.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() || null,
      images: product.images,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        size: v.size,
        color: v.color,
        price: v.price.toNumber(),
        inStock: (v.inventory?.available || 0) > 0,
      })),
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
    }));

    const totalPages = Math.ceil(totalProducts / limit);

    const response: CategoryDetailResponse = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      parent: category.parent,
      children: category.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        imageUrl: child.imageUrl,
        productCount: childCountMap.get(child.id) || 0,
      })),
      productCount: totalProducts,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      products: {
        items: transformedProducts,
        pagination: {
          page,
          limit,
          totalItems: totalProducts,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
