/**
 * Cart types for the Kids Petite e-commerce platform
 */

import type { ProductVariant } from './product';

/**
 * Represents a shopping cart
 */
export interface Cart {
  /** Unique identifier */
  id: string;
  /** ID of the user who owns this cart (optional for guest carts) */
  userId?: string;
  /** Session ID for guest carts */
  sessionId: string;
  /** Items in the cart */
  items: CartItem[];
  /** Cart creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents an item in the shopping cart
 */
export interface CartItem {
  /** Unique identifier */
  id: string;
  /** ID of the cart this item belongs to */
  cartId: string;
  /** ID of the product variant */
  variantId: string;
  /** Product variant details */
  variant: ProductVariant;
  /** Quantity of this item in the cart */
  quantity: number;
  /** Item creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Input type for adding/updating cart items
 */
export interface CartItemInput {
  /** ID of the product variant */
  variantId: string;
  /** Quantity to add */
  quantity: number;
}

/**
 * Summary of cart totals
 */
export interface CartSummary {
  /** Subtotal before discounts */
  subtotal: number;
  /** Total discount amount */
  discount: number;
  /** Shipping cost */
  shipping: number;
  /** Tax amount */
  tax: number;
  /** Total amount */
  total: number;
  /** Total number of items in cart */
  itemCount: number;
}
