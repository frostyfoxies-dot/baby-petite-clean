import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { OrderDetailClient } from './order-detail-client';

/**
 * Fulfillment Order Detail Page
 * 
 * Shows detailed information about a specific dropship order.
 */
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  // Fetch the dropship order with all related data
  const dropshipOrder = await prisma.dropshipOrder.findUnique({
    where: { id: orderId },
    include: {
      order: {
        include: {
          items: {
            include: {
              variant: true,
            },
          },
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      items: {
        include: {
          productSource: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!dropshipOrder) {
    notFound();
  }

  return <OrderDetailClient dropshipOrder={dropshipOrder} />;
}
