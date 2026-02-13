import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DropshipOrderStatus } from '@prisma/client';

/**
 * GET /api/admin/fulfillment
 *
 * List all fulfillment orders with filtering and pagination.
 *
 * Query params:
 * - status: Filter by status (PENDING, PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, ISSUE)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DropshipOrderStatus | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100
    );
    const offset = (page - 1) * limit;

    // Build where clause
    const where = status ? { status } : {};

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.dropshipOrder.findMany({
        where,
        include: {
          order: {
            include: {
              items: true,
            },
          },
          items: {
            include: {
              productSource: {
                select: {
                  id: true,
                  productSlug: true,
                  aliExpressProductId: true,
                  aliExpressUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.dropshipOrder.count({ where }),
    ]);

    // Format response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderId: order.orderId,
      orderNumber: order.order.orderNumber,
      aliExpressOrderId: order.aliExpressOrderId,
      status: order.status,
      customerEmail: order.customerEmail,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      totalCost: Number(order.totalCost),
      shippingCost: Number(order.shippingCost),
      itemCount: order.items.length,
      placedAt: order.placedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        aliExpressSku: item.aliExpressSku,
        quantity: item.quantity,
        unitCost: Number(item.unitCost),
        totalCost: Number(item.totalCost),
        productSource: item.productSource,
      })),
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching fulfillment orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
