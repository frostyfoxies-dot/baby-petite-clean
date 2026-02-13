import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateRecommendations } from '@/lib/openai';
import { z } from 'zod';
import {
  AppError,
  UnauthorizedError,
} from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendationItem {
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
  score: number;
  reason: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  source: 'personalized' | 'popular' | 'trending';
}

// ============================================================================
// GET /api/recommendations - Get personalized recommendations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // If user is authenticated, try to get personalized recommendations
    if (user) {
      // Get user's browsing history, purchase history, and preferences
      const [browsingHistory, purchaseHistory, cartItems, wishlistItems, registryItems] = await Promise.all([
        // Browsing history (recently viewed products)
        prisma.userBehavior.findMany({
          where: {
            userId: user.id,
            eventType: 'VIEW',
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { productId: true },
        }),
        // Purchase history
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            items: {
              select: { productId: true },
            },
          },
        }),
        // Current cart items
        prisma.cart.findUnique({
          where: { userId: user.id },
          select: {
            items: {
              select: { variant: { select: { productId: true } } },
            },
          },
        }),
        // Wishlist items
        prisma.wishlist.findUnique({
          where: { userId: user.id },
          select: {
            items: {
              select: { productId: true },
            },
          },
        }),
        // Registry items
        prisma.registry.findUnique({
          where: { userId: user.id },
          select: {
            items: {
              select: { productId: true },
            },
          },
        }),
      ]);

      // Extract product IDs
      const browsedProductIds = browsingHistory.map((b) => b.productId).filter(Boolean) as string[];
      const purchasedProductIds = purchaseHistory.flatMap((o) => o.items.map((i) => i.productId));
      const cartProductIds = cartItems?.items.map((i) => i.variant.productId) || [];
      const wishlistProductIds = wishlistItems?.items.map((i) => i.productId) || [];
      const registryProductIds = registryItems?.items.map((i) => i.productId) || [];

      // Get available products for recommendation
      const availableProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: [...purchasedProductIds, ...cartProductIds] }, // Exclude already owned/in cart
        },
        take: 50,
        select: {
          id: true,
          name: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          basePrice: true,
          compareAtPrice: true,
          tags: true,
        },
      });

      // If we have enough user data, use AI for personalized recommendations
      if (browsedProductIds.length > 0 || purchasedProductIds.length > 0) {
        try {
          const aiRecommendations = await generateRecommendations(
            {
              browsingHistory: browsedProductIds,
              purchaseHistory: purchasedProductIds,
              cartItems: cartProductIds,
              wishlistItems: wishlistProductIds,
              registryItems: registryProductIds,
            },
            availableProducts.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category.name,
              price: p.basePrice.toNumber(),
              tags: p.tags,
            }))
          );

          // Get full product details for recommended products
          const recommendedProductIds = aiRecommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((r) => r.productId);

          const products = await prisma.product.findMany({
            where: { id: { in: recommendedProductIds } },
            include: {
              images: {
                where: { isPrimary: true },
                select: { url: true, altText: true, isPrimary: true },
                take: 1,
              },
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          });

          const productMap = new Map(products.map((p) => [p.id, p]));

          const recommendations: RecommendationItem[] = aiRecommendations
            .filter((r) => productMap.has(r.productId))
            .slice(0, limit)
            .map((r) => {
              const product = productMap.get(r.productId)!;
              return {
                id: product.id,
                name: product.name,
                slug: product.slug,
                basePrice: product.basePrice.toNumber(),
                compareAtPrice: product.compareAtPrice?.toNumber() || null,
                images: product.images,
                category: product.category,
                score: r.score,
                reason: r.reason,
              };
            });

          return NextResponse.json({
            recommendations,
            source: 'personalized',
          } as RecommendationsResponse);
        } catch (aiError) {
          console.error('AI recommendations failed, falling back to popular:', aiError);
          // Fall through to popular products
        }
      }
    }

    // Fallback: Get popular products
    const popularProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { popularityScore: 'desc' },
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
      },
    });

    const recommendations: RecommendationItem[] = popularProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() || null,
      images: product.images,
      category: product.category,
      score: product.popularityScore,
      reason: 'Popular with other parents',
    }));

    return NextResponse.json({
      recommendations,
      source: 'popular',
    } as RecommendationsResponse);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
