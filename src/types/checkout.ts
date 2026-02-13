/**
 * Checkout types for the Kids Petite e-commerce platform
 */

import type { AddressInput } from './address';

/** Checkout step enumeration */
export type CheckoutStep = 'shipping' | 'payment' | 'review';

/**
 * Represents a checkout session
 */
export interface CheckoutSession {
  /** Session ID */
  id: string;
  /** Checkout URL */
  url: string;
  /** Current session status */
  status: string;
}

/**
 * Checkout data input
 */
export interface CheckoutData {
  /** Shipping address */
  shippingAddress: AddressInput;
  /** Billing address (optional, defaults to shipping) */
  billingAddress?: AddressInput;
  /** Whether billing address is same as shipping */
  sameAsBilling: boolean;
  /** Selected shipping method ID */
  shippingMethod: string;
  /** Selected payment method */
  paymentMethod: 'card' | 'paypal';
  /** Discount/promo code (optional) */
  discountCode?: string;
  /** Order notes (optional) */
  notes?: string;
}

/**
 * Available shipping method
 */
export interface ShippingMethod {
  /** Shipping method ID */
  id: string;
  /** Display name */
  name: string;
  /** Description (e.g., "5-7 business days") */
  description: string;
  /** Shipping cost */
  price: number;
  /** Estimated delivery days */
  estimatedDays: number;
}

/**
 * Checkout totals breakdown
 */
export interface CheckoutTotals {
  /** Subtotal before discounts */
  subtotal: number;
  /** Shipping cost */
  shipping: number;
  /** Tax amount */
  tax: number;
  /** Discount amount */
  discount: number;
  /** Total amount */
  total: number;
}
