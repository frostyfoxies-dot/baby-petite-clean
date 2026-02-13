import Stripe from 'stripe';

/**
 * Stripe Client Configuration
 *
 * Provides a configured Stripe client and helper functions for payment processing.
 * All amounts in Stripe are handled in cents (smallest currency unit).
 *
 * @see https://stripe.com/docs/api
 */

// Validate required environment variable
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Currency configuration for formatting
 */
const CURRENCY_CONFIG: Record<string, { symbol: string; position: 'before' | 'after' }> = {
  USD: { symbol: '$', position: 'before' },
  EUR: { symbol: '€', position: 'before' },
  GBP: { symbol: '£', position: 'before' },
  MYR: { symbol: 'RM', position: 'before' },
  SGD: { symbol: 'S$', position: 'before' },
  AUD: { symbol: 'A$', position: 'before' },
};

/**
 * Converts a dollar amount to cents for Stripe API
 * @param amount - Amount in dollars
 * @returns Amount in cents
 * @example
 * formatAmountForStripe(10.99) // returns 1099
 */
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts a cent amount from Stripe API to dollars
 * @param amount - Amount in cents
 * @returns Amount in dollars
 * @example
 * formatAmountFromStripe(1099) // returns 10.99
 */
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}

/**
 * Formats a cent amount for display with currency symbol
 * @param amount - Amount in cents
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 * @example
 * formatCurrencyForDisplay(1099, 'USD') // returns "$10.99"
 */
export function formatCurrencyForDisplay(
  amount: number,
  currency: string = 'USD'
): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const dollarAmount = formatAmountFromStripe(amount);
  const formatted = dollarAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return config.position === 'before'
    ? `${config.symbol}${formatted}`
    : `${formatted}${config.symbol}`;
}

/**
 * Creates a PaymentIntent for processing a payment
 * @param amount - Amount in cents
 * @param currency - Currency code (default: USD)
 * @param metadata - Additional metadata to attach
 * @returns Stripe PaymentIntent object
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'USD',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

/**
 * Creates a Checkout Session for redirect-based payments
 * @param options - Checkout session options
 * @returns Stripe Checkout Session object
 */
export async function createCheckoutSession(options: {
  lineItems: Array<{
    price: string;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  mode?: 'payment' | 'subscription' | 'setup';
  allowPromotionCodes?: boolean;
  shippingAddressCollection?: {
    allowedCountries: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];
  };
}): Promise<Stripe.Checkout.Session> {
  const {
    lineItems,
    successUrl,
    cancelUrl,
    customerId,
    customerEmail,
    metadata = {},
    mode = 'payment',
    allowPromotionCodes = true,
    shippingAddressCollection,
  } = options;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    line_items: lineItems,
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: allowPromotionCodes,
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  if (shippingAddressCollection) {
    sessionParams.shipping_address_collection = shippingAddressCollection;
  }

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Constructs and verifies a webhook event from Stripe
 * @param payload - Raw request body
 * @param signature - Stripe-Signature header value
 * @param secret - Webhook secret (optional, uses env var if not provided)
 * @returns Verified Stripe Event object
 * @throws Error if signature verification fails
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret?: string
): Stripe.Event {
  const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Creates a Stripe customer
 * @param email - Customer email
 * @param name - Customer name
 * @param metadata - Additional metadata
 * @returns Stripe Customer object
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

/**
 * Retrieves a Stripe customer by ID
 * @param customerId - Stripe customer ID
 * @returns Stripe Customer object
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  return stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>;
}

/**
 * Updates a Stripe customer
 * @param customerId - Stripe customer ID
 * @param data - Update data
 * @returns Updated Stripe Customer object
 */
export async function updateCustomer(
  customerId: string,
  data: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  return stripe.customers.update(customerId, data);
}

/**
 * Creates a refund for a payment
 * @param paymentIntentId - Stripe PaymentIntent ID
 * @param amount - Amount to refund in cents (optional, defaults to full refund)
 * @param reason - Refund reason
 * @returns Stripe Refund object
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge'
): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amount) {
    refundParams.amount = amount;
  }

  if (reason) {
    refundParams.reason = reason;
  }

  return stripe.refunds.create(refundParams);
}

/**
 * Creates a product in Stripe
 * @param name - Product name
 * @param description - Product description
 * @param metadata - Additional metadata
 * @returns Stripe Product object
 */
export async function createProduct(
  name: string,
  description?: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Product> {
  return stripe.products.create({
    name,
    description,
    metadata,
  });
}

/**
 * Creates a price for a product
 * @param productId - Stripe Product ID
 * @param amount - Amount in cents
 * @param currency - Currency code
 * @param recurring - Recurring interval (optional)
 * @returns Stripe Price object
 */
export async function createPrice(
  productId: string,
  amount: number,
  currency: string = 'USD',
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number;
  }
): Promise<Stripe.Price> {
  const priceParams: Stripe.PriceCreateParams = {
    product: productId,
    unit_amount: amount,
    currency: currency.toLowerCase(),
  };

  if (recurring) {
    priceParams.recurring = {
      interval: recurring.interval,
      interval_count: recurring.intervalCount,
    };
  }

  return stripe.prices.create(priceParams);
}

/**
 * Retrieves a Checkout Session with line items
 * @param sessionId - Stripe Checkout Session ID
 * @returns Stripe Checkout Session with line items
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer', 'payment_intent'],
  });
}

/**
 * Creates a payment method and attaches it to a customer
 * @param customerId - Stripe Customer ID
 * @param paymentMethodId - Stripe Payment Method ID
 * @returns Attached Payment Method
 */
export async function attachPaymentMethodToCustomer(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return paymentMethod;
}

/**
 * Lists payment methods for a customer
 * @param customerId - Stripe Customer ID
 * @param type - Payment method type
 * @returns List of Payment Methods
 */
export async function listCustomerPaymentMethods(
  customerId: string,
  type: Stripe.PaymentMethodListParams.Type = 'card'
): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
  return stripe.paymentMethods.list({
    customer: customerId,
    type,
  });
}

export default stripe;
