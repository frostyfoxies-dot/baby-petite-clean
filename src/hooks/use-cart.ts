'use client';

import { useCallback, useState } from 'react';
import { useCartStore, type CartItem } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import {
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
} from '@/actions/cart';

/**
 * Cart hook return type
 */
interface UseCartReturn {
  /** Array of cart items */
  items: CartItem[];
  /** Total number of items in cart */
  totalItems: number;
  /** Subtotal price of all items */
  subtotal: number;
  /** Add item to cart */
  addToCart: (variantId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  /** Update quantity of cart item */
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  /** Remove item from cart */
  removeFromCart: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  /** Clear all items from cart */
  clearCart: () => Promise<{ success: boolean; error?: string }>;
  /** Whether cart is performing an async operation */
  isLoading: boolean;
  /** Open cart drawer */
  openCart: () => void;
  /** Close cart drawer */
  closeCart: () => void;
  /** Toggle cart drawer */
  toggleCart: () => void;
  /** Whether cart drawer is open */
  isCartOpen: boolean;
}

/**
 * Hook for cart operations
 *
 * Provides a unified interface for shopping cart management including
 * adding, updating, and removing items. Integrates with the cart store
 * for local state and server actions for persistence.
 *
 * @returns Cart state and actions
 *
 * @example
 * ```tsx
 * function AddToCartButton({ variantId }) {
 *   const { addToCart, isLoading } = useCart();
 *
 *   const handleAdd = async () => {
 *     const result = await addToCart(variantId, 1);
 *     if (result.success) {
 *       // Item added successfully
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleAdd} disabled={isLoading}>
 *       Add to Cart
 *     </button>
 *   );
 * }
 * ```
 */
export function useCart(): UseCartReturn {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity: updateStoreQuantity,
    clearCart: clearStoreCart,
    getSubtotal,
    getTotalItems,
    openCart: openCartDrawer,
    closeCart: closeCartDrawer,
    toggleCart: toggleCartDrawer,
    isOpen,
  } = useCartStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Add item to cart
   */
  const addToCart = useCallback(async (variantId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const result = await addToCartAction({ variantId, quantity });

      if (result.success && result.data) {
        // Fetch the variant details to update local store
        const response = await fetch(`/api/products/variant/${variantId}`);
        if (response.ok) {
          const variant = await response.json();
          addItem({
            variantId,
            productId: variant.productId,
            productName: variant.productName,
            variantName: variant.name,
            sku: variant.sku,
            price: Number(variant.price),
            quantity,
            image: variant.images?.[0] || '',
          });
        }
        addToast({
          type: 'success',
          title: 'Added to cart',
          message: 'Item has been added to your cart.',
        });
        openCartDrawer();
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Add to cart error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [addItem, addToast, openCartDrawer]);

  /**
   * Update quantity of cart item
   */
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const result = await updateCartItemAction({ itemId, quantity });

      if (result.success) {
        if (quantity === 0) {
          removeItem(itemId);
        } else {
          updateStoreQuantity(itemId, quantity);
        }
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Update cart error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [removeItem, updateStoreQuantity]);

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      const result = await removeFromCartAction(itemId);

      if (result.success) {
        removeItem(itemId);
        addToast({
          type: 'info',
          title: 'Removed from cart',
          message: 'Item has been removed from your cart.',
        });
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Remove from cart error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [removeItem, addToast]);

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await clearCartAction();

      if (result.success) {
        clearStoreCart();
        addToast({
          type: 'info',
          title: 'Cart cleared',
          message: 'All items have been removed from your cart.',
        });
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Clear cart error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [clearStoreCart, addToast]);

  return {
    items,
    totalItems: getTotalItems(),
    subtotal: getSubtotal(),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoading,
    openCart: openCartDrawer,
    closeCart: closeCartDrawer,
    toggleCart: toggleCartDrawer,
    isCartOpen: isOpen,
  };
}

export default useCart;
