import { notFound } from 'next/navigation';
import { getRegistry } from '@/actions/registry';
import { RegistryPublicView } from './registry-public-view';
import { Priority } from '@prisma/client';

/**
 * Public registry view page
 * Server component that fetches registry data by share code
 */
export default async function RegistryPublicPage({
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
    <RegistryPublicView
      registry={{
        id: registry.id,
        name: registry.name,
        description: registry.description,
        eventDate: registry.eventDate,
        shareCode: registry.shareCode,
        isPublic: registry.isPublic,
        isOwner: registry.isOwner,
        items: registryItems,
      }}
    />
  );
}
