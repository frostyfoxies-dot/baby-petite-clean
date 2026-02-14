/**
 * Review types for the Baby Petite e-commerce platform
 */

import type { UserPublic } from './user';

/**
 * Represents a product review
 */
export interface Review {
  /** Unique identifier */
  id: string;
  /** ID of the product being reviewed */
  productId: string;
  /** ID of the user who wrote the review */
  userId: string;
  /** User who wrote the review (optional, populated on fetch) */
  user?: UserPublic;
  /** Rating from 1-5 */
  rating: number;
  /** Review title */
  title: string;
  /** Review content */
  content: string;
  /** Whether this is a verified purchase */
  isVerifiedPurchase: boolean;
  /** Whether this review is approved for display */
  isApproved: boolean;
  /** Number of helpful votes */
  helpfulCount: number;
  /** Review creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Input type for creating a review
 */
export interface ReviewInput {
  /** ID of the product being reviewed */
  productId: string;
  /** Rating from 1-5 */
  rating: number;
  /** Review title */
  title: string;
  /** Review content */
  content: string;
}

/**
 * Aggregated review summary for a product
 */
export interface ReviewSummary {
  /** Average rating */
  average: number;
  /** Total number of reviews */
  count: number;
  /** Distribution of ratings */
  distribution: {
    /** Number of 5-star reviews */
    5: number;
    /** Number of 4-star reviews */
    4: number;
    /** Number of 3-star reviews */
    3: number;
    /** Number of 2-star reviews */
    2: number;
    /** Number of 1-star reviews */
    1: number;
  };
}
