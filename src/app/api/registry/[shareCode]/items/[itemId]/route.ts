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
import { Priority } from '@prisma/client';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const updateRegistryItemSchema = z.object({
  quantity: z.number().int().positive().max(99).optional(),
  priority: z.enum(['essential', 'nice_to_have', 'dream']).optional(),
  notes: z.string().max(500).optional().nullable(),
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
// PATCH /api/registry/[shareCode]/items/[itemId] - Update registry item
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string; itemId: string }> }
) {
  try {
    const { shareCode, itemId } = await params;
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

    // Find registry item
    const registryItem = await prisma.registryItem.findFirst({
      where: {
        id: itemId,
        registryId: registry.id,
      },
    });

    if (!registryItem) {
      throw new NotFoundError('Registry item not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateRegistryItemSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Update registry item
    const updatedItem = await prisma.registryItem.update({
      where: { id: itemId },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.priority !== undefined && { priority: mapPriority(data.priority) }),
        ...(data.notes !== undefined && { notes: data.notes }),
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
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error updating registry item:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/registry/[shareCode]/items/[itemId] - Remove registry item
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string; itemId: string }> }
) {
  try {
    const { shareCode, itemId } = await params;
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

    // Find registry item
    const registryItem = await prisma.registryItem.findFirst({
      where: {
        id: itemId,
        registryId: registry.id,
      },
    });

    if (!registryItem) {
      throw new NotFoundError('Registry item not found');
    }

    // Delete registry item
    await prisma.registryItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: 'Item removed from registry' });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error deleting registry item:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
