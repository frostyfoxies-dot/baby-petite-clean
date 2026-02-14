'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError, InvalidOrderStatusError } from '@/lib/errors';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { createDropshipOrderForOrder } from '@/services/fulfillment/order-handler';

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
 * Create order input schema
 */
const createOrderSchema = z.object({
  checkoutSessionId: z.string().min(1, 'Checkout session ID is required'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Cancel order input schema
 */
const cancelOrderSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

/**
 * Request refund input schema
 */
const requestRefundSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  reason: z.string().min(10, 'Please provide a reason (at least 10 characters)').max(500),
});

export type RequestRefundInput = z.infer<typeof requestRefundSchema>;

/**
 * Track order input schema
 */
const trackOrderSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
});

export type TrackOrderInput = z.infer<typeof trackOrderSchema>;

// ============================================
// ORDER ACTIONS
// ============================================

/**
 * Create an order from a checkout session
 *
 * Creates an order after successful payment via Stripe checkout.
 *
 * @param checkoutSessionId - Stripe checkout session ID
 * @returns Result object with order details or error
 *
 * @example
 * const result = await createOrder('cs_test_123');
 */
export async function createOrder(checkoutSessionId: string): Promise<ActionResult<{
  orderNumber: string;
  orderId: string;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();

    // Validate input
    const validatedFields = createOrderSchema.safeParse({ checkoutSessionId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia' as any,
    });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

    if (session.payment_status !== 'paid') {
      return {
        success: false,
        error: 'Payment not completed',
      };
    }

    // Check if order already exists for this session
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: session.payment_intent as string },
    });

    if (existingPayment) {
      // Order already created
      const order = await prisma.order.findUnique({
        where: { id: existingPayment.orderId },
      });
      return {
        success: true,
        data: {
          orderNumber: order?.orderNumber || '',
          orderId: order?.id || '',
        },
      };
    }

    // Get metadata
    const metadata = session.metadata || {};
    const userId = metadata.userId || null;
    const cartId = metadata.cartId;
    const orderNumber = metadata.orderNumber || generateOrderNumber();
    const shippingAddressId = metadata.shippingAddressId;
    const billingAddressId = metadata.billingAddressId;
    const shippingMethodId = metadata.shippingMethodId;
    const isGift = metadata.isGift === 'true';
    const giftMessage = metadata.giftMessage || null;
    const notes = metadata.notes || null;

    // Get cart items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: 'Cart is empty',
      };
    }

    // Get addresses
    const shippingAddress = await prisma.address.findUnique({
      where: { id: shippingAddressId },
    });

    if (!shippingAddress) {
      return {
        success: false,
        error: 'Shipping address not found',
      };
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      variantId: string;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of cart.items) {
      const unitPrice = Number(item.variant.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        variantId: item.variantId,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        sku: item.variant.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    // Calculate shipping and tax
    const shippingAmount = await calculateShippingCost(shippingMethodId, subtotal);
    const taxAmount = await calculateTaxForOrder(shippingAddress.state, subtotal);
    const total = subtotal + shippingAmount + taxAmount;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || undefined,
          subtotal,
          shippingAmount,
          taxAmount,
          total,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          shippingAddress: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            company: shippingAddress.company,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zip,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
          },
          billingAddress: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            company: shippingAddress.company,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zip,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
          },
          customerEmail: user?.email || session.customer_email || '',
          customerPhone: shippingAddress.phone,
          notes,
          confirmedAt: new Date(),
        },
      });

      // Create order items
      for (const item of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });

        // Update inventory
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: {
            quantity: { decrement: item.quantity },
            reservedQuantity: { decrement: item.quantity },
            available: { decrement: item.quantity },
          },
        });
      }

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          provider: 'stripe',
          stripePaymentIntentId: session.payment_intent as string,
          amount: total,
          status: PaymentStatus.COMPLETED,
          paymentMethod: session.payment_method_types?.[0] || 'card',
        },
      });

      // Create shipping record
      await tx.shipping.create({
        data: {
          orderId: newOrder.id,
          service: shippingMethodId,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Create dropship order for any dropshipped products (after main transaction)
    try {
      // Get the created order items with their IDs
      const createdOrderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      await createDropshipOrderForOrder(
        {
          id: order.id,
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress as Record<string, unknown>,
          subtotal: Number(order.subtotal),
          shippingAmount: Number(order.shippingAmount),
          total: Number(order.total),
        },
        createdOrderItems.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        }))
      );
    } catch (dropshipError) {
      // Log but don't fail the order creation
      console.error('Failed to create dropship order:', dropshipError);
    }

    revalidatePath('/account/orders');
    revalidatePath('/account');
    revalidateTag('orders');

    return {
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
      },
    };
  } catch (error) {
    console.error('Create order error:', error);
    return {
      success: false,
      error: 'An error occurred while creating your order. Please contact support.',
    };
  }
}

/**
 * Cancel an order
 *
 * Cancels an order if it hasn't been shipped yet.
 *
 * @param orderNumber - Order number to cancel
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await cancelOrder('KP-ABC123-XYZ');
 */
export async function cancelOrder(orderNumber: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to cancel an order');
    }

    // Validate input
    const validatedFields = cancelOrderSchema.safeParse({ orderNumber });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: user.id,
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if order can be cancelled
    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      return {
        success: false,
        error: 'Cannot cancel an order that has been shipped or delivered',
      };
    }

    if (order.status === OrderStatus.CANCELLED) {
      return {
        success: false,
        error: 'Order is already cancelled',
      };
    }

    // Cancel order and process refund
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Restore inventory
      for (const item of order.items) {
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: {
            quantity: { increment: item.quantity },
            available: { increment: item.quantity },
          },
        });
      }

      // Process refund if payment was completed
      if (order.payment && order.payment.status === PaymentStatus.COMPLETED) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2025-02-24.acacia' as any,
        });

        // Create refund
        await stripe.refunds.create({
          payment_intent: order.payment.stripePaymentIntentId!,
          reason: 'requested_by_customer',
        });

        // Update payment status
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }
    });

    revalidatePath('/account/orders');
    revalidatePath(`/account/orders/${orderNumber}`);
    revalidateTag('orders');

    return { success: true };
  } catch (error) {
    console.error('Cancel order error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while cancelling your order. Please try again.',
    };
  }
}

/**
 * Request a refund for an order
 *
 * Submits a refund request for a delivered order.
 *
 * @param orderNumber - Order number
 * @param reason - Reason for refund
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await requestRefund({
 *   orderNumber: 'KP-ABC123-XYZ',
 *   reason: 'Product was damaged on arrival',
 * });
 */
export async function requestRefund(orderNumber: string, reason: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to request a refund');
    }

    // Validate input
    const validatedFields = requestRefundSchema.safeParse({ orderNumber, reason });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: user.id,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if order is eligible for refund
    if (order.status === OrderStatus.CANCELLED) {
      return {
        success: false,
        error: 'Cannot request refund for a cancelled order',
      };
    }

    if (order.status === OrderStatus.REFUNDED) {
      return {
        success: false,
        error: 'Order has already been refunded',
      };
    }

    // Check if within refund window (e.g., 30 days)
    const daysSinceDelivery = order.deliveredAt
      ? Math.floor((Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysSinceDelivery > 30) {
      return {
        success: false,
        error: 'Refund requests must be made within 30 days of delivery',
      };
    }

    // In a real implementation, you would:
    // 1. Create a refund request record
    // 2. Send notification to admin
    // 3. Process the refund through Stripe

    // For now, we'll update the order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REFUNDED,
        notes: `Refund requested: ${reason}`,
      },
    });

    revalidatePath('/account/orders');
    revalidatePath(`/account/orders/${orderNumber}`);
    revalidateTag('orders');

    return { success: true };
  } catch (error) {
    console.error('Request refund error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while requesting a refund. Please try again.',
    };
  }
}

/**
 * Track an order
 *
 * Returns tracking information for an order.
 *
 * @param orderNumber - Order number to track
 * @returns Result object with tracking information or error
 *
 * @example
 * const result = await trackOrder('KP-ABC123-XYZ');
 */
export async function trackOrder(orderNumber: string): Promise<ActionResult<{
  orderNumber: string;
  status: OrderStatus;
  estimatedDelivery: Date | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  events: Array<{
    status: string;
    location: string;
    timestamp: Date;
    description: string;
  }>;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();

    // Validate input
    const validatedFields = trackOrderSchema.safeParse({ orderNumber });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        // Allow tracking without login for order status page
        ...(user ? { userId: user.id } : {}),
      },
      include: {
        shipping: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Build tracking events based on order status
    const events: Array<{
      status: string;
      location: string;
      timestamp: Date;
      description: string;
    }> = [];

    if (order.confirmedAt) {
      events.push({
        status: 'confirmed',
        location: 'Online',
        timestamp: order.confirmedAt,
        description: 'Order confirmed',
      });
    }

    if (order.shippedAt) {
      events.push({
        status: 'shipped',
        location: 'Warehouse',
        timestamp: order.shippedAt,
        description: 'Order shipped',
      });
    }

    if (order.deliveredAt) {
      events.push({
        status: 'delivered',
        location: 'Destination',
        timestamp: order.deliveredAt,
        description: 'Order delivered',
      });
    }

    return {
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDelivery: order.shipping?.estimatedDelivery || null,
        trackingNumber: order.shipping?.trackingNumber || null,
        trackingUrl: order.shipping?.trackingUrl || null,
        carrier: order.shipping?.carrier || null,
        events,
      },
    };
  } catch (error) {
    console.error('Track order error:', error);
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while tracking your order. Please try again.',
    };
  }
}

/**
 * Get user's orders
 *
 * Retrieves all orders for the current user.
 *
 * @param options - Pagination and filtering options
 * @returns Result object with orders or error
 *
 * @example
 * const result = await getUserOrders({ limit: 10, offset: 0 });
 */
export async function getUserOrders(options?: {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
}): Promise<ActionResult<{
  orders: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    total: number;
    createdAt: Date;
    itemCount: number;
  }>;
  total: number;
  hasMore: boolean;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view orders');
    }

    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    // Get orders
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: user.id,
          ...(options?.status && { status: options.status }),
        },
        include: {
          items: { select: { quantity: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: offset,
      }),
      prisma.order.count({
        where: {
          userId: user.id,
          ...(options?.status && { status: options.status }),
        },
      }),
    ]);

    const hasMore = orders.length > limit;
    if (hasMore) {
      orders.pop();
    }

    return {
      success: true,
      data: {
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          total: Number(order.total),
          createdAt: order.createdAt,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        })),
        total,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Get user orders error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching your orders. Please try again.',
    };
  }
}

/**
 * Get a single order by order number
 *
 * Retrieves detailed information for a specific order.
 *
 * @param orderNumber - Order number
 * @returns Result object with order details or error
 *
 * @example
 * const result = await getOrder('KP-ABC123-XYZ');
 */
export async function getOrder(orderNumber: string): Promise<ActionResult<{
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
  customerEmail: string;
  customerPhone: string | null;
  notes: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shipping: {
    carrier: string | null;
    service: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    estimatedDelivery: Date | null;
  } | null;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view order details');
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: user.id,
      },
      include: {
        items: true,
        shipping: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        subtotal: Number(order.subtotal),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        total: Number(order.total),
        shippingAddress: order.shippingAddress as Record<string, unknown>,
        billingAddress: order.billingAddress as Record<string, unknown>,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        notes: order.notes,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        shipping: order.shipping ? {
          carrier: order.shipping.carrier,
          service: order.shipping.service,
          trackingNumber: order.shipping.trackingNumber,
          trackingUrl: order.shipping.trackingUrl,
          estimatedDelivery: order.shipping.estimatedDelivery,
        } : null,
      },
    };
  } catch (error) {
    console.error('Get order error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching the order. Please try again.',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KP-${timestamp}-${random}`;
}

/**
 * Calculate shipping cost for a shipping method
 */
async function calculateShippingCost(methodId: string, subtotal: number): Promise<number> {
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
 * Calculate tax for an order
 */
async function calculateTaxForOrder(state: string, subtotal: number): Promise<number> {
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
