import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/layout/container';

/**
 * Products page loading skeleton
 * Displays a skeleton grid while products are loading
 */
export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200">
        <Container>
          <div className="py-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-5 w-96" />
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar Skeleton */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="space-y-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>

                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>

                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Products Grid Skeleton */}
            <div className="flex-1">
              {/* Sort Bar Skeleton */}
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-40" />
              </div>

              {/* Product Cards Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <Skeleton className="w-full aspect-square" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-5 w-20 mt-2" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Skeleton */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-10" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
