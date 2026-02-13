import { Suspense } from 'react';
import { Metadata } from 'next';
import { FilterPanel, ActiveFilter } from '@/components/search/filter-panel';
import { SortDropdown, SortOption } from '@/components/search/sort-dropdown';
import { Pagination } from '@/components/ui/pagination';
import { ProductCard, Product } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  inStock: boolean;
}

interface SearchCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

interface SearchCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

interface SearchResponse {
  query: string;
  products: SearchProduct[];
  categories: SearchCategory[];
  collections: SearchCollection[];
  suggestions: string[];
  totalResults: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function performSearch(query: string, limit: number = 24): Promise<SearchResponse | null> {
  if (!query || query.trim().length === 0) {
    return null;
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search?q=${encodeURIComponent(query)}&limit=${limit}&type=products`,
      {
        cache: 'no-store', // Always fetch fresh search results
      }
    );

    if (!res.ok) {
      throw new Error(`Search failed: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Error performing search:', error);
    return null;
  }
}

function transformProduct(product: SearchProduct): Product {
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: product.images.map(img => ({
      url: img.url,
      alt: img.altText || undefined,
    })),
    price: product.basePrice,
    salePrice: product.compareAtPrice || undefined,
    isOutOfStock: !product.inStock,
    category: product.category.name,
  };
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';

  if (!query) {
    return {
      title: 'Search | Kids Petite',
      description: 'Search for products in our collection',
    };
  }

  return {
    title: `Search results for "${query}" | Kids Petite`,
    description: `Find products matching "${query}" in our collection`,
    robots: {
      index: false, // Don't index search pages
    },
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

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

// ============================================================================
// SEARCH PAGE COMPONENT
// ============================================================================

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    category?: string;
    price?: string;
    color?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const sortBy = resolvedSearchParams.sort || 'relevance';
  const productsPerPage = 24;

  // Perform search
  const searchResults = query ? await performSearch(query, 50) : null;

  // Transform products
  let products: Product[] = searchResults?.products.map(transformProduct) || [];

  // Apply sorting
  switch (sortBy) {
    case 'price_asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      // Products with sale price first (assuming they're popular)
      products.sort((a, b) => (b.salePrice ? 1 : 0) - (a.salePrice ? 1 : 0));
      break;
    case 'relevance':
    default:
      // Keep original order from search
      break;
  }

  // Apply category filter if present
  if (resolvedSearchParams.category) {
    products = products.filter(p => 
      p.category?.toLowerCase() === resolvedSearchParams.category?.toLowerCase()
    );
  }

  // Pagination
  const totalResults = products.length;
  const totalPages = Math.ceil(totalResults / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + productsPerPage);

  // Filter groups
  const filterGroups = [
    {
      id: 'category',
      label: 'Category',
      type: 'checkbox' as const,
      options: [
        { value: 'baby', label: 'Baby', count: 0 },
        { value: 'toddler', label: 'Toddler', count: 0 },
        { value: 'kids', label: 'Kids', count: 0 },
        { value: 'accessories', label: 'Accessories', count: 0 },
      ],
    },
    {
      id: 'price',
      label: 'Price Range',
      type: 'range' as const,
      min: 0,
      max: 100,
      step: 5,
      unit: '$',
    },
  ];

  // Update category counts from search results
  if (searchResults?.products) {
    const categoryCounts = new Map<string, number>();
    searchResults.products.forEach(p => {
      const cat = p.category.name.toLowerCase();
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });
    filterGroups[0].options = filterGroups[0].options.map(opt => ({
      ...opt,
      count: categoryCounts.get(opt.value) || 0,
    }));
  }

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High', direction: 'asc' },
    { value: 'price_desc', label: 'Price: High to Low', direction: 'desc' },
    { value: 'popular', label: 'Best Selling' },
  ];

  // Active filters
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

  // Suggestions from search results
  const suggestions = searchResults?.suggestions || [];

  return (
    <div className="min-h-screen">
      {/* Search header */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Search
          </h1>

          {/* Search input */}
          <form className="max-w-2xl" action="/search" method="get">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                name="q"
                placeholder="Search for products..."
                defaultValue={query}
                className="pl-10 pr-10 h-12"
              />
              {query && (
                <Link
                  href="/search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </Link>
              )}
            </div>
          </form>

          {/* Results count */}
          {query && searchResults && (
            <p className="text-gray-600 mt-3">
              {totalResults} results for "<span className="font-medium text-gray-900">{query}</span>"
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!query ? (
          /* No search query state */
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Start your search
            </h2>
            <p className="text-gray-600 mb-6">
              Enter a keyword to find products
            </p>
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['bodysuit', 'dress', 'romper', 'organic cotton', 'newborn'].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : !searchResults || totalResults === 0 ? (
          /* No results state */
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No results found
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any products matching "<span className="font-medium">{query}</span>"
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Try:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Checking your spelling</li>
                <li>• Using more general terms</li>
                <li>• Trying different keywords</li>
              </ul>
            </div>
            {suggestions.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.slice(0, 5).map((suggestion) => (
                    <Link
                      key={suggestion}
                      href={`/search?q=${encodeURIComponent(suggestion)}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      {suggestion}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          /* Search results */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                  {activeFilters.length > 0 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </Link>
                  )}
                </div>

                <FilterPanel
                  groups={filterGroups}
                  activeFilters={activeFilters}
                  onFilterChange={(groupId, value, checked) => {
                    const params = new URLSearchParams();
                    params.set('q', query);
                    if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                    if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                    if (checked) {
                      params.set(groupId, value);
                    }
                    window.location.href = `/search?${params.toString()}`;
                  }}
                  onRangeChange={(groupId, value) => {
                    const params = new URLSearchParams();
                    params.set('q', query);
                    if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                    if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                    params.set(groupId, `${value[0]}-${value[1]}`);
                    window.location.href = `/search?${params.toString()}`;
                  }}
                  onRemoveFilter={(groupId, value) => {
                    const params = new URLSearchParams();
                    params.set('q', query);
                    if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                    if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                    params.delete(groupId);
                    window.location.href = `/search?${params.toString()}`;
                  }}
                  onClearAll={() => {
                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                  }}
                  defaultOpen={['category', 'price']}
                />
              </div>
            </aside>

            {/* Results grid */}
            <div className="flex-1">
              {/* Sort and view options */}
              <div className="flex items-center justify-between mb-4">
                <SortDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={(value) => {
                    const params = new URLSearchParams();
                    params.set('q', query);
                    if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                    params.set('sort', value);
                    window.location.href = `/search?${params.toString()}`;
                  }}
                />

                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, totalResults)} of {totalResults}
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
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Products grid */}
              <Suspense fallback={<ProductsGridSkeleton />}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Suspense>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      const params = new URLSearchParams();
                      params.set('q', query);
                      if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                      params.set('page', String(page));
                      window.location.href = `/search?${params.toString()}`;
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
