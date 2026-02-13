import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DropshipOrderStatus } from '@prisma/client';
import { FulfillmentService } from '@/services/fulfillment/fulfillment-service';

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
 * GET /api/admin/fulfillment/[orderId]
 *
 * Get fulfillment order details.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get fulfillment details
    const fulfillmentService = new FulfillmentService();
    const details = await fulfillmentService.getFulfillmentDetails(orderId);

    if (!details) {
      return NextResponse.json(
        { error: 'Fulfillment order not found' },
        { status: 404 }
      );
    }

    // Get validation result
    const validation = await fulfillmentService.validateFulfillment(orderId);

    // Get fulfillment history
    const history = await fulfillmentService.getFulfillmentHistory(orderId);

    // Prepare AliExpress order data
    let aliExpressData = null;
    if (details.status === DropshipOrderStatus.PENDING) {
      aliExpressData = await fulfillmentService.prepareOrderForAliExpress(orderId);
    }

    return NextResponse.json({
      order: details,
      validation,
      history,
      aliExpressData,
    });
  } catch (error) {
    console.error('Error fetching fulfillment order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/fulfillment/[orderId]
 *
 * Update fulfillment order.
 *
 * Body:
 * - status: New status (optional)
 * - aliExpressOrderId: AliExpress order ID (optional)
 * - notes: Notes (optional)
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

    // Get current order
    const currentOrder = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Fulfillment order not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle status update
    if (body.status) {
      const newStatus = body.status as DropshipOrderStatus;
      const validTransitions = VALID_STATUS_TRANSITIONS[currentOrder.status];

      if (!validTransitions.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentOrder.status} to ${newStatus}` },
          { status: 400 }
        );
      }

      updateData.status = newStatus;

      // Set timestamps based on status
      if (newStatus === DropshipOrderStatus.PLACED) {
        updateData.placedAt = new Date();
      } else if (newStatus === DropshipOrderStatus.SHIPPED) {
        updateData.shippedAt = new Date();
      } else if (newStatus === DropshipOrderStatus.DELIVERED) {
        updateData.deliveredAt = new Date();
        updateData.actualDelivery = new Date();
      }
    }

    // Handle AliExpress order ID
    if (body.aliExpressOrderId) {
      updateData.aliExpressOrderId = body.aliExpressOrderId;
    }

    // Update order
    const updatedOrder = await prisma.dropshipOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        aliExpressOrderId: updatedOrder.aliExpressOrderId,
        placedAt: updatedOrder.placedAt,
        shippedAt: updatedOrder.shippedAt,
        deliveredAt: updatedOrder.deliveredAt,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating fulfillment order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
