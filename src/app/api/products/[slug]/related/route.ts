import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Product data for frequently bought together recommendations
 */
export interface FrequentlyBoughtProduct {
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
  category: {
    id: string;
    name: string;
    slug: string;
  };
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
  purchaseCount: number;
}

/**
 * Response type for the frequently bought together endpoint
 */
export interface FrequentlyBoughtResponse {
  products: FrequentlyBoughtProduct[];
  algorithm: 'order-based' | 'category-based';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find products frequently bought together based on order data
 * Uses order item co-occurrence to identify products often purchased together
 */
async function findProductsFromOrders(
  productId: string,
  limit: number = 3
): Promise<FrequentlyBoughtProduct[]> {
  // Find orders that contain the current product
  const ordersWithProduct = await prisma.orderItem.findMany({
    where: {
      productId,
    },
    select: {
      orderId: true,
    },
    distinct: ['orderId'],
  });

  const orderIds = ordersWithProduct.map((item) => item.orderId);

  if (orderIds.length === 0) {
    return [];
  }

  // Find other products in those orders (excluding the current product)
  const coOccurringProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      orderId: { in: orderIds },
      productId: { not: productId },
    },
    _count: {
      productId: true,
    },
    orderBy: {
      _count: {
        productId: 'desc',
      },
    },
    take: limit * 2, // Get more than needed to filter by availability
  });

  if (coOccurringProducts.length === 0) {
    return [];
  }

  // Fetch full product details for the co-occurring products
  const productIds = coOccurringProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
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

  // Create a map for quick lookup of purchase counts
  const purchaseCountMap = new Map(
    coOccurringProducts.map((p) => [p.productId, p._count.productId])
  );

  // Filter products with available stock and sort by purchase count
  const availableProducts = products
    .filter((product) =>
      product.variants.some((v) => v.inventory && v.inventory.available > 0)
    )
    .sort((a, b) => {
      const countA = purchaseCountMap.get(a.id) || 0;
      const countB = purchaseCountMap.get(b.id) || 0;
      return countB - countA;
    })
    .slice(0, limit);

  return availableProducts.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice.toNumber(),
    compareAtPrice: product.compareAtPrice?.toNumber() || null,
    images: product.images,
    category: product.category,
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
    purchaseCount: purchaseCountMap.get(product.id) || 0,
  }));
}

/**
 * Find products from the same category as fallback
 * Used when there's not enough order data
 */
async function findProductsFromCategory(
  productId: string,
  categoryId: string,
  limit: number = 3
): Promise<FrequentlyBoughtProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      id: { not: productId },
      isActive: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
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
    orderBy: [
      { popularityScore: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit * 2, // Get more to filter by availability
  });

  // Filter products with available stock
  const availableProducts = products
    .filter((product) =>
      product.variants.some((v) => v.inventory && v.inventory.available > 0)
    )
    .slice(0, limit);

  return availableProducts.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice.toNumber(),
    compareAtPrice: product.compareAtPrice?.toNumber() || null,
    images: product.images,
    category: product.category,
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
    purchaseCount: 0, // Not from order data
  }));
}

// ============================================================================
// GET /api/products/[slug]/related - Get frequently bought together products
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    // First, get the product to find its ID and category
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        categoryId: true,
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Try to find products from order data first
    let products = await findProductsFromOrders(product.id, limit);
    let algorithm: 'order-based' | 'category-based' = 'order-based';

    // Fall back to category-based recommendations if not enough order data
    if (products.length < 2) {
      const categoryProducts = await findProductsFromCategory(
        product.id,
        product.categoryId,
        limit
      );

      // Merge results, preferring order-based products
      const existingIds = new Set(products.map((p) => p.id));
      const additionalProducts = categoryProducts.filter(
        (p) => !existingIds.has(p.id)
      );

      products = [...products, ...additionalProducts].slice(0, limit);
      algorithm = products.some((p) => p.purchaseCount > 0)
        ? 'order-based'
        : 'category-based';
    }

    const response: FrequentlyBoughtResponse = {
      products,
      algorithm,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching frequently bought together products:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
