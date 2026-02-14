/**
 * Baby Petite Custom Hooks
 * Central export for all custom React hooks
 */

// Authentication Hooks
export { useAuth, default as useAuthDefault } from './use-auth';

// Cart Hooks
export { useCart, default as useCartDefault } from './use-cart';

// Product Hooks
export {
  useProduct,
  default as useProductDefault,
  type Product,
  type ProductVariant,
} from './use-product';

export {
  useProducts,
  default as useProductsDefault,
  type ProductFilters,
  type ProductSortOption,
} from './use-products';

export {
  useProductSearch,
  default as useProductSearchDefault,
} from './use-product-search';

export {
  useSearchSuggestions,
  default as useSearchSuggestionsDefault,
  type SearchSuggestionProduct,
  type SearchSuggestionCategory,
  type SearchSuggestionsResponse,
  type RecentSearch,
  type UseSearchSuggestionsOptions,
  type UseSearchSuggestionsReturn,
} from './use-search-suggestions';

// Category Hooks
export {
  useCategories,
  default as useCategoriesDefault,
  type Category,
} from './use-categories';

export { useCategory, default as useCategoryDefault } from './use-category';

// Order Hooks
export {
  useOrders,
  default as useOrdersDefault,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentStatus,
  type FulfillmentStatus,
  type OrderAddress,
} from './use-orders';

export { useOrder, default as useOrderDefault } from './use-order';

// Registry Hooks
export {
  useRegistry,
  default as useRegistryDefault,
  type Registry,
  type RegistryItem,
} from './use-registry';

export {
  useRegistryDetail,
  default as useRegistryDetailDefault,
} from './use-registry-detail';

export {
  useGrowthTracking,
  default as useGrowthTrackingDefault,
  type GrowthEntry,
} from './use-growth-tracking';

// Wishlist Hooks
export { useWishlist, default as useWishlistDefault } from './use-wishlist';

// Address Hooks
export {
  useAddresses,
  default as useAddressesDefault,
  type Address,
  type AddressType,
} from './use-addresses';

// Review Hooks
export {
  useReviews,
  default as useReviewsDefault,
  type Review,
  type ReviewSummary,
} from './use-reviews';

// Checkout Hooks
export {
  useCheckout,
  default as useCheckoutDefault,
  type CheckoutTotals,
} from './use-checkout';

// Form Hooks
export {
  useForm,
  default as useFormDefault,
  type UseFormOptions,
  type UseFormReturn,
} from './use-form';

export {
  useDebounce,
  useDebounceValue,
  default as useDebounceDefault,
} from './use-debounce';

// UI Hooks
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLargeDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  default as useMediaQueryDefault,
} from './use-media-query';

export {
  useClickOutside,
  useClickOutsideRef,
  default as useClickOutsideDefault,
} from './use-click-outside';

export {
  useLocalStorage,
  useSessionStorage,
  default as useLocalStorageDefault,
} from './use-local-storage';

export {
  useScrollPosition,
  useScrolledPast,
  useScrollToTop,
  default as useScrollPositionDefault,
  type ScrollDirection,
} from './use-scroll-position';

export {
  useIntersectionObserver,
  useInfiniteScroll,
  useLazyImage,
  default as useIntersectionObserverDefault,
} from './use-intersection-observer';

// Recommendation Hooks
export {
  useRecommendations,
  useRegistryRecommendations,
  useProductRecommendations,
  useHomepageRecommendations,
  default as useRecommendationsDefault,
  type RecommendationReason,
} from './use-recommendations';

// Notification Hooks
export {
  useToast,
  ToastProvider,
  default as useToastDefault,
} from './use-toast';
