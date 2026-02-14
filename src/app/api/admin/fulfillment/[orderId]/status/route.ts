import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DropshipOrderStatus, OrderStatus } from '@prisma/client';
import { FulfillmentNotificationService } from '@/services/fulfillment/notifications';

interface RouteParams {
  params: Promise<{ orderId: string }>;
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

/**
 * Map dropship status to main order status
 */
const DROPSHIP_TO_ORDER_STATUS: Partial<Record<DropshipOrderStatus, OrderStatus>> = {
  SHIPPED: OrderStatus.SHIPPED,
  DELIVERED: OrderStatus.DELIVERED,
  CANCELLED: OrderStatus.CANCELLED,
};

/**
 * PUT /api/admin/fulfillment/[orderId]/status
 *
 * Update fulfillment status.
 *
 * Body:
 * - status: New status (required)
 * - issue: Issue description (required if status is ISSUE)
 * - notifyCustomer: Whether to send notification (default: true for shipped/delivered)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderId } = await params;
    const body = await request.json();

    // Validate status
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const newStatus = body.status as DropshipOrderStatus;

    // Validate issue description for ISSUE status
    if (newStatus === DropshipOrderStatus.ISSUE) {
      if (!body.issue || body.issue.trim().length < 10) {
        return NextResponse.json(
          { error: 'Issue description must be at least 10 characters' },
          { status: 400 }
        );
      }
    }

    // Get current order
    const dropshipOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
      include: {
        order: true,
      },
    });

    if (!dropshipOrder) {
      return NextResponse.json(
        { error: 'Fulfillment order not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[dropshipOrder.status];
    if (!validTransitions.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${dropshipOrder.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (newStatus === DropshipOrderStatus.PLACED) {
      updateData.placedAt = new Date();
    } else if (newStatus === DropshipOrderStatus.SHIPPED) {
      updateData.shippedAt = new Date();
    } else if (newStatus === DropshipOrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      updateData.actualDelivery = new Date();
    }

    // Update in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update dropship order
      const updated = await tx.dropshipOrder.update({
        where: { id: orderId },
        data: updateData,
      });

      // Update main order status if applicable
      const mainOrderStatus = DROPSHIP_TO_ORDER_STATUS[newStatus];
      if (mainOrderStatus) {
        const orderUpdateData: any = {
          status: mainOrderStatus,
          updatedAt: new Date(),
        };

        if (newStatus === DropshipOrderStatus.SHIPPED) {
          orderUpdateData.shippedAt = new Date();
        } else if (newStatus === DropshipOrderStatus.DELIVERED) {
          orderUpdateData.deliveredAt = new Date();
        } else if (newStatus === DropshipOrderStatus.CANCELLED) {
          orderUpdateData.cancelledAt = new Date();
        }

        await tx.order.update({
          where: { id: dropshipOrder.orderId },
          data: orderUpdateData,
        });

        // Update shipping record for delivered
        if (newStatus === DropshipOrderStatus.DELIVERED) {
          await tx.shipping.update({
            where: { orderId: dropshipOrder.orderId },
            data: {
              actualDelivery: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }

      return updated;
    });

    // Send notifications
    const notifyCustomer = body.notifyCustomer !== false;

    try {
      const notificationService = new FulfillmentNotificationService();

      if (newStatus === DropshipOrderStatus.SHIPPED && notifyCustomer) {
        await notificationService.sendShippingNotification(
          dropshipOrder.order as any,
          dropshipOrder.trackingNumber || 'Tracking pending',
          dropshipOrder.carrier || undefined
        );
      } else if (newStatus === DropshipOrderStatus.DELIVERED && notifyCustomer) {
        await notificationService.sendDeliveryNotification(dropshipOrder.order as any);
      } else if (newStatus === DropshipOrderStatus.ISSUE) {
        await notificationService.sendIssueNotification(
          dropshipOrder.order as any,
          body.issue
        );
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        placedAt: updatedOrder.placedAt,
        shippedAt: updatedOrder.shippedAt,
        deliveredAt: updatedOrder.deliveredAt,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating fulfillment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
