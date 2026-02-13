'use client';

import * as React from 'react';
import Link from 'next/link';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { EmptyCart } from '@/components/cart/empty-cart';
import { CartUpsell } from '@/components/upsell';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Truck, Shield, Loader2, Tag, X } from 'lucide-react';
import { updateCartItem, removeFromCart, applyDiscountCode, removeDiscountCode } from '@/actions/cart';
import { useToast } from '@/hooks/use-toast';
import type { CartItemData, CartSummaryData } from './cart-drawer';

/**
 * Cart item from server action
 */
interface CartItemFromServer {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    size: string;
    color: string | null;
    price: number;
    compareAtPrice: number | null;
    sku: string;
    product: {
      id: string;
      name: string;
      slug: string;
      images: Array<{ url: string; altText: string | null }>;
    };
    inventory: {
      available: number;
    } | null;
  };
}

/**
 * Cart data from server
 */
interface CartData {
  id: string;
  items: CartItemFromServer[];
  itemCount: number;
  subtotal: number;
}

/**
 * Cart content component props
 */
interface CartContentProps {
  initialCart: CartData;
}

/**
 * Transform server cart item to component cart item
 */
function transformCartItem(item: CartItemFromServer): CartItemData {
  const variantName = item.variant.color 
    ? `${item.variant.color} / ${item.variant.size}`
    : item.variant.size;
  
  return {
    id: item.id,
    productId: item.variant.product.id,
    productName: item.variant.product.name,
    productSlug: item.variant.product.slug,
    productImage: item.variant.product.images[0]?.url || '/images/placeholder.jpg',
    variantName,
    price: item.variant.compareAtPrice || item.variant.price,
    salePrice: item.variant.compareAtPrice ? item.variant.price : undefined,
    quantity: item.quantity,
    maxQuantity: item.variant.inventory?.available || 99,
  };
}

/**
 * Calculate cart summary
 */
function calculateCartSummary(items: CartItemFromServer[]): CartSummaryData {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.variant.price * item.quantity);
  }, 0);
  
  // Tax calculation (assuming 8% tax rate - should be configurable)
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  
  // Free shipping over $50
  const shipping = subtotal >= 50 ? 0 : 5.99;
  
  const total = subtotal + tax + shipping;
  
  return {
    subtotal,
    tax,
    shipping,
    total,
    currency: 'USD',
  };
}

/**
 * Cart content component with all interactive functionality
 */
export function CartContent({ initialCart }: CartContentProps) {
  const toast = useToast();
  
  // State for cart items and loading states
  const [cartItems, setCartItems] = React.useState<CartItemFromServer[]>(initialCart.items);
  const [updatingItems, setUpdatingItems] = React.useState<Set<string>>(new Set());
  const [promoCode, setPromoCode] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);
  
  // Sync with server data when it changes
  React.useEffect(() => {
    setCartItems(initialCart.items);
  }, [initialCart.items]);
  
  // Calculate summary
  const cartSummary = React.useMemo(() => {
    const baseSummary = calculateCartSummary(cartItems);
    if (appliedPromo) {
      return {
        ...baseSummary,
        total: Math.max(0, baseSummary.total - appliedPromo.discountAmount),
      };
    }
    return baseSummary;
  }, [cartItems, appliedPromo]);
  
  const isEmpty = cartItems.length === 0;
  
  // Handle quantity update with optimistic update
  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    // Optimistic update
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await updateCartItem({ itemId, quantity });
      
      if (!result.success) {
        // Revert on error
        setCartItems(initialCart.items);
        toast.error(result.error || 'Failed to update quantity');
      }
    } catch (error) {
      // Revert on error
      setCartItems(initialCart.items);
      toast.error('An unexpected error occurred');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };
  
  // Handle remove item with optimistic update
  const handleRemoveItem = async (itemId: string) => {
    // Optimistic update
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await removeFromCart(itemId);
      
      if (!result.success) {
        // Revert on error
        setCartItems(initialCart.items);
        toast.error(result.error || 'Failed to remove item');
      } else {
        toast.success('The item has been removed from your cart', { title: 'Item removed' });
      }
    } catch (error) {
      // Revert on error
      setCartItems(initialCart.items);
      toast.error('An unexpected error occurred');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };
  
  // Handle promo code application
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    
    setIsApplyingPromo(true);
    
    try {
      const result = await applyDiscountCode(promoCode);
      
      if (result.success && result.data) {
        setAppliedPromo({
          code: result.data.code,
          discountAmount: result.data.discountAmount,
        });
        toast.success(`Code "${result.data.code}" has been applied to your order`, { title: 'Promo applied' });
      } else {
        toast.error(result.error || 'This promo code is not valid', { title: 'Invalid code' });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsApplyingPromo(false);
    }
  };
  
  // Handle promo code removal
  const handleRemovePromoCode = async () => {
    setIsApplyingPromo(true);
    
    try {
      const result = await removeDiscountCode();
      
      if (result.success) {
        setAppliedPromo(null);
        setPromoCode('');
        toast.success('The promo code has been removed from your order', { title: 'Promo removed' });
      }
    } catch (error) {
      toast.error('Failed to remove promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };
  
  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>
          <p className="text-gray-600 mt-1">
            {isEmpty ? 'Your cart is empty' : `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isEmpty ? (
          <EmptyCart
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet."
            buttonText="Start Shopping"
            buttonLink="/products"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={transformCartItem(item)}
                  onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
                  onRemove={() => handleRemoveItem(item.id)}
                  isUpdating={updatingItems.has(item.id)}
                />
              ))}

              {/* Continue shopping */}
              <div className="pt-4">
                <Link href="/products">
                  <Button variant="ghost" leftIcon={<ArrowRight className="w-4 h-4 rotate-180" />}>
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Cart upsell recommendations */}
              <CartUpsell
                cartProductIds={cartItems.map((item) => item.variant.product.id)}
                categoryIds={[]}
                limit={3}
                onAddToCart={() => {
                  // Refresh cart data when item is added
                  // The cart will be re-fetched on next page load
                }}
              />
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-20">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <CartSummary
                  summary={cartSummary}
                  showTax={true}
                  showShipping={true}
                />

                {/* Applied promo code */}
                {appliedPromo && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {appliedPromo.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="text-green-600 hover:text-green-800"
                        aria-label="Remove promo code"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      You saved ${appliedPromo.discountAmount.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Checkout button */}
                <Link href="/checkout/shipping" className="block mt-6">
                  <Button size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Proceed to Checkout
                  </Button>
                </Link>

                {/* Security note */}
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>

                <Separator className="my-6" />

                {/* Shipping info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Free Shipping
                      </p>
                      <p className="text-xs text-gray-500">
                        On orders over $50
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Easy Returns
                      </p>
                      <p className="text-xs text-gray-500">
                        30-day return policy
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Promo code */}
                <div>
                  <label htmlFor="promo-code" className="text-sm font-medium text-gray-900 block mb-2">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo-code"
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                      placeholder="Enter code"
                      disabled={isApplyingPromo || !!appliedPromo}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <Button 
                      variant="outline" 
                      size="md"
                      onClick={handleApplyPromoCode}
                      disabled={isApplyingPromo || !!appliedPromo}
                    >
                      {isApplyingPromo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Gift option */}
                <div className="mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-yellow border-gray-300 rounded focus:ring-yellow"
                    />
                    <span className="text-sm text-gray-700">
                      This order is a gift
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
