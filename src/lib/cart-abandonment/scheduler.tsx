/**
 * Cart Abandonment Email Scheduler
 *
 * Handles the scheduling and sending of cart abandonment email sequences.
 * Processes emails in batches with rate limiting to avoid spam flags.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/service';
import {
  CartAbandonmentEmail,
  CartAbandonmentEmail1,
  CartAbandonmentEmail2,
  CartAbandonmentEmail3,
  generateCartAbandonmentText,
  type CartItem,
} from '@/lib/email/templates/cart-abandonment';
import {
  cartAbandonmentConfig,
  cartAbandonmentSubjects,
  emailConfig,
} from '@/lib/email/config';
import {
  getCartsForEmail,
  markEmailSent,
  isEmailUnsubscribed,
} from './tracker';
import { cronConfig } from '@/lib/email/config';

// ============================================================================
// TYPES
// ============================================================================

export interface SendResult {
  emailNumber: 1 | 2 | 3;
  cartId: string;
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BatchResult {
  email1: SendResult[];
  email2: SendResult[];
  email3: SendResult[];
  totalSent: number;
  totalFailed: number;
}

export interface SchedulerStats {
  email1Queue: number;
  email2Queue: number;
  email3Queue: number;
  totalPending: number;
}

// ============================================================================
// EMAIL SCHEDULER
// ============================================================================

/**
 * Get cart items for abandonment email
 */
async function getCartItems(cartId: string): Promise<CartItem[]> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return [];
    }

    return cart.items.map((item) => ({
      name: item.variant.product.name,
      image: item.variant.product.images[0]?.url || '',
      price: item.variant.price.toNumber(),
      quantity: item.quantity,
      variant: item.variant.name,
      productUrl: `${emailConfig.baseUrl}/product/${item.variant.product.slug}`,
    }));
  } catch (error) {
    logger.error('Failed to get cart items', {
      cartId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Get customer name for email
 */
async function getCustomerName(
  email: string,
  userId?: string | null
): Promise<string | undefined> {
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true },
      });
      return user?.firstName || undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Send a single cart abandonment email
 */
async function sendAbandonmentEmail(
  record: { cartId: string; email: string },
  emailNumber: 1 | 2 | 3
): Promise<SendResult> {
  const { cartId, email } = record;

  try {
    // Check if unsubscribed
    const unsubscribed = await isEmailUnsubscribed(email);
    if (unsubscribed) {
      return {
        emailNumber,
        cartId,
        email,
        success: false,
        error: 'User unsubscribed',
      };
    }

    // Get cart items
    const items = await getCartItems(cartId);
    if (items.length === 0) {
      return {
        emailNumber,
        cartId,
        email,
        success: false,
        error: 'Cart is empty',
      };
    }

    // Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Get customer name
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      select: { userId: true },
    });
    const customerName = await getCustomerName(email, cart?.userId);

    // Build cart URL
    const cartUrl = `${emailConfig.baseUrl}/cart?utm_source=cart_abandonment&utm_medium=email&utm_campaign=email${emailNumber}`;

    // Prepare email props
    const emailProps = {
      customerName,
      items,
      subtotal,
      cartUrl,
      discountCode: emailNumber === 3 ? cartAbandonmentConfig.discountCode : undefined,
      discountPercent: emailNumber === 3 ? cartAbandonmentConfig.discountPercent || undefined : undefined,
    };

    // Select the appropriate email component
    const EmailComponent = {
      1: CartAbandonmentEmail1,
      2: CartAbandonmentEmail2,
      3: CartAbandonmentEmail3,
    }[emailNumber];

    // Send the email
    const result = await sendEmail({
      to: email,
      subject: cartAbandonmentSubjects[`email${emailNumber}` as const],
      react: <EmailComponent {...emailProps} />,
      text: generateCartAbandonmentText({ ...emailProps, emailNumber }),
      tags: {
        type: 'cart-abandonment',
        emailNumber: String(emailNumber),
        cartId,
      },
    });

    if (result.success) {
      // Mark as sent
      await markEmailSent(cartId, emailNumber);

      logger.info('Cart abandonment email sent', {
        emailNumber,
        cartId,
        email,
        messageId: result.messageId,
      });

      return {
        emailNumber,
        cartId,
        email,
        success: true,
        messageId: result.messageId,
      };
    } else {
      return {
        emailNumber,
        cartId,
        email,
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to send cart abandonment email', {
      emailNumber,
      cartId,
      email,
      error: errorMessage,
    });

    return {
      emailNumber,
      cartId,
      email,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Process a batch of emails for a specific email number
 */
async function processEmailBatch(
  emailNumber: 1 | 2 | 3,
  limit: number
): Promise<SendResult[]> {
  if (!cartAbandonmentConfig.enabled) {
    logger.debug('Cart abandonment emails are disabled');
    return [];
  }

  // Get carts eligible for this email
  const records = await getCartsForEmail(emailNumber, limit);

  if (records.length === 0) {
    return [];
  }

  logger.info('Processing email batch', {
    emailNumber,
    count: records.length,
  });

  const results: SendResult[] = [];

  // Process emails with a small delay between each to avoid rate limiting
  for (const record of records) {
    const result = await sendAbandonmentEmail(record, emailNumber);
    results.push(result);

    // Add a small delay between emails (100ms)
    if (records.indexOf(record) < records.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Run the full email scheduler (process all three email types)
 */
export async function runEmailScheduler(): Promise<BatchResult> {
  const startTime = Date.now();

  logger.info('Starting cart abandonment email scheduler');

  const batchSize = cronConfig.maxEmailsPerBatch;

  // Process all three email types
  const [email1Results, email2Results, email3Results] = await Promise.all([
    processEmailBatch(1, batchSize),
    processEmailBatch(2, batchSize),
    processEmailBatch(3, batchSize),
  ]);

  const allResults = [...email1Results, ...email2Results, ...email3Results];
  const totalSent = allResults.filter((r) => r.success).length;
  const totalFailed = allResults.filter((r) => !r.success).length;

  const duration = Date.now() - startTime;

  logger.info('Cart abandonment email scheduler completed', {
    totalSent,
    totalFailed,
    duration: `${duration}ms`,
    email1Sent: email1Results.filter((r) => r.success).length,
    email2Sent: email2Results.filter((r) => r.success).length,
    email3Sent: email3Results.filter((r) => r.success).length,
  });

  return {
    email1: email1Results,
    email2: email2Results,
    email3: email3Results,
    totalSent,
    totalFailed,
  };
}

/**
 * Get scheduler statistics
 */
export async function getSchedulerStats(): Promise<SchedulerStats> {
  if (!cartAbandonmentConfig.enabled) {
    return {
      email1Queue: 0,
      email2Queue: 0,
      email3Queue: 0,
      totalPending: 0,
    };
  }

  try {
    const now = new Date();
    const email1Cutoff = new Date(
      now.getTime() - cartAbandonmentConfig.email1DelayHours * 60 * 60 * 1000
    );
    const email2Cutoff = new Date(
      now.getTime() - cartAbandonmentConfig.email2DelayHours * 60 * 60 * 1000
    );
    const email3Cutoff = new Date(
      now.getTime() - cartAbandonmentConfig.email3DelayHours * 60 * 60 * 1000
    );

    // Count carts waiting for email 1
    const email1Queue = await prisma.cartAbandonment.count({
      where: {
        unsubscribed: false,
        recoveredAt: null,
        email1SentAt: null,
        lastActivity: { lte: email1Cutoff },
      },
    });

    // Count carts waiting for email 2
    const email2Queue = await prisma.cartAbandonment.count({
      where: {
        unsubscribed: false,
        recoveredAt: null,
        email1SentAt: { not: null },
        email2SentAt: null,
        lastActivity: { lte: email2Cutoff },
      },
    });

    // Count carts waiting for email 3
    const email3Queue = await prisma.cartAbandonment.count({
      where: {
        unsubscribed: false,
        recoveredAt: null,
        email2SentAt: { not: null },
        email3SentAt: null,
        lastActivity: { lte: email3Cutoff },
      },
    });

    return {
      email1Queue,
      email2Queue,
      email3Queue,
      totalPending: email1Queue + email2Queue + email3Queue,
    };
  } catch (error) {
    logger.error('Failed to get scheduler stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      email1Queue: 0,
      email2Queue: 0,
      email3Queue: 0,
      totalPending: 0,
    };
  }
}

/**
 * Send a test abandonment email
 */
export async function sendTestEmail(
  email: string,
  emailNumber: 1 | 2 | 3
): Promise<SendResult> {
  // Create sample cart items
  const sampleItems: CartItem[] = [
    {
      name: 'Baby Cotton Onesie',
      image: 'https://babypetite.com/products/onesie.jpg',
      price: 24.99,
      quantity: 2,
      variant: 'Size: 6-12M, Color: Pink',
      productUrl: `${emailConfig.baseUrl}/product/baby-cotton-onesie`,
    },
    {
      name: 'Soft Knit Booties',
      image: 'https://babypetite.com/products/booties.jpg',
      price: 14.99,
      quantity: 1,
      variant: 'Size: 0-6M',
      productUrl: `${emailConfig.baseUrl}/product/soft-knit-booties`,
    },
  ];

  const subtotal = sampleItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartUrl = `${emailConfig.baseUrl}/cart?test=true`;

  const EmailComponent = {
    1: CartAbandonmentEmail1,
    2: CartAbandonmentEmail2,
    3: CartAbandonmentEmail3,
  }[emailNumber];

  const result = await sendEmail({
    to: email,
    subject: `[TEST] ${cartAbandonmentSubjects[`email${emailNumber}` as const]}`,
    react: (
      <EmailComponent
        customerName="Test Customer"
        items={sampleItems}
        subtotal={subtotal}
        cartUrl={cartUrl}
        discountCode={emailNumber === 3 ? 'TEST10' : undefined}
        discountPercent={emailNumber === 3 ? 10 : undefined}
      />
    ),
    text: generateCartAbandonmentText({
      emailNumber,
      customerName: 'Test Customer',
      items: sampleItems,
      subtotal,
      cartUrl,
      discountCode: emailNumber === 3 ? 'TEST10' : undefined,
      discountPercent: emailNumber === 3 ? 10 : undefined,
    }),
    tags: {
      type: 'cart-abandonment-test',
      emailNumber: String(emailNumber),
    },
  });

  return {
    emailNumber,
    cartId: 'test',
    email,
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const cartAbandonmentScheduler = {
  run: runEmailScheduler,
  getStats: getSchedulerStats,
  sendTest: sendTestEmail,
};

export default cartAbandonmentScheduler;
