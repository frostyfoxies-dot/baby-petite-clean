import { prisma } from '@/lib/prisma';
import { DropshipOrderStatus } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Order interface for dropship order creation
 */
interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: Record<string, unknown>;
  subtotal: number;
  shippingAmount: number;
  total: number;
}

/**
 * Order item interface
 */
interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Product source with variant mapping
 */
interface ProductSourceWithMapping {
  id: string;
  sanityProductId: string;
  productSlug: string;
  aliExpressProductId: string;
  aliExpressUrl: string;
  aliExpressSku: string | null;
  originalPrice: number;
  originalCurrency: string;
  supplierId: string;
  variantMapping: Record<string, unknown> | null;
}

/**
 * Result of dropship order creation
 */
interface CreateDropshipOrderResult {
  success: boolean;
  dropshipOrderId?: string;
  error?: string;
}

// ============================================
// ORDER HANDLER SERVICE
// ============================================

/**
 * Create a dropship order for an order containing dropshipped products
 *
 * This function should be called after an order is created to check
 * if any items are from dropshipped products and create the necessary
 * DropshipOrder and DropshipOrderItem records.
 *
 * @param order - The created order
 * @param orderItems - The order items
 * @returns Result indicating success or failure
 */
export async function createDropshipOrderForOrder(
  order: Order,
  orderItems: OrderItem[]
): Promise<CreateDropshipOrderResult> {
  try {
    // Get variant IDs from order items
    const variantIds = orderItems.map((item) => item.variantId);

    // Find ProductSource records for these variants
    // We need to match by product slug or sanity product ID
    const productSources = await findProductSourcesForVariants(variantIds, orderItems);

    if (productSources.length === 0) {
      // No dropshipped products in this order
      return { success: true };
    }

    // Calculate total cost
    let totalCost = 0;
    let shippingCost = 0;

    // Build dropship order items
    const dropshipOrderItems: Array<{
      productSourceId: string;
      aliExpressSku: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      orderItemId: string;
    }> = [];

    for (const item of orderItems) {
      const productSource = productSources.find(
        (ps) => ps.productSlug === item.sku.split('-')[0] || // Match by SKU prefix
                productSources.some((ps) => {
                  // Check variant mapping
                  const mapping = ps.variantMapping as any;
                  if (mapping && mapping[item.sku]) {
                    return true;
                  }
                  return false;
                })
      );

      if (productSource) {
        // Get the AliExpress SKU for this variant
        const aliExpressSku = getAliExpressSku(productSource, item.sku);
        const unitCost = Number(productSource.originalPrice);
        const itemTotalCost = unitCost * item.quantity;

        totalCost += itemTotalCost;

        dropshipOrderItems.push({
          productSourceId: productSource.id,
          aliExpressSku,
          quantity: item.quantity,
          unitCost,
          totalCost: itemTotalCost,
          orderItemId: item.id,
        });
      }
    }

    if (dropshipOrderItems.length === 0) {
      return { success: true };
    }

    // Add shipping cost (estimate based on number of items)
    shippingCost = calculateShippingCost(dropshipOrderItems.length);
    totalCost += shippingCost;

    // Create dropship order in transaction
    const dropshipOrder = await prisma.$transaction(async (tx) => {
      // Create the dropship order
      const newDropshipOrder = await tx.dropshipOrder.create({
        data: {
          orderId: order.id,
          status: DropshipOrderStatus.PENDING,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress,
          totalCost,
          shippingCost,
        },
      });

      // Create dropship order items in batch (fixes N+1 query issue)
      await tx.dropshipOrderItem.createMany({
        data: dropshipOrderItems.map((item) => ({
          dropshipOrderId: newDropshipOrder.id,
          productSourceId: item.productSourceId,
          aliExpressSku: item.aliExpressSku,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          orderItemId: item.orderItemId,
        })),
      });

      return newDropshipOrder;
    });

    console.log(`Created dropship order ${dropshipOrder.id} for order ${order.orderNumber}`);

    return {
      success: true,
      dropshipOrderId: dropshipOrder.id,
    };
  } catch (error) {
    console.error('Error creating dropship order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if an order contains dropshipped products
 *
 * @param orderItems - The order items to check
 * @returns True if any items are from dropshipped products
 */
export async function orderContainsDropshippedItems(
  orderItems: OrderItem[]
): Promise<boolean> {
  const variantIds = orderItems.map((item) => item.variantId);
  const productSources = await findProductSourcesForVariants(variantIds, orderItems);
  return productSources.length > 0;
}

/**
 * Get AliExpress product URLs for order items
 *
 * Returns the AliExpress URLs for items that are dropshipped.
 *
 * @param orderItems - The order items
 * @returns Map of order item IDs to AliExpress URLs
 */
export async function getAliExpressUrlsForOrderItems(
  orderItems: OrderItem[]
): Promise<Map<string, string>> {
  const variantIds = orderItems.map((item) => item.variantId);
  const productSources = await findProductSourcesForVariants(variantIds, orderItems);
  const urlMap = new Map<string, string>();

  for (const item of orderItems) {
    const productSource = productSources.find((ps) => {
      const mapping = ps.variantMapping as any;
      return mapping && mapping[item.sku];
    });

    if (productSource) {
      urlMap.set(item.id, productSource.aliExpressUrl);
    }
  }

  return urlMap;
}

// ============================================
// PRIVATE HELPER FUNCTIONS
// ============================================

/**
 * Find ProductSource records for variants
 */
async function findProductSourcesForVariants(
  variantIds: string[],
  orderItems: OrderItem[]
): Promise<ProductSourceWithMapping[]> {
  // Get variants with their products
  const variants = await prisma.variant.findMany({
    where: {
      id: { in: variantIds },
    },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (variants.length === 0) {
    return [];
  }

  // Get product slugs and Sanity IDs
  const productSlugs = variants.map((v) => v.product.slug);
  const sanityProductIds = variants.map((v) => v.product.id);

  // Find ProductSource records
  const productSources = await prisma.productSource.findMany({
    where: {
      OR: [
        { productSlug: { in: productSlugs } },
        { sanityProductId: { in: sanityProductIds } },
      ],
    },
  });

  return productSources.map((ps) => ({
    id: ps.id,
    sanityProductId: ps.sanityProductId,
    productSlug: ps.productSlug,
    aliExpressProductId: ps.aliExpressProductId,
    aliExpressUrl: ps.aliExpressUrl,
    aliExpressSku: ps.aliExpressSku,
    originalPrice: Number(ps.originalPrice),
    originalCurrency: ps.originalCurrency,
    supplierId: ps.supplierId,
    variantMapping: ps.variantMapping as Record<string, unknown> | null,
  }));
}

/**
 * Get the AliExpress SKU for a variant
 */
function getAliExpressSku(
  productSource: ProductSourceWithMapping,
  localSku: string
): string {
  // Check if there's a variant mapping
  if (productSource.variantMapping) {
    const mapping = productSource.variantMapping as any;
    if (mapping[localSku]) {
      return mapping[localSku].aliExpressSku || mapping[localSku];
    }
  }

  // Fall back to the default SKU
  return productSource.aliExpressSku || localSku;
}

/**
 * Calculate shipping cost for dropship order
 */
function calculateShippingCost(itemCount: number): number {
  // Base shipping cost plus per-item cost
  const baseCost = 2.99;
  const perItemCost = 0.50;
  return baseCost + (itemCount - 1) * perItemCost;
}

/**
 * Get all pending dropship orders for a supplier
 */
export async function getPendingOrdersForSupplier(
  supplierId: string
): Promise<Array<{
  id: string;
  orderNumber: string;
  customerEmail: string;
  shippingAddress: Record<string, unknown>;
  items: Array<{
    productName: string;
    aliExpressSku: string;
    quantity: number;
    unitCost: number;
  }>;
}>> {
  const dropshipOrders = await prisma.dropshipOrder.findMany({
    where: {
      status: DropshipOrderStatus.PENDING,
      items: {
        some: {
          productSource: {
            supplierId,
          },
        },
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

  return dropshipOrders.map((dropshipOrder) => ({
    id: dropshipOrder.id,
    orderNumber: dropshipOrder.order.orderNumber,
    customerEmail: dropshipOrder.customerEmail,
    shippingAddress: dropshipOrder.shippingAddress as Record<string, unknown>,
    items: dropshipOrder.items.map((item) => ({
      productName: dropshipOrder.order.items.find(
        (oi) => oi.id === item.orderItemId
      )?.productName || 'Unknown Product',
      aliExpressSku: item.aliExpressSku,
      quantity: item.quantity,
      unitCost: Number(item.unitCost),
    })),
  }));
}
