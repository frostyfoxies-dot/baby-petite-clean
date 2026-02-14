import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { createCheckoutSession, formatAmountForStripe } from '@/lib/stripe';
import { z } from 'zod';
import { calculateTax } from '@/lib/tax';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  OutOfStockError,
} from '@/lib/errors';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const createCheckoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  shippingAddress: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(2, 'Country is required'),
    phone: z.string().optional(),
  }),
  billingAddress: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(2, 'Country is required'),
    phone: z.string().optional(),
  }).optional(),
  useSameBillingAddress: z.boolean().default(true),
  shippingMethodId: z.string().min(1, 'Shipping method is required'),
  discountCode: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CheckoutError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('cart_session')?.value || null;
}

async function getCart(userId: string | null, sessionId: string | null) {
  if (userId) {
    return prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                  },
                },
                inventory: {
                  select: { available: true },
                },
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
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                  },
                },
                inventory: {
                  select: { available: true },
                },
              },
            },
          },
        },
      },
    });
  }
  return null;
}

// Shipping methods configuration
const SHIPPING_METHODS: Record<string, { name: string; price: number; estimatedDays: string }> = {
  standard: { name: 'Standard Shipping', price: 9.99, estimatedDays: '5-7 business days' },
  express: { name: 'Express Shipping', price: 19.99, estimatedDays: '2-3 business days' },
  overnight: { name: 'Overnight Shipping', price: 39.99, estimatedDays: '1 business day' },
  free: { name: 'Free Shipping', price: 0, estimatedDays: '7-10 business days' },
};

// ============================================================================
// POST /api/checkout - Create Stripe checkout session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sessionId = await getSessionId();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCheckoutSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const checkoutData = validationResult.data;

    // Get cart
    const cart = await getCart(user?.id || null, sessionId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // Validate stock and build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      // Check if product is active
      if (!item.variant.product.isActive) {
        throw new BadRequestError(`Product ${item.variant.product.name} is no longer available`);
      }

      // Check stock
      const availableStock = item.variant.inventory?.available || 0;
      if (availableStock < item.quantity) {
        throw new OutOfStockError(
          item.variant.product.id,
          item.variantId,
          item.quantity,
          availableStock
        );
      }

      const price = item.variant.price.toNumber();
      subtotal += price * item.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.variant.product.name,
            description: `${item.variant.name} - Size: ${item.variant.size}${item.variant.color ? `, Color: ${item.variant.color}` : ''}`,
            metadata: {
              productId: item.variant.product.id,
              variantId: item.variantId,
            },
          },
          unit_amount: formatAmountForStripe(price),
        },
        quantity: item.quantity,
      });
    }

    // Get shipping method
    const shippingMethod = SHIPPING_METHODS[checkoutData.shippingMethodId];
    if (!shippingMethod) {
      throw new BadRequestError('Invalid shipping method');
    }

    // Add shipping as a line item if not free
    if (shippingMethod.price > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: shippingMethod.name,
            description: shippingMethod.estimatedDays,
          },
          unit_amount: formatAmountForStripe(shippingMethod.price),
        },
        quantity: 1,
      });
    }

    // Calculate tax based on shipping destination
    const shippingCountry = checkoutData.shippingAddress.country;
    const shippingState = checkoutData.shippingAddress.state || null;
    const tax = calculateTax(subtotal, shippingMethod.price, shippingCountry, shippingState);

    // Add tax as a line item if nonzero
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: `Sales tax for ${shippingCountry}${shippingState ? `, ${shippingState}` : ''}`,
          },
          unit_amount: formatAmountForStripe(tax),
        },
        quantity: 1,
      });
    }

    // Apply discount if provided
    let discountAmount = 0;
    if (checkoutData.discountCode) {
      const discount = await (prisma as any).discount.findUnique({
        where: { code: checkoutData.discountCode.toUpperCase() },
      });

      if (discount && discount.isActive) {
        // Validate discount
        const now = new Date();
        if (discount.startDate && discount.startDate > now) {
          throw new BadRequestError('Discount code is not yet active');
        }
        if (discount.endDate && discount.endDate < now) {
          throw new BadRequestError('Discount code has expired');
        }
        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
          throw new BadRequestError('Discount code has reached its usage limit');
        }
        if (discount.minOrderValue && subtotal < discount.minOrderValue.toNumber()) {
          throw new BadRequestError(`Minimum order value of $${discount.minOrderValue} required`);
        }

        // Calculate discount
        if (discount.type === 'PERCENTAGE') {
          discountAmount = subtotal * (discount.value.toNumber() / 100);
        } else if (discount.type === 'FIXED') {
          discountAmount = discount.value.toNumber();
        }

        // Add discount as negative line item
        if (discountAmount > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Discount: ${checkoutData.discountCode}`,
              },
              unit_amount: -formatAmountForStripe(Math.min(discountAmount, subtotal)),
            },
            quantity: 1,
          });
        }
      }
    }

    // Build success and cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout?canceled=true`;

    // Create Stripe checkout session
    const stripeSession = await createCheckoutSession({
      lineItems: lineItems as any,
      successUrl,
      cancelUrl,
      customerId: user?.id ? undefined : undefined, // Would fetch Stripe customer ID if exists
      customerEmail: checkoutData.email,
      metadata: {
        userId: user?.id || '',
        cartId: cart.id,
        shippingMethodId: checkoutData.shippingMethodId,
        discountCode: checkoutData.discountCode || '',
        notes: checkoutData.notes || '',
      },
      shippingAddressCollection: {
        allowedCountries: ['US', 'CA', 'GB', 'AU', 'MY', 'SG'],
      },
      allowPromotionCodes: false, // We handle discounts ourselves
    });

    // Store checkout data in database for later retrieval
    await (prisma as any).checkoutSession.create({
      data: {
        id: stripeSession.id,
        cartId: cart.id,
        userId: user?.id,
        email: checkoutData.email,
        shippingAddress: checkoutData.shippingAddress,
        billingAddress: checkoutData.billingAddress || checkoutData.shippingAddress,
        shippingMethod: checkoutData.shippingMethodId,
        discountCode: checkoutData.discountCode,
        notes: checkoutData.notes,
        subtotal,
        shipping: shippingMethod.price,
        discount: discountAmount,
        status: 'PENDING',
        expiresAt: new Date(stripeSession.expires_at * 1000),
      },
    });

    const response: CheckoutSessionResponse = {
      sessionId: stripeSession.id,
      url: stripeSession.url || '',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
