import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Default price range
 */
const DEFAULT_PRICE_RANGE: [number, number] = [0, 500];

/**
 * Filter store interface with state, actions, and computed values
 */
interface FilterStore {
  // State
  priceRange: [number, number];
  selectedSizes: string[];
  selectedColors: string[];
  selectedCategories: string[];
  inStockOnly: boolean;
  onSaleOnly: boolean;

  // Actions
  setPriceRange: (range: [number, number]) => void;
  toggleSize: (size: string) => void;
  toggleColor: (color: string) => void;
  toggleCategory: (category: string) => void;
  setInStockOnly: (value: boolean) => void;
  setOnSaleOnly: (value: boolean) => void;
  resetFilters: () => void;

  // Computed
  hasActiveFilters: () => boolean;
  getFilterCount: () => number;
}

/**
 * Filter store using Zustand with persistence
 * Manages product filtering state across the application
 */
export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      // Initial state
      priceRange: DEFAULT_PRICE_RANGE,
      selectedSizes: [],
      selectedColors: [],
      selectedCategories: [],
      inStockOnly: false,
      onSaleOnly: false,

      /**
       * Set the price range filter
       */
      setPriceRange: (range) => {
        set({ priceRange: range });
      },

      /**
       * Toggle a size in the filter
       * Adds if not present, removes if present
       */
      toggleSize: (size) => {
        const { selectedSizes } = get();
        const exists = selectedSizes.includes(size);
        set({
          selectedSizes: exists
            ? selectedSizes.filter((s) => s !== size)
            : [...selectedSizes, size],
        });
      },

      /**
       * Toggle a color in the filter
       * Adds if not present, removes if present
       */
      toggleColor: (color) => {
        const { selectedColors } = get();
        const exists = selectedColors.includes(color);
        set({
          selectedColors: exists
            ? selectedColors.filter((c) => c !== color)
            : [...selectedColors, color],
        });
      },

      /**
       * Toggle a category in the filter
       * Adds if not present, removes if present
       */
      toggleCategory: (category) => {
        const { selectedCategories } = get();
        const exists = selectedCategories.includes(category);
        set({
          selectedCategories: exists
            ? selectedCategories.filter((c) => c !== category)
            : [...selectedCategories, category],
        });
      },

      /**
       * Set the in-stock only filter
       */
      setInStockOnly: (value) => {
        set({ inStockOnly: value });
      },

      /**
       * Set the on-sale only filter
       */
      setOnSaleOnly: (value) => {
        set({ onSaleOnly: value });
      },

      /**
       * Reset all filters to default values
       */
      resetFilters: () => {
        set({
          priceRange: DEFAULT_PRICE_RANGE,
          selectedSizes: [],
          selectedColors: [],
          selectedCategories: [],
          inStockOnly: false,
          onSaleOnly: false,
        });
      },

      /**
       * Check if any filters are active
       * @returns True if any filter is not at its default value
       */
      hasActiveFilters: () => {
        const state = get();
        return (
          state.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
          state.priceRange[1] !== DEFAULT_PRICE_RANGE[1] ||
          state.selectedSizes.length > 0 ||
          state.selectedColors.length > 0 ||
          state.selectedCategories.length > 0 ||
          state.inStockOnly ||
          state.onSaleOnly
        );
      },

      /**
       * Get the count of active filters
       * @returns The number of active filter categories
       */
      getFilterCount: () => {
        const state = get();
        let count = 0;

        // Price range filter
        if (
          state.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
          state.priceRange[1] !== DEFAULT_PRICE_RANGE[1]
        ) {
          count++;
        }

        // Size filter
        if (state.selectedSizes.length > 0) {
          count++;
        }

        // Color filter
        if (state.selectedColors.length > 0) {
          count++;
        }

        // Category filter
        if (state.selectedCategories.length > 0) {
          count++;
        }

        // In stock filter
        if (state.inStockOnly) {
          count++;
        }

        // On sale filter
        if (state.onSaleOnly) {
          count++;
        }

        return count;
      },
    }),
    {
      name: 'baby-petite-filter-storage',
      partialize: (state) => ({
        priceRange: state.priceRange,
        selectedSizes: state.selectedSizes,
        selectedColors: state.selectedColors,
        selectedCategories: state.selectedCategories,
        inStockOnly: state.inStockOnly,
        onSaleOnly: state.onSaleOnly,
      }),
    }
  )
);
