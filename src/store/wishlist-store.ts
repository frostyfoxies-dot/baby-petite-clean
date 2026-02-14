import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Wishlist item interface representing a product variant in the wishlist
 */
export interface WishlistItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  image: string;
  addedAt: Date;
}

/**
 * Wishlist store interface with state, actions, and computed values
 */
interface WishlistStore {
  // State
  items: WishlistItem[];

  // Actions
  addItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
  removeItem: (variantId: string) => void;
  clearWishlist: () => void;

  // Computed
  hasItem: (variantId: string) => boolean;
  getItemCount: () => number;
}

/**
 * Wishlist store using Zustand with persistence
 * Manages user's wishlist of product variants
 */
export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],

      /**
       * Add an item to the wishlist
       * If item already exists, it won't be duplicated
       */
      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.variantId === item.variantId);

        if (!existingItem) {
          set({
            items: [
              ...items,
              {
                ...item,
                id: `${item.variantId}-${Date.now()}`,
                addedAt: new Date(),
              },
            ],
          });
        }
      },

      /**
       * Remove an item from the wishlist by variant ID
       */
      removeItem: (variantId) => {
        set({
          items: get().items.filter((item) => item.variantId !== variantId),
        });
      },

      /**
       * Clear all items from the wishlist
       */
      clearWishlist: () => {
        set({ items: [] });
      },

      /**
       * Check if a variant is in the wishlist
       * @param variantId - The variant ID to check
       * @returns True if the variant is in the wishlist
       */
      hasItem: (variantId) => {
        const { items } = get();
        return items.some((item) => item.variantId === variantId);
      },

      /**
       * Get the total number of items in the wishlist
       * @returns The total item count
       */
      getItemCount: () => {
        const { items } = get();
        return items.length;
      },
    }),
    {
      name: 'baby-petite-wishlist-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
