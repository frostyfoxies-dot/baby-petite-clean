'use client';

import { useState, useCallback } from 'react';
import { useCheckoutStore, type CheckoutStep, type PaymentMethod, type CheckoutAddress } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { createOrder as createOrderAction } from '@/actions/checkout';

/**
 * Checkout totals interface
 */
export interface CheckoutTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

/**
 * Checkout hook return type
 */
interface UseCheckoutReturn {
  /** Current checkout step */
  step: CheckoutStep;
  /** Set the current step */
  setStep: (step: CheckoutStep) => void;
  /** Shipping address */
  shippingAddress: CheckoutAddress | null;
  /** Set shipping address */
  setShippingAddress: (address: CheckoutAddress) => void;
  /** Shipping method ID */
  shippingMethod: string | null;
  /** Set shipping method */
  setShippingMethod: (method: string) => void;
  /** Payment method */
  paymentMethod: PaymentMethod;
  /** Set payment method */
  setPaymentMethod: (method: PaymentMethod) => void;
  /** Calculated totals */
  totals: CheckoutTotals;
  /** Create the order */
  createOrder: () => Promise<{ success: boolean; error?: string; orderNumber?: string }>;
  /** Whether order is being processed */
  isProcessing: boolean;
  /** Reset checkout state */
  reset: () => void;
  /** Discount code */
  discountCode: string | null;
  /** Apply discount code */
  applyDiscount: (code: string) => Promise<{ success: boolean; error?: string }>;
  /** Remove discount code */
  removeDiscount: () => void;
  /** Order notes */
  notes: string;
  /** Set order notes */
  setNotes: (notes: string) => void;
}

/**
 * Tax rate constant
 */
const TAX_RATE = 0.08; // 8% tax rate

/**
 * Hook for checkout flow
 *
 * Manages the checkout process including shipping address,
 * shipping method, payment method, and order creation.
 *
 * @returns Checkout state and actions
 *
 * @example
 * ```tsx
 * function CheckoutPage() {
 *   const {
 *     step,
 *     setStep,
 *     shippingAddress,
 *     setShippingAddress,
 *     totals,
 *     createOrder,
 *     isProcessing,
 *   } = useCheckout();
 *
 *   const handleShippingSubmit = (address) => {
 *     setShippingAddress(address);
 *     setStep('payment');
 *   };
 *
 *   const handlePlaceOrder = async () => {
 *     const result = await createOrder();
 *     if (result.success) {
 *       router.push(`/checkout/success?order=${result.orderNumber}`);
 *     }
 *   };
 *
 *   return (
 *     <CheckoutFlow
 *       step={step}
 *       totals={totals}
 *       onShippingSubmit={handleShippingSubmit}
 *       onPlaceOrder={handlePlaceOrder}
 *     />
 *   );
 * }
 * ```
 */
export function useCheckout(): UseCheckoutReturn {
  const {
    step,
    setStep,
    shippingAddress,
    setShippingAddress,
    shippingMethod,
    shippingCost,
    setShippingMethod: setStoreShippingMethod,
    paymentMethod,
    setPaymentMethod,
    discountCode,
    discountAmount,
    setDiscountCode,
    notes,
    setNotes,
    resetCheckout,
    getSubtotal,
    getTax,
    getTotal,
  } = useCheckoutStore();

  const { items, getSubtotal: getCartSubtotal } = useCartStore();
  const { addToast } = useUIStore();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Calculate totals
   */
  const totals: CheckoutTotals = {
    subtotal: getSubtotal(),
    shipping: shippingCost,
    tax: getTax(),
    discount: discountAmount,
    total: getTotal(),
  };

  /**
   * Set shipping method with cost
   */
  const handleSetShippingMethod = useCallback(
    (method: string) => {
      // Calculate shipping cost based on method
      const shippingCosts: Record<string, number> = {
        standard: 5.99,
        express: 12.99,
        overnight: 24.99,
        free: 0,
      };

      const cost = shippingCosts[method] ?? 5.99;
      setStoreShippingMethod(method, cost);
    },
    [setStoreShippingMethod]
  );

  /**
   * Apply discount code
   */
  const applyDiscount = useCallback(
    async (code: string) => {
      try {
        // Validate discount code via API
        const response = await fetch('/api/checkout/discount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const data = await response.json();
          return {
            success: false,
            error: data.error || 'Invalid discount code',
          };
        }

        const data = await response.json();
        setDiscountCode(code, data.discountAmount);

        addToast({
          type: 'success',
          title: 'Discount applied',
          message: `Code "${code}" has been applied to your order.`,
        });

        return { success: true };
      } catch (error) {
        console.error('Apply discount error:', error);
        return {
          success: false,
          error: 'Failed to apply discount code. Please try again.',
        };
      }
    },
    [setDiscountCode, addToast]
  );

  /**
   * Remove discount code
   */
  const removeDiscount = useCallback(() => {
    setDiscountCode(null, 0);
    addToast({
      type: 'info',
      title: 'Discount removed',
      message: 'The discount code has been removed from your order.',
    });
  }, [setDiscountCode, addToast]);

  /**
   * Create the order
   */
  const createOrder = useCallback(async () => {
    if (!shippingAddress) {
      return { success: false, error: 'Please provide a shipping address' };
    }

    if (!shippingMethod) {
      return { success: false, error: 'Please select a shipping method' };
    }

    if (items.length === 0) {
      return { success: false, error: 'Your cart is empty' };
    }

    setIsProcessing(true);

    try {
      const result = await createOrderAction({
        shippingAddress,
        billingAddress: shippingAddress, // Use same as shipping for now
        shippingMethod,
        paymentMethod,
        discountCode,
        notes,
      });

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Order placed!',
          message: 'Your order has been placed successfully.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Order failed',
          message: result.error || 'Please try again.',
        });
      }

      return {
        success: result.success,
        error: result.error,
        orderNumber: result.data?.orderNumber,
      };
    } catch (error) {
      console.error('Create order error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      addToast({
        type: 'error',
        title: 'Order failed',
        message: errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  }, [
    shippingAddress,
    shippingMethod,
    items,
    paymentMethod,
    discountCode,
    notes,
    addToast,
  ]);

  /**
   * Reset checkout state
   */
  const reset = useCallback(() => {
    resetCheckout();
  }, [resetCheckout]);

  return {
    step,
    setStep,
    shippingAddress,
    setShippingAddress,
    shippingMethod,
    setShippingMethod: handleSetShippingMethod,
    paymentMethod,
    setPaymentMethod,
    totals,
    createOrder,
    isProcessing,
    reset,
    discountCode,
    applyDiscount,
    removeDiscount,
    notes,
    setNotes,
  };
}

export default useCheckout;
