import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import {
  AppError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors';

// ============================================================================
// DELETE /api/wishlist/[itemId] - Remove wishlist item
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Find wishlist item
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: {
        wishlist: {
          select: { userId: true },
        },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundError('Wishlist item not found');
    }

    // Check ownership
    if (wishlistItem.wishlist.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to remove this item');
    }

    // Delete wishlist item
    await prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error removing wishlist item:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
