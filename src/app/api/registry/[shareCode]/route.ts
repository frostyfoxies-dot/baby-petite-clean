import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors';
import { RegistryStatus } from '@prisma/client';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const updateRegistrySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  eventDate: z.string().datetime().optional().nullable(),
  isPublic: z.boolean().optional(),
  status: z.nativeEnum(RegistryStatus).optional(),
});

export interface PublicRegistryResponse {
  id: string;
  name: string;
  description: string | null;
  shareCode: string;
  eventDate: Date | null;
  isPublic: boolean;
  status: RegistryStatus;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    variantId: string | null;
    variantName: string | null;
    quantity: number;
    quantityPurchased: number;
    quantityRemaining: number;
    priority: string;
    notes: string | null;
    product: {
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
    };
    variant?: {
      id: string;
      size: string;
      color: string | null;
      price: number;
    } | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// GET /api/registry/[shareCode] - Get registry by share code (public)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;
    const user = await getCurrentUser();

    // Find registry by share code
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

    // Get product details for all items
    const productIds = registry.items.map((item) => item.productId);
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

    const response: PublicRegistryResponse = {
      id: registry.id,
      name: registry.name,
      description: registry.description,
      shareCode: registry.shareCode,
      eventDate: registry.eventDate,
      isPublic: registry.isPublic,
      status: registry.status,
      items: registry.items.map((item) => {
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
          quantityRemaining: item.quantity - item.quantityPurchased,
          priority: item.priority,
          notes: item.notes,
          product: product
            ? {
                id: product.id,
                name: product.name,
                slug: product.slug,
                basePrice: product.basePrice.toNumber(),
                compareAtPrice: product.compareAtPrice?.toNumber() || null,
                images: product.images,
                category: product.category,
              }
            : {
                id: item.productId,
                name: item.productName,
                slug: item.productSlug,
                basePrice: 0,
                compareAtPrice: null,
                images: [],
                category: { id: '', name: '', slug: '' },
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
      }),
      createdAt: registry.createdAt,
      updatedAt: registry.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching registry:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/registry/[shareCode] - Update registry
// ============================================================================

export async function PATCH(
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
      throw new ForbiddenError('You do not have permission to update this registry');
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateRegistrySchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Update registry
    const updatedRegistry = await prisma.registry.update({
      where: { id: registry.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ? new Date(data.eventDate) : null }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return NextResponse.json({
      id: updatedRegistry.id,
      name: updatedRegistry.name,
      description: updatedRegistry.description,
      shareCode: updatedRegistry.shareCode,
      eventDate: updatedRegistry.eventDate,
      isPublic: updatedRegistry.isPublic,
      status: updatedRegistry.status,
      updatedAt: updatedRegistry.updatedAt,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error updating registry:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/registry/[shareCode] - Delete registry
// ============================================================================

export async function DELETE(
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
      throw new ForbiddenError('You do not have permission to delete this registry');
    }

    // Delete registry (cascade will delete items)
    await prisma.registry.delete({
      where: { id: registry.id },
    });

    return NextResponse.json({ message: 'Registry deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error deleting registry:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
