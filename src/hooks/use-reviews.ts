'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import {
  addReview as addReviewAction,
  markReviewHelpful as markReviewHelpfulAction,
  type AddReviewInput,
} from '@/actions/reviews';

/**
 * Review interface
 */
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpfulCount: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Review summary interface
 */
export interface ReviewSummary {
  average: number;
  count: number;
  distribution: number[]; // [5-star count, 4-star count, ..., 1-star count]
}

/**
 * Reviews hook return type
 */
interface UseReviewsReturn {
  /** Array of product reviews */
  reviews: Review[];
  /** Review summary statistics */
  summary: ReviewSummary;
  /** Whether reviews are being loaded */
  isLoading: boolean;
  /** Error if reviews fetch failed */
  error: Error | null;
  /** Add a new review */
  addReview: (data: AddReviewInput) => Promise<{ success: boolean; error?: string; reviewId?: string }>;
  /** Mark a review as helpful */
  markHelpful: (reviewId: string) => Promise<{ success: boolean; error?: string }>;
  /** Refetch reviews */
  refetch: () => Promise<void>;
  /** Load more reviews */
  loadMore: () => Promise<void>;
  /** Whether there are more reviews to load */
  hasMore: boolean;
}

/**
 * Default review summary
 */
const DEFAULT_SUMMARY: ReviewSummary = {
  average: 0,
  count: 0,
  distribution: [0, 0, 0, 0, 0],
};

/**
 * Default number of reviews per page
 */
const DEFAULT_PER_PAGE = 10;

/**
 * Hook for product reviews
 *
 * Fetches and manages state for product reviews.
 * Provides actions for adding reviews and marking them as helpful.
 *
 * @param productId - The product ID to fetch reviews for
 * @param perPage - Number of reviews per page (default: 10)
 * @returns Reviews state and actions
 *
 * @example
 * ```tsx
 * function ProductReviews({ productId }) {
 *   const {
 *     reviews,
 *     summary,
 *     isLoading,
 *     addReview,
 *     markHelpful,
 *   } = useReviews(productId);
 *
 *   return (
 *     <div>
 *       <ReviewSummary summary={summary} />
 *       <ReviewList
 *         reviews={reviews}
 *         onMarkHelpful={markHelpful}
 *       />
 *       <ReviewForm onSubmit={addReview} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useReviews(productId: string | null, perPage: number = DEFAULT_PER_PAGE): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(DEFAULT_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { addToast } = useUIStore();

  /**
   * Fetch reviews from API
   */
  const fetchReviews = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!productId) {
        setReviews([]);
        setSummary(DEFAULT_SUMMARY);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          perPage: perPage.toString(),
        });

        const response = await fetch(`/api/products/${productId}/reviews?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();

        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews);
        }

        setSummary(data.summary || DEFAULT_SUMMARY);
        setTotal(data.total);
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
      } finally {
        setIsLoading(false);
      }
    },
    [productId, perPage]
  );

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  /**
   * Add a new review
   */
  const addReview = useCallback(
    async (data: AddReviewInput) => {
      try {
        const result = await addReviewAction(data);

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Review submitted',
            message: 'Thank you for your review! It will be visible shortly.',
          });
          await fetchReviews(1, false);
        } else {
          addToast({
            type: 'error',
            title: 'Failed to submit review',
            message: result.error || 'Please try again.',
          });
        }

        return {
          success: result.success,
          error: result.error,
          reviewId: result.data?.reviewId,
        };
      } catch (err) {
        console.error('Add review error:', err);
        const errorMessage = 'An unexpected error occurred. Please try again.';
        addToast({
          type: 'error',
          title: 'Failed to submit review',
          message: errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [fetchReviews, addToast]
  );

  /**
   * Mark a review as helpful
   */
  const markHelpful = useCallback(
    async (reviewId: string) => {
      try {
        const result = await markReviewHelpfulAction(reviewId);

        if (result.success) {
          // Update the helpful count locally
          setReviews((prev) =>
            prev.map((review) =>
              review.id === reviewId
                ? { ...review, helpfulCount: review.helpfulCount + 1 }
                : review
            )
          );
          addToast({
            type: 'success',
            title: 'Thanks for your feedback',
            message: 'You marked this review as helpful.',
          });
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Mark helpful error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [addToast]
  );

  /**
   * Refetch reviews
   */
  const refetch = useCallback(() => {
    return fetchReviews(1, false);
  }, [fetchReviews]);

  /**
   * Load more reviews
   */
  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    await fetchReviews(nextPage, true);
  }, [page, fetchReviews]);

  const hasMore = reviews.length < total;

  return {
    reviews,
    summary,
    isLoading,
    error,
    addReview,
    markHelpful,
    refetch,
    loadMore,
    hasMore,
  };
}

export default useReviews;
