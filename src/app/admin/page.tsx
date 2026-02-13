import { prisma } from '@/lib/prisma';
import { DashboardClient } from './dashboard-client';

/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard with overview statistics and quick actions.
 */
export default async function AdminDashboardPage() {
  // Fetch statistics
  const [
    totalProducts,
    totalSuppliers,
    pendingOrders,
    recentImports,
    pendingFulfillment,
  ] = await Promise.all([
    // Total products from ProductSource
    prisma.productSource.count(),
    
    // Total suppliers
    prisma.supplier.count({
      where: { status: 'ACTIVE' },
    }),
    
    // Pending orders
    prisma.dropshipOrder.count({
      where: { status: 'PENDING' },
    }),
    
    // Recent imports (last 7 days)
    prisma.productSource.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    
    // Pending fulfillment count
    prisma.dropshipOrder.count({
      where: {
        status: { in: ['PENDING', 'PLACED', 'CONFIRMED'] },
      },
    }),
  ]);

  // Get recent orders
  const recentOrders = await prisma.dropshipOrder.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  });

  // Get recent products
  const recentProducts = await prisma.productSource.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      productSlug: true,
      aliExpressProductId: true,
      createdAt: true,
      sourceStatus: true,
    },
  });

  const stats = {
    totalProducts,
    totalSuppliers,
    pendingOrders,
    recentImports,
    pendingFulfillment,
  };

  return (
    <DashboardClient 
      stats={stats} 
      recentOrders={recentOrders}
      recentProducts={recentProducts}
    />
  );
}
