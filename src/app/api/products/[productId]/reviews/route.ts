import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/session';
import { reviewSchema } from '@/lib/validators';
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

const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).default('newest'),
});

const createReviewSchema = reviewSchema.omit({ productId: true });

export interface ReviewListItem {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewsListResponse {
  reviews: ReviewListItem[];
  summary: {
    averageRating: number;
    totalReviews: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ReviewDetailResponse {
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
// HELPER FUNCTIONS
// ============================================================================

function getOrderBy(sort: string): { rating: 'asc' | 'desc' } | { createdAt: 'asc' | 'desc' } | { helpfulCount: 'desc' } {
  switch (sort) {
    case 'highest':
      return { rating: 'desc' };
    case 'lowest':
      return { rating: 'asc' };
    case 'oldest':
      return { createdAt: 'asc' };
    case 'helpful':
      return { helpfulCount: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

// ============================================================================
// GET /api/products/[productId]/reviews - List product reviews
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = reviewQuerySchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      rating: searchParams.get('rating') || undefined,
      sort: searchParams.get('sort') || undefined,
    });

    if (!queryParams.success) {
      throw new BadRequestError('Invalid query parameters', queryParams.error.flatten());
    }

    const { page, limit, rating, sort } = queryParams.data;
    const skip = (page - 1) * limit;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Build where clause
    const where: { productId: string; isApproved: boolean; rating?: number } = {
      productId,
      isApproved: true,
    };

    if (rating) {
      where.rating = rating;
    }

    // Get reviews and count
    const [reviews, totalCount, allReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: getOrderBy(sort),
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
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        where: { productId, isApproved: true },
        select: { rating: true },
      }),
    ]);

    // Calculate distribution and average
    const distribution: ReviewsListResponse['summary']['distribution'] = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    for (const review of allReviews) {
      distribution[review.rating as keyof typeof distribution]++;
      totalRating += review.rating;
    }
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    const totalPages = Math.ceil(totalCount / limit);

    const response: ReviewsListResponse = {
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        isVerifiedPurchase: review.isVerifiedPurchase,
        helpfulCount: review.helpfulCount,
        user: {
          id: review.user.id,
          name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Anonymous',
          avatar: review.user.avatar,
        },
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      summary: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: allReviews.length,
        distribution,
      },
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/products/[productId]/reviews - Create review (authenticated)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createReviewSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or unavailable');
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: user.id,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError('You have already reviewed this product');
    }

    // Check if user has purchased this product (for verified purchase badge)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        variant: { productId },
        order: {
          userId: user.id,
          status: { in: ['DELIVERED', 'CONFIRMED'] },
        },
      },
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: data.rating,
        title: data.title,
        content: data.content,
        isVerifiedPurchase: !!hasPurchased,
        isApproved: true, // Auto-approve for now; could be changed to require moderation
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

    const response: ReviewDetailResponse = {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      title: review.title,
      content: review.content,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      helpfulCount: review.helpfulCount,
      user: {
        id: review.user.id,
        name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Anonymous',
        avatar: review.user.avatar,
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
