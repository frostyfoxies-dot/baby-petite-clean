'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Users, Heart } from 'lucide-react';
import { createRegistry } from '@/actions/registry';

/**
 * Registry create page component
 * Client component that handles registry creation via server action
 */
export default function RegistryCreatePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('registry-name') as string;
    const eventDate = formData.get('event-date') as string;

    const result = await createRegistry({
      name,
      eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
    });

    setIsCreating(false);

    if (result.success && result.data) {
      router.push(`/registry/${result.data.shareCode}/manage`);
    } else {
      setError(result.error || 'Failed to create registry');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Create Baby Registry
          </h1>
          <p className="text-gray-600 mt-1">
            Set up your registry and start adding items for your little one.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleCreate} className="bg-white rounded-lg p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Registry name */}
            <div>
              <label htmlFor="registry-name" className="block text-sm font-medium text-gray-900 mb-2">
                Registry Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="registry-name"
                name="registry-name"
                type="text"
                placeholder="e.g., Baby Smith Registry"
                required
              />
            </div>

            {/* Event information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Event Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="event-date" className="block text-sm font-medium text-gray-900 mb-2">
                    Event Date (Optional)
                  </label>
                  <div className="relative">
                    <Input
                      id="event-date"
                      name="event-date"
                      type="date"
                      leftIcon={<Calendar className="w-4 h-4" />}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Baby shower, due date, or other celebration date
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy settings */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Privacy Settings
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    defaultChecked
                    className="w-4 h-4 text-yellow border-gray-300 focus:ring-yellow"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Public</p>
                    <p className="text-xs text-gray-500">Anyone with the link can view</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    className="w-4 h-4 text-yellow border-gray-300 focus:ring-yellow"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Private</p>
                    <p className="text-xs text-gray-500">Only people you invite can view</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isCreating}>
                Create Registry
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
