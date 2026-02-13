import { create } from 'zustand';
import { useCartStore } from './cart-store';

/**
 * Checkout address interface
 */
export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

/**
 * Checkout step type
 */
export type CheckoutStep = 'shipping' | 'payment' | 'review';

/**
 * Payment method type
 */
export type PaymentMethod = 'card' | 'paypal';

/**
 * Checkout store interface with state, actions, and computed values
 */
interface CheckoutStore {
  // State
  step: CheckoutStep;
  shippingAddress: CheckoutAddress | null;
  billingAddress: CheckoutAddress | null;
  sameAsBilling: boolean;
  shippingMethod: string | null;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  discountCode: string | null;
  discountAmount: number;
  notes: string;

  // Actions
  setStep: (step: CheckoutStep) => void;
  setShippingAddress: (address: CheckoutAddress) => void;
  setBillingAddress: (address: CheckoutAddress) => void;
  setSameAsBilling: (same: boolean) => void;
  setShippingMethod: (method: string, cost: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscountCode: (code: string | null, amount: number) => void;
  setNotes: (notes: string) => void;
  resetCheckout: () => void;

  // Computed
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

/**
 * Tax rate constant (can be made configurable)
 */
const TAX_RATE = 0.08; // 8% tax rate

/**
 * Checkout store using Zustand
 * Manages checkout process state including addresses, shipping, and payment
 */
export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  // Initial state
  step: 'shipping',
  shippingAddress: null,
  billingAddress: null,
  sameAsBilling: true,
  shippingMethod: null,
  shippingCost: 0,
  paymentMethod: 'card',
  discountCode: null,
  discountAmount: 0,
  notes: '',

  /**
   * Set the current checkout step
   */
  setStep: (step) => {
    set({ step });
  },

  /**
   * Set the shipping address
   */
  setShippingAddress: (address) => {
    set({ shippingAddress: address });
  },

  /**
   * Set the billing address
   */
  setBillingAddress: (address) => {
    set({ billingAddress: address });
  },

  /**
   * Set whether billing address is same as shipping
   */
  setSameAsBilling: (same) => {
    set({ sameAsBilling: same });
  },

  /**
   * Set the shipping method and cost
   */
  setShippingMethod: (method, cost) => {
    set({
      shippingMethod: method,
      shippingCost: cost,
    });
  },

  /**
   * Set the payment method
   */
  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  /**
   * Set the discount code and amount
   */
  setDiscountCode: (code, amount) => {
    set({
      discountCode: code,
      discountAmount: amount,
    });
  },

  /**
   * Set order notes
   */
  setNotes: (notes) => {
    set({ notes });
  },

  /**
   * Reset checkout to initial state
   */
  resetCheckout: () => {
    set({
      step: 'shipping',
      shippingAddress: null,
      billingAddress: null,
      sameAsBilling: true,
      shippingMethod: null,
      shippingCost: 0,
      paymentMethod: 'card',
      discountCode: null,
      discountAmount: 0,
      notes: '',
    });
  },

  /**
   * Get the subtotal from cart
   * @returns The cart subtotal
   */
  getSubtotal: () => {
    return useCartStore.getState().getSubtotal();
  },

  /**
   * Calculate tax based on subtotal
   * @returns The calculated tax amount
   */
  getTax: () => {
    const subtotal = get().getSubtotal();
    const { discountAmount } = get();
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    return taxableAmount * TAX_RATE;
  },

  /**
   * Calculate the total order amount
   * @returns The total including subtotal, shipping, tax, minus discounts
   */
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const { shippingCost, discountAmount } = get();
    const tax = get().getTax();
    return Math.max(0, subtotal + shippingCost + tax - discountAmount);
  },
}));
