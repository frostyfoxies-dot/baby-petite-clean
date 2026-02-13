import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { VariantSelector } from '@/components/product/variant-selector';
import { ProductReviews, Review } from '@/components/product/product-reviews';
import { RelatedProductsGrid } from '@/components/product/related-products';
import { StockIndicator, StockUrgencyIndicator } from '@/components/product/stock-indicator';
import { FrequentlyBoughtTogether } from '@/components/upsell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Star, Truck, Shield, Heart, Share2, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { ProductDetailResponse } from '@/app/api/products/[slug]/route';

/**
 * Fetch product from API
 */
async function getProduct(slug: string): Promise<ProductDetailResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/products/${slug}`, {
      next: { revalidate: 300, tags: [`product-${slug}`] },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch product');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Generate metadata for product page
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found | Kids Petite',
      description: 'The requested product could not be found.',
    };
  }

  return {
    title: `${product.name} | Kids Petite`,
    description: product.metaDescription || product.shortDescription || product.description?.slice(0, 160) || 'Product details',
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kidspetite.com'}/products/${product.slug}`,
    },
  };
}

/**
 * Product detail page component
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  // Build variant groups from product variants
  const sizes = [...new Set(product.variants.map(v => v.size))];
  const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];

  const variantGroups = [];

  if (sizes.length > 0) {
    variantGroups.push({
      name: 'Size',
      type: 'size' as const,
      options: sizes.map(size => {
        const sizeVariants = product.variants.filter(v => v.size === size);
        const hasStock = sizeVariants.some(v => v.inventory?.inStock);
        return {
          value: size.toLowerCase(),
          label: size,
          available: hasStock,
        };
      }),
      selectedValue: sizes[0]?.toLowerCase() || '',
    });
  }

  if (colors.length > 0) {
    variantGroups.push({
      name: 'Color',
      type: 'color' as const,
      options: colors.map(color => {
        const colorVariants = product.variants.filter(v => v.color === color);
        const hasStock = colorVariants.some(v => v.inventory?.inStock);
        const colorCode = colorVariants.find(v => v.colorCode)?.colorCode;
        return {
          value: color!.toLowerCase(),
          label: color!,
          color: colorCode || color!.toLowerCase(),
          available: hasStock,
        };
      }),
      selectedValue: colors[0]?.toLowerCase() || '',
    });
  }

  // Transform reviews - the API only provides review statistics, not individual reviews
  // In a real app, you'd fetch reviews from a separate endpoint
  const reviews: Review[] = []; // Reviews would need to be fetched separately

  // Map related products for the grid
  const relatedProducts = product.relatedProducts.map(p => {
    const primaryImage = p.images.find(img => img.isPrimary) || p.images[0];
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      images: [{ url: primaryImage?.url || '/images/placeholder.jpg' }],
      price: p.basePrice,
      salePrice: p.compareAtPrice || undefined,
      rating: 4.5, // Default rating
      reviewCount: 0,
      isNew: false,
      isOnSale: !!p.compareAtPrice,
      category: product.category.name,
    };
  });

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.basePrice - product.compareAtPrice) / product.basePrice) * 100)
    : 0;

  const inStock = product.variants.some(v => v.inventory?.inStock);

  // JSON-LD structured data for SEO
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.url),
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: 'Kids Petite',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kidspetite.com'}/products/${product.slug}`,
      priceCurrency: 'USD',
      price: product.basePrice,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Kids Petite',
      },
    },
    aggregateRating: product.reviews.totalReviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.reviews.averageRating,
      reviewCount: product.reviews.totalReviews,
    } : undefined,
  };

  return (
    <div className="min-h-screen">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Products', href: '/products' },
          { label: product.category.name, href: `/category/${product.category.slug}` },
          { label: product.name },
        ]}
        showHome={true}
        className="container mx-auto px-4 py-4 text-sm"
      />

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product images */}
          <div className="space-y-4">
            <Suspense fallback={<Skeleton className="aspect-square w-full rounded-md" />}>
              <div className="aspect-square bg-gray-50 rounded-md overflow-hidden relative">
                <Image
                  src={product.images[0]?.url || '/images/placeholder.jpg'}
                  alt={product.images[0]?.altText || product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </Suspense>

            {/* Thumbnail gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id || index}
                    className={`aspect-square bg-gray-50 rounded-md overflow-hidden border-2 transition-colors relative ${
                      index === 0 ? 'border-yellow' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.altText || `${product.name} - Image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 25vw, 12.5vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-6">
            {/* Title and rating */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.reviews.averageRating)
                          ? 'fill-yellow text-yellow'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <Link href="#reviews" className="text-sm text-gray-600 hover:text-gray-900">
                  {product.reviews.totalReviews} reviews
                </Link>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {product.compareAtPrice ? (
                <>
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.basePrice)}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                    -{discountPercent}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.shortDescription || product.description || 'No description available.'}
            </p>

            {/* Variant selector */}
            {variantGroups.length > 0 && (
              <VariantSelector
                groups={variantGroups}
                onVariantChange={(group, value) => {
                  console.log('Variant changed:', group, value);
                }}
              />
            )}

            {/* Quantity and add to cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    defaultValue="1"
                    className="w-12 text-center border-0 focus:ring-0 text-sm"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button size="lg" className="flex-1" disabled={!inStock}>
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>

                <Button variant="outline" size="lg" aria-label="Add to wishlist">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {/* Buy now */}
              <Button variant="secondary" size="lg" className="w-full" disabled={!inStock}>
                Buy Now
              </Button>
            </div>

            {/* Stock status */}
            <div className="space-y-2">
              <StockIndicator
                available={product.variants.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0)}
                variant="badge"
                size="md"
              />
              <StockUrgencyIndicator
                available={product.variants.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0)}
              />
            </div>

            <Separator />

            {/* Product details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">SKU</span>
                <span className="text-gray-900">{product.sku}</span>
              </div>
              {product.tags.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tags</span>
                  <span className="text-gray-900">{product.tags.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Free shipping over $50</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">30-day returns</span>
              </div>
            </div>

            {/* Share */}
            <div className="flex items-center gap-2 pt-4">
              <Button variant="ghost" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Product details tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button className="pb-4 border-b-2 border-yellow text-gray-900 font-medium">
                Description
              </button>
              <button className="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-900 font-medium">
                Size Guide
              </button>
              <button className="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-900 font-medium">
                Shipping & Returns
              </button>
            </nav>
          </div>
          <div className="py-6">
            <p className="text-gray-600 leading-relaxed">
              {product.description || product.shortDescription || 'No detailed description available.'}
            </p>
          </div>
        </div>

        {/* Frequently Bought Together */}
        <FrequentlyBoughtTogether
          mainProduct={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            basePrice: product.basePrice,
            compareAtPrice: product.compareAtPrice,
            images: product.images,
            category: product.category,
            variants: product.variants,
          }}
          bundleDiscount={0}
        />

        {/* Reviews */}
        <div className="mt-12" id="reviews">
          <ProductReviews
            productId={product.id}
            reviews={reviews}
            averageRating={product.reviews.averageRating}
            totalReviews={product.reviews.totalReviews}
            ratingDistribution={product.reviews.distribution}
            onHelpfulClick={(reviewId) => {
              console.log('Marked helpful:', reviewId);
            }}
            onFilterChange={(filter) => {
              console.log('Filter changed:', filter);
            }}
            onWriteReview={() => {
              console.log('Write review clicked');
            }}
          />
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <RelatedProductsGrid
              products={relatedProducts}
              title="You May Also Like"
              onQuickAdd={(variantId) => {
                console.log('Quick add:', variantId);
              }}
              onWishlist={(productId) => {
                console.log('Toggle wishlist:', productId);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
