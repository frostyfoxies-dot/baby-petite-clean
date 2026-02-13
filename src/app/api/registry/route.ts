import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/session';
import { registrySchema } from '@/lib/validators';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '@/lib/errors';
import { RegistryStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface RegistryListItem {
  id: string;
  name: string;
  shareCode: string;
  eventDate: Date | null;
  status: RegistryStatus;
  isPublic: boolean;
  itemCount: number;
  itemsPurchased: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistryListResponse {
  registries: RegistryListItem[];
}

export interface RegistryDetailResponse {
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
    priority: string;
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
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateShareCode(): string {
  // Generate a unique 8-character share code
  return randomBytes(4).toString('hex').toUpperCase();
}

// ============================================================================
// GET /api/registry - List user's registries
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get user's registry (typically one per user for baby registry)
    const registry = await prisma.registry.findUnique({
      where: { userId: user.id },
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
        },
      },
    });

    if (!registry) {
      return NextResponse.json({ registries: [] });
    }

    const response: RegistryListResponse = {
      registries: [
        {
          id: registry.id,
          name: registry.name,
          shareCode: registry.shareCode,
          eventDate: registry.eventDate,
          status: registry.status,
          isPublic: registry.isPublic,
          itemCount: registry.items.length,
          itemsPurchased: registry.items.reduce(
            (sum, item) => sum + item.quantityPurchased,
            0
          ),
          createdAt: registry.createdAt,
          updatedAt: registry.updatedAt,
        },
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching registries:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/registry - Create new registry
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = registrySchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Check if user already has a registry
    const existingRegistry = await prisma.registry.findUnique({
      where: { userId: user.id },
    });

    if (existingRegistry) {
      throw new ConflictError('You already have a registry. Please update your existing registry instead.');
    }

    // Generate unique share code
    let shareCode = generateShareCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.registry.findUnique({
        where: { shareCode },
      });
      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    // Create registry with items
    const registry = await prisma.$transaction(async (tx) => {
      // Create registry
      const newRegistry = await tx.registry.create({
        data: {
          userId: user.id,
          name: data.name,
          description: data.message,
          eventDate: data.dueDate ? new Date(data.dueDate) : null,
          shareCode,
          isPublic: data.isPublic,
          status: RegistryStatus.ACTIVE,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              productName: '', // Will be updated below
              productSlug: '', // Will be updated below
              variantId: item.variantId,
              variantName: null,
              quantity: item.quantity,
              quantityPurchased: 0,
              priority: item.priority === 'essential' ? 'HIGH' : item.priority === 'dream' ? 'LOW' : 'MEDIUM',
              notes: item.notes,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Update item names from products
      for (const item of newRegistry.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, slug: true },
        });

        if (product) {
          await tx.registryItem.update({
            where: { id: item.id },
            data: {
              productName: product.name,
              productSlug: product.slug,
            },
          });
        }

        if (item.variantId) {
          const variant = await tx.variant.findUnique({
            where: { id: item.variantId },
            select: { name: true },
          });

          if (variant) {
            await tx.registryItem.update({
              where: { id: item.id },
              data: { variantName: variant.name },
            });
          }
        }
      }

      return newRegistry;
    });

    // Fetch complete registry with product details
    const completeRegistry = await prisma.registry.findUnique({
      where: { id: registry.id },
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
        },
      },
    });

    const response: RegistryDetailResponse = {
      id: registry.id,
      name: registry.name,
      description: registry.description,
      shareCode: registry.shareCode,
      eventDate: registry.eventDate,
      isPublic: registry.isPublic,
      status: registry.status,
      items: (completeRegistry?.items || []).map((item) => ({
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
        product: {
          id: item.productId,
          name: item.productName,
          slug: item.productSlug,
          basePrice: 0, // Would need to fetch from product
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
      })),
      createdAt: registry.createdAt,
      updatedAt: registry.updatedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error creating registry:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
