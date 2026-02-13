import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/layout/container';

/**
 * Product detail page loading skeleton
 * Displays a skeleton layout while product details are loading
 */
export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-gray-200">
        <Container>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery Skeleton */}
            <div>
              <Skeleton className="w-full aspect-square rounded-lg mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-square rounded" />
                ))}
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-6">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-10 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-10" />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <div className="flex gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          {/* Product Details Tabs Skeleton */}
          <div className="mt-16">
            <div className="flex gap-8 border-b border-gray-200 mb-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Reviews Section Skeleton */}
          <div className="mt-16">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-gray-200 pb-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Products Skeleton */}
          <div className="mt-16">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
          </div>
        </div>
      </Container>
    </main>
  );
}
