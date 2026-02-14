/**
 * Baby Petite State Management
 * Central export for all Zustand stores
 */

// Cart Store
export { useCartStore, type CartItem } from './cart-store';

// UI Store
export { useUIStore, type Toast } from './ui-store';

// User Store
export { useUserStore, type User } from './user-store';

// Wishlist Store
export { useWishlistStore, type WishlistItem } from './wishlist-store';

// Search Store
export { useSearchStore, type SearchFilters, type SortOption } from './search-store';

// Checkout Store
export {
  useCheckoutStore,
  type CheckoutAddress,
  type CheckoutStep,
  type PaymentMethod,
} from './checkout-store';

// Registry Store
export {
  useRegistryStore,
  type RegistryItem,
  type Registry,
} from './registry-store';

// Product Store
export { useProductStore } from './product-store';

// Notification Store
export {
  useNotificationStore,
  notificationHelpers,
  type Notification,
  type NotificationType,
} from './notification-store';

// Filter Store
export { useFilterStore } from './filter-store';
