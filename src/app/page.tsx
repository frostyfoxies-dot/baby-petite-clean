import { BannerCarousel } from '@/components/content/banner-carousel';
import { CollectionCard } from '@/components/content/collection-card';
import { FeatureCard } from '@/components/content/feature-card';
import { ProductCard, Product } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Shield, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PaginatedProductsResponse } from '@/app/api/products/route';
import { CategoriesListResponse } from '@/app/api/categories/route';

/**
 * Fetch featured products from API
 */
async function getFeaturedProducts(): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/products?isFeatured=true&limit=4`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch featured products');
    }

    const data: PaginatedProductsResponse = await response.json();
    
    return data.products.map(p => {
      const primaryImage = p.images.find(img => img.isPrimary) || p.images[0];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        images: [{ url: primaryImage?.url || '/images/placeholder.jpg' }],
        price: p.basePrice,
        salePrice: p.compareAtPrice || undefined,
        rating: p.popularityScore / 20,
        reviewCount: 0,
        isNew: p.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isOnSale: p.isOnSale,
        category: p.category.name,
      };
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

/**
 * Fetch categories from API
 */
async function getCategories(): Promise<CategoriesListResponse['categories']> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data: CategoriesListResponse = await response.json();
    return data.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Home page component
 */
export default async function HomePage() {
  // Fetch data in parallel
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  // Hero banner slides
  const heroSlides = [
    {
      id: '1',
      title: 'Curated Style for Little Ones',
      subtitle: 'New Collection 2026',
      description: 'Discover 500+ carefully selected pieces. No clutter, just style.',
      cta: 'Shop Collection',
      ctaHref: '/products',
      image: '/images/hero-1.jpg',
      align: 'left' as const,
      theme: 'dark' as const,
    },
    {
      id: '2',
      title: 'Spring Essentials',
      subtitle: 'Seasonal Favorites',
      description: 'Lightweight fabrics and fresh colors for the season ahead.',
      cta: 'Explore',
      ctaHref: '/products?category=spring',
      image: '/images/hero-2.jpg',
      align: 'center' as const,
      theme: 'light' as const,
    },
    {
      id: '3',
      title: 'Create Your Baby Registry',
      subtitle: 'Gift Registry',
      description: 'Let friends and family celebrate your little one with the perfect gifts.',
      cta: 'Start Registry',
      ctaHref: '/registry/create',
      image: '/images/hero-3.jpg',
      align: 'right' as const,
      theme: 'light' as const,
    },
  ];

  // Featured collections - static content
  const collections = [
    {
      id: 'new-arrivals',
      name: 'New Arrivals',
      description: 'Fresh styles just added',
      image: '/images/collection-new.jpg',
      href: '/products?sort=newest',
      productCount: 48,
      layout: 'overlay' as const,
      theme: 'light' as const,
    },
    {
      id: 'best-sellers',
      name: 'Best Sellers',
      description: 'Most loved by parents',
      image: '/images/collection-bestsellers.jpg',
      href: '/products?sort=popular',
      productCount: 36,
      layout: 'overlay' as const,
      theme: 'light' as const,
    },
    {
      id: 'sale',
      name: 'Sale',
      description: 'Up to 50% off',
      image: '/images/collection-sale.jpg',
      href: '/products?isOnSale=true',
      productCount: 24,
      layout: 'overlay' as const,
      theme: 'light' as const,
    },
  ];

  // Map categories for display - only show top-level categories
  const displayCategories = categories
    .filter(cat => !cat.parentId)
    .slice(0, 4)
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      image: cat.imageUrl || '/images/placeholder.jpg',
      href: `/category/${cat.slug}`,
      productCount: cat.productCount,
      layout: 'overlay' as const,
      theme: 'light' as const,
    }));

  return (
    <>
      {/* H1 tag for SEO - visually hidden but accessible to screen readers */}
      <h1 className="sr-only">Baby Petite - Curated Style for Little Ones</h1>

      {/* Hero Carousel */}
      <BannerCarousel
        slides={heroSlides}
        autoPlayInterval={6000}
        height="large"
      />

      {/* Features Bar */}
      <section className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Free Shipping"
              description="On orders over $50"
              icon={<Truck className="w-5 h-5" />}
              variant="default"
              size="small"
              align="center"
            />
            <FeatureCard
              title="Easy Returns"
              description="30-day return policy"
              icon={<ArrowRight className="w-5 h-5" />}
              variant="default"
              size="small"
              align="center"
            />
            <FeatureCard
              title="Quality Guaranteed"
              description="Premium materials only"
              icon={<Shield className="w-5 h-5" />}
              variant="default"
              size="small"
              align="center"
            />
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Shop by Collection
            </h2>
            <Link href="/collection">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} {...collection} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <Link href="/products">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No featured products available at the moment.</p>
              <Link href="/products">
                <Button variant="outline" className="mt-4">
                  Browse All Products
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <Link href="/category">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>
          {displayCategories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayCategories.map((category) => (
                <CollectionCard key={category.id} {...category} size="medium" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Baby Registry CTA */}
      <section className="py-12 md:py-16 bg-yellow/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="w-12 h-12 text-yellow-dark mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Create Your Baby Registry
            </h2>
            <p className="text-gray-600 mb-6">
              Make gift-giving easy for friends and family. Curate your wishlist and share it with loved ones.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/registry/create">
                <Button size="lg">
                  Create Registry
                </Button>
              </Link>
              <Link href="/registry">
                <Button variant="outline" size="lg">
                  Find a Registry
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Join Our Newsletter
            </h2>
            <p className="text-gray-600 mb-6">
              Subscribe for exclusive offers, new arrivals, and parenting tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                required
              />
              <Button type="submit" size="lg">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              By subscribing, you agree to our{' '}
              <Link href="/privacy" className="underline hover:text-gray-700">
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="/terms" className="underline hover:text-gray-700">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
