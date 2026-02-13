import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/session';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '@/lib/errors';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const addWishlistItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export interface WishlistItemResponse {
  id: string;
  productId: string;
  variantId: string | null;
  notes: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    compareAtPrice: number | null;
    isActive: boolean;
    images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  variant?: {
    id: string;
    name: string;
    size: string;
    color: string | null;
    price: number;
    inStock: boolean;
  } | null;
  createdAt: Date;
}

export interface WishlistResponse {
  id: string;
  name: string;
  itemCount: number;
  items: WishlistItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: {
        userId,
        name: 'My Wishlist',
        isDefault: true,
      },
    });
  }

  return wishlist;
}

// ============================================================================
// GET /api/wishlist - Get user's wishlist
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get or create wishlist
    const wishlist = await getOrCreateWishlist(user.id);

    // Get wishlist items with product details
    const wishlistWithItems = await prisma.wishlist.findUnique({
      where: { id: wishlist.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                inventory: {
                  select: { available: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wishlistWithItems) {
      throw new NotFoundError('Wishlist not found');
    }

    // Get product details for all items
    const productIds = wishlistWithItems.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
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
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items: WishlistItemResponse[] = wishlistWithItems.items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        notes: item.notes,
        product: product
          ? {
              id: product.id,
              name: product.name,
              slug: product.slug,
              basePrice: product.basePrice.toNumber(),
              compareAtPrice: product.compareAtPrice?.toNumber() || null,
              isActive: product.isActive,
              images: product.images,
              category: product.category,
            }
          : {
              id: item.productId,
              name: 'Unknown Product',
              slug: '',
              basePrice: 0,
              compareAtPrice: null,
              isActive: false,
              images: [],
              category: { id: '', name: '', slug: '' },
            },
        variant: item.variant
          ? {
              id: item.variant.id,
              name: item.variant.name,
              size: item.variant.size,
              color: item.variant.color,
              price: item.variant.price.toNumber(),
              inStock: (item.variant.inventory?.available || 0) > 0,
            }
          : null,
        createdAt: item.createdAt,
      };
    });

    const response: WishlistResponse = {
      id: wishlistWithItems.id,
      name: wishlistWithItems.name,
      itemCount: wishlistWithItems.items.length,
      items,
      createdAt: wishlistWithItems.createdAt,
      updatedAt: wishlistWithItems.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/wishlist - Add item to wishlist
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addWishlistItemSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify variant if provided
    if (data.variantId) {
      const variant = await prisma.variant.findUnique({
        where: { id: data.variantId },
        select: { id: true, productId: true },
      });

      if (!variant || variant.productId !== data.productId) {
        throw new NotFoundError('Variant not found or does not belong to product');
      }
    }

    // Get or create wishlist
    const wishlist = await getOrCreateWishlist(user.id);

    // Check if item already exists
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: data.productId,
        variantId: data.variantId || null,
      },
    });

    if (existingItem) {
      throw new ConflictError('This item is already in your wishlist');
    }

    // Add item to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: data.productId,
        variantId: data.variantId,
        notes: data.notes,
      },
      include: {
        variant: {
          include: {
            inventory: {
              select: { available: true },
            },
          },
        },
      },
    });

    // Get product details
    const productDetails = await prisma.product.findUnique({
      where: { id: data.productId },
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

    const response: WishlistItemResponse = {
      id: wishlistItem.id,
      productId: wishlistItem.productId,
      variantId: wishlistItem.variantId,
      notes: wishlistItem.notes,
      product: productDetails
        ? {
            id: productDetails.id,
            name: productDetails.name,
            slug: productDetails.slug,
            basePrice: productDetails.basePrice.toNumber(),
            compareAtPrice: productDetails.compareAtPrice?.toNumber() || null,
            isActive: productDetails.isActive,
            images: productDetails.images,
            category: productDetails.category,
          }
        : {
            id: wishlistItem.productId,
            name: 'Unknown Product',
            slug: '',
            basePrice: 0,
            compareAtPrice: null,
            isActive: false,
            images: [],
            category: { id: '', name: '', slug: '' },
          },
      variant: wishlistItem.variant
        ? {
            id: wishlistItem.variant.id,
            name: wishlistItem.variant.name,
            size: wishlistItem.variant.size,
            color: wishlistItem.variant.color,
            price: wishlistItem.variant.price.toNumber(),
            inStock: (wishlistItem.variant.inventory?.available || 0) > 0,
          }
        : null,
      createdAt: wishlistItem.createdAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
