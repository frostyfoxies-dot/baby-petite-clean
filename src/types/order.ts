/**
 * Order types for the Kids Petite e-commerce platform
 */

import type { User } from './user';
import type { Address } from './address';
import type { Payment } from './payment';

/** Order status enumeration */
export type OrderStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

/**
 * Represents an order
 */
export interface Order {
  /** Unique identifier */
  id: string;
  /** Human-readable order number */
  orderNumber: string;
  /** ID of the user who placed the order */
  userId: string;
  /** User who placed the order (optional, populated on fetch) */
  user?: User;
  /** Current order status */
  status: OrderStatus;
  /** Shipping address */
  shippingAddress: Address;
  /** Billing address */
  billingAddress: Address;
  /** Subtotal before tax, shipping, and discounts */
  subtotal: number;
  /** Tax amount */
  tax: number;
  /** Shipping cost */
  shipping: number;
  /** Discount amount */
  discount: number;
  /** Total order amount */
  total: number;
  /** Currency code (e.g., 'USD') */
  currency: string;
  /** Order notes (optional) */
  notes?: string;
  /** Items in the order */
  items: OrderItem[];
  /** Shipping information (optional, populated on fetch) */
  shipping?: Shipping;
  /** Payment information (optional, populated on fetch) */
  payment?: Payment;
  /** Order creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents an item in an order
 */
export interface OrderItem {
  /** Unique identifier */
  id: string;
  /** ID of the order this item belongs to */
  orderId: string;
  /** ID of the product variant */
  variantId: string;
  /** Product name at time of purchase */
  productName: string;
  /** Variant name at time of purchase */
  variantName: string;
  /** SKU at time of purchase */
  sku: string;
  /** Quantity ordered */
  quantity: number;
  /** Price per unit at time of purchase */
  unitPrice: number;
  /** Total price for this line item */
  totalPrice: number;
  /** Item creation timestamp */
  createdAt: Date;
}

/**
 * Represents shipping information for an order
 */
export interface Shipping {
  /** Unique identifier */
  id: string;
  /** ID of the order */
  orderId: string;
  /** Shipping carrier name */
  carrier: string;
  /** Tracking number (optional) */
  trackingNumber?: string;
  /** Current shipping status */
  status: string;
  /** Date when the order was shipped */
  shippedAt?: Date;
  /** Date when the order was delivered */
  deliveredAt?: Date;
  /** Shipping record creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}
