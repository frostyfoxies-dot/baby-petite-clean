import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(10).max(2000).optional(),
});

export interface ReviewResponse {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PATCH /api/reviews/[reviewId] - Update review
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Find review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check ownership
    if (review.userId !== user.id) {
      throw new ForbiddenError('You can only edit your own reviews');
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateReviewSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        // Reset approval status when content changes (if moderation is enabled)
        ...(data.content !== undefined && { isApproved: true }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const response: ReviewResponse = {
      id: updatedReview.id,
      productId: updatedReview.productId,
      rating: updatedReview.rating,
      title: updatedReview.title,
      content: updatedReview.content,
      isVerifiedPurchase: updatedReview.isVerifiedPurchase,
      isApproved: updatedReview.isApproved,
      helpfulCount: updatedReview.helpfulCount,
      user: {
        id: updatedReview.user.id,
        name: `${updatedReview.user.firstName || ''} ${updatedReview.user.lastName || ''}`.trim() || 'Anonymous',
        avatar: updatedReview.user.avatar,
      },
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/reviews/[reviewId] - Delete review
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Find review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check ownership (or admin)
    if (review.userId !== user.id && user.role === 'CUSTOMER') {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
