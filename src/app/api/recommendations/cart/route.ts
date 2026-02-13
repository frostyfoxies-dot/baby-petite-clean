import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Product data for cart recommendations
 */
export interface CartRecommendationProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  images: Array<{
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
    inventory: {
      available: number;
      inStock: boolean;
    } | null;
  }>;
}

/**
 * Response type for cart recommendations
 */
export interface CartRecommendationsResponse {
  products: CartRecommendationProduct[];
}

// ============================================================================
// GET /api/recommendations/cart - Get recommendations based on cart contents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIds = searchParams.get('productIds')?.split(',').filter(Boolean) || [];
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean) || [];
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    // If no products in cart, return popular products
    if (productIds.length === 0) {
      const popularProducts = await prisma.product.findMany({
        where: {
          isActive: true,
        },
        include: {
          images: {
            where: { isPrimary: true },
            select: {
              url: true,
              altText: true,
              isPrimary: true,
            },
            take: 1,
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
                select: {
                  available: true,
                },
              },
            },
          },
        },
        orderBy: {
          popularityScore: 'desc',
        },
        take: limit,
      });

      const products: CartRecommendationProduct[] = popularProducts
        .filter((p) => p.variants.some((v) => v.inventory && v.inventory.available > 0))
        .map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice.toNumber(),
          compareAtPrice: product.compareAtPrice?.toNumber() || null,
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            size: v.size,
            color: v.color,
            price: v.price.toNumber(),
            inventory: v.inventory
              ? {
                  available: v.inventory.available,
                  inStock: v.inventory.available > 0,
                }
              : null,
          })),
        }));

      return NextResponse.json({ products });
    }

    // Find products frequently bought with cart items
    // First, find orders that contain any of the cart products
    const ordersWithProducts = await prisma.orderItem.findMany({
      where: {
        productId: { in: productIds },
      },
      select: {
        orderId: true,
      },
      distinct: ['orderId'],
    });

    const orderIds = ordersWithProducts.map((item) => item.orderId);

    let recommendedProducts: CartRecommendationProduct[] = [];

    if (orderIds.length > 0) {
      // Find other products in those orders
      const coOccurringProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          orderId: { in: orderIds },
          productId: { notIn: productIds },
        },
        _count: {
          productId: true,
        },
        orderBy: {
          _count: {
            productId: 'desc',
          },
        },
        take: limit * 2,
      });

      if (coOccurringProducts.length > 0) {
        const recommendedIds = coOccurringProducts.map((p) => p.productId);

        const products = await prisma.product.findMany({
          where: {
            id: { in: recommendedIds },
            isActive: true,
          },
          include: {
            images: {
              where: { isPrimary: true },
              select: {
                url: true,
                altText: true,
                isPrimary: true,
              },
              take: 1,
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
                  select: {
                    available: true,
                  },
                },
              },
            },
          },
        });

        // Sort by co-occurrence count and filter by availability
        const purchaseCountMap = new Map(
          coOccurringProducts.map((p) => [p.productId, p._count.productId])
        );

        recommendedProducts = products
          .filter((p) => p.variants.some((v) => v.inventory && v.inventory.available > 0))
          .sort((a, b) => {
            const countA = purchaseCountMap.get(a.id) || 0;
            const countB = purchaseCountMap.get(b.id) || 0;
            return countB - countA;
          })
          .slice(0, limit)
          .map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            basePrice: product.basePrice.toNumber(),
            compareAtPrice: product.compareAtPrice?.toNumber() || null,
            images: product.images,
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              size: v.size,
              color: v.color,
              price: v.price.toNumber(),
              inventory: v.inventory
                ? {
                    available: v.inventory.available,
                    inStock: v.inventory.available > 0,
                  }
                : null,
            })),
          }));
      }
    }

    // If not enough order-based recommendations, supplement with category-based
    if (recommendedProducts.length < limit && categoryIds.length > 0) {
      const existingIds = new Set([
        ...productIds,
        ...recommendedProducts.map((p) => p.id),
      ]);

      const categoryProducts = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          id: { notIn: Array.from(existingIds) },
          isActive: true,
        },
        include: {
          images: {
            where: { isPrimary: true },
            select: {
              url: true,
              altText: true,
              isPrimary: true,
            },
            take: 1,
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
                select: {
                  available: true,
                },
              },
            },
          },
        },
        orderBy: {
          popularityScore: 'desc',
        },
        take: limit - recommendedProducts.length,
      });

      const additionalProducts = categoryProducts
        .filter((p) => p.variants.some((v) => v.inventory && v.inventory.available > 0))
        .map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice.toNumber(),
          compareAtPrice: product.compareAtPrice?.toNumber() || null,
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            size: v.size,
            color: v.color,
            price: v.price.toNumber(),
            inventory: v.inventory
              ? {
                  available: v.inventory.available,
                  inStock: v.inventory.available > 0,
                }
              : null,
          })),
        }));

      recommendedProducts = [...recommendedProducts, ...additionalProducts];
    }

    // If still not enough, add popular products
    if (recommendedProducts.length < limit) {
      const existingIds = new Set([
        ...productIds,
        ...recommendedProducts.map((p) => p.id),
      ]);

      const popularProducts = await prisma.product.findMany({
        where: {
          id: { notIn: Array.from(existingIds) },
          isActive: true,
        },
        include: {
          images: {
            where: { isPrimary: true },
            select: {
              url: true,
              altText: true,
              isPrimary: true,
            },
            take: 1,
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
                select: {
                  available: true,
                },
              },
            },
          },
        },
        orderBy: {
          popularityScore: 'desc',
        },
        take: limit - recommendedProducts.length,
      });

      const additionalProducts = popularProducts
        .filter((p) => p.variants.some((v) => v.inventory && v.inventory.available > 0))
        .map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice.toNumber(),
          compareAtPrice: product.compareAtPrice?.toNumber() || null,
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            size: v.size,
            color: v.color,
            price: v.price.toNumber(),
            inventory: v.inventory
              ? {
                  available: v.inventory.available,
                  inStock: v.inventory.available > 0,
                }
              : null,
          })),
        }));

      recommendedProducts = [...recommendedProducts, ...additionalProducts];
    }

    const response: CartRecommendationsResponse = {
      products: recommendedProducts,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching cart recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
