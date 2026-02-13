'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Shipping address type
 */
export interface CheckoutShippingAddress {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

/**
 * Shipping method type
 */
export interface CheckoutShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

/**
 * Payment method type
 */
export interface CheckoutPaymentMethod {
  type: string;
  lastFour?: string;
  cardholderName?: string;
}

/**
 * Cart item for checkout
 */
export interface CheckoutCartItem {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  variantName: string;
  price: number;
  salePrice?: number;
  quantity: number;
}

/**
 * Checkout summary
 */
export interface CheckoutSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

/**
 * Checkout session state
 */
export interface CheckoutState {
  // Cart data
  cartId: string | null;
  items: CheckoutCartItem[];
  summary: CheckoutSummary;
  
  // Shipping
  shippingAddress: CheckoutShippingAddress | null;
  shippingMethod: CheckoutShippingMethod | null;
  
  // Payment
  paymentMethod: CheckoutPaymentMethod | null;
  useSameBillingAddress: boolean;
  
  // Discount
  discountCode: string | null;
  discountAmount: number;
  
  // Session
  checkoutSessionId: string | null;
  
  // Guest checkout
  isGuestCheckout: boolean;
  guestEmail: string | null;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

/**
 * Checkout context actions
 */
interface CheckoutContextActions {
  // Cart
  setCartData: (cartId: string, items: CheckoutCartItem[], summary: CheckoutSummary) => void;
  
  // Shipping
  setShippingAddress: (address: CheckoutShippingAddress) => void;
  setShippingMethod: (method: CheckoutShippingMethod) => void;
  
  // Payment
  setPaymentMethod: (method: CheckoutPaymentMethod) => void;
  setUseSameBillingAddress: (value: boolean) => void;
  
  // Discount
  applyDiscount: (code: string, amount: number) => void;
  removeDiscount: () => void;
  
  // Session
  setCheckoutSessionId: (sessionId: string) => void;
  
  // Guest checkout
  setGuestCheckout: (isGuest: boolean) => void;
  setGuestEmail: (email: string) => void;
  
  // Status
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetCheckout: () => void;
  
  // Navigation helpers
  goToNextStep: (currentStep: 'shipping' | 'payment' | 'review') => void;
}

const initialState: CheckoutState = {
  cartId: null,
  items: [],
  summary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    currency: 'USD',
  },
  shippingAddress: null,
  shippingMethod: null,
  paymentMethod: null,
  useSameBillingAddress: true,
  discountCode: null,
  discountAmount: 0,
  checkoutSessionId: null,
  isGuestCheckout: false,
  guestEmail: null,
  isLoading: false,
  error: null,
};

const CheckoutContext = React.createContext<{
  state: CheckoutState;
  actions: CheckoutContextActions;
} | null>(null);

/**
 * Checkout provider component
 */
export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = React.useState<CheckoutState>(() => {
    // Try to restore state from sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('checkout_state');
      if (saved) {
        try {
          return { ...initialState, ...JSON.parse(saved) };
        } catch {
          return initialState;
        }
      }
    }
    return initialState;
  });

  // Persist state to sessionStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('checkout_state', JSON.stringify(state));
    }
  }, [state]);

  const actions: CheckoutContextActions = {
    setCartData: (cartId, items, summary) => {
      setState((prev) => ({ ...prev, cartId, items, summary }));
    },

    setShippingAddress: (address) => {
      setState((prev) => ({ ...prev, shippingAddress: address }));
    },

    setShippingMethod: (method) => {
      setState((prev) => ({
        ...prev,
        shippingMethod: method,
        summary: { ...prev.summary, shipping: method.price },
      }));
    },

    setPaymentMethod: (method) => {
      setState((prev) => ({ ...prev, paymentMethod: method }));
    },

    setUseSameBillingAddress: (value) => {
      setState((prev) => ({ ...prev, useSameBillingAddress: value }));
    },

    applyDiscount: (code, amount) => {
      setState((prev) => ({
        ...prev,
        discountCode: code,
        discountAmount: amount,
        summary: { ...prev.summary, discount: amount },
      }));
    },

    removeDiscount: () => {
      setState((prev) => ({
        ...prev,
        discountCode: null,
        discountAmount: 0,
        summary: { ...prev.summary, discount: 0 },
      }));
    },

    setCheckoutSessionId: (sessionId) => {
      setState((prev) => ({ ...prev, checkoutSessionId: sessionId }));
    },

    setGuestCheckout: (isGuest) => {
      setState((prev) => ({ ...prev, isGuestCheckout: isGuest }));
    },

    setGuestEmail: (email) => {
      setState((prev) => ({ ...prev, guestEmail: email }));
    },

    setLoading: (loading) => {
      setState((prev) => ({ ...prev, isLoading: loading }));
    },

    setError: (error) => {
      setState((prev) => ({ ...prev, error }));
    },

    resetCheckout: () => {
      setState(initialState);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('checkout_state');
      }
    },

    goToNextStep: (currentStep) => {
      const steps = ['shipping', 'payment', 'review', 'success'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        router.push(`/checkout/${steps[currentIndex + 1]}`);
      }
    },
  };

  return (
    <CheckoutContext.Provider value={{ state, actions }}>
      {children}
    </CheckoutContext.Provider>
  );
}

/**
 * Hook to use checkout context
 */
export function useCheckout() {
  const context = React.useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

/**
 * Hook to get checkout summary with recalculated totals
 */
export function useCheckoutSummary() {
  const { state } = useCheckout();
  
  const subtotal = state.items.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + price * item.quantity;
  }, 0);
  
  const total = subtotal + state.summary.tax + state.summary.shipping - state.discountAmount;
  
  return {
    ...state.summary,
    subtotal,
    total,
    discount: state.discountAmount,
  };
}
