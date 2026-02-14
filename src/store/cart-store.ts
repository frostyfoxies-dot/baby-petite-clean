import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Cart item interface representing a product variant in the cart
 */
export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

/**
 * Cart store interface with state, actions, and computed values
 */
interface CartStore {
  // State
  items: CartItem[];
  isOpen: boolean;
  discountCode: string | null;
  discountAmount: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  applyDiscount: (code: string, amount: number) => void;
  removeDiscount: () => void;

  // Computed
  getSubtotal: () => number;
  getTotalItems: () => number;
  getDiscountedTotal: () => number;
}

/**
 * Cart store using Zustand with persistence
 * Manages shopping cart state, items, and discount codes
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      discountCode: null,
      discountAmount: 0,

      /**
       * Add an item to the cart
       * If item already exists, update quantity instead
       */
      addItem: (item) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (i) => i.variantId === item.variantId
        );

        if (existingItemIndex > -1) {
          // Update quantity of existing item
          set({
            items: items.map((i, index) =>
              index === existingItemIndex
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          // Add new item with unique ID
          set({
            items: [
              ...items,
              {
                ...item,
                id: `${item.variantId}-${Date.now()}`,
              },
            ],
          });
        }
      },

      /**
       * Remove an item from the cart by ID
       */
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      /**
       * Update the quantity of a cart item
       * Removes item if quantity is 0 or less
       */
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      /**
       * Clear all items from the cart
       */
      clearCart: () => {
        set({
          items: [],
          discountCode: null,
          discountAmount: 0,
        });
      },

      /**
       * Open the cart drawer
       */
      openCart: () => {
        set({ isOpen: true });
      },

      /**
       * Close the cart drawer
       */
      closeCart: () => {
        set({ isOpen: false });
      },

      /**
       * Toggle the cart drawer open/closed state
       */
      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      /**
       * Apply a discount code with amount
       */
      applyDiscount: (code, amount) => {
        set({
          discountCode: code,
          discountAmount: amount,
        });
      },

      /**
       * Remove the applied discount
       */
      removeDiscount: () => {
        set({
          discountCode: null,
          discountAmount: 0,
        });
      },

      /**
       * Calculate the subtotal of all items in the cart
       * @returns The subtotal amount
       */
      getSubtotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      /**
       * Get the total number of items in the cart
       * @returns The total item count
       */
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      /**
       * Calculate the total after discount is applied
       * @returns The discounted total amount
       */
      getDiscountedTotal: () => {
        const subtotal = get().getSubtotal();
        const { discountAmount } = get();
        return Math.max(0, subtotal - discountAmount);
      },
    }),
    {
      name: 'baby-petite-cart-storage',
      partialize: (state) => ({
        items: state.items,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
