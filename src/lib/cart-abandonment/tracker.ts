/**
 * Cart Abandonment Tracker
 *
 * Tracks cart abandonment events and manages the lifecycle of abandonment records.
 * Handles email capture, activity tracking, and recovery status.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cartAbandonmentConfig } from '@/lib/email/config';

// ============================================================================
// TYPES
// ============================================================================

export interface CartAbandonmentRecord {
  id: string;
  cartId: string;
  email: string;
  lastActivity: Date;
  email1SentAt: Date | null;
  email2SentAt: Date | null;
  email3SentAt: Date | null;
  recoveredAt: Date | null;
  unsubscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackActivityOptions {
  cartId: string;
  email?: string;
  userId?: string | null;
}

export interface CaptureEmailOptions {
  cartId: string;
  email: string;
  source: 'exit-intent' | 'checkout' | 'newsletter';
}

export interface RecoveryStatus {
  isRecovered: boolean;
  recoveredAt: Date | null;
  emailsSent: number;
  lastEmailSentAt: Date | null;
}

// ============================================================================
// CART ABANDONMENT TRACKER
// ============================================================================

/**
 * Track cart activity and update/create abandonment record
 */
export async function trackCartActivity(
  options: TrackActivityOptions
): Promise<CartAbandonmentRecord | null> {
  const { cartId, email, userId } = options;

  try {
    // Get the cart with user info
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: true,
        abandonment: true,
      },
    });

    if (!cart) {
      logger.warn('Cart not found for tracking', { cartId });
      return null;
    }

    // Determine email to use
    let emailToUse = email;

    // If no email provided, try to get from user
    if (!emailToUse && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      emailToUse = user?.email;
    }

    // If still no email, check existing abandonment record
    if (!emailToUse && cart.abandonment) {
      emailToUse = cart.abandonment.email;
    }

    // If no email available, we can't track abandonment
    if (!emailToUse) {
      logger.debug('No email available for cart abandonment tracking', { cartId });
      return null;
    }

    // Check if cart has items
    if (cart.items.length === 0) {
      // If cart is empty, delete any existing abandonment record
      if (cart.abandonment) {
        await prisma.cartAbandonment.delete({
          where: { cartId },
        });
        logger.info('Deleted abandonment record for empty cart', { cartId });
      }
      return null;
    }

    // Create or update abandonment record
    const now = new Date();
    
    if (cart.abandonment) {
      // Update existing record
      const updated = await prisma.cartAbandonment.update({
        where: { cartId },
        data: {
          email: emailToUse,
          lastActivity: now,
          // Reset email flags if activity resumed
          ...(cart.abandonment.recoveredAt === null && {
            // Keep the email sent timestamps - we don't reset those
          }),
        },
      });

      logger.debug('Updated cart abandonment record', {
        cartId,
        email: emailToUse,
        lastActivity: now,
      });

      return updated;
    } else {
      // Create new record
      const created = await prisma.cartAbandonment.create({
        data: {
          cartId,
          email: emailToUse,
          lastActivity: now,
        },
      });

      logger.info('Created cart abandonment record', {
        cartId,
        email: emailToUse,
      });

      return created;
    }
  } catch (error) {
    logger.error('Failed to track cart activity', {
      cartId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Capture email for cart abandonment tracking
 */
export async function captureEmailForCart(
  options: CaptureEmailOptions
): Promise<CartAbandonmentRecord | null> {
  const { cartId, email, source } = options;

  try {
    // Verify cart exists and has items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      logger.debug('Cart not found or empty for email capture', { cartId, source });
      return null;
    }

    // Track activity with the captured email
    const record = await trackCartActivity({ cartId, email });

    if (record) {
      logger.info('Captured email for cart abandonment', {
        cartId,
        email,
        source,
      });
    }

    return record;
  } catch (error) {
    logger.error('Failed to capture email for cart', {
      cartId,
      email,
      source,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Mark cart as recovered (purchase completed)
 */
export async function markCartRecovered(cartId: string): Promise<void> {
  try {
    const abandonment = await prisma.cartAbandonment.findUnique({
      where: { cartId },
    });

    if (!abandonment) {
      return;
    }

    await prisma.cartAbandonment.update({
      where: { cartId },
      data: {
        recoveredAt: new Date(),
      },
    });

    logger.info('Cart marked as recovered', {
      cartId,
      emailsSent: countEmailsSent(abandonment),
    });
  } catch (error) {
    logger.error('Failed to mark cart as recovered', {
      cartId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Mark email as sent for a specific email number
 */
export async function markEmailSent(
  cartId: string,
  emailNumber: 1 | 2 | 3
): Promise<void> {
  try {
    const field = `email${emailNumber}SentAt` as const;
    
    await prisma.cartAbandonment.update({
      where: { cartId },
      data: {
        [field]: new Date(),
      },
    });

    logger.debug('Marked email as sent', { cartId, emailNumber });
  } catch (error) {
    logger.error('Failed to mark email as sent', {
      cartId,
      emailNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Unsubscribe email from cart abandonment emails
 */
export async function unsubscribeEmail(email: string): Promise<void> {
  try {
    await prisma.cartAbandonment.updateMany({
      where: { email },
      data: { unsubscribed: true },
    });

    logger.info('Unsubscribed email from cart abandonment', { email });
  } catch (error) {
    logger.error('Failed to unsubscribe email', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Check if email is unsubscribed
 */
export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  try {
    const record = await prisma.cartAbandonment.findFirst({
      where: { email, unsubscribed: true },
    });

    return !!record;
  } catch (error) {
    logger.error('Failed to check unsubscribe status', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Get abandonment record by cart ID
 */
export async function getAbandonmentRecord(
  cartId: string
): Promise<CartAbandonmentRecord | null> {
  try {
    return await prisma.cartAbandonment.findUnique({
      where: { cartId },
    });
  } catch (error) {
    logger.error('Failed to get abandonment record', {
      cartId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get recovery status for a cart
 */
export async function getRecoveryStatus(cartId: string): Promise<RecoveryStatus | null> {
  try {
    const record = await prisma.cartAbandonment.findUnique({
      where: { cartId },
    });

    if (!record) {
      return null;
    }

    const emailsSent = countEmailsSent(record);
    const lastEmailSentAt = getLastEmailSentAt(record);

    return {
      isRecovered: record.recoveredAt !== null,
      recoveredAt: record.recoveredAt,
      emailsSent,
      lastEmailSentAt,
    };
  } catch (error) {
    logger.error('Failed to get recovery status', {
      cartId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get carts eligible for a specific email in the sequence
 */
export async function getCartsForEmail(
  emailNumber: 1 | 2 | 3,
  limit: number = 50
): Promise<CartAbandonmentRecord[]> {
  if (!cartAbandonmentConfig.enabled) {
    return [];
  }

  const delays = {
    1: cartAbandonmentConfig.email1DelayHours,
    2: cartAbandonmentConfig.email2DelayHours,
    3: cartAbandonmentConfig.email3DelayHours,
  };

  const delayHours = delays[emailNumber];
  const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);

  try {
    // Build the query based on email number
    const whereClause: Record<string, unknown> = {
      unsubscribed: false,
      recoveredAt: null,
      lastActivity: { lte: cutoffTime },
    };

    // Ensure previous emails were sent (for emails 2 and 3)
    if (emailNumber === 2) {
      whereClause.email1SentAt = { not: null };
      whereClause.email2SentAt = null;
    } else if (emailNumber === 3) {
      whereClause.email2SentAt = { not: null };
      whereClause.email3SentAt = null;
    } else {
      whereClause.email1SentAt = null;
    }

    const records = await prisma.cartAbandonment.findMany({
      where: whereClause,
      take: limit,
      orderBy: { lastActivity: 'asc' },
    });

    logger.debug('Found carts for email', {
      emailNumber,
      count: records.length,
      cutoffTime,
    });

    return records;
  } catch (error) {
    logger.error('Failed to get carts for email', {
      emailNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Clean up old abandonment records (older than 30 days)
 */
export async function cleanupOldRecords(
  daysOld: number = 30
): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.cartAbandonment.deleteMany({
      where: {
        OR: [
          { recoveredAt: { not: null, lt: cutoffDate } },
          {
            AND: [
              { email3SentAt: { not: null, lt: cutoffDate } },
              { recoveredAt: null },
            ],
          },
        ],
      },
    });

    logger.info('Cleaned up old abandonment records', {
      count: result.count,
      daysOld,
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup old records', {
      daysOld,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function countEmailsSent(record: CartAbandonmentRecord): number {
  let count = 0;
  if (record.email1SentAt) count++;
  if (record.email2SentAt) count++;
  if (record.email3SentAt) count++;
  return count;
}

function getLastEmailSentAt(record: CartAbandonmentRecord): Date | null {
  if (record.email3SentAt) return record.email3SentAt;
  if (record.email2SentAt) return record.email2SentAt;
  if (record.email1SentAt) return record.email1SentAt;
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const cartAbandonmentTracker = {
  trackActivity: trackCartActivity,
  captureEmail: captureEmailForCart,
  markRecovered: markCartRecovered,
  markEmailSent,
  unsubscribe: unsubscribeEmail,
  isUnsubscribed: isEmailUnsubscribed,
  getRecord: getAbandonmentRecord,
  getRecoveryStatus,
  getCartsForEmail,
  cleanup: cleanupOldRecords,
};

export default cartAbandonmentTracker;
