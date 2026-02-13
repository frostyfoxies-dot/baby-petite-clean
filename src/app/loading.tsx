import { Skeleton } from '@/components/ui/skeleton';

/**
 * Global loading component
 * Displays a loading spinner while the app is loading
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-yellow-dark rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
