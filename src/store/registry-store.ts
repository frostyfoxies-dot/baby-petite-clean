import { create } from 'zustand';

/**
 * Registry item interface
 */
export interface RegistryItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
  quantityPurchased: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

/**
 * Registry interface
 */
export interface Registry {
  id: string;
  shareCode: string;
  name: string;
  description?: string;
  eventDate?: Date;
  items: RegistryItem[];
}

/**
 * Registry store interface with state, actions, and computed values
 */
interface RegistryStore {
  // State
  currentRegistry: Registry | null;
  isOwner: boolean;

  // Actions
  setCurrentRegistry: (registry: Registry | null, isOwner: boolean) => void;
  addItem: (item: Omit<RegistryItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<RegistryItem>) => void;
  removeItem: (id: string) => void;
  clearRegistry: () => void;

  // Computed
  getProgress: () => number;
  getRemainingItems: () => number;
  getEstimatedTotal: () => number;
}

/**
 * Registry store using Zustand
 * Manages baby registry state including items and ownership
 */
export const useRegistryStore = create<RegistryStore>((set, get) => ({
  // Initial state
  currentRegistry: null,
  isOwner: false,

  /**
   * Set the current registry and ownership status
   */
  setCurrentRegistry: (registry, isOwner) => {
    set({
      currentRegistry: registry,
      isOwner,
    });
  },

  /**
   * Add an item to the registry
   */
  addItem: (item) => {
    const { currentRegistry } = get();
    if (!currentRegistry) return;

    const newItem: RegistryItem = {
      ...item,
      id: `${item.variantId}-${Date.now()}`,
    };

    set({
      currentRegistry: {
        ...currentRegistry,
        items: [...currentRegistry.items, newItem],
      },
    });
  },

  /**
   * Update a registry item
   */
  updateItem: (id, updates) => {
    const { currentRegistry } = get();
    if (!currentRegistry) return;

    set({
      currentRegistry: {
        ...currentRegistry,
        items: currentRegistry.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      },
    });
  },

  /**
   * Remove an item from the registry
   */
  removeItem: (id) => {
    const { currentRegistry } = get();
    if (!currentRegistry) return;

    set({
      currentRegistry: {
        ...currentRegistry,
        items: currentRegistry.items.filter((item) => item.id !== id),
      },
    });
  },

  /**
   * Clear the current registry
   */
  clearRegistry: () => {
    set({
      currentRegistry: null,
      isOwner: false,
    });
  },

  /**
   * Get the progress percentage of purchased items
   * @returns The progress percentage (0-100)
   */
  getProgress: () => {
    const { currentRegistry } = get();
    if (!currentRegistry || currentRegistry.items.length === 0) return 0;

    const totalRequested = currentRegistry.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalPurchased = currentRegistry.items.reduce(
      (sum, item) => sum + item.quantityPurchased,
      0
    );

    if (totalRequested === 0) return 0;
    return Math.round((totalPurchased / totalRequested) * 100);
  },

  /**
   * Get the count of remaining items to be purchased
   * @returns The number of items still needed
   */
  getRemainingItems: () => {
    const { currentRegistry } = get();
    if (!currentRegistry) return 0;

    return currentRegistry.items.reduce((sum, item) => {
      const remaining = item.quantity - item.quantityPurchased;
      return sum + Math.max(0, remaining);
    }, 0);
  },

  /**
   * Get the estimated total value of remaining items
   * @returns The estimated total price
   */
  getEstimatedTotal: () => {
    const { currentRegistry } = get();
    if (!currentRegistry) return 0;

    return currentRegistry.items.reduce((sum, item) => {
      const remaining = Math.max(0, item.quantity - item.quantityPurchased);
      return sum + remaining * item.price;
    }, 0);
  },
}));
