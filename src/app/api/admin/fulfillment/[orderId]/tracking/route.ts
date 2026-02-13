import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { FulfillmentNotificationService } from '@/services/fulfillment/notifications';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * POST /api/admin/fulfillment/[orderId]/tracking
 *
 * Add tracking information to a fulfillment order.
 *
 * Body:
 * - trackingNumber: The tracking number (required)
 * - carrier: Carrier name (optional)
 * - trackingUrl: Tracking URL (optional)
 * - notifyCustomer: Whether to send notification (default: true)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Validate tracking number
    if (!body.trackingNumber || body.trackingNumber.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      );
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

    const trackingNumber = body.trackingNumber.trim();
    const carrier = body.carrier?.trim() || null;
    const trackingUrl = body.trackingUrl?.trim() || null;
    const notifyCustomer = body.notifyCustomer !== false;

    // Update tracking info in transaction
    await prisma.$transaction(async (tx) => {
      // Update dropship order
      await tx.dropshipOrder.update({
        where: { id: orderId },
        data: {
          trackingNumber,
          carrier,
          trackingUrl,
          updatedAt: new Date(),
        },
      });

      // Update main order's shipping record
      await tx.shipping.update({
        where: { orderId: dropshipOrder.orderId },
        data: {
          trackingNumber,
          carrier,
          trackingUrl,
          updatedAt: new Date(),
        },
      });
    });

    // Send notification if requested
    if (notifyCustomer) {
      try {
        const notificationService = new FulfillmentNotificationService();
        await notificationService.sendShippingNotification(
          dropshipOrder.order,
          trackingNumber,
          carrier || undefined
        );
      } catch (notificationError) {
        console.error('Failed to send shipping notification:', notificationError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      tracking: {
        trackingNumber,
        carrier,
        trackingUrl,
      },
    });
  } catch (error) {
    console.error('Error adding tracking info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
