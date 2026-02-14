import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Heart, Share2, Calendar, Users } from 'lucide-react';
import { getUserRegistry } from '@/actions/registry';
import { RegistryStatus } from '@prisma/client';

/**
 * Force dynamic rendering - page requires session/auth
 */
export const dynamic = 'force-dynamic';

/**
 * Registry list page component
 * Server component that fetches user's registry data
 */
export default async function RegistryPage() {
  const result = await getUserRegistry();
  
  // Handle the case where user has a registry
  const registry = result.success ? result.data : null;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-gray-50 border-b border-gray-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <Heart className="w-12 h-12 text-yellow-dark mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Baby Registry
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create a registry for your little one and let friends and family celebrate with the perfect gifts.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Create registry CTA */}
        {!registry && (
          <div className="bg-yellow/10 rounded-lg p-8 mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Create Your Baby Registry
            </h2>
            <p className="text-gray-600 mb-4">
              Start building your wishlist and share it with loved ones.
            </p>
            <Link href="/registry/create">
              <Button size="lg" leftIcon={<Plus className="w-4 h-4" />}>
                Create Registry
              </Button>
            </Link>
          </div>
        )}

        {/* Find a registry */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Find a Registry
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter registry name or share code"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
            />
            <Button>Search</Button>
          </div>
        </div>

        {/* My registries */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            My Registry
          </h2>

          {!registry ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                You don't have a registry yet
              </p>
              <Link href="/registry/create">
                <Button>Create Your First Registry</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div key={registry.id} className="bg-white rounded-lg overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-yellow/20 to-yellow-dark/20 flex items-center justify-center">
                  <Heart className="w-12 h-12 text-yellow-dark" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {registry.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {registry.eventDate 
                          ? `Event: ${new Date(registry.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                          : 'No event date set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        registry.status === RegistryStatus.ACTIVE 
                          ? 'bg-green-100 text-green-800' 
                          : registry.status === RegistryStatus.COMPLETED
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {registry.status}
                      </span>
                      <span className="text-gray-500">
                        {registry.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {registry.items.reduce((sum, item) => sum + item.quantityPurchased, 0)} of {registry.items.length} items fulfilled
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {registry.items.length > 0 && (
                    <div className="mt-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow"
                          style={{ 
                            width: `${Math.min(100, (registry.items.reduce((sum, item) => sum + item.quantityPurchased, 0) / registry.items.length) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/registry/${registry.shareCode}`} className="flex-1">
                      <Button variant="outline" size="sm" fullWidth leftIcon={<Share2 className="w-4 h-4" />}>
                        View
                      </Button>
                    </Link>
                    <Link href={`/registry/${registry.shareCode}/manage`} className="flex-1">
                      <Button size="sm" fullWidth>
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
