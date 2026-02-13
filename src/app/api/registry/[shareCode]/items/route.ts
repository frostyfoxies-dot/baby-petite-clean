import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { registryItemSchema } from '@/lib/validators';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors';
import { Priority } from '@prisma/client';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const addRegistryItemSchema = registryItemSchema.extend({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
});

export interface RegistryItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  quantityPurchased: number;
  priority: Priority;
  notes: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: Array<{ url: string; altText: string | null }>;
  };
  variant?: {
    id: string;
    size: string;
    color: string | null;
    price: number;
  } | null;
}

export interface RegistryItemsListResponse {
  items: RegistryItemResponse[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPriority(priority: string): Priority {
  switch (priority) {
    case 'essential':
      return Priority.HIGH;
    case 'dream':
      return Priority.LOW;
    default:
      return Priority.MEDIUM;
  }
}

// ============================================================================
// GET /api/registry/[shareCode]/items - List registry items
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;
    const user = await getCurrentUser();

    // Find registry
    const registry = await prisma.registry.findUnique({
      where: { shareCode: shareCode.toUpperCase() },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                price: true,
              },
            },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Check access permissions
    const isOwner = user && registry.userId === user.id;
    if (!registry.isPublic && !isOwner) {
      throw new ForbiddenError('This registry is private');
    }

    // Get product details
    const productIds = registry.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          where: { isPrimary: true },
          select: { url: true, altText: true },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items: RegistryItemResponse[] = registry.items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        variantId: item.variantId,
        variantName: item.variantName,
        quantity: item.quantity,
        quantityPurchased: item.quantityPurchased,
        priority: item.priority,
        notes: item.notes,
        product: product
          ? {
              id: product.id,
              name: product.name,
              slug: product.slug,
              basePrice: product.basePrice.toNumber(),
              images: product.images,
            }
          : {
              id: item.productId,
              name: item.productName,
              slug: item.productSlug,
              basePrice: 0,
              images: [],
            },
        variant: item.variant
          ? {
              id: item.variant.id,
              size: item.variant.size,
              color: item.variant.color,
              price: item.variant.price.toNumber(),
            }
          : null,
      };
    });

    const response: RegistryItemsListResponse = { items };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching registry items:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/registry/[shareCode]/items - Add item to registry
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Find registry
    const registry = await prisma.registry.findUnique({
      where: { shareCode: shareCode.toUpperCase() },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Check ownership
    if (registry.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to modify this registry');
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addRegistryItemSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, name: true, slug: true, isActive: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or unavailable');
    }

    // Verify variant exists
    const variant = await prisma.variant.findUnique({
      where: { id: data.variantId },
      select: { id: true, name: true, productId: true },
    });

    if (!variant || variant.productId !== data.productId) {
      throw new NotFoundError('Variant not found or does not belong to product');
    }

    // Check if item already exists in registry
    const existingItem = await prisma.registryItem.findFirst({
      where: {
        registryId: registry.id,
        productId: data.productId,
        variantId: data.variantId,
      },
    });

    if (existingItem) {
      // Update quantity instead of creating new
      const updatedItem = await prisma.registryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          priority: mapPriority(data.priority || 'nice_to_have'),
          notes: data.notes || existingItem.notes,
        },
        include: {
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              price: true,
            },
          },
        },
      });

      const response: RegistryItemResponse = {
        id: updatedItem.id,
        productId: updatedItem.productId,
        productName: updatedItem.productName,
        productSlug: updatedItem.productSlug,
        variantId: updatedItem.variantId,
        variantName: updatedItem.variantName,
        quantity: updatedItem.quantity,
        quantityPurchased: updatedItem.quantityPurchased,
        priority: updatedItem.priority,
        notes: updatedItem.notes,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: 0,
          images: [],
        },
        variant: updatedItem.variant
          ? {
              id: updatedItem.variant.id,
              size: updatedItem.variant.size,
              color: updatedItem.variant.color,
              price: updatedItem.variant.price.toNumber(),
            }
          : null,
      };

      return NextResponse.json(response);
    }

    // Create new registry item
    const newItem = await prisma.registryItem.create({
      data: {
        registryId: registry.id,
        productId: data.productId,
        productName: product.name,
        productSlug: product.slug,
        variantId: data.variantId,
        variantName: variant.name,
        quantity: data.quantity,
        quantityPurchased: 0,
        priority: mapPriority(data.priority || 'nice_to_have'),
        notes: data.notes,
      },
      include: {
        variant: {
          select: {
            id: true,
            size: true,
            color: true,
            price: true,
          },
        },
      },
    });

    const response: RegistryItemResponse = {
      id: newItem.id,
      productId: newItem.productId,
      productName: newItem.productName,
      productSlug: newItem.productSlug,
      variantId: newItem.variantId,
      variantName: newItem.variantName,
      quantity: newItem.quantity,
      quantityPurchased: newItem.quantityPurchased,
      priority: newItem.priority,
      notes: newItem.notes,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: 0,
        images: [],
      },
      variant: newItem.variant
        ? {
            id: newItem.variant.id,
            size: newItem.variant.size,
            color: newItem.variant.color,
            price: newItem.variant.price.toNumber(),
          }
        : null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error adding registry item:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
