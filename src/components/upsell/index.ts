/**
 * Upsell Components
 *
 * Components for displaying frequently bought together recommendations
 * and bundle offers on product pages and cart.
 */

export { FrequentlyBoughtTogether, FrequentlyBoughtTogetherCart } from './frequently-bought-together';
export type {
  MainProductData,
  FrequentlyBoughtTogetherProps,
  FrequentlyBoughtTogetherCartProps,
} from './frequently-bought-together';

export { UpsellItem } from './upsell-item';
export type { UpsellItemProps } from './upsell-item';

export { BundleSummary } from './bundle-summary';
export type { BundleSummaryProps } from './bundle-summary';

export { CartUpsell } from './cart-upsell';
export type { CartUpsellProps, CartUpsellProduct } from './cart-upsell';
