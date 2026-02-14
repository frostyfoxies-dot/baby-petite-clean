import { prisma } from '@/lib/prisma';
import { SupplierDetails } from './supplier-details';
import { Supplier } from '@prisma/client';

/**
 * Supplier Management Page
 * 
 * Admin page for viewing and managing AliExpress suppliers.
 */
export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  // Fetch all suppliers with product count
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: {
          products: true,
          dropshipOrders: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <SupplierDetails suppliers={suppliers} />;
}
