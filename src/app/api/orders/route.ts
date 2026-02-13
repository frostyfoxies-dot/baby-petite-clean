import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/session';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/errors';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const createOrderSchema = z.object({
  checkoutSessionId: z.string().min(1, 'Checkout session ID is required'),
});

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

export interface OrdersListResponse {
  orders: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
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
    };
  }>;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
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
    estimatedDelivery: Date | null;
    actualDelivery: Date | null;
  } | null;
  payment: {
    provider: string;
    cardLast4: string | null;
    cardBrand: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KP-${timestamp}-${random}`;
}

// ============================================================================
// GET /api/orders - List user's orders
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = orderQuerySchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    });

    if (!queryParams.success) {
      throw new BadRequestError('Invalid query parameters', queryParams.error.flatten());
    }

    const { page, limit, status, paymentStatus, startDate, endDate } = queryParams.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      userId: string;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      userId: user.id,
    };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get orders
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: { quantity: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const transformedOrders: OrderListItem[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total.toNumber(),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const response: OrdersListResponse = {
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/orders - Create order from checkout
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createOrderSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const { checkoutSessionId } = validationResult.data;

    // Get checkout session
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { id: checkoutSessionId },
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
                        slug: true,
                      },
                    },
                    inventory: {
                      select: { available: true, quantity: true, reservedQuantity: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!checkoutSession) {
      throw new NotFoundError('Checkout session not found');
    }

    // Verify ownership
    if (checkoutSession.userId !== user.id) {
      throw new UnauthorizedError('You do not have access to this checkout session');
    }

    // Check if order already exists for this checkout session
    const existingOrder = await prisma.order.findFirst({
      where: { id: checkoutSession.orderId || undefined },
    });

    if (existingOrder) {
      return NextResponse.json({ order: existingOrder, message: 'Order already exists' });
    }

    // Validate stock availability before creating order
    for (const item of checkoutSession.cart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.variant.product.id },
        select: { name: true, stockQuantity: true },
      });

      if (!product) {
        throw new BadRequestError(`Product no longer available: ${item.variant.product.name}`);
      }

      if ((product.stockQuantity || 0) < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity || 0}, Requested: ${item.quantity}`);
      }
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Calculate totals
    const subtotal = checkoutSession.subtotal;
    const shipping = checkoutSession.shipping;
    const discount = checkoutSession.discount;
    const tax = subtotal * 0.08; // Simplified tax calculation
    const total = subtotal + shipping + tax - discount;

    // Create order with items
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal,
          discountAmount: discount,
          shippingAmount: shipping,
          taxAmount: tax,
          total,
          currency: 'USD',
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          shippingAddress: checkoutSession.shippingAddress,
          billingAddress: checkoutSession.billingAddress,
          customerEmail: checkoutSession.email,
          customerPhone: checkoutSession.shippingAddress.phone || null,
          notes: checkoutSession.notes,
          couponCode: checkoutSession.discountCode,
          items: {
            create: checkoutSession.cart.items.map((item) => ({
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantName: item.variant.name,
              sku: item.variant.sku,
              quantity: item.quantity,
              unitPrice: item.variant.price,
              totalPrice: item.variant.price.mul(item.quantity),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Create shipping record
      await tx.shipping.create({
        data: {
          orderId: newOrder.id,
          service: checkoutSession.shippingMethod,
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          provider: 'stripe',
          amount: total,
          currency: 'USD',
          status: PaymentStatus.PENDING,
        },
      });

      // Update inventory (reserve items)
      for (const item of checkoutSession.cart.items) {
        if (item.variant.inventory) {
          await tx.inventory.update({
            where: { variantId: item.variantId },
            data: {
              reservedQuantity: {
                increment: item.quantity,
              },
              available: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: checkoutSession.cartId },
      });

      // Update checkout session
      await tx.checkoutSession.update({
        where: { id: checkoutSessionId },
        data: {
          status: 'COMPLETED',
          orderId: newOrder.id,
          completedAt: new Date(),
        },
      });

      return newOrder;
    });

    return NextResponse.json(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total.toNumber(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
