import { create } from 'zustand';

/**
 * Toast notification interface
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * UI store interface managing UI state across the application
 */
interface UIStore {
  // Drawer states
  cartDrawerOpen: boolean;
  filterDrawerOpen: boolean;
  mobileMenuOpen: boolean;

  // Modal states
  sizeGuideOpen: boolean;
  shareModalOpen: boolean;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;

  // Toast notifications
  toasts: Toast[];

  // Actions
  setCartDrawerOpen: (open: boolean) => void;
  setFilterDrawerOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSizeGuideOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * UI store using Zustand
 * Manages global UI state including drawers, modals, loading states, and toast notifications
 */
export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  cartDrawerOpen: false,
  filterDrawerOpen: false,
  mobileMenuOpen: false,
  sizeGuideOpen: false,
  shareModalOpen: false,
  isLoading: false,
  isSubmitting: false,
  toasts: [],

  /**
   * Set the cart drawer open/closed state
   */
  setCartDrawerOpen: (open) => {
    set({ cartDrawerOpen: open });
  },

  /**
   * Set the filter drawer open/closed state
   */
  setFilterDrawerOpen: (open) => {
    set({ filterDrawerOpen: open });
  },

  /**
   * Set the mobile menu open/closed state
   */
  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open });
  },

  /**
   * Set the size guide modal open/closed state
   */
  setSizeGuideOpen: (open) => {
    set({ sizeGuideOpen: open });
  },

  /**
   * Set the share modal open/closed state
   */
  setShareModalOpen: (open) => {
    set({ shareModalOpen: open });
  },

  /**
   * Set the global loading state
   */
  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  /**
   * Set the form submission state
   */
  setIsSubmitting: (submitting) => {
    set({ isSubmitting: submitting });
  },

  /**
   * Add a toast notification
   * Automatically removes toast after duration (default 5000ms)
   */
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = toast.duration ?? 5000;

    set({
      toasts: [...get().toasts, { ...toast, id }],
    });

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  /**
   * Remove a toast notification by ID
   */
  removeToast: (id) => {
    set({
      toasts: get().toasts.filter((toast) => toast.id !== id),
    });
  },

  /**
   * Clear all toast notifications
   */
  clearToasts: () => {
    set({ toasts: [] });
  },
}));
