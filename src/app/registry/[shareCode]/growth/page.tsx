import { notFound, redirect } from 'next/navigation';
import { getRegistry } from '@/actions/registry';
import { getGrowthEntries } from '@/actions/growth';
import { GrowthTrackerView } from './growth-tracker-view';
import { Priority } from '@prisma/client';

/**
 * Growth tracker page
 * Server component that fetches registry and growth data
 */
export default async function RegistryGrowthPage({
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

  // Only allow owners to view growth tracking
  if (!registry.isOwner) {
    redirect(`/registry/${shareCode}`);
  }

  // Fetch growth entries
  const growthResult = await getGrowthEntries(registry.id);
  const growthEntries = growthResult.success && growthResult.data ? growthResult.data.entries : [];

  return (
    <GrowthTrackerView
      registry={{
        id: registry.id,
        name: registry.name,
        shareCode: registry.shareCode,
        eventDate: registry.eventDate,
      }}
      growthEntries={growthEntries.map((entry) => ({
        id: entry.id,
        childName: entry.childName,
        childBirthDate: entry.childBirthDate,
        height: entry.height,
        weight: entry.weight,
        headCircumference: entry.headCircumference,
        recordedAt: entry.recordedAt,
        notes: entry.notes,
      }))}
    />
  );
}
