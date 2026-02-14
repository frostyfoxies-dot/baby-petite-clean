import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductDetailResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  sku: string;
  barcode: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  };
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isOnSale: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  // Compliance
  minAge?: number | null;
  maxAge?: number | null;
  chokingHazard?: boolean;
  chokingHazardText?: string | null;
  certifications?: string[];
  countryOfOrigin?: string | null;
  careInstructions?: string | null;
  popularityScore: number;
  aiTags: string[];
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
    isPrimary: boolean;
    variantId: string | null;
  }>;
  variants: Array<{
    id: string;
    name: string;
    size: string;
    color: string | null;
    colorCode: string | null;
    price: number;
    compareAtPrice: number | null;
    sku: string;
    barcode: string | null;
    weight: number | null;
    dimensions: Record<string, unknown> | null;
    isActive: boolean;
    inventory: {
      quantity: number;
      reservedQuantity: number;
      available: number;
      lowStockThreshold: number;
      inStock: boolean;
    } | null;
  }>;
  reviews: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
  };
  relatedProducts: Array<{
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    compareAtPrice: number | null;
    images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

// ============================================================================
// GET /api/products/[slug] - Get single product by slug
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            width: true,
            height: true,
            isPrimary: true,
            variantId: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            size: true,
            color: true,
            colorCode: true,
            price: true,
            compareAtPrice: true,
            sku: true,
            barcode: true,
            weight: true,
            dimensions: true,
            isActive: true,
            inventory: {
              select: {
                quantity: true,
                reservedQuantity: true,
                available: true,
                lowStockThreshold: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          select: {
            rating: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Get related products from the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 8,
      orderBy: { popularityScore: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        compareAtPrice: true,
        images: {
          where: { isPrimary: true },
          select: { url: true, altText: true, isPrimary: true },
          take: 1,
        },
      },
    });

    // Calculate review statistics
    const reviewDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    for (const review of product.reviews) {
      reviewDistribution[review.rating] = (reviewDistribution[review.rating] || 0) + 1;
      totalRating += review.rating;
    }
    const averageRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

    const response: ProductDetailResponse = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      basePrice: product.basePrice.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() || null,
      costPrice: product.costPrice?.toNumber() || null,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      tags: product.tags,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isOnSale: product.isOnSale,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      metaKeywords: product.metaKeywords,
      // Compliance
      minAge: product.minAge ?? null,
      maxAge: product.maxAge ?? null,
      chokingHazard: product.chokingHazard,
      chokingHazardText: product.chokingHazardText ?? null,
      certifications: product.certifications ?? [],
      countryOfOrigin: product.countryOfOrigin ?? null,
      careInstructions: product.careInstructions ?? null,
      popularityScore: product.popularityScore,
      aiTags: product.aiTags,
      images: product.images,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        size: v.size,
        color: v.color,
        colorCode: v.colorCode,
        price: v.price.toNumber(),
        compareAtPrice: v.compareAtPrice?.toNumber() || null,
        sku: v.sku,
        barcode: v.barcode,
        weight: v.weight,
        dimensions: v.dimensions as Record<string, unknown> | null,
        isActive: v.isActive,
        inventory: v.inventory
          ? {
              quantity: v.inventory.quantity,
              reservedQuantity: v.inventory.reservedQuantity,
              available: v.inventory.available,
              lowStockThreshold: v.inventory.lowStockThreshold,
              inStock: v.inventory.available > 0,
            }
          : null,
      })),
      reviews: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: product.reviews.length,
        distribution: reviewDistribution,
      },
      relatedProducts: relatedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: p.basePrice.toNumber(),
        compareAtPrice: p.compareAtPrice?.toNumber() || null,
        images: p.images,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      publishedAt: product.publishedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
