import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { client, urlFor } from '@/sanity/client';
import { SortDropdown, SortOption } from '@/components/search/sort-dropdown';
import { Pagination } from '@/components/ui/pagination';
import { ProductCard, Product } from '@/components/product/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}

interface SanityProduct {
  _id: string;
  name: string;
  slug: { current: string };
  price: number;
  compareAtPrice?: number;
  images?: Array<{
    image: SanityImage;
    alt: string;
    isPrimary?: boolean;
  }>;
  variants?: Array<{
    name: string;
    sku: string;
    size?: string;
    color?: string;
    price?: number;
    stock?: number;
  }>;
  isActive: boolean;
  isFeatured?: boolean;
}

interface SanityCollection {
  _id: string;
  name: string;
  slug: { current: string };
  description?: any; // Portable Text
  image?: SanityImage;
  products?: SanityProduct[];
  isActive: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
}

// ============================================================================
// GROQ QUERIES
// ============================================================================

const collectionQuery = `
  *[_type == "collection" && slug.current == $slug && isActive == true][0] {
    _id,
    name,
    slug,
    description,
    image,
    isActive,
    isFeatured,
    startDate,
    endDate,
    sortOrder,
    seoTitle,
    seoDescription,
    "products": products[]-> {
      _id,
      name,
      slug,
      price,
      compareAtPrice,
      images,
      variants,
      isActive,
      isFeatured
    }
  }
`;

const allCollectionsQuery = `
  *[_type == "collection" && isActive == true] | order(sortOrder asc) {
    _id,
    name,
    slug,
    image,
    startDate,
    endDate,
    "productCount": count(products)
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getCollection(slug: string): Promise<SanityCollection | null> {
  try {
    const collection = await client.fetch(collectionQuery, { slug });
    return collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

async function getAllCollections(): Promise<Array<{
  _id: string;
  name: string;
  slug: { current: string };
  image?: SanityImage;
  startDate?: string;
  endDate?: string;
  productCount: number;
}>> {
  try {
    const collections = await client.fetch(allCollectionsQuery);
    return collections || [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

function transformProduct(product: SanityProduct): Product {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  
  return {
    id: product._id,
    name: product.name,
    slug: product.slug.current,
    images: product.images?.map(img => ({
      url: img.image ? urlFor(img.image).url() : '/images/placeholder.jpg',
      alt: img.alt || product.name,
    })) || [{ url: '/images/placeholder.jpg', alt: product.name }],
    price: product.price,
    salePrice: product.compareAtPrice || undefined,
    variants: product.variants?.map(v => ({
      id: v.sku,
      name: v.name,
      price: v.price,
      stock: v.stock || 0,
    })),
    isNew: product.isFeatured,
    isOnSale: product.compareAtPrice ? product.compareAtPrice > product.price : false,
    isOutOfStock: product.variants?.every(v => !v.stock || v.stock === 0) ?? true,
  };
}

function getImageUrl(image: SanityImage | undefined): string | null {
  if (!image) return null;
  try {
    return urlFor(image).url();
  } catch {
    return null;
  }
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
  const collection = await getCollection(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found',
    };
  }

  const title = collection.seoTitle || collection.name;
  const description = collection.seoDescription || `Shop our ${collection.name} collection`;

  return {
    title: `${title} | Kids Petite`,
    description,
    openGraph: {
      title: `${title} | Kids Petite`,
      description,
      images: collection.image ? [{ url: urlFor(collection.image).url() }] : [],
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
// COLLECTION PAGE COMPONENT
// ============================================================================

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
  }>;
}) {
  const { slug: collectionSlug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const sortBy = resolvedSearchParams.sort || 'newest';
  const productsPerPage = 24;

  // Fetch collection data from Sanity
  const collection = await getCollection(collectionSlug);

  // Handle not found
  if (!collection) {
    notFound();
  }

  // Get all collections for "Browse Other Collections" section
  const allCollections = await getAllCollections();

  // Transform and sort products
  let products: Product[] = (collection.products || [])
    .filter(p => p.isActive)
    .map(transformProduct);

  // Apply sorting
  switch (sortBy) {
    case 'price_asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      // Featured products first
      products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    case 'newest':
    default:
      // Keep original order (as they appear in the collection)
      break;
  }

  // Pagination
  const totalProducts = products.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + productsPerPage);

  // Check if collection is limited time
  const isLimited = collection.startDate || collection.endDate;
  const now = new Date();
  const hasEnded = collection.endDate ? new Date(collection.endDate) < now : false;
  const hasStarted = collection.startDate ? new Date(collection.startDate) <= now : true;

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High', direction: 'asc' },
    { value: 'price_desc', label: 'Price: High to Low', direction: 'desc' },
    { value: 'popular', label: 'Best Selling' },
  ];

  // Get collection image URL
  const collectionImageUrl = getImageUrl(collection.image);

  // Filter out current collection from "Browse Other Collections"
  const otherCollections = allCollections.filter(c => c.slug.current !== collectionSlug).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Collection header */}
      <div className="relative h-64 md:h-80 bg-gray-100">
        {collectionImageUrl ? (
          <img
            src={collectionImageUrl}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-100 to-pink-100" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-2xl px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {collection.name}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-4">
              Discover our curated selection
            </p>
            <div className="flex items-center justify-center gap-6 text-sm opacity-75">
              <span>{totalProducts} products</span>
              {isLimited && (
                <>
                  {collection.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(collection.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {collection.endDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Ends {new Date(collection.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="container mx-auto px-4 py-8">
        {/* Sort and view options */}
        <div className="flex items-center justify-between mb-6">
          <SortDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(value) => {
              const params = new URLSearchParams();
              if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
              params.set('sort', value);
              window.location.href = `/collection/${collectionSlug}?${params.toString()}`;
            }}
          />

          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, totalProducts)} of {totalProducts}
          </div>
        </div>

        {/* Products grid */}
        {paginatedProducts.length > 0 ? (
          <Suspense fallback={<ProductsGridSkeleton />}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Suspense>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this collection.</p>
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
                window.location.href = `/collection/${collectionSlug}?${params.toString()}`;
              }}
            />
          </div>
        )}

        {/* Collection info */}
        <div className="mt-12 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            About This Collection
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Each piece in this collection has been carefully selected to meet our high standards of quality, comfort, and style. We believe that children deserve clothing that looks great and feels even better.
          </p>
          {isLimited && !hasEnded && (
            <div className="mt-6 p-4 bg-yellow/10 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Limited Time Offer:</strong> This collection is available for a limited time only. Don't miss out on these exclusive styles!
              </p>
            </div>
          )}
          {hasEnded && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Ended:</strong> This limited-time collection has ended. Some items may still be available in our regular categories.
              </p>
            </div>
          )}
        </div>

        {/* Browse other collections */}
        {otherCollections.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Browse Other Collections
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherCollections.map((otherCollection) => {
                const otherImageUrl = getImageUrl(otherCollection.image);
                return (
                  <Link
                    key={otherCollection._id}
                    href={`/collection/${otherCollection.slug.current}`}
                    className="group relative aspect-square rounded-lg overflow-hidden"
                  >
                    {otherImageUrl ? (
                      <img
                        src={otherImageUrl}
                        alt={otherCollection.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {otherCollection.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
