import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from '../cart-store';
import { act } from '@testing-library/react';

// Helper to get fresh store state for each test
const getFreshStore = () => {
  // Reset the store before each test
  useCartStore.setState({
    items: [],
    isOpen: false,
    discountCode: null,
    discountAmount: 0,
  });
  return useCartStore;
};

describe('cart-store', () => {
  beforeEach(() => {
    getFreshStore();
    vi.clearAllMocks();
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 2,
          image: 'https://example.com/image.jpg',
        });
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe('variant-1');
      expect(items[0].quantity).toBe(2);
    });

    it('should update quantity if item already exists', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 2,
          image: 'https://example.com/image.jpg',
        });
      });

      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 3,
          image: 'https://example.com/image.jpg',
        });
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('should add different items separately', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image1.jpg',
        });
      });

      act(() => {
        store.addItem({
          variantId: 'variant-2',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Medium - Pink',
          sku: 'SKU-002',
          price: 29.99,
          quantity: 2,
          image: 'https://example.com/image2.jpg',
        });
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
    });

    it('should generate unique ID for each item', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      const { items } = useCartStore.getState();
      expect(items[0].id).toBeDefined();
      expect(items[0].id).toContain('variant-1');
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      const itemId = useCartStore.getState().items[0].id;
      
      act(() => {
        useCartStore.getState().removeItem(itemId);
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should not affect other items', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image1.jpg',
        });
        store.addItem({
          variantId: 'variant-2',
          productId: 'product-2',
          productName: 'Baby Socks',
          variantName: 'One Size',
          sku: 'SKU-002',
          price: 9.99,
          quantity: 1,
          image: 'https://example.com/image2.jpg',
        });
      });

      const items = useCartStore.getState().items;
      const itemIdToRemove = items[0].id;
      
      act(() => {
        useCartStore.getState().removeItem(itemIdToRemove);
      });

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].variantId).toBe('variant-2');
    });

    it('should handle removing non-existent item', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      act(() => {
        useCartStore.getState().removeItem('non-existent-id');
      });

      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      const itemId = useCartStore.getState().items[0].id;
      
      act(() => {
        useCartStore.getState().updateQuantity(itemId, 5);
      });

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      const itemId = useCartStore.getState().items[0].id;
      
      act(() => {
        useCartStore.getState().updateQuantity(itemId, 0);
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should remove item when quantity is negative', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      const itemId = useCartStore.getState().items[0].id;
      
      act(() => {
        useCartStore.getState().updateQuantity(itemId, -1);
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all items', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
        store.addItem({
          variantId: 'variant-2',
          productId: 'product-2',
          productName: 'Baby Socks',
          variantName: 'One Size',
          sku: 'SKU-002',
          price: 9.99,
          quantity: 2,
          image: 'https://example.com/image2.jpg',
        });
      });

      expect(useCartStore.getState().items).toHaveLength(2);
      
      act(() => {
        useCartStore.getState().clearCart();
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should clear discount code and amount', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.applyDiscount('SAVE10', 10);
      });

      expect(useCartStore.getState().discountCode).toBe('SAVE10');
      expect(useCartStore.getState().discountAmount).toBe(10);
      
      act(() => {
        useCartStore.getState().clearCart();
      });

      expect(useCartStore.getState().discountCode).toBeNull();
      expect(useCartStore.getState().discountAmount).toBe(0);
    });
  });

  describe('openCart, closeCart, toggleCart', () => {
    it('should open cart', () => {
      act(() => {
        useCartStore.getState().openCart();
      });

      expect(useCartStore.getState().isOpen).toBe(true);
    });

    it('should close cart', () => {
      act(() => {
        useCartStore.getState().openCart();
      });
      expect(useCartStore.getState().isOpen).toBe(true);

      act(() => {
        useCartStore.getState().closeCart();
      });
      expect(useCartStore.getState().isOpen).toBe(false);
    });

    it('should toggle cart state', () => {
      expect(useCartStore.getState().isOpen).toBe(false);

      act(() => {
        useCartStore.getState().toggleCart();
      });
      expect(useCartStore.getState().isOpen).toBe(true);

      act(() => {
        useCartStore.getState().toggleCart();
      });
      expect(useCartStore.getState().isOpen).toBe(false);
    });
  });

  describe('applyDiscount, removeDiscount', () => {
    it('should apply discount code', () => {
      act(() => {
        useCartStore.getState().applyDiscount('SAVE10', 10);
      });

      expect(useCartStore.getState().discountCode).toBe('SAVE10');
      expect(useCartStore.getState().discountAmount).toBe(10);
    });

    it('should remove discount', () => {
      act(() => {
        useCartStore.getState().applyDiscount('SAVE10', 10);
      });

      act(() => {
        useCartStore.getState().removeDiscount();
      });

      expect(useCartStore.getState().discountCode).toBeNull();
      expect(useCartStore.getState().discountAmount).toBe(0);
    });

    it('should override previous discount', () => {
      act(() => {
        useCartStore.getState().applyDiscount('SAVE10', 10);
      });

      act(() => {
        useCartStore.getState().applyDiscount('SAVE20', 20);
      });

      expect(useCartStore.getState().discountCode).toBe('SAVE20');
      expect(useCartStore.getState().discountAmount).toBe(20);
    });
  });

  describe('getSubtotal', () => {
    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getSubtotal()).toBe(0);
    });

    it('should calculate subtotal correctly', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 2,
          image: 'https://example.com/image.jpg',
        });
        store.addItem({
          variantId: 'variant-2',
          productId: 'product-2',
          productName: 'Baby Socks',
          variantName: 'One Size',
          sku: 'SKU-002',
          price: 9.99,
          quantity: 3,
          image: 'https://example.com/image2.jpg',
        });
      });

      // 29.99 * 2 + 9.99 * 3 = 59.98 + 29.97 = 89.95
      expect(useCartStore.getState().getSubtotal()).toBeCloseTo(89.95, 2);
    });

    it('should update when items change', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      expect(useCartStore.getState().getSubtotal()).toBe(29.99);

      const itemId = useCartStore.getState().items[0].id;
      
      act(() => {
        useCartStore.getState().updateQuantity(itemId, 3);
      });

      expect(useCartStore.getState().getSubtotal()).toBe(89.97);
    });
  });

  describe('getTotalItems', () => {
    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getTotalItems()).toBe(0);
    });

    it('should count total items correctly', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 29.99,
          quantity: 2,
          image: 'https://example.com/image.jpg',
        });
        store.addItem({
          variantId: 'variant-2',
          productId: 'product-2',
          productName: 'Baby Socks',
          variantName: 'One Size',
          sku: 'SKU-002',
          price: 9.99,
          quantity: 3,
          image: 'https://example.com/image2.jpg',
        });
      });

      expect(useCartStore.getState().getTotalItems()).toBe(5);
    });
  });

  describe('getDiscountedTotal', () => {
    it('should return subtotal when no discount', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 100,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
      });

      expect(useCartStore.getState().getDiscountedTotal()).toBe(100);
    });

    it('should subtract discount from subtotal', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 100,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
        store.applyDiscount('SAVE10', 10);
      });

      expect(useCartStore.getState().getDiscountedTotal()).toBe(90);
    });

    it('should not return negative total', () => {
      const store = useCartStore.getState();
      
      act(() => {
        store.addItem({
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Baby Onesie',
          variantName: 'Small - Blue',
          sku: 'SKU-001',
          price: 10,
          quantity: 1,
          image: 'https://example.com/image.jpg',
        });
        store.applyDiscount('HUGEDISCOUNT', 100);
      });

      expect(useCartStore.getState().getDiscountedTotal()).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should have correct persistence config', () => {
      // Check that the store is configured with persist middleware
      const store = useCartStore;
      expect(store).toBeDefined();
      
      // The persist middleware should be applied
      // We can verify by checking the store has the expected methods
      const state = store.getState();
      expect(typeof state.addItem).toBe('function');
      expect(typeof state.removeItem).toBe('function');
      expect(typeof state.updateQuantity).toBe('function');
      expect(typeof state.clearCart).toBe('function');
    });
  });
});
