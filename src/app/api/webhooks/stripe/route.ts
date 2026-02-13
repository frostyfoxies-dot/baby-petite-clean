import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';
import Stripe from 'stripe';

// ============================================================================
// TYPES
// ============================================================================

interface WebhookResponse {
  received: boolean;
  message?: string;
  error?: string;
}

// ============================================================================
// POST /api/webhooks/stripe - Handle Stripe webhooks
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<WebhookResponse>> {
  try {
    // Get raw body
    const body = await request.text();
    
    // Get Stripe signature from header
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { received: false, error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook event
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { received: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the event
    console.log(`Received Stripe webhook: ${event.type} (${event.id})`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { received: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle checkout.session.completed event
 * This is triggered when a customer completes a checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log(`Processing checkout session: ${session.id}`);

  // Find the checkout session in our database
  const checkoutSession = await prisma.checkoutSession.findUnique({
    where: { id: session.id },
    include: {
      cart: {
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: { id: true, name: true },
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
    console.log(`Checkout session not found in database: ${session.id}`);
    return;
  }

  // If order already exists, skip
  if (checkoutSession.orderId) {
    console.log(`Order already exists for checkout session: ${session.id}`);
    return;
  }

  // Generate order number
  const orderNumber = generateOrderNumber();

  // Calculate totals
  const subtotal = checkoutSession.subtotal;
  const shipping = checkoutSession.shipping;
  const discount = checkoutSession.discount;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax - discount;

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: checkoutSession.userId || undefined,
        subtotal,
        discountAmount: discount,
        shippingAmount: shipping,
        taxAmount: tax,
        total,
        currency: 'USD',
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PROCESSING,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        shippingAddress: checkoutSession.shippingAddress,
        billingAddress: checkoutSession.billingAddress,
        customerEmail: checkoutSession.email,
        customerPhone: checkoutSession.shippingAddress.phone || null,
        notes: checkoutSession.notes,
        couponCode: checkoutSession.discountCode,
        confirmedAt: new Date(),
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
        stripePaymentIntentId: session.payment_intent as string || undefined,
        amount: total,
        currency: 'USD',
        status: PaymentStatus.PROCESSING,
      },
    });

    // Update inventory (reserve items)
    for (const item of checkoutSession.cart.items) {
      const inventory = await tx.inventory.findUnique({
        where: { variantId: item.variantId },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: {
            reservedQuantity: { increment: item.quantity },
            available: { decrement: item.quantity },
          },
        });
      }
    }

    // Clear cart items
    await tx.cartItem.deleteMany({
      where: { cartId: checkoutSession.cartId },
    });

    // Update checkout session
    await tx.checkoutSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        orderId: newOrder.id,
        completedAt: new Date(),
      },
    });

    return newOrder;
  });

  console.log(`Order created: ${order.orderNumber} from checkout session: ${session.id}`);
}

/**
 * Handle payment_intent.succeeded event
 * This is triggered when a payment is successful
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Processing successful payment intent: ${paymentIntent.id}`);

  // Find the payment record
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { order: true },
  });

  if (!payment) {
    console.log(`Payment not found for payment intent: ${paymentIntent.id}`);
    return;
  }

  // Update payment and order status
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        cardLast4: paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4 || null,
        cardBrand: paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand || null,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        status: payment.order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : undefined,
        confirmedAt: payment.order.confirmedAt || new Date(),
      },
    }),
  ]);

  console.log(`Payment completed for order: ${payment.order.orderNumber}`);
}

/**
 * Handle payment_intent.payment_failed event
 * This is triggered when a payment fails
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Processing failed payment intent: ${paymentIntent.id}`);

  // Find the payment record
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { order: true },
  });

  if (!payment) {
    console.log(`Payment not found for payment intent: ${paymentIntent.id}`);
    return;
  }

  // Update payment and order status
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        failureCode: paymentIntent.last_payment_error?.code || null,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.FAILED,
      },
    }),
  ]);

  console.log(`Payment failed for order: ${payment.order.orderNumber}`);
}

/**
 * Handle charge.refunded event
 * This is triggered when a charge is refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log(`Processing refunded charge: ${charge.id}`);

  if (!charge.payment_intent) {
    console.log('No payment intent associated with charge');
    return;
  }

  const paymentIntentId = typeof charge.payment_intent === 'string' 
    ? charge.payment_intent 
    : charge.payment_intent.id;

  // Find the payment record
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { order: true },
  });

  if (!payment) {
    console.log(`Payment not found for payment intent: ${paymentIntentId}`);
    return;
  }

  // Determine refund status
  const refundAmount = charge.amount_refunded;
  const originalAmount = charge.amount;
  const isFullRefund = refundAmount >= originalAmount;

  // Update payment and order status
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        status: isFullRefund ? OrderStatus.REFUNDED : payment.order.status,
        cancelledAt: isFullRefund ? new Date() : undefined,
      },
    }),
  ]);

  console.log(`Refund processed for order: ${payment.order.orderNumber}`);
}

/**
 * Handle charge.dispute.created event
 * This is triggered when a dispute/chargeback is created
 */
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  console.log(`Processing dispute: ${dispute.id}`);

  if (!dispute.payment_intent) {
    console.log('No payment intent associated with dispute');
    return;
  }

  const paymentIntentId = typeof dispute.payment_intent === 'string'
    ? dispute.payment_intent
    : dispute.payment_intent.id;

  // Find the payment record
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { order: true },
  });

  if (!payment) {
    console.log(`Payment not found for payment intent: ${paymentIntentId}`);
    return;
  }

  // Create a notification for admins about the dispute
  // In a real app, you'd want to notify admins immediately
  console.log(`DISPUTE ALERT: Order ${payment.order.orderNumber} has a dispute: ${dispute.reason}`);

  // You could also update order status or create a dispute record
  // For now, we'll just log it
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KP-${timestamp}-${random}`;
}
