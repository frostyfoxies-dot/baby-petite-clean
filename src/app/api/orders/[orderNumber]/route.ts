import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { AppError, UnauthorizedError, NotFoundError, ForbiddenError } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variant: {
      id: string;
      size: string;
      color: string | null;
      product: {
        id: string;
        name: string;
        slug: string;
        images: Array<{ url: string; altText: string | null }>;
      };
    };
  }>;
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
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  customerEmail: string;
  customerPhone: string | null;
  notes: string | null;
  couponCode: string | null;
  shipping: {
    carrier: string | null;
    service: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: string | null;
    estimatedDelivery: string | null;
    actualDelivery: string | null;
  } | null;
  payment: {
    provider: string;
    status: string;
    cardLast4: string | null;
    cardBrand: string | null;
  } | null;
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}

// ============================================================================
// GET /api/orders/[orderNumber] - Get order details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
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
                    images: {
                      where: { isPrimary: true },
                      select: { url: true, altText: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        shipping: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check authorization - only the order owner or admin/staff can view
    if (order.userId !== user.id && user.role === 'CUSTOMER') {
      throw new ForbiddenError('You do not have access to this order');
    }

    // Build timeline
    const timeline: OrderDetailResponse['timeline'] = [];

    timeline.push({
      status: 'created',
      timestamp: order.createdAt.toISOString(),
      description: 'Order placed',
    });

    if (order.confirmedAt) {
      timeline.push({
        status: 'confirmed',
        timestamp: order.confirmedAt.toISOString(),
        description: 'Order confirmed',
      });
    }

    if (order.shippedAt) {
      timeline.push({
        status: 'shipped',
        timestamp: order.shippedAt.toISOString(),
        description: order.shipping?.trackingNumber
          ? `Shipped via ${order.shipping.carrier || 'carrier'} - Tracking: ${order.shipping.trackingNumber}`
          : 'Order shipped',
      });
    }

    if (order.deliveredAt) {
      timeline.push({
        status: 'delivered',
        timestamp: order.deliveredAt.toISOString(),
        description: 'Order delivered',
      });
    }

    if (order.cancelledAt) {
      timeline.push({
        status: 'cancelled',
        timestamp: order.cancelledAt.toISOString(),
        description: 'Order cancelled',
      });
    }

    const response: OrderDetailResponse = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
        variant: {
          id: item.variant.id,
          size: item.variant.size,
          color: item.variant.color,
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            slug: item.variant.product.slug,
            images: item.variant.product.images,
          },
        },
      })),
      shippingAddress: order.shippingAddress as OrderDetailResponse['shippingAddress'],
      billingAddress: order.billingAddress as OrderDetailResponse['billingAddress'],
      subtotal: order.subtotal.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      shippingAmount: order.shippingAmount.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      total: order.total.toNumber(),
      currency: order.currency,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      notes: order.notes,
      couponCode: order.couponCode,
      shipping: order.shipping
        ? {
            carrier: order.shipping.carrier,
            service: order.shipping.service,
            trackingNumber: order.shipping.trackingNumber,
            trackingUrl: order.shipping.trackingUrl,
            status: order.shipping.status,
            estimatedDelivery: order.shipping.estimatedDelivery?.toISOString() || null,
            actualDelivery: order.shipping.actualDelivery?.toISOString() || null,
          }
        : null,
      payment: order.payment
        ? {
            provider: order.payment.provider,
            status: order.payment.status,
            cardLast4: order.payment.cardLast4,
            cardBrand: order.payment.cardBrand,
          }
        : null,
      timeline,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      confirmedAt: order.confirmedAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      cancelledAt: order.cancelledAt?.toISOString() || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
