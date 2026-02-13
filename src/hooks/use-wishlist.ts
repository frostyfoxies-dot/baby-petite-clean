'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWishlistStore, type WishlistItem } from '@/store/wishlist-store';
import { useUIStore } from '@/store/ui-store';
import {
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
} from '@/actions/wishlist';

/**
 * Wishlist hook return type
 */
interface UseWishlistReturn {
  /** Array of wishlist items */
  items: WishlistItem[];
  /** Whether wishlist is being loaded */
  isLoading: boolean;
  /** Add item to wishlist */
  addToWishlist: (variantId: string) => Promise<{ success: boolean; error?: string }>;
  /** Remove item from wishlist */
  removeFromWishlist: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  /** Move item from wishlist to cart */
  moveToCart: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  /** Check if variant is in wishlist */
  isInWishlist: (variantId: string) => boolean;
  /** Total number of items in wishlist */
  itemCount: number;
  /** Clear all items from wishlist */
  clearWishlist: () => void;
}

/**
 * Hook for wishlist
 *
 * Provides a unified interface for wishlist management including
 * adding, removing, and moving items to cart.
 *
 * @returns Wishlist state and actions
 *
 * @example
 * ```tsx
 * function WishlistButton({ variantId }) {
 *   const { addToWishlist, removeFromWishlist, isInWishlist, isLoading } = useWishlist();
 *   const inWishlist = isInWishlist(variantId);
 *
 *   const handleClick = async () => {
 *     if (inWishlist) {
 *       await removeFromWishlist(variantId);
 *     } else {
 *       await addToWishlist(variantId);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleClick} disabled={isLoading}>
 *       {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useWishlist(): UseWishlistReturn {
  const {
    items,
    addItem,
    removeItem,
    clearWishlist: clearStoreWishlist,
    hasItem,
    getItemCount,
  } = useWishlistStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch wishlist from API on mount
   */
  useEffect(() => {
    const fetchWishlist = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/wishlist');
        if (response.ok) {
          const data = await response.json();
          // Sync store with server data
          for (const item of data.items || []) {
            if (!hasItem(item.variantId)) {
              addItem({
                variantId: item.variantId,
                productId: item.productId,
                productName: item.productName,
                variantName: item.variantName,
                price: item.price,
                image: item.image,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [addItem, hasItem]);

  /**
   * Add item to wishlist
   */
  const addToWishlist = useCallback(
    async (variantId: string) => {
      setIsLoading(true);
      try {
        const result = await addToWishlistAction(variantId);

        if (result.success && result.data) {
          // Fetch variant details and add to store
          const response = await fetch(`/api/products/variant/${variantId}`);
          if (response.ok) {
            const variant = await response.json();
            addItem({
              variantId,
              productId: variant.productId,
              productName: variant.productName,
              variantName: variant.name,
              price: Number(variant.price),
              image: variant.images?.[0] || '',
            });
          }
          addToast({
            type: 'success',
            title: 'Added to wishlist',
            message: 'Item has been added to your wishlist.',
          });
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (error) {
        console.error('Add to wishlist error:', error);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [addItem, addToast]
  );

  /**
   * Remove item from wishlist
   */
  const removeFromWishlist = useCallback(
    async (itemId: string) => {
      setIsLoading(true);
      try {
        const result = await removeFromWishlistAction(itemId);

        if (result.success) {
          removeItem(itemId);
          addToast({
            type: 'info',
            title: 'Removed from wishlist',
            message: 'Item has been removed from your wishlist.',
          });
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (error) {
        console.error('Remove from wishlist error:', error);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [removeItem, addToast]
  );

  /**
   * Move item from wishlist to cart
   */
  const moveToCart = useCallback(
    async (itemId: string) => {
      setIsLoading(true);
      try {
        // Find the item in wishlist
        const item = items.find((i) => i.id === itemId || i.variantId === itemId);
        if (!item) {
          return { success: false, error: 'Item not found in wishlist' };
        }

        // Add to cart via API
        const cartResponse = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId: item.variantId, quantity: 1 }),
        });

        if (!cartResponse.ok) {
          throw new Error('Failed to add to cart');
        }

        // Remove from wishlist
        const removeResult = await removeFromWishlistAction(item.variantId);

        if (removeResult.success) {
          removeItem(item.variantId);
          addToast({
            type: 'success',
            title: 'Moved to cart',
            message: 'Item has been moved from wishlist to cart.',
          });
        }

        return {
          success: removeResult.success,
          error: removeResult.error,
        };
      } catch (error) {
        console.error('Move to cart error:', error);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [items, removeItem, addToast]
  );

  /**
   * Check if variant is in wishlist
   */
  const isInWishlist = useCallback(
    (variantId: string) => hasItem(variantId),
    [hasItem]
  );

  return {
    items,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    isInWishlist,
    itemCount: getItemCount(),
    clearWishlist: clearStoreWishlist,
  };
}

export default useWishlist;
