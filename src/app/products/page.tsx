import { Suspense } from 'react';
import { FilterPanel, ActiveFilter } from '@/components/search/filter-panel';
import { SortDropdown, SortOption } from '@/components/search/sort-dropdown';
import { Pagination } from '@/components/ui/pagination';
import { ProductCard, Product } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, X } from 'lucide-react';
import { PaginatedProductsResponse } from '@/app/api/products/route';

/**
 * Force dynamic rendering to avoid session errors during build
 */
export const dynamic = 'force-dynamic';

/**
 * Fetch products from API
 */
async function getProducts(searchParams: {
  page?: string;
  sort?: string;
  category?: string;
  price?: string;
  color?: string;
  size?: string;
}): Promise<PaginatedProductsResponse> {
  const params = new URLSearchParams();
  
  if (searchParams.page) params.set('page', searchParams.page);
  if (searchParams.sort) {
    // Map frontend sort values to API sort values
    const sortMap: Record<string, string> = {
      'featured': 'newest',
      'newest': 'newest',
      'price-asc': 'price_asc',
      'price-desc': 'price_desc',
      'popular': 'popular',
      'rating': 'rating',
    };
    params.set('sort', sortMap[searchParams.sort] || 'newest');
  }
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.color) params.set('color', searchParams.color);
  if (searchParams.size) params.set('size', searchParams.size);
  if (searchParams.price) {
    const [min, max] = searchParams.price.split('-');
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/products?${params.toString()}`, {
    cache: 'no-store', // Always fetch fresh data for product listings
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

/**
 * Map API product to ProductCard format
 */
function mapProduct(apiProduct: PaginatedProductsResponse['products'][0]): Product {
  const primaryImage = apiProduct.images.find(img => img.isPrimary) || apiProduct.images[0];
  
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    images: [{ url: primaryImage?.url || '/images/placeholder.jpg' }],
    price: apiProduct.basePrice,
    salePrice: apiProduct.compareAtPrice || undefined,
    rating: apiProduct.popularityScore / 20, // Convert 0-100 score to 0-5 rating
    reviewCount: 0, // Not provided in list API
    isNew: apiProduct.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Within 30 days
    isOnSale: apiProduct.isOnSale,
    category: apiProduct.category.name,
  };
}

/**
 * Products page component
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    category?: string;
    price?: string;
    color?: string;
    size?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const sortBy = resolvedSearchParams.sort || 'featured';

  // Fetch products from API
  let data: PaginatedProductsResponse;
  let products: Product[] = [];
  let totalPages = 1;
  let totalProducts = 0;
  let filterOptions = {
    categories: [] as Array<{ id: string; name: string; slug: string; count: number }>,
    colors: [] as Array<{ name: string; count: number }>,
    sizes: [] as Array<{ name: string; count: number }>,
    priceRange: { min: 0, max: 100 },
  };

  try {
    data = await getProducts(resolvedSearchParams);
    products = data.products.map(mapProduct);
    totalPages = data.pagination.totalPages;
    totalProducts = data.pagination.totalItems;
    filterOptions = data.filters;
  } catch (error) {
    console.error('Error loading products:', error);
    // Continue with empty products on error
  }

  // Filter groups - using API data
  const filterGroups = [
    {
      id: 'category',
      label: 'Category',
      type: 'checkbox' as const,
      options: filterOptions.categories.map(cat => ({
        value: cat.slug,
        label: cat.name,
        count: cat.count,
      })),
    },
    {
      id: 'price',
      label: 'Price Range',
      type: 'range' as const,
      min: filterOptions.priceRange.min,
      max: filterOptions.priceRange.max,
      step: 5,
      unit: '$',
    },
    {
      id: 'color',
      label: 'Color',
      type: 'color' as const,
      options: filterOptions.colors.map(color => ({
        value: color.name.toLowerCase(),
        label: color.name,
        color: color.name.toLowerCase(), // Would need color code mapping
      })),
    },
    {
      id: 'size',
      label: 'Size',
      type: 'checkbox' as const,
      options: filterOptions.sizes.map(size => ({
        value: size.name.toLowerCase(),
        label: size.name,
        count: size.count,
      })),
    },
  ];

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High', direction: 'asc' },
    { value: 'price-desc', label: 'Price: High to Low', direction: 'desc' },
    { value: 'popular', label: 'Best Selling' },
    { value: 'rating', label: 'Top Rated' },
  ];

  // Active filters from search params
  const activeFilters: ActiveFilter[] = [];
  if (resolvedSearchParams.category) {
    const category = filterGroups[0].options?.find(o => o.value === resolvedSearchParams.category);
    if (category) {
      activeFilters.push({
        groupId: 'category',
        groupLabel: 'Category',
        value: resolvedSearchParams.category,
        label: category.label,
      });
    }
  }
  if (resolvedSearchParams.color) {
    const color = filterGroups[2].options?.find(o => o.value === resolvedSearchParams.color);
    if (color) {
      activeFilters.push({
        groupId: 'color',
        groupLabel: 'Color',
        value: resolvedSearchParams.color,
        label: color.label,
      });
    }
  }
  if (resolvedSearchParams.size) {
    const size = filterGroups[3].options?.find(o => o.value === resolvedSearchParams.size);
    if (size) {
      activeFilters.push({
        groupId: 'size',
        groupLabel: 'Size',
        value: resolvedSearchParams.size,
        label: size.label,
      });
    }
  }

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            All Products
          </h1>
          <p className="text-gray-600 mt-1">
            {totalProducts} products
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                {activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/products';
                    }}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <FilterPanel
                groups={filterGroups}
                activeFilters={activeFilters}
                onFilterChange={(groupId, value, checked) => {
                  const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                  if (checked) {
                    params.set(groupId, value);
                  } else {
                    params.delete(groupId);
                  }
                  window.location.href = `/products?${params.toString()}`;
                }}
                onRangeChange={(groupId, value) => {
                  const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                  params.set(groupId, `${value[0]}-${value[1]}`);
                  window.location.href = `/products?${params.toString()}`;
                }}
                onRemoveFilter={(groupId, value) => {
                  const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                  params.delete(groupId);
                  window.location.href = `/products?${params.toString()}`;
                }}
                onClearAll={() => {
                  window.location.href = '/products';
                }}
                defaultOpen={['category', 'price']}
              />
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {/* Sort and view options */}
            <div className="flex items-center justify-between mb-4">
              <SortDropdown
                options={sortOptions}
                value={sortBy}
                onChange={(value) => {
                  const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                  params.set('sort', value);
                  window.location.href = `/products?${params.toString()}`;
                }}
              />

              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalProducts)} of {totalProducts}
              </div>
            </div>

            {/* Active filters mobile */}
            {activeFilters.length > 0 && (
              <div className="lg:hidden mb-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <div
                    key={`${filter.groupId}-${filter.value}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    <span>{filter.label}</span>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                        params.delete(filter.groupId);
                        window.location.href = `/products?${params.toString()}`;
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Products grid */}
            <Suspense fallback={<ProductsGridSkeleton />}>
              {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No products found.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      window.location.href = '/products';
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </Suspense>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                    params.set('page', String(page));
                    window.location.href = `/products?${params.toString()}`;
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Products grid skeleton for loading state
 */
function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
