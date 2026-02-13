import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { AppError, NotFoundError, ForbiddenError } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface CheckoutSessionDetailResponse {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELED';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'canceled';
  customerEmail: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingMethod: {
    id: string;
    name: string;
    price: number;
    estimatedDays: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    size: string;
    color: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  summary: {
    subtotal: number;
    shipping: number;
    discount: number;
    tax: number;
    total: number;
  };
  discountCode?: string;
  notes?: string;
  orderNumber?: string;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const SHIPPING_METHODS: Record<string, { name: string; price: number; estimatedDays: string }> = {
  standard: { name: 'Standard Shipping', price: 9.99, estimatedDays: '5-7 business days' },
  express: { name: 'Express Shipping', price: 19.99, estimatedDays: '2-3 business days' },
  overnight: { name: 'Overnight Shipping', price: 39.99, estimatedDays: '1 business day' },
  free: { name: 'Free Shipping', price: 0, estimatedDays: '7-10 business days' },
};

// ============================================================================
// GET /api/checkout/session/[sessionId] - Get checkout session details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    // Get checkout session from our database
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    if (!checkoutSession) {
      // Try to get from Stripe directly (might be a direct Stripe session ID)
      try {
        const stripeSession = await getCheckoutSession(sessionId);
        
        // Build response from Stripe data
        const shippingMethod = SHIPPING_METHODS[stripeSession.metadata?.shippingMethodId || 'standard'];
        
        const response: CheckoutSessionDetailResponse = {
          id: stripeSession.id,
          status: mapStripeStatusToLocal(stripeSession.status),
          paymentStatus: mapStripePaymentStatus(stripeSession.payment_status),
          customerEmail: stripeSession.customer_email || stripeSession.customer_details?.email || '',
          shippingAddress: {
            firstName: stripeSession.shipping_details?.name?.split(' ')[0] || '',
            lastName: stripeSession.shipping_details?.name?.split(' ').slice(1).join(' ') || '',
            line1: stripeSession.shipping_details?.address?.line1 || '',
            line2: stripeSession.shipping_details?.address?.line2 || undefined,
            city: stripeSession.shipping_details?.address?.city || '',
            state: stripeSession.shipping_details?.address?.state || '',
            postalCode: stripeSession.shipping_details?.address?.postal_code || '',
            country: stripeSession.shipping_details?.address?.country || '',
          },
          billingAddress: {
            firstName: '',
            lastName: '',
            line1: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
          shippingMethod: {
            id: stripeSession.metadata?.shippingMethodId || 'standard',
            name: shippingMethod?.name || 'Standard Shipping',
            price: shippingMethod?.price || 9.99,
            estimatedDays: shippingMethod?.estimatedDays || '5-7 business days',
          },
          items: (stripeSession.line_items?.data || []).map((item) => ({
            productId: item.price?.product?.metadata?.productId || '',
            productName: item.description || '',
            variantId: item.price?.product?.metadata?.variantId || '',
            variantName: '',
            size: '',
            color: null,
            quantity: item.quantity || 1,
            unitPrice: (item.price?.unit_amount || 0) / 100,
            totalPrice: ((item.price?.unit_amount || 0) * (item.quantity || 1)) / 100,
          })),
          summary: {
            subtotal: (stripeSession.amount_subtotal || 0) / 100,
            shipping: shippingMethod?.price || 0,
            discount: 0,
            tax: (stripeSession.total_details?.amount_tax || 0) / 100,
            total: (stripeSession.amount_total || 0) / 100,
          },
          discountCode: stripeSession.metadata?.discountCode || undefined,
          notes: stripeSession.metadata?.notes || undefined,
          createdAt: new Date(stripeSession.created * 1000),
          expiresAt: new Date(stripeSession.expires_at * 1000),
        };

        return NextResponse.json(response);
      } catch {
        throw new NotFoundError('Checkout session not found');
      }
    }

    // Check authorization
    if (user && checkoutSession.userId && checkoutSession.userId !== user.id) {
      throw new ForbiddenError('You do not have access to this checkout session');
    }

    // Get shipping method
    const shippingMethod = SHIPPING_METHODS[checkoutSession.shippingMethod] || SHIPPING_METHODS.standard;

    // Build items from cart
    const items = checkoutSession.cart.items.map((item) => ({
      productId: item.variant.product.id,
      productName: item.variant.product.name,
      variantId: item.variantId,
      variantName: item.variant.name,
      size: item.variant.size,
      color: item.variant.color,
      quantity: item.quantity,
      unitPrice: item.variant.price.toNumber(),
      totalPrice: item.variant.price.toNumber() * item.quantity,
    }));

    // Calculate totals
    const subtotal = checkoutSession.subtotal;
    const shipping = checkoutSession.shipping;
    const discount = checkoutSession.discount;
    const tax = subtotal * 0.08; // Simplified tax calculation
    const total = subtotal + shipping + tax - discount;

    const response: CheckoutSessionDetailResponse = {
      id: checkoutSession.id,
      status: checkoutSession.status,
      paymentStatus: 'pending', // Would be updated from Stripe
      customerEmail: checkoutSession.email,
      shippingAddress: checkoutSession.shippingAddress as CheckoutSessionDetailResponse['shippingAddress'],
      billingAddress: checkoutSession.billingAddress as CheckoutSessionDetailResponse['billingAddress'],
      shippingMethod: {
        id: checkoutSession.shippingMethod,
        name: shippingMethod.name,
        price: shippingMethod.price,
        estimatedDays: shippingMethod.estimatedDays,
      },
      items,
      summary: {
        subtotal,
        shipping,
        discount,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
      discountCode: checkoutSession.discountCode || undefined,
      notes: checkoutSession.notes || undefined,
      orderNumber: checkoutSession.order?.orderNumber,
      createdAt: checkoutSession.createdAt,
      expiresAt: checkoutSession.expiresAt,
      completedAt: checkoutSession.completedAt || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapStripeStatusToLocal(
  status: string | null
): 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELED' {
  switch (status) {
    case 'complete':
      return 'COMPLETED';
    case 'expired':
      return 'EXPIRED';
    case 'canceled':
      return 'CANCELED';
    default:
      return 'PENDING';
  }
}

function mapStripePaymentStatus(
  status: string
): 'pending' | 'paid' | 'failed' | 'canceled' {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    default:
      return 'pending';
  }
}
