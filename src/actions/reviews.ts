'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Result type for server actions
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Create review input schema
 */
const createReviewSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().min(1, 'Review title is required').max(200),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  pros: z.array(z.string().max(100)).optional().default([]),
  cons: z.array(z.string().max(100)).optional().default([]),
  recommend: z.boolean().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * Update review input schema
 */
const updateReviewSchema = z.object({
  reviewId: z.string().cuid('Invalid review ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
  title: z.string().min(1, 'Review title is required').max(200).optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000).optional(),
  pros: z.array(z.string().max(100)).optional(),
  cons: z.array(z.string().max(100)).optional(),
  recommend: z.boolean().optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

/**
 * Delete review input schema
 */
const deleteReviewSchema = z.object({
  reviewId: z.string().cuid('Invalid review ID'),
});

export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;

/**
 * Mark review helpful input schema
 */
const markReviewHelpfulSchema = z.object({
  reviewId: z.string().cuid('Invalid review ID'),
});

export type MarkReviewHelpfulInput = z.infer<typeof markReviewHelpfulSchema>;

// ============================================
// REVIEW ACTIONS
// ============================================

/**
 * Create a product review
 *
 * Creates a new review for a product. User must be logged in.
 *
 * @param input - Review data (productId, rating, title, content, etc.)
 * @returns Result object with review details or error
 *
 * @example
 * const result = await createReview({
 *   productId: 'product123',
 *   rating: 5,
 *   title: 'Great product!',
 *   content: 'My baby loves this product. Very high quality.',
 *   recommend: true,
 * });
 */
export async function createReview(input: CreateReviewInput): Promise<ActionResult<{ reviewId: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to write a review');
    }

    // Validate input
    const validatedFields = createReviewSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { productId, rating, title, content, pros, cons, recommend } = validatedFields.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: user.id,
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: 'You have already reviewed this product',
      };
    }

    // Check if user has purchased this product (optional, for verified purchase badge)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        variant: {
          productId,
        },
        order: {
          userId: user.id,
          status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        },
      },
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating,
        title,
        content,
        pros: pros || [],
        cons: cons || [],
        recommend: recommend ?? true,
        isVerifiedPurchase: !!hasPurchased,
      },
    });

    revalidatePath(`/products/${product.slug}`);
    revalidateTag('reviews');
    revalidateTag(`product-${productId}`);

    return {
      success: true,
      data: { reviewId: review.id },
    };
  } catch (error) {
    console.error('Create review error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while creating your review. Please try again.',
    };
  }
}

/**
 * Update a review
 *
 * Updates an existing review. Only the review author can update it.
 *
 * @param reviewId - Review ID to update
 * @param data - Updated review data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateReview('review123', {
 *   rating: 4,
 *   content: 'Updated review content',
 * });
 */
export async function updateReview(
  reviewId: string,
  data: Partial<Omit<UpdateReviewInput, 'reviewId'>>
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to update a review');
    }

    // Validate input
    const validatedFields = updateReviewSchema.partial().safeParse({ reviewId, ...data });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { select: { slug: true } } },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user is the review author
    if (review.userId !== user.id) {
      return {
        success: false,
        error: 'You can only update your own reviews',
      };
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.pros !== undefined) updateData.pros = data.pros;
    if (data.cons !== undefined) updateData.cons = data.cons;
    if (data.recommend !== undefined) updateData.recommend = data.recommend;

    // Update review
    await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    revalidatePath(`/products/${review.product.slug}`);
    revalidateTag('reviews');
    revalidateTag(`product-${review.productId}`);

    return { success: true };
  } catch (error) {
    console.error('Update review error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating your review. Please try again.',
    };
  }
}

/**
 * Delete a review
 *
 * Deletes a review. Only the review author can delete it.
 *
 * @param reviewId - Review ID to delete
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await deleteReview('review123');
 */
export async function deleteReview(reviewId: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to delete a review');
    }

    // Validate input
    const validatedFields = deleteReviewSchema.safeParse({ reviewId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { select: { slug: true } } },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if user is the review author
    if (review.userId !== user.id) {
      return {
        success: false,
        error: 'You can only delete your own reviews',
      };
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    revalidatePath(`/products/${review.product.slug}`);
    revalidateTag('reviews');
    revalidateTag(`product-${review.productId}`);

    return { success: true };
  } catch (error) {
    console.error('Delete review error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while deleting your review. Please try again.',
    };
  }
}

/**
 * Mark a review as helpful
 *
 * Increments the helpful count for a review.
 *
 * @param reviewId - Review ID to mark as helpful
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await markReviewHelpful('review123');
 */
export async function markReviewHelpful(reviewId: string): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = markReviewHelpfulSchema.safeParse({ reviewId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { select: { slug: true } } },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Increment helpful count
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
      },
    });

    revalidatePath(`/products/${review.product.slug}`);
    revalidateTag('reviews');
    revalidateTag(`product-${review.productId}`);

    return { success: true };
  } catch (error) {
    console.error('Mark review helpful error:', error);
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while marking the review as helpful. Please try again.',
    };
  }
}

/**
 * Get reviews for a product
 *
 * Retrieves all reviews for a specific product.
 *
 * @param productId - Product ID
 * @param options - Pagination and filtering options
 * @returns Result object with reviews or error
 *
 * @example
 * const result = await getProductReviews('product123', { limit: 10, offset: 0 });
 */
export async function getProductReviews(
  productId: string,
  options?: {
    limit?: number;
    offset?: number;
    rating?: number;
    verifiedOnly?: boolean;
  }
): Promise<ActionResult<{
  reviews: Array<{
    id: string;
    rating: number;
    title: string;
    content: string;
    pros: string[];
    cons: string[];
    recommend: boolean;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string | null;
      avatar: string | null;
    };
  }>;
  total: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  hasMore: boolean;
}>> {
  try {
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    // Get reviews
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          isApproved: true,
          ...(options?.rating && { rating: options.rating }),
          ...(options?.verifiedOnly && { isVerifiedPurchase: true }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: offset,
      }),
      prisma.review.count({
        where: {
          productId,
          isApproved: true,
          ...(options?.rating && { rating: options.rating }),
          ...(options?.verifiedOnly && { isVerifiedPurchase: true }),
        },
      }),
    ]);

    const hasMore = reviews.length > limit;
    if (hasMore) {
      reviews.pop();
    }

    // Calculate average rating
    const allReviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      select: { rating: true },
    });

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of allReviews) {
      ratingDistribution[review.rating]++;
    }

    return {
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title || '',
          content: review.content || '',
          pros: review.pros,
          cons: review.cons,
          recommend: review.recommend,
          isVerifiedPurchase: review.isVerifiedPurchase,
          helpfulCount: review.helpfulCount,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          user: {
            id: review.user.id,
            name: review.user.name,
            avatar: review.user.avatar,
          },
        })),
        total,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Get product reviews error:', error);
    return {
      success: false,
      error: 'An error occurred while fetching reviews. Please try again.',
    };
  }
}

/**
 * Get a user's reviews
 *
 * Retrieves all reviews written by the current user.
 *
 * @param options - Pagination options
 * @returns Result object with reviews or error
 *
 * @example
 * const result = await getUserReviews({ limit: 10, offset: 0 });
 */
export async function getUserReviews(options?: {
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{
  reviews: Array<{
    id: string;
    rating: number;
    title: string;
    content: string;
    recommend: boolean;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: Date;
    product: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  total: number;
  hasMore: boolean;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view your reviews');
    }

    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    // Get reviews
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId: user.id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: offset,
      }),
      prisma.review.count({
        where: { userId: user.id },
      }),
    ]);

    const hasMore = reviews.length > limit;
    if (hasMore) {
      reviews.pop();
    }

    return {
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title || '',
          content: review.content || '',
          recommend: review.recommend,
          isVerifiedPurchase: review.isVerifiedPurchase,
          helpfulCount: review.helpfulCount,
          createdAt: review.createdAt,
          product: {
            id: review.product.id,
            name: review.product.name,
            slug: review.product.slug,
          },
        })),
        total,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Get user reviews error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching your reviews. Please try again.',
    };
  }
}

/**
 * Get a single review
 *
 * Retrieves a specific review by ID.
 *
 * @param reviewId - Review ID
 * @returns Result object with review details or error
 *
 * @example
 * const result = await getReview('review123');
 */
export async function getReview(reviewId: string): Promise<ActionResult<{
  id: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  recommend: boolean;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}>> {
  try {
    // Find review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return {
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        title: review.title || '',
        content: review.content || '',
        pros: review.pros,
        cons: review.cons,
        recommend: review.recommend,
        isVerifiedPurchase: review.isVerifiedPurchase,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: {
          id: review.user.id,
          name: review.user.name,
          avatar: review.user.avatar,
        },
        product: {
          id: review.product.id,
          name: review.product.name,
          slug: review.product.slug,
        },
      },
    };
  } catch (error) {
    console.error('Get review error:', error);
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching the review. Please try again.',
    };
  }
}
