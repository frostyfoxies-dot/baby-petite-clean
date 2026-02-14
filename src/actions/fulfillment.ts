'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';
import { DropshipOrderStatus, OrderStatus, Order } from '@prisma/client';
import { FulfillmentService } from '@/services/fulfillment/fulfillment-service';
import { FulfillmentNotificationService } from '@/services/fulfillment/notifications';

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
 * Fulfillment statistics
 */
export interface FulfillmentStats {
  pending: number;
  placed: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  issue: number;
  total: number;
}

/**
 * Dropship order with related details
 */
export interface DropshipOrderWithDetails {
  id: string;
  orderId: string;
  aliExpressOrderId: string | null;
  status: DropshipOrderStatus;
  customerEmail: string;
  customerPhone: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  totalCost: number;
  shippingCost: number;
  placedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  order: {
    orderNumber: string;
    status: OrderStatus;
    total: number;
    shippingAddress: Record<string, unknown>;
    items: Array<{
      id: string;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
  items: Array<{
    id: string;
    aliExpressSku: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    productSource: {
      id: string;
      aliExpressProductId: string;
      aliExpressUrl: string;
      productSlug: string;
    };
  }>;
}

/**
 * Valid status transitions map
 */
const VALID_STATUS_TRANSITIONS: Record<DropshipOrderStatus, DropshipOrderStatus[]> = {
  PENDING: ['PLACED', 'CANCELLED', 'ISSUE'],
  PLACED: ['CONFIRMED', 'CANCELLED', 'ISSUE'],
  CONFIRMED: ['SHIPPED', 'CANCELLED', 'ISSUE'],
  SHIPPED: ['DELIVERED', 'ISSUE'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
  ISSUE: ['PENDING', 'PLACED', 'CONFIRMED', 'SHIPPED', 'CANCELLED'],
};

// ============================================
// FULFILLMENT ACTIONS
// ============================================

/**
 * Get all pending fulfillment orders
 *
 * Retrieves all dropship orders that need fulfillment attention.
 *
 * @returns Result object with list of pending orders or error
 *
 * @example
 * const result = await getPendingFulfillmentOrders();
 */
export async function getPendingFulfillmentOrders(): Promise<ActionResult<DropshipOrderWithDetails[]>> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    const fulfillmentService = new FulfillmentService();
    const orders = await fulfillmentService.getPendingOrders();

    return {
      success: true,
      data: orders.map(formatDropshipOrder),
    };
  } catch (error) {
    console.error('Get pending fulfillment orders error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching fulfillment orders.',
    };
  }
}

/**
 * Get fulfillment order by ID
 *
 * Retrieves detailed information for a specific fulfillment order.
 *
 * @param orderId - The dropship order ID
 * @returns Result object with order details or error
 *
 * @example
 * const result = await getFulfillmentOrder('order_123');
 */
export async function getFulfillmentOrder(orderId: string): Promise<ActionResult<DropshipOrderWithDetails>> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    const fulfillmentService = new FulfillmentService();
    const order = await fulfillmentService.getFulfillmentDetails(orderId);

    if (!order) {
      throw new NotFoundError('Fulfillment order not found');
    }

    return {
      success: true,
      data: formatDropshipOrder(order),
    };
  } catch (error) {
    console.error('Get fulfillment order error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching the fulfillment order.',
    };
  }
}

/**
 * Update fulfillment status
 *
 * Updates the status of a fulfillment order with validation.
 *
 * @param orderId - The dropship order ID
 * @param status - The new status
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateFulfillmentStatus('order_123', 'CONFIRMED');
 */
export async function updateFulfillmentStatus(
  orderId: string,
  status: DropshipOrderStatus
): Promise<ActionResult> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    // Get current order
    const currentOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
    });

    if (!currentOrder) {
      throw new NotFoundError('Fulfillment order not found');
    }

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[currentOrder.status];
    if (!validTransitions.includes(status)) {
      return {
        success: false,
        error: `Cannot transition from ${currentOrder.status} to ${status}`,
      };
    }

    // Update status
    await prisma.dropshipOrder.update({
      where: { id: orderId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/admin/fulfillment');
    revalidatePath(`/admin/fulfillment/${orderId}`);
    revalidateTag('fulfillment');

    return { success: true };
  } catch (error) {
    console.error('Update fulfillment status error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating the fulfillment status.',
    };
  }
}

/**
 * Add tracking information
 *
 * Adds tracking details to a fulfillment order.
 *
 * @param orderId - The dropship order ID
 * @param trackingNumber - The tracking number
 * @param carrier - Optional carrier name
 * @param trackingUrl - Optional tracking URL
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await addTrackingInfo('order_123', 'TRACK123', 'DHL', 'https://dhl.com/track/TRACK123');
 */
export async function addTrackingInfo(
  orderId: string,
  trackingNumber: string,
  carrier?: string,
  trackingUrl?: string
): Promise<ActionResult> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    // Validate tracking number
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return {
        success: false,
        error: 'Tracking number is required',
      };
    }

    // Get current order with related data
    const dropshipOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
      include: {
        order: true,
      },
    });

    if (!dropshipOrder) {
      throw new NotFoundError('Fulfillment order not found');
    }

    // Update tracking info
    await prisma.dropshipOrder.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingNumber.trim(),
        carrier: carrier?.trim() || null,
        trackingUrl: trackingUrl?.trim() || null,
        updatedAt: new Date(),
      },
    });

    // Also update the main order's shipping record
    await prisma.shipping.update({
      where: { orderId: dropshipOrder.orderId },
      data: {
        trackingNumber: trackingNumber.trim(),
        carrier: carrier?.trim() || null,
        trackingUrl: trackingUrl?.trim() || null,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/admin/fulfillment');
    revalidatePath(`/admin/fulfillment/${orderId}`);
    revalidateTag('fulfillment');

    return { success: true };
  } catch (error) {
    console.error('Add tracking info error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while adding tracking information.',
    };
  }
}

/**
 * Mark order as placed on AliExpress
 *
 * Updates the fulfillment order to indicate it has been placed on AliExpress.
 *
 * @param orderId - The dropship order ID
 * @param aliExpressOrderId - The AliExpress order ID
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await markOrderPlaced('order_123', 'AE123456');
 */
export async function markOrderPlaced(
  orderId: string,
  aliExpressOrderId: string
): Promise<ActionResult> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    // Validate AliExpress order ID
    if (!aliExpressOrderId || aliExpressOrderId.trim().length === 0) {
      return {
        success: false,
        error: 'AliExpress order ID is required',
      };
    }

    // Get current order
    const currentOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
    });

    if (!currentOrder) {
      throw new NotFoundError('Fulfillment order not found');
    }

    // Validate status transition
    if (currentOrder.status !== DropshipOrderStatus.PENDING) {
      return {
        success: false,
        error: `Cannot mark as placed. Current status: ${currentOrder.status}`,
      };
    }

    // Update order
    await prisma.dropshipOrder.update({
      where: { id: orderId },
      data: {
        status: DropshipOrderStatus.PLACED,
        aliExpressOrderId: aliExpressOrderId.trim(),
        placedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    revalidatePath('/admin/fulfillment');
    revalidatePath(`/admin/fulfillment/${orderId}`);
    revalidateTag('fulfillment');

    return { success: true };
  } catch (error) {
    console.error('Mark order placed error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while marking the order as placed.',
    };
  }
}

/**
 * Mark order as shipped
 *
 * Updates the fulfillment order to shipped status with tracking info.
 *
 * @param orderId - The dropship order ID
 * @param trackingNumber - The tracking number
 * @param carrier - Optional carrier name
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await markOrderShipped('order_123', 'TRACK123', 'DHL');
 */
export async function markOrderShipped(
  orderId: string,
  trackingNumber: string,
  carrier?: string
): Promise<ActionResult> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    // Validate tracking number
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return {
        success: false,
        error: 'Tracking number is required',
      };
    }

    // Get current order with related data
    const dropshipOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!dropshipOrder) {
      throw new NotFoundError('Fulfillment order not found');
    }

    // Validate status transition
    const validStatuses: DropshipOrderStatus[] = [DropshipOrderStatus.CONFIRMED, DropshipOrderStatus.PLACED];
    if (!validStatuses.includes(dropshipOrder.status)) {
      return {
        success: false,
        error: `Cannot mark as shipped. Current status: ${dropshipOrder.status}`,
      };
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update dropship order
      await tx.dropshipOrder.update({
        where: { id: orderId },
        data: {
          status: DropshipOrderStatus.SHIPPED,
          trackingNumber: trackingNumber.trim(),
          carrier: carrier?.trim() || null,
          shippedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update main order
      await tx.order.update({
        where: { id: dropshipOrder.orderId },
        data: {
          status: OrderStatus.SHIPPED,
          shippedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update shipping record
      await tx.shipping.update({
        where: { orderId: dropshipOrder.orderId },
        data: {
          trackingNumber: trackingNumber.trim(),
          carrier: carrier?.trim() || null,
          updatedAt: new Date(),
        },
      });
    });

    // Send shipping notification
    try {
      const notificationService = new FulfillmentNotificationService();
      await notificationService.sendShippingNotification(
        dropshipOrder.order as any,
        trackingNumber,
        carrier
      );
    } catch (notificationError) {
      // Log but don't fail the operation
      console.error('Failed to send shipping notification:', notificationError);
    }

    revalidatePath('/admin/fulfillment');
    revalidatePath(`/admin/fulfillment/${orderId}`);
    revalidateTag('fulfillment');
    revalidateTag('orders');

    return { success: true };
  } catch (error) {
    console.error('Mark order shipped error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while marking the order as shipped.',
    };
  }
}

/**
 * Mark order as delivered
 *
 * Updates the fulfillment order to delivered status.
 *
 * @param orderId - The dropship order ID
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await markOrderDelivered('order_123');
 */
export async function markOrderDelivered(orderId: string): Promise<ActionResult> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    // Get current order with related data
    const dropshipOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
      include: {
        order: true,
      },
    });

    if (!dropshipOrder) {
      throw new NotFoundError('Fulfillment order not found');
    }

    // Validate status transition
    if (dropshipOrder.status !== DropshipOrderStatus.SHIPPED) {
      return {
        success: false,
        error: `Cannot mark as delivered. Current status: ${dropshipOrder.status}`,
      };
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update dropship order
      await tx.dropshipOrder.update({
        where: { id: orderId },
        data: {
          status: DropshipOrderStatus.DELIVERED,
          deliveredAt: new Date(),
          actualDelivery: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update main order
      await tx.order.update({
        where: { id: dropshipOrder.orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update shipping record
      await tx.shipping.update({
        where: { orderId: dropshipOrder.orderId },
        data: {
          actualDelivery: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    // Send delivery notification
    try {
      const notificationService = new FulfillmentNotificationService();
      await notificationService.sendDeliveryNotification(dropshipOrder.order as any);
    } catch (notificationError) {
      // Log but don't fail the operation
      console.error('Failed to send delivery notification:', notificationError);
    }

    revalidatePath('/admin/fulfillment');
    revalidatePath(`/admin/fulfillment/${orderId}`);
    revalidateTag('fulfillment');
    revalidateTag('orders');

    return { success: true };
  } catch (error) {
    console.error('Mark order delivered error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while marking the order as delivered.',
    };
  }
}

/**
 * Report fulfillment issue
 *
 * Marks an order as having an issue and sends notification to admin.
 *
 * @param orderId - The dropship order ID
 * @param issue - Description of the issue
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await reportFulfillmentIssue('order_123', 'Supplier out of stock');
 */
export async function reportFulfillmentIssue(
  orderId: string,
  issue: string
): Promise<ActionResult> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    // Validate issue description
    if (!issue || issue.trim().length < 10) {
      return {
        success: false,
        error: 'Issue description must be at least 10 characters',
      };
    }

    // Get current order with related data
    const dropshipOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
      include: {
        order: true,
      },
    });

    if (!dropshipOrder) {
      throw new NotFoundError('Fulfillment order not found');
    }

    // Update order status
    await prisma.dropshipOrder.update({
      where: { id: orderId },
      data: {
        status: DropshipOrderStatus.ISSUE,
        updatedAt: new Date(),
      },
    });

    // Send issue notification
    try {
      const notificationService = new FulfillmentNotificationService();
      await notificationService.sendIssueNotification(dropshipOrder.order as any, issue);
    } catch (notificationError) {
      // Log but don't fail the operation
      console.error('Failed to send issue notification:', notificationError);
    }

    revalidatePath('/admin/fulfillment');
    revalidatePath(`/admin/fulfillment/${orderId}`);
    revalidateTag('fulfillment');

    return { success: true };
  } catch (error) {
    console.error('Report fulfillment issue error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while reporting the issue.',
    };
  }
}

/**
 * Get fulfillment statistics
 *
 * Returns counts of orders in each fulfillment status.
 *
 * @returns Result object with statistics or error
 *
 * @example
 * const result = await getFulfillmentStats();
 */
export async function getFulfillmentStats(): Promise<ActionResult<FulfillmentStats>> {
  try {
    // Check admin/staff authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      throw new UnauthorizedError('Admin access required');
    }

    // Get counts for each status
    const counts = await prisma.dropshipOrder.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Build stats object
    const stats: FulfillmentStats = {
      pending: 0,
      placed: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      issue: 0,
      total: 0,
    };

    for (const count of counts) {
      stats[count.status.toLowerCase() as keyof FulfillmentStats] = count._count.id;
      stats.total += count._count.id;
    }

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Get fulfillment stats error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching fulfillment statistics.',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format a dropship order for API response
 */
function formatDropshipOrder(order: any): DropshipOrderWithDetails {
  return {
    id: order.id,
    orderId: order.orderId,
    aliExpressOrderId: order.aliExpressOrderId,
    status: order.status,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    carrier: order.carrier,
    totalCost: Number(order.totalCost),
    shippingCost: Number(order.shippingCost),
    placedAt: order.placedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    order: {
      orderNumber: order.order.orderNumber,
      status: order.order.status,
      total: Number(order.order.total),
      shippingAddress: order.order.shippingAddress as Record<string, unknown>,
      items: order.order.items?.map((item: any) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })) || [],
    },
    items: order.items?.map((item: any) => ({
      id: item.id,
      aliExpressSku: item.aliExpressSku,
      quantity: item.quantity,
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      productSource: {
        id: item.productSource.id,
        aliExpressProductId: item.productSource.aliExpressProductId,
        aliExpressUrl: item.productSource.aliExpressUrl,
        productSlug: item.productSource.productSlug,
      },
    })) || [],
  };
}
