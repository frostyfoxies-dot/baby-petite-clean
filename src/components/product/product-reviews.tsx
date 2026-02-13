'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Star, ThumbsUp, ThumbsDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/components/ui/dropdown';

/**
 * Review type
 */
export interface Review {
  /**
   * Review ID
   */
  id: string;
  /**
   * Reviewer name
   */
  reviewerName: string;
  /**
   * Reviewer avatar URL (optional)
   */
  reviewerAvatar?: string;
  /**
   * Rating (1-5)
   */
  rating: number;
  /**
   * Review title
   */
  title: string;
  /**
   * Review content
   */
  content: string;
  /**
   * Review date
   */
  date: Date | string;
  /**
   * Whether review is verified purchase
   */
  verifiedPurchase?: boolean;
  /**
   * Number of helpful votes
   */
  helpfulCount?: number;
  /**
   * Whether current user voted helpful
   */
  userVotedHelpful?: boolean;
  /**
   * Review images (optional)
   */
  images?: Array<{
    url: string;
    alt?: string;
  }>;
}

/**
 * Product reviews component props
 */
export interface ProductReviewsProps {
  /**
   * Product ID
   */
  productId: string;
  /**
   * Reviews list
   */
  reviews: Review[];
  /**
   * Average rating
   */
  averageRating: number;
  /**
   * Total number of reviews
   */
  totalReviews: number;
  /**
   * Rating distribution (count per star)
   */
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  /**
   * Callback when helpful is clicked
   */
  onHelpfulClick?: (reviewId: string) => void;
  /**
   * Callback when filter changes
   */
  onFilterChange?: (filter: 'all' | '5' | '4' | '3' | '2' | '1' | 'verified') => void;
  /**
   * Current filter
   */
  currentFilter?: 'all' | '5' | '4' | '3' | '2' | '1' | 'verified';
  /**
   * Whether to show write review button
   * @default true
   */
  showWriteReview?: boolean;
  /**
   * Callback when write review is clicked
   */
  onWriteReview?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Review list with rating summary
 * 
 * @example
 * ```tsx
 * <ProductReviews
 *   productId="product-123"
 *   reviews={reviews}
 *   averageRating={4.5}
 *   totalReviews={42}
 *   ratingDistribution={{ 5: 25, 4: 12, 3: 3, 2: 1, 1: 1 }}
 *   onHelpfulClick={(reviewId) => markHelpful(reviewId)}
 *   onWriteReview={() => setShowReviewForm(true)}
 * />
 * ```
 */
export function ProductReviews({
  productId,
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
  onHelpfulClick,
  onFilterChange,
  currentFilter = 'all',
  showWriteReview = true,
  onWriteReview,
  className,
}: ProductReviewsProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filterOptions = [
    { value: 'all', label: 'All Reviews' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
    { value: 'verified', label: 'Verified Purchases' },
  ] as const;

  return (
    <div id="reviews" className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Customer Reviews
        </h2>
        {showWriteReview && (
          <Button variant="outline" size="sm" onClick={onWriteReview}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Average rating */}
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-md">
          <div className="text-5xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-5 h-5',
                  i < Math.round(averageRating)
                    ? 'fill-yellow text-yellow'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Based on {totalReviews} reviews
          </p>
        </div>

        {/* Rating distribution */}
        {ratingDistribution && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-8">
                    {star} <span className="text-gray-400">star</span>
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {reviews.length} reviews
        </p>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="outline" size="sm" rightIcon={<Filter className="w-4 h-4" />}>
              {filterOptions.find((o) => o.value === currentFilter)?.label}
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            {filterOptions.map((option) => (
              <DropdownItem
                key={option.value}
                value={option.value}
                onClick={() => onFilterChange?.(option.value as any)}
              >
                {option.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No reviews yet.</p>
            {showWriteReview && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={onWriteReview}
              >
                Be the first to review
              </Button>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onHelpfulClick={() => onHelpfulClick?.(review.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Individual review item component
 */
interface ReviewItemProps {
  review: Review;
  onHelpfulClick?: () => void;
}

function ReviewItem({ review, onHelpfulClick }: ReviewItemProps) {
  return (
    <div className="space-y-3">
      {/* Reviewer info */}
      <div className="flex items-start gap-3">
        <Avatar
          src={review.reviewerAvatar}
          fallback={review.reviewerName}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {review.reviewerName}
            </span>
            {review.verifiedPurchase && (
              <span className="text-xs text-gray-500">
                · Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3.5 h-3.5',
                    i < review.rating
                      ? 'fill-yellow text-yellow'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(review.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Review content */}
      <div>
        <h4 className="text-sm font-medium text-gray-900">
          {review.title}
        </h4>
        <p className="text-sm text-gray-600 mt-1">
          {review.content}
        </p>
      </div>

      {/* Review images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-2">
          {review.images.map((image, index) => (
            <div
              key={index}
              className="w-16 h-16 rounded-md overflow-hidden bg-gray-100"
            >
              <img
                src={image.url}
                alt={image.alt || `Review image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Helpful */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onHelpfulClick}
          className={cn(
            'flex items-center gap-1.5 text-xs',
            'hover:text-gray-900',
            'transition-colors duration-200'
          )}
        >
          <ThumbsUp
            className={cn(
              'w-4 h-4',
              review.userVotedHelpful && 'fill-yellow text-yellow'
            )}
          />
          Helpful ({review.helpfulCount || 0})
        </button>
      </div>

      <Separator />
    </div>
  );
}
