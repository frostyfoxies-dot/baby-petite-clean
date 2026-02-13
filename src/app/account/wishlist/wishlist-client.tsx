'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { removeFromWishlist, moveWishlistToCart } from '@/actions/wishlist';

interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  notes: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    compareAtPrice: number | null;
    images: Array<{ url: string; altText: string | null }>;
  };
  variant: {
    id: string;
    name: string;
    size: string;
    color: string | null;
    price: number;
    compareAtPrice: number | null;
    sku: string;
    inventory: {
      available: number;
    } | null;
  } | null;
}

interface WishlistClientProps {
  initialItems: WishlistItem[];
}

/**
 * Account wishlist page client component
 * Allows users to view and manage their wishlist
 */
export default function WishlistClient({ initialItems }: WishlistClientProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<WishlistItem[]>(initialItems);
  const [loadingIds, setLoadingIds] = React.useState<Set<string>>(new Set());
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRemove = async (itemId: string) => {
    setLoadingIds(prev => new Set(prev).add(itemId));
    setMessage(null);

    try {
      const result = await removeFromWishlist(itemId);

      if (result.success) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        setMessage({ type: 'success', text: 'Item removed from wishlist' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove item' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleMoveToCart = async (itemId: string) => {
    setLoadingIds(prev => new Set(prev).add(itemId));
    setMessage(null);

    try {
      const result = await moveWishlistToCart(itemId, 1);

      if (result.success) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        setMessage({ type: 'success', text: 'Item moved to cart!' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to move item to cart' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleMoveAllToCart = async () => {
    setMessage(null);
    
    // Move items one by one
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      const result = await moveWishlistToCart(item.id, 1);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    if (successCount > 0) {
      setMessage({ type: 'success', text: `${successCount} item${successCount !== 1 ? 's' : ''} moved to cart!` });
      setItems([]);
      router.refresh();
    }
    
    if (errorCount > 0) {
      setMessage({ type: 'error', text: `${errorCount} item${errorCount !== 1 ? 's' : ''} could not be moved to cart` });
    }
  };

  const getImageUrl = (item: WishlistItem) => {
    return item.product.images?.[0]?.url || '/images/placeholder-product.jpg';
  };

  const getPrice = (item: WishlistItem) => {
    return item.variant?.price || item.product.basePrice;
  };

  const getCompareAtPrice = (item: WishlistItem) => {
    return item.variant?.compareAtPrice || item.product.compareAtPrice;
  };

  const isOutOfStock = (item: WishlistItem) => {
    if (!item.variant?.inventory) return false;
    return item.variant.inventory.available <= 0;
  };

  return (
    <div className="space-y-6">
      {/* Message alert */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            My Wishlist
          </h2>
          <p className="text-gray-600">
            {items.length} item{items.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {items.length > 0 && (
          <Button onClick={handleMoveAllToCart} leftIcon={<ShoppingBag className="w-4 h-4" />}>
            Add All to Cart
          </Button>
        )}
      </div>

      {/* Wishlist items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Save items you love to your wishlist and they'll appear here.
          </p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const price = getPrice(item);
            const compareAtPrice = getCompareAtPrice(item);
            const outOfStock = isOutOfStock(item);
            const isLoading = loadingIds.has(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Product image */}
                <Link href={`/products/${item.product.slug}`} className="block relative aspect-square bg-gray-100">
                  <Image
                    src={getImageUrl(item)}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                  {outOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">Out of Stock</span>
                    </div>
                  )}
                </Link>

                {/* Product info */}
                <div className="p-4">
                  <Link href={`/products/${item.product.slug}`}>
                    <h3 className="font-medium text-gray-900 hover:text-gray-600 line-clamp-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  
                  {item.variant && (
                    <p className="text-sm text-gray-500 mt-1">
                      {item.variant.name} - {item.variant.size}
                      {item.variant.color && ` / ${item.variant.color}`}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      ${price.toFixed(2)}
                    </span>
                    {compareAtPrice && compareAtPrice > price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      "{item.notes}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      leftIcon={<ShoppingBag className="w-4 h-4" />}
                      onClick={() => handleMoveToCart(item.id)}
                      loading={isLoading}
                      disabled={outOfStock}
                    >
                      {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemove(item.id)}
                      disabled={isLoading}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
