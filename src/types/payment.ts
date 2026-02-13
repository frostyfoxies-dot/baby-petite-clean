/**
 * Payment types for the Kids Petite e-commerce platform
 */

/** Payment status enumeration */
export type PaymentStatus = 
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED';

/**
 * Represents a payment for an order
 */
export interface Payment {
  /** Unique identifier */
  id: string;
  /** ID of the order this payment is for */
  orderId: string;
  /** Stripe Payment Intent ID */
  stripePaymentIntentId: string;
  /** Payment amount */
  amount: number;
  /** Currency code (e.g., 'USD') */
  currency: string;
  /** Current payment status */
  status: PaymentStatus;
  /** Payment method used (optional) */
  paymentMethod?: string;
  /** Payment creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents a Stripe payment intent
 */
export interface PaymentIntent {
  /** Payment Intent ID */
  id: string;
  /** Payment amount */
  amount: number;
  /** Currency code (e.g., 'USD') */
  currency: string;
  /** Current payment intent status */
  status: string;
  /** Client secret for frontend confirmation */
  clientSecret: string;
}
