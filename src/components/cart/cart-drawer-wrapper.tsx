'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CartDrawer } from './cart-drawer';
import { useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';

/**
 * Cart Drawer Wrapper
 *
 * Connects the CartDrawer component to the global cart store.
 * Manages open/close state and provides all necessary props.
 *
 * This component should be used in the root layout instead of CartDrawer directly.
 */
export function CartDrawerWrapper() {
  const router = useRouter();
  
  // Get cart state and actions from store
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const discountAmount = useCartStore((state) => state.discountAmount);
  const closeCart = useCartStore((state) => state.closeCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  
  // Computed values
  const subtotal = useCartStore((state) => state.getSubtotal());
  const totalItems = useCartStore((state) => state.getTotalItems());
  const discountedTotal = useCartStore((state) => state.getDiscountedTotal());
  
  // For now, tax and shipping are simplified
  // TODO: Integrate with checkout context or API for real tax/shipping calculations
  const tax = 0;
  const shipping = 0;
  const total = discountedTotal;
  
  // Handle checkout navigation
  const handleCheckout = React.useCallback(() => {
    closeCart();
    router.push('/checkout');
  }, [closeCart, router]);
  
  // Transform cart items to CartItemData format
  const cartItems = React.useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      productImage: item.image,
      variantName: item.variantName,
      price: item.price,
      salePrice: undefined, // TODO: add sale price to cart store if needed
      quantity: item.quantity,
      maxQuantity: undefined, // TODO: could be derived from inventory
    }));
  }, [items]);
  
  // Build summary object
  const summary = React.useMemo(() => ({
    subtotal,
    tax,
    shipping,
    total,
    currency: 'USD', // TODO: make dynamic based on locale
  }), [subtotal, tax, shipping, total]);
  
  return (
    <CartDrawer
      isOpen={isOpen}
      onClose={closeCart}
      items={cartItems}
      summary={summary}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeItem}
      onCheckout={handleCheckout}
    />
  );
}

export default CartDrawerWrapper;
