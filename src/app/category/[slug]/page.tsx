import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { FilterPanel, ActiveFilter } from '@/components/search/filter-panel';
import { SortDropdown, SortOption } from '@/components/search/sort-dropdown';
import { Pagination } from '@/components/ui/pagination';
import { ProductCard, Product } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionCard } from '@/components/content/collection-card';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface CategoryImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

interface CategoryProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  images: CategoryImage[];
  variants: Array<{
    id: string;
    name: string;
    size: string;
    color: string | null;
    price: number;
    inStock: boolean;
  }>;
  isFeatured: boolean;
  isOnSale: boolean;
}

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    productCount: number;
  }>;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  products: {
    items: CategoryProduct[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getCategory(slug: string, page: number, sort: string): Promise<CategoryResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/categories/${slug}?page=${page}&limit=24&sort=${sort}`,
      {
        cache: 'no-store', // Always fetch fresh data for category pages
      }
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch category: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

function transformProduct(product: CategoryProduct): Product {
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.shortDescription || undefined,
    images: product.images.map(img => ({
      url: img.url,
      alt: img.altText || undefined,
    })),
    price: product.basePrice,
    salePrice: product.compareAtPrice || undefined,
    variants: product.variants.map(v => ({
      id: v.id,
      name: v.name,
      price: v.price,
      stock: v.inStock ? 1 : 0,
    })),
    isNew: product.isFeatured,
    isOnSale: product.isOnSale,
    isOutOfStock: !product.variants.some(v => v.inStock),
  };
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug, 1, 'newest');

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} | Kids Petite`,
    description: category.description || `Shop our ${category.name} collection for kids`,
    openGraph: {
      title: `${category.name} | Kids Petite`,
      description: category.description || `Shop our ${category.name} collection for kids`,
      images: category.imageUrl ? [{ url: category.imageUrl }] : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://babypetite.com'}/category/${category.slug}`,
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
// CATEGORY PAGE COMPONENT
// ============================================================================

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    subcategory?: string;
    price?: string;
    color?: string;
    size?: string;
  }>;
}) {
  const { slug: categorySlug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const sortBy = resolvedSearchParams.sort || 'newest';

  // Fetch category data from API
  const category = await getCategory(categorySlug, currentPage, sortBy);

  // Handle not found
  if (!category) {
    notFound();
  }

  // Transform products for the ProductCard component
  const products: Product[] = category.products.items.map(transformProduct);
  const totalPages = category.products.pagination.totalPages;

  // Build subcategories from children
  const subcategories = category.children.map((child) => ({
    id: child.id,
    name: child.name,
    description: `${child.productCount} products`,
    image: child.imageUrl || '/images/placeholder-category.jpg',
    href: `/category/${child.slug}`,
    productCount: child.productCount,
    layout: 'overlay' as const,
    theme: 'light' as const,
  }));

  // Filter groups - these would ideally come from the API
  // For now, we'll derive them from the products
  const uniqueColors = [...new Set(products.flatMap(p => 
    p.variants?.flatMap(v => v.name.match(/#[0-9A-Fa-f]{6}/) ? [] : []) || []
  ))];
  
  const filterGroups = [
    {
      id: 'subcategory',
      label: 'Subcategory',
      type: 'checkbox' as const,
      options: subcategories.map(sub => ({
        value: sub.id,
        label: sub.name,
        count: sub.productCount,
      })),
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
    {
      id: 'size',
      label: 'Size',
      type: 'checkbox' as const,
      options: [
        { value: 'newborn', label: 'Newborn', count: 0 },
        { value: '0-3m', label: '0-3 months', count: 0 },
        { value: '3-6m', label: '3-6 months', count: 0 },
        { value: '6-12m', label: '6-12 months', count: 0 },
        { value: '12-18m', label: '12-18 months', count: 0 },
        { value: '18-24m', label: '18-24 months', count: 0 },
      ],
    },
  ];

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High', direction: 'asc' },
    { value: 'price_desc', label: 'Price: High to Low', direction: 'desc' },
    { value: 'popular', label: 'Best Selling' },
  ];

  // Build active filters from search params
  const activeFilters: ActiveFilter[] = [];
  if (resolvedSearchParams.subcategory) {
    const subcategory = subcategories.find(s => s.id === resolvedSearchParams.subcategory);
    if (subcategory) {
      activeFilters.push({
        groupId: 'subcategory',
        groupLabel: 'Subcategory',
        value: resolvedSearchParams.subcategory,
        label: subcategory.name,
      });
    }
  }

  return (
    <div className="min-h-screen">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category.name,
            description: category.description,
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://babypetite.com'}/category/${category.slug}`,
            image: category.imageUrl,
            numberOfItems: category.productCount,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: products.map((product, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://babypetite.com'}/products/${product.slug}`,
              })),
            },
          }),
        }}
      />

      {/* Category header */}
      <div className="relative h-48 md:h-64 bg-gray-100">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-100 to-purple-100" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg opacity-90">
                {category.description}
              </p>
            )}
            <p className="text-sm mt-2 opacity-75">
              {category.productCount} products
            </p>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Shop by Subcategory
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subcategories.map((subcategory) => (
              <CollectionCard key={subcategory.id} {...subcategory} size="medium" />
            ))}
          </div>
        </div>
      )}

      {/* Products section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                {activeFilters.length > 0 && (
                  <Link
                    href={`/category/${categorySlug}`}
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
                  if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                  if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                  if (checked) {
                    params.set(groupId, value);
                  }
                  window.location.href = `/category/${categorySlug}?${params.toString()}`;
                }}
                onRangeChange={(groupId, value) => {
                  const params = new URLSearchParams();
                  if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                  if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                  params.set(groupId, `${value[0]}-${value[1]}`);
                  window.location.href = `/category/${categorySlug}?${params.toString()}`;
                }}
                onRemoveFilter={(groupId, value) => {
                  const params = new URLSearchParams();
                  if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                  if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                  params.delete(groupId);
                  window.location.href = `/category/${categorySlug}?${params.toString()}`;
                }}
                onClearAll={() => {
                  window.location.href = `/category/${categorySlug}`;
                }}
                defaultOpen={['subcategory', 'price']}
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
                  const params = new URLSearchParams();
                  if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
                  params.set('sort', value);
                  window.location.href = `/category/${categorySlug}?${params.toString()}`;
                }}
              />

              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 24) + 1}-{Math.min(currentPage * 24, category.productCount)} of {category.productCount}
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
                      href={`/category/${categorySlug}`}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Products grid */}
            {products.length > 0 ? (
              <Suspense fallback={<ProductsGridSkeleton />}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Suspense>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found in this category.</p>
                <Link href="/products" className="text-primary hover:underline mt-2 inline-block">
                  Browse all products
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    const params = new URLSearchParams();
                    if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
                    params.set('page', String(page));
                    window.location.href = `/category/${categorySlug}?${params.toString()}`;
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
