import { notFound, redirect } from 'next/navigation';
import { getRegistry } from '@/actions/registry';
import { RegistryManageView } from './registry-manage-view';
import { Priority } from '@prisma/client';

/**
 * Registry manage page
 * Server component that fetches registry data for editing
 */
export default async function RegistryManagePage({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}) {
  const { shareCode } = await params;
  const result = await getRegistry(shareCode);

  if (!result.success) {
    if (result.error === 'Registry not found') {
      notFound();
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Registry</h1>
          <p className="text-gray-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const registry = result.data!;

  // Only allow owners to manage the registry
  if (!registry.isOwner) {
    redirect(`/registry/${shareCode}`);
  }

  // Transform items for the client component
  const registryItems = registry.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    variantId: item.variantId,
    variantName: item.variantName,
    quantity: item.quantity,
    quantityPurchased: item.quantityPurchased,
    priority: item.priority,
    notes: item.notes,
  }));

  return (
    <RegistryManageView
      registry={{
        id: registry.id,
        name: registry.name,
        description: registry.description,
        eventDate: registry.eventDate,
        shareCode: registry.shareCode,
        isPublic: registry.isPublic,
        items: registryItems,
      }}
    />
  );
}
