'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserId } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

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
 * Create checkout session input schema
 */
const createCheckoutSessionSchema = z.object({
  shippingAddressId: z.string().cuid('Invalid shipping address ID'),
  billingAddressId: z.string().cuid('Invalid billing address ID').optional(),
  useSameBillingAddress: z.boolean().optional().default(true),
  shippingMethodId: z.string().min(1, 'Shipping method is required'),
  discountCode: z.string().optional(),
  giftMessage: z.string().max(500).optional(),
  isGift: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

/**
 * Validate discount code input schema
 */
const validateDiscountCodeSchema = z.object({
  code: z.string().min(1, 'Discount code is required').max(50),
});

export type ValidateDiscountCodeInput = z.infer<typeof validateDiscountCodeSchema>;

/**
 * Calculate shipping input schema
 */
const calculateShippingSchema = z.object({
  addressId: z.string().cuid('Invalid address ID'),
});

export type CalculateShippingInput = z.infer<typeof calculateShippingSchema>;

/**
 * Calculate tax input schema
 */
const calculateTaxSchema = z.object({
  addressId: z.string().cuid('Invalid address ID'),
});

export type CalculateTaxInput = z.infer<typeof calculateTaxSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the current user's cart
 */
async function getCart() {
  const userId = await getUserId();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cart_session')?.value;

  if (userId) {
    return prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true, isActive: true } },
                inventory: { select: { available: true } },
              },
            },
          },
        },
      },
    });
  }

  if (sessionId) {
    return prisma.cart.findFirst({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true, isActive: true } },
                inventory: { select: { available: true } },
              },
            },
          },
        },
      },
    });
  }

  return null;
}

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KP-${timestamp}-${random}`;
}

// ============================================
// CHECKOUT ACTIONS
// ============================================

/**
 * Create a checkout session
 *
 * Creates a checkout session for processing payment via Stripe.
 *
 * @param input - Checkout session data
 * @returns Result object with checkout session URL or error
 *
 * @example
 * const result = await createCheckoutSession({
 *   shippingAddressId: 'address123',
 *   shippingMethodId: 'standard',
 * });
 */
export async function createCheckoutSession(input: CreateCheckoutSessionInput): Promise<ActionResult<{
  sessionId: string;
  url: string;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();

    // Validate input
    const validatedFields = createCheckoutSessionSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validatedFields.data;

    // Get cart
    const cart = await getCart();
    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: 'Your cart is empty',
      };
    }

    // Validate cart items
    for (const item of cart.items) {
      if (!item.variant.product.isActive) {
        return {
          success: false,
          error: `${item.variant.product.name} is no longer available`,
        };
      }

      const available = item.variant.inventory?.available ?? 0;
      if (available < item.quantity) {
        return {
          success: false,
          error: `Only ${available} items available for ${item.variant.product.name}`,
        };
      }
    }

    // Get shipping address
    const shippingAddress = await prisma.address.findUnique({
      where: { id: data.shippingAddressId },
    });

    if (!shippingAddress) {
      return {
        success: false,
        error: 'Shipping address not found',
      };
    }

    // Get billing address
    let billingAddress = shippingAddress;
    if (!data.useSameBillingAddress && data.billingAddressId) {
      const foundBilling = await prisma.address.findUnique({
        where: { id: data.billingAddressId },
      });
      if (foundBilling) {
        billingAddress = foundBilling;
      }
    }

    // Calculate totals
    let subtotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of cart.items) {
      const price = Number(item.variant.price);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.variant.product.name} - ${item.variant.name}`,
            metadata: {
              productId: item.variant.product.id,
              variantId: item.variantId,
            },
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }

    // Calculate shipping
    const shippingAmount = await calculateShippingAmount(data.shippingMethodId, subtotal);
    subtotal += shippingAmount;

    // Calculate tax
    const taxAmount = await calculateTaxAmount(shippingAddress.state, subtotal);
    const total = subtotal + taxAmount;

    // Add shipping as a line item
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(shippingAmount * 100),
        },
        quantity: 1,
      });
    }

    // Add tax as a line item
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
          },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    });

    // Create Stripe checkout session
    // Note: Apple Pay requires domain verification via .well-known file
    // Google Pay works automatically with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout`,
      customer_email: user?.email,
      metadata: {
        cartId: cart.id,
        userId: user?.id || '',
        orderNumber: generateOrderNumber(),
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.useSameBillingAddress ? data.shippingAddressId : (data.billingAddressId || data.shippingAddressId),
        shippingMethodId: data.shippingMethodId,
        isGift: data.isGift ? 'true' : 'false',
        giftMessage: data.giftMessage || '',
        notes: data.notes || '',
      },
    });

    revalidatePath('/checkout');

    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url || '',
      },
    };
  } catch (error) {
    console.error('Create checkout session error:', error);
    return {
      success: false,
      error: 'An error occurred while creating the checkout session. Please try again.',
    };
  }
}

/**
 * Validate a discount code
 *
 * Validates a discount code and returns the discount details.
 *
 * @param code - Discount code to validate
 * @returns Result object with discount details or error
 *
 * @example
 * const result = await validateDiscountCode('SAVE20');
 */
export async function validateDiscountCode(code: string): Promise<ActionResult<{
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'SHIPPING';
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
}>> {
  try {
    // Validate input
    const validatedFields = validateDiscountCodeSchema.safeParse({ code });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const normalizedCode = code.toUpperCase().trim();

    // Get cart to check subtotal
    const cart = await getCart();
    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: 'Cannot validate discount for empty cart',
      };
    }

    // Calculate cart subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += Number(item.variant.price) * item.quantity;
    }

    // Note: In a real implementation, you would look up the discount in the database
    // const discount = await prisma.discount.findUnique({
    //   where: { code: normalizedCode },
    // });

    // Placeholder implementation
    // For demonstration, we'll validate some test codes
    const testDiscounts: Record<string, { type: 'PERCENTAGE' | 'FIXED' | 'SHIPPING'; value: number; minOrderValue: number; maxDiscount: number | null }> = {
      'SAVE10': { type: 'PERCENTAGE', value: 10, minOrderValue: 50, maxDiscount: 50 },
      'SAVE20': { type: 'PERCENTAGE', value: 20, minOrderValue: 100, maxDiscount: 100 },
      'FLAT25': { type: 'FIXED', value: 25, minOrderValue: 100, maxDiscount: null },
      'FREESHIP': { type: 'SHIPPING', value: 100, minOrderValue: 75, maxDiscount: null },
    };

    const discount = testDiscounts[normalizedCode];

    if (!discount) {
      return {
        success: false,
        error: 'Invalid discount code',
      };
    }

    // Check minimum order value
    if (subtotal < discount.minOrderValue) {
      return {
        success: false,
        error: `Minimum order value of $${discount.minOrderValue} required`,
      };
    }

    return {
      success: true,
      data: {
        code: normalizedCode,
        type: discount.type,
        value: discount.value,
        minOrderValue: discount.minOrderValue,
        maxDiscount: discount.maxDiscount,
      },
    };
  } catch (error) {
    console.error('Validate discount code error:', error);
    return {
      success: false,
      error: 'An error occurred while validating the discount code. Please try again.',
    };
  }
}

/**
 * Calculate shipping options for an address
 *
 * Returns available shipping methods and their costs for the given address.
 *
 * @param addressId - ID of the shipping address
 * @returns Result object with shipping options or error
 *
 * @example
 * const result = await calculateShipping('address123');
 */
export async function calculateShipping(addressId: string): Promise<ActionResult<{
  options: Array<{
    id: string;
    name: string;
    price: number;
    estimatedDays: string;
    description: string;
  }>;
}>> {
  try {
    // Validate input
    const validatedFields = calculateShippingSchema.safeParse({ addressId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Get address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return {
        success: false,
        error: 'Address not found',
      };
    }

    // Get cart to calculate shipping based on order value
    const cart = await getCart();
    let subtotal = 0;
    if (cart) {
      for (const item of cart.items) {
        subtotal += Number(item.variant.price) * item.quantity;
      }
    }

    // Define shipping options
    // In a real implementation, this would integrate with shipping carriers
    const options = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: subtotal >= 75 ? 0 : 5.99,
        estimatedDays: '5-7 business days',
        description: 'Delivered via USPS or UPS',
      },
      {
        id: 'express',
        name: 'Express Shipping',
        price: subtotal >= 150 ? 9.99 : 14.99,
        estimatedDays: '2-3 business days',
        description: 'Delivered via UPS or FedEx',
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        price: 29.99,
        estimatedDays: '1 business day',
        description: 'Order by 2 PM for next-day delivery',
      },
    ];

    return {
      success: true,
      data: { options },
    };
  } catch (error) {
    console.error('Calculate shipping error:', error);
    return {
      success: false,
      error: 'An error occurred while calculating shipping. Please try again.',
    };
  }
}

/**
 * Calculate tax for an address
 *
 * Calculates the tax amount based on the shipping address.
 *
 * @param addressId - ID of the shipping address
 * @returns Result object with tax amount or error
 *
 * @example
 * const result = await calculateTax('address123');
 */
export async function calculateTax(addressId: string): Promise<ActionResult<{
  taxRate: number;
  taxAmount: number;
  taxableAmount: number;
}>> {
  try {
    // Validate input
    const validatedFields = calculateTaxSchema.safeParse({ addressId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Get address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return {
        success: false,
        error: 'Address not found',
      };
    }

    // Get cart to calculate tax
    const cart = await getCart();
    if (!cart || cart.items.length === 0) {
      return {
        success: true,
        data: {
          taxRate: 0,
          taxAmount: 0,
          taxableAmount: 0,
        },
      };
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += Number(item.variant.price) * item.quantity;
    }

    // Calculate tax based on state
    // In a real implementation, you would use a tax service like TaxJar or Avalara
    const taxRates: Record<string, number> = {
      'CA': 0.0825,
      'NY': 0.08,
      'TX': 0.0625,
      'FL': 0.06,
      'IL': 0.0625,
      'PA': 0.06,
      'OH': 0.0575,
      'GA': 0.04,
      'NC': 0.0475,
      'MI': 0.06,
    };

    const taxRate = taxRates[address.state] || 0;
    const taxAmount = subtotal * taxRate;

    return {
      success: true,
      data: {
        taxRate,
        taxAmount: Math.round(taxAmount * 100) / 100,
        taxableAmount: subtotal,
      },
    };
  } catch (error) {
    console.error('Calculate tax error:', error);
    return {
      success: false,
      error: 'An error occurred while calculating tax. Please try again.',
    };
  }
}

// ============================================
// HELPER FUNCTIONS FOR CALCULATIONS
// ============================================

/**
 * Calculate shipping amount for a shipping method
 */
async function calculateShippingAmount(methodId: string, subtotal: number): Promise<number> {
  switch (methodId) {
    case 'standard':
      return subtotal >= 75 ? 0 : 5.99;
    case 'express':
      return subtotal >= 150 ? 9.99 : 14.99;
    case 'overnight':
      return 29.99;
    default:
      return 5.99;
  }
}

/**
 * Calculate tax amount for a state
 */
async function calculateTaxAmount(state: string, subtotal: number): Promise<number> {
  const taxRates: Record<string, number> = {
    'CA': 0.0825,
    'NY': 0.08,
    'TX': 0.0625,
    'FL': 0.06,
    'IL': 0.0625,
    'PA': 0.06,
    'OH': 0.0575,
    'GA': 0.04,
    'NC': 0.0475,
    'MI': 0.06,
  };

  const taxRate = taxRates[state] || 0;
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Get checkout summary
 *
 * Returns a summary of the checkout including cart items, totals, and applied discounts.
 *
 * @returns Result object with checkout summary or error
 *
 * @example
 * const result = await getCheckoutSummary();
 */
export async function getCheckoutSummary(): Promise<ActionResult<{
  items: Array<{
    id: string;
    variantId: string;
    quantity: number;
    productName: string;
    variantName: string;
    price: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}>> {
  try {
    // Get cart
    const cart = await getCart();
    if (!cart || cart.items.length === 0) {
      return {
        success: true,
        data: {
          items: [],
          subtotal: 0,
          shipping: 0,
          tax: 0,
          discount: 0,
          total: 0,
        },
      };
    }

    // Calculate totals
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const price = Number(item.variant.price);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        price,
        lineTotal,
      };
    });

    // Default shipping (standard)
    const shipping = subtotal >= 75 ? 0 : 5.99;

    // Default tax (will be recalculated based on address)
    const tax = 0;

    // No discount applied yet
    const discount = 0;

    const total = subtotal + shipping + tax - discount;

    return {
      success: true,
      data: {
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
    };
  } catch (error) {
    console.error('Get checkout summary error:', error);
    return {
      success: false,
      error: 'An error occurred while fetching the checkout summary. Please try again.',
    };
  }
}
