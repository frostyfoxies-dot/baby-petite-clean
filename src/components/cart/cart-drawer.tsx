'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ShoppingBag, X } from 'lucide-react';
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { CartItem } from './cart-item';
import { CartSummary } from './cart-summary';
import { EmptyCart } from './empty-cart';

/**
 * Cart item type
 */
export interface CartItemData {
  /**
   * Cart item ID
   */
  id: string;
  /**
   * Product ID
   */
  productId: string;
  /**
   * Product name
   */
  productName: string;
  /**
   * Product slug
   */
  productSlug: string;
  /**
   * Product image
   */
  productImage: string;
  /**
   * Variant name (e.g., size/color)
   */
  variantName?: string;
  /**
   * Price
   */
  price: number;
  /**
   * Sale price (optional)
   */
  salePrice?: number;
  /**
   * Quantity
   */
  quantity: number;
  /**
   * Maximum quantity available
   */
  maxQuantity?: number;
}

/**
 * Cart summary data type
 */
export interface CartSummaryData {
  /**
   * Subtotal
   */
  subtotal: number;
  /**
   * Tax amount
   */
  tax: number;
  /**
   * Shipping cost
   */
  shipping: number;
  /**
   * Total
   */
  total: number;
  /**
   * Currency code
   */
  currency?: string;
}

/**
 * Cart drawer component props
 */
export interface CartDrawerProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;
  /**
   * Callback when drawer is closed
   */
  onClose: () => void;
  /**
   * Cart items
   */
  items: CartItemData[];
  /**
   * Cart summary
   */
  summary: CartSummaryData;
  /**
   * Callback when quantity is updated
   */
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  /**
   * Callback when item is removed
   */
  onRemoveItem: (itemId: string) => void;
  /**
   * Callback when checkout is clicked
   */
  onCheckout?: () => void;
  /**
   * Whether checkout is loading
   */
  isCheckoutLoading?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Slide-out cart drawer
 * 
 * @example
 * ```tsx
 * <CartDrawer
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   items={cartItems}
 *   summary={cartSummary}
 *   onUpdateQuantity={(itemId, quantity) => updateQuantity(itemId, quantity)}
 *   onRemoveItem={(itemId) => removeItem(itemId)}
 *   onCheckout={() => router.push('/checkout')}
 * />
 * ```
 */
export function CartDrawer({
  isOpen,
  onClose,
  items,
  summary,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckoutLoading = false,
  className,
}: CartDrawerProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      width="md"
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          <span>Shopping Cart</span>
          {itemCount > 0 && (
            <span className="text-sm text-gray-500">
              ({itemCount})
            </span>
          )}
        </div>
      }
    >
      <DrawerContent>
        {items.length === 0 ? (
          <EmptyCart onClose={onClose} />
        ) : (
          <div className="space-y-4">
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto -mx-4 px-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(quantity) =>
                      onUpdateQuantity(item.id, quantity)
                    }
                    onRemove={() => onRemoveItem(item.id)}
                  />
                ))}
              </div>
            </div>

            {/* Cart summary */}
            <CartSummary summary={summary} />
          </div>
        )}
      </DrawerContent>

      {items.length > 0 && (
        <DrawerFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Continue Shopping
          </Button>
          <Button
            onClick={onCheckout}
            loading={isCheckoutLoading}
            className="flex-1"
          >
            Checkout
          </Button>
        </DrawerFooter>
      )}
    </Drawer>
  );
}
