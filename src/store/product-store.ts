import { create } from 'zustand';

/**
 * Maximum number of recently viewed products to store
 */
const MAX_RECENTLY_VIEWED = 10;

/**
 * Maximum number of products in compare list
 */
const MAX_COMPARE_ITEMS = 4;

/**
 * Product store interface with state, actions, and computed values
 */
interface ProductStore {
  // State
  recentlyViewed: string[];
  compareList: string[];

  // Actions
  addToRecentlyViewed: (productId: string) => void;
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;

  // Computed
  isInCompare: (productId: string) => boolean;
}

/**
 * Product store using Zustand
 * Manages recently viewed products and product comparison list
 */
export const useProductStore = create<ProductStore>((set, get) => ({
  // Initial state
  recentlyViewed: [],
  compareList: [],

  /**
   * Add a product to recently viewed list
   * Moves to front if already exists, maintains max limit
   */
  addToRecentlyViewed: (productId) => {
    const { recentlyViewed } = get();
    
    // Remove if already exists
    const filtered = recentlyViewed.filter((id) => id !== productId);
    
    // Add to front and limit size
    const updated = [productId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    
    set({ recentlyViewed: updated });
  },

  /**
   * Add a product to compare list
   * Does nothing if list is full or product already in list
   */
  addToCompare: (productId) => {
    const { compareList } = get();
    
    // Check if already in compare list
    if (compareList.includes(productId)) {
      return;
    }
    
    // Check if compare list is full
    if (compareList.length >= MAX_COMPARE_ITEMS) {
      console.warn('Compare list is full. Remove an item before adding another.');
      return;
    }
    
    set({ compareList: [...compareList, productId] });
  },

  /**
   * Remove a product from compare list
   */
  removeFromCompare: (productId) => {
    set({
      compareList: get().compareList.filter((id) => id !== productId),
    });
  },

  /**
   * Clear all products from compare list
   */
  clearCompare: () => {
    set({ compareList: [] });
  },

  /**
   * Check if a product is in the compare list
   * @param productId - The product ID to check
   * @returns True if the product is in the compare list
   */
  isInCompare: (productId) => {
    return get().compareList.includes(productId);
  },
}));
