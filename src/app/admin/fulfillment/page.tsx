import { prisma } from '@/lib/prisma';
import { FulfillmentClient } from './fulfillment-client';

/**
 * Fulfillment Dashboard Page
 * 
 * Admin page for managing dropship order fulfillment.
 */
export default async function FulfillmentPage() {
  // Fetch dropship orders with related data
  const orders = await prisma.dropshipOrder.findMany({
    include: {
      order: {
        include: {
          items: {
            include: {
              variant: true,
            },
          },
        },
      },
      items: {
        include: {
          productSource: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate counts for each status
  const counts = {
    pending: orders.filter(o => o.status === 'PENDING').length,
    placed: orders.filter(o => o.status === 'PLACED' || o.status === 'CONFIRMED').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    issues: orders.filter(o => o.status === 'ISSUE' || o.status === 'CANCELLED').length,
  };

  return <FulfillmentClient orders={orders} counts={counts} />;
}
