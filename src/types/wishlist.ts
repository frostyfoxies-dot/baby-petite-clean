/**
 * Wishlist types for the Baby Petite e-commerce platform
 */

import type { ProductVariant } from './product';

/**
 * Represents a user's wishlist
 */
export interface Wishlist {
  /** Unique identifier */
  id: string;
  /** ID of the user who owns this wishlist */
  userId: string;
  /** Wishlist name */
  name: string;
  /** Whether this is the default wishlist */
  isDefault: boolean;
  /** Items in the wishlist */
  items: WishlistItem[];
  /** Wishlist creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents an item in a wishlist
 */
export interface WishlistItem {
  /** Unique identifier */
  id: string;
  /** ID of the wishlist this item belongs to */
  wishlistId: string;
  /** ID of the product variant */
  variantId: string;
  /** Product variant details */
  variant: ProductVariant;
  /** Notes about this item (optional) */
  notes?: string;
  /** Item creation timestamp */
  createdAt: Date;
}
