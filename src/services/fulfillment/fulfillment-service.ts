import { prisma } from '@/lib/prisma';
import { DropshipOrderStatus, OrderStatus } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Filter options for fulfillment queries
 */
export interface FilterOptions {
  status?: DropshipOrderStatus;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'placedAt' | 'shippedAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * AliExpress order data for placement
 */
export interface AliExpressOrderData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  items: Array<{
    aliExpressProductId: string;
    aliExpressSku: string;
    aliExpressUrl: string;
    quantity: number;
    unitCost: number;
  }>;
  totalCost: number;
  shippingCost: number;
}

/**
 * Order cost breakdown
 */
export interface OrderCost {
  itemsCost: number;
  shippingCost: number;
  totalCost: number;
  currency: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Fulfillment details with all related data
 */
export interface FulfillmentDetails {
  id: string;
  orderId: string;
  aliExpressOrderId: string | null;
  aliExpressOrderStatus: string | null;
  status: DropshipOrderStatus;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: Record<string, unknown>;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  totalCost: number;
  shippingCost: number;
  placedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    subtotal: number;
    shippingAmount: number;
    taxAmount: number;
    shippingAddress: Record<string, unknown>;
    items: Array<{
      id: string;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      variantId: string;
    }>;
  };
  items: Array<{
    id: string;
    aliExpressSku: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    orderItemId: string;
    productSource: {
      id: string;
      sanityProductId: string;
      productSlug: string;
      aliExpressProductId: string;
      aliExpressUrl: string;
      aliExpressSku: string | null;
      originalPrice: number;
      originalCurrency: string;
      sourceStatus: string;
      inventoryStatus: string;
      variantMapping: Record<string, unknown> | null;
    };
  }>;
}

// ============================================
// FULFILLMENT SERVICE
// ============================================

/**
 * Fulfillment Service
 *
 * Provides business logic for order fulfillment operations.
 */
export class FulfillmentService {
  /**
   * Get orders needing fulfillment
   *
   * Retrieves dropship orders based on filter criteria.
   *
   * @param options - Filter and pagination options
   * @returns Array of dropship orders
   */
  async getPendingOrders(options?: FilterOptions): Promise<any[]> {
    const {
      status,
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = options || {};

    const where = status ? { status } : {};

    const orders = await prisma.dropshipOrder.findMany({
      where,
      include: {
        order: {
          include: {
            items: true,
          },
        },
        items: {
          include: {
            productSource: true,
          },
        },
      },
      orderBy: {
        [orderBy]: orderDirection,
      },
      take: limit,
      skip: offset,
    });

    return orders;
  }

  /**
   * Get fulfillment details with all related data
   *
   * Retrieves complete information for a fulfillment order.
   *
   * @param orderId - The dropship order ID
   * @returns Fulfillment details or null if not found
   */
  async getFulfillmentDetails(orderId: string): Promise<FulfillmentDetails | null> {
    const order = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
      include: {
        order: {
          include: {
            items: true,
          },
        },
        items: {
          include: {
            productSource: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      orderId: order.orderId,
      aliExpressOrderId: order.aliExpressOrderId,
      aliExpressOrderStatus: order.aliExpressOrderStatus,
      status: order.status,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress as Record<string, unknown>,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      totalCost: Number(order.totalCost),
      shippingCost: Number(order.shippingCost),
      placedAt: order.placedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      order: {
        id: order.order.id,
        orderNumber: order.order.orderNumber,
        status: order.order.status,
        total: Number(order.order.total),
        subtotal: Number(order.order.subtotal),
        shippingAmount: Number(order.order.shippingAmount),
        taxAmount: Number(order.order.taxAmount),
        shippingAddress: order.order.shippingAddress as Record<string, unknown>,
        items: order.order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          variantId: item.variantId,
        })),
      },
      items: order.items.map((item) => ({
        id: item.id,
        aliExpressSku: item.aliExpressSku,
        quantity: item.quantity,
        unitCost: Number(item.unitCost),
        totalCost: Number(item.totalCost),
        orderItemId: item.orderItemId,
        productSource: {
          id: item.productSource.id,
          sanityProductId: item.productSource.sanityProductId,
          productSlug: item.productSource.productSlug,
          aliExpressProductId: item.productSource.aliExpressProductId,
          aliExpressUrl: item.productSource.aliExpressUrl,
          aliExpressSku: item.productSource.aliExpressSku,
          originalPrice: Number(item.productSource.originalPrice),
          originalCurrency: item.productSource.originalCurrency,
          sourceStatus: item.productSource.sourceStatus,
          inventoryStatus: item.productSource.inventoryStatus,
          variantMapping: item.productSource.variantMapping as Record<string, unknown> | null,
        },
      })),
    };
  }

  /**
   * Prepare order data for AliExpress placement
   *
   * Formats the order data for manual placement on AliExpress.
   *
   * @param orderId - The dropship order ID
   * @returns Formatted order data for AliExpress
   */
  async prepareOrderForAliExpress(orderId: string): Promise<AliExpressOrderData> {
    const details = await this.getFulfillmentDetails(orderId);

    if (!details) {
      throw new Error('Fulfillment order not found');
    }

    const shippingAddress = details.shippingAddress as any;

    return {
      orderId: details.id,
      orderNumber: details.order.orderNumber,
      customerEmail: details.customerEmail,
      customerPhone: details.customerPhone,
      shippingAddress: {
        firstName: shippingAddress.firstName || '',
        lastName: shippingAddress.lastName || '',
        line1: shippingAddress.line1 || '',
        line2: shippingAddress.line2 || undefined,
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zip: shippingAddress.zip || '',
        country: shippingAddress.country || 'US',
        phone: shippingAddress.phone || undefined,
      },
      items: details.items.map((item) => ({
        aliExpressProductId: item.productSource.aliExpressProductId,
        aliExpressSku: item.aliExpressSku,
        aliExpressUrl: item.productSource.aliExpressUrl,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      totalCost: details.totalCost,
      shippingCost: details.shippingCost,
    };
  }

  /**
   * Calculate total cost for supplier
   *
   * Calculates the cost breakdown for a fulfillment order.
   *
   * @param orderId - The dropship order ID
   * @returns Cost breakdown
   */
  async calculateOrderCost(orderId: string): Promise<OrderCost> {
    const order = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Fulfillment order not found');
    }

    const itemsCost = order.items.reduce(
      (sum, item) => sum + Number(item.totalCost),
      0
    );

    return {
      itemsCost,
      shippingCost: Number(order.shippingCost),
      totalCost: Number(order.totalCost),
      currency: 'USD',
    };
  }

  /**
   * Validate order can be fulfilled
   *
   * Checks if the order is ready for fulfillment.
   *
   * @param orderId - The dropship order ID
   * @returns Validation result with any errors or warnings
   */
  async validateFulfillment(orderId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const details = await this.getFulfillmentDetails(orderId);

    if (!details) {
      return {
        valid: false,
        errors: ['Fulfillment order not found'],
        warnings: [],
      };
    }

    // Check order status
    if (details.status === DropshipOrderStatus.CANCELLED) {
      errors.push('Order has been cancelled');
    }

    if (details.status === DropshipOrderStatus.DELIVERED) {
      errors.push('Order has already been delivered');
    }

    if (details.status === DropshipOrderStatus.REFUNDED) {
      errors.push('Order has been refunded');
    }

    // Check for items
    if (details.items.length === 0) {
      errors.push('Order has no items to fulfill');
    }

    // Check each item's product source
    for (const item of details.items) {
      if (item.productSource.sourceStatus === 'DISCONTINUED') {
        errors.push(`Product ${item.productSource.productSlug} has been discontinued`);
      }

      if (item.productSource.sourceStatus === 'UNAVAILABLE') {
        warnings.push(`Product ${item.productSource.productSlug} may be unavailable on AliExpress`);
      }

      if (item.productSource.inventoryStatus === 'OUT_OF_STOCK') {
        warnings.push(`Product ${item.productSource.productSlug} is out of stock`);
      }

      // Check for missing AliExpress SKU
      if (!item.aliExpressSku && !item.productSource.aliExpressSku) {
        errors.push(`Missing AliExpress SKU for item in order`);
      }
    }

    // Check shipping address
    const address = details.shippingAddress as any;
    if (!address.line1 || !address.city || !address.state || !address.zip) {
      errors.push('Incomplete shipping address');
    }

    // Check customer contact
    if (!details.customerEmail) {
      errors.push('Missing customer email');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get orders by status
   *
   * Retrieves orders filtered by a specific status.
   *
   * @param status - The status to filter by
   * @param limit - Maximum number of results
   * @returns Array of dropship orders
   */
  async getOrdersByStatus(
    status: DropshipOrderStatus,
    limit: number = 50
  ): Promise<any[]> {
    return this.getPendingOrders({ status, limit });
  }

  /**
   * Get orders requiring attention
   *
   * Retrieves orders that need immediate attention (ISSUE status or old PENDING orders).
   *
   * @returns Array of orders requiring attention
   */
  async getOrdersRequiringAttention(): Promise<any[]> {
    const issueOrders = await prisma.dropshipOrder.findMany({
      where: {
        status: DropshipOrderStatus.ISSUE,
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
        items: {
          include: {
            productSource: true,
          },
        },
      },
    });

    // Get PENDING orders older than 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const oldPendingOrders = await prisma.dropshipOrder.findMany({
      where: {
        status: DropshipOrderStatus.PENDING,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
        items: {
          include: {
            productSource: true,
          },
        },
      },
    });

    return [...issueOrders, ...oldPendingOrders];
  }

  /**
   * Get fulfillment history for an order
   *
   * Retrieves the status history for a fulfillment order.
   *
   * @param orderId - The dropship order ID
   * @returns Array of status changes with timestamps
   */
  async getFulfillmentHistory(orderId: string): Promise<Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>> {
    const order = await prisma.dropshipOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Fulfillment order not found');
    }

    // Build history from timestamps
    const history: Array<{
      status: string;
      timestamp: Date;
      note?: string;
    }> = [];

    history.push({
      status: 'PENDING',
      timestamp: order.createdAt,
      note: 'Order created',
    });

    if (order.placedAt) {
      history.push({
        status: 'PLACED',
        timestamp: order.placedAt,
        note: order.aliExpressOrderId 
          ? `AliExpress Order: ${order.aliExpressOrderId}`
          : undefined,
      });
    }

    if (order.shippedAt) {
      history.push({
        status: 'SHIPPED',
        timestamp: order.shippedAt,
        note: order.trackingNumber
          ? `Tracking: ${order.trackingNumber}`
          : undefined,
      });
    }

    if (order.deliveredAt) {
      history.push({
        status: 'DELIVERED',
        timestamp: order.deliveredAt,
      });
    }

    return history;
  }
}
