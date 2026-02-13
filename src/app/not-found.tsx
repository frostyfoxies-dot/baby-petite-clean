import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Home, ShoppingBag } from 'lucide-react';

/**
 * 404 Not Found page component
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/">
            <Button fullWidth size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>

          <div className="flex gap-4">
            <Link href="/products" className="flex-1">
              <Button variant="outline" fullWidth>
                <ShoppingBag className="w-5 h-5 mr-2" />
                Shop Products
              </Button>
            </Link>
            <Link href="/search" className="flex-1">
              <Button variant="outline" fullWidth>
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/category/clothing" className="text-sm text-yellow-dark hover:underline">
              Clothing
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/category/shoes" className="text-sm text-yellow-dark hover:underline">
              Shoes
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/category/accessories" className="text-sm text-yellow-dark hover:underline">
              Accessories
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/collection/new-arrivals" className="text-sm text-yellow-dark hover:underline">
              New Arrivals
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/collection/sale" className="text-sm text-yellow-dark hover:underline">
              Sale
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
