/**
 * Application Constants
 *
 * Centralized constants used throughout the application.
 * Includes order statuses, payment statuses, shipping info, size charts, and more.
 */

// ============================================================================
// ORDER STATUSES
// ============================================================================

/**
 * Order status enum values
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

/**
 * Order status display labels
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
  [ORDER_STATUS.FAILED]: 'Failed',
};

/**
 * Order status colors for UI
 */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUS.PROCESSING]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUS.SHIPPED]: 'bg-indigo-100 text-indigo-800',
  [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [ORDER_STATUS.REFUNDED]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUS.FAILED]: 'bg-red-100 text-red-800',
};

// ============================================================================
// PAYMENT STATUSES
// ============================================================================

/**
 * Payment status enum values
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

/**
 * Payment status display labels
 */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PROCESSING]: 'Processing',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
  [PAYMENT_STATUS.PARTIALLY_REFUNDED]: 'Partially Refunded',
};

// ============================================================================
// SHIPPING CARRIERS
// ============================================================================

/**
 * Shipping carrier information
 */
export const SHIPPING_CARRIERS = {
  UPS: {
    name: 'UPS',
    trackingUrl: 'https://www.ups.com/track?loc=en_US&tracknum=',
  },
  FEDEX: {
    name: 'FedEx',
    trackingUrl: 'https://www.fedex.com/apps/fedextrack/?tracknumbers=',
  },
  USPS: {
    name: 'USPS',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  },
  DHL: {
    name: 'DHL',
    trackingUrl: 'https://www.dhl.com/us-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=',
  },
} as const;

/**
 * Shipping methods
 */
export const SHIPPING_METHODS = {
  STANDARD: {
    id: 'standard',
    name: 'Standard Shipping',
    description: '5-7 business days',
    basePrice: 5.99,
  },
  EXPRESS: {
    id: 'express',
    name: 'Express Shipping',
    description: '2-3 business days',
    basePrice: 12.99,
  },
  OVERNIGHT: {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: '1 business day',
    basePrice: 24.99,
  },
  FREE: {
    id: 'free',
    name: 'Free Shipping',
    description: '5-7 business days',
    basePrice: 0,
  },
} as const;

/**
 * Free shipping threshold
 */
export const FREE_SHIPPING_THRESHOLD = 75;

// ============================================================================
// SIZE CHARTS
// ============================================================================

/**
 * Baby clothing size chart (months)
 */
export const BABY_CLOTHING_SIZES = [
  { size: 'NB', label: 'Newborn', ageRange: '0-1 months', weightRange: '5-8 lbs' },
  { size: '0-3M', label: '0-3 Months', ageRange: '0-3 months', weightRange: '8-12 lbs' },
  { size: '3-6M', label: '3-6 Months', ageRange: '3-6 months', weightRange: '12-16 lbs' },
  { size: '6-9M', label: '6-9 Months', ageRange: '6-9 months', weightRange: '16-20 lbs' },
  { size: '9-12M', label: '9-12 Months', ageRange: '9-12 months', weightRange: '20-24 lbs' },
  { size: '12-18M', label: '12-18 Months', ageRange: '12-18 months', weightRange: '24-28 lbs' },
  { size: '18-24M', label: '18-24 Months', ageRange: '18-24 months', weightRange: '28-32 lbs' },
  { size: '2T', label: '2 Toddler', ageRange: '2 years', weightRange: '30-34 lbs' },
  { size: '3T', label: '3 Toddler', ageRange: '3 years', weightRange: '32-38 lbs' },
  { size: '4T', label: '4 Toddler', ageRange: '4 years', weightRange: '36-42 lbs' },
  { size: '5T', label: '5 Toddler', ageRange: '5 years', weightRange: '40-46 lbs' },
] as const;

/**
 * Baby shoe size chart
 */
export const BABY_SHOE_SIZES = [
  { size: '0', label: '0', ageRange: '0-3 months', lengthInches: 3.5 },
  { size: '1', label: '1', ageRange: '0-3 months', lengthInches: 3.75 },
  { size: '2', label: '2', ageRange: '3-6 months', lengthInches: 4.125 },
  { size: '3', label: '3', ageRange: '6-9 months', lengthInches: 4.5 },
  { size: '4', label: '4', ageRange: '9-12 months', lengthInches: 4.75 },
  { size: '5', label: '5', ageRange: '12-18 months', lengthInches: 5.125 },
  { size: '5.5', label: '5.5', ageRange: '18-24 months', lengthInches: 5.25 },
  { size: '6', label: '6', ageRange: '2-3 years', lengthInches: 5.5 },
  { size: '7', label: '7', ageRange: '3-4 years', lengthInches: 5.75 },
  { size: '8', label: '8', ageRange: '4-5 years', lengthInches: 6.125 },
] as const;

/**
 * Diaper size chart
 */
export const DIAPER_SIZES = [
  { size: 'N', label: 'Newborn', weightRange: 'Up to 10 lbs' },
  { size: '1', label: 'Size 1', weightRange: '8-14 lbs' },
  { size: '2', label: 'Size 2', weightRange: '12-18 lbs' },
  { size: '3', label: 'Size 3', weightRange: '16-28 lbs' },
  { size: '4', label: 'Size 4', weightRange: '22-37 lbs' },
  { size: '5', label: 'Size 5', weightRange: '27+ lbs' },
  { size: '6', label: 'Size 6', weightRange: '35+ lbs' },
] as const;

// ============================================================================
// COLOR PALETTES
// ============================================================================

/**
 * Brand color palette
 */
export const BRAND_COLORS = {
  primary: '#E91E63', // Pink
  primaryLight: '#F48FB1',
  primaryDark: '#C2185B',
  secondary: '#9C27B0', // Purple
  secondaryLight: '#BA68C8',
  secondaryDark: '#7B1FA2',
  accent: '#FF9800', // Orange
  accentLight: '#FFB74D',
  accentDark: '#F57C00',
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
} as const;

/**
 * Product color options
 */
export const PRODUCT_COLORS = [
  { name: 'White', hex: '#FFFFFF', slug: 'white' },
  { name: 'Black', hex: '#000000', slug: 'black' },
  { name: 'Gray', hex: '#9E9E9E', slug: 'gray' },
  { name: 'Pink', hex: '#E91E63', slug: 'pink' },
  { name: 'Light Pink', hex: '#F48FB1', slug: 'light-pink' },
  { name: 'Purple', hex: '#9C27B0', slug: 'purple' },
  { name: 'Lavender', hex: '#E1BEE7', slug: 'lavender' },
  { name: 'Blue', hex: '#2196F3', slug: 'blue' },
  { name: 'Light Blue', hex: '#90CAF9', slug: 'light-blue' },
  { name: 'Mint', hex: '#A5D6A7', slug: 'mint' },
  { name: 'Green', hex: '#4CAF50', slug: 'green' },
  { name: 'Yellow', hex: '#FFEB3B', slug: 'yellow' },
  { name: 'Orange', hex: '#FF9800', slug: 'orange' },
  { name: 'Red', hex: '#F44336', slug: 'red' },
  { name: 'Beige', hex: '#D7CCC8', slug: 'beige' },
  { name: 'Brown', hex: '#795548', slug: 'brown' },
  { name: 'Navy', hex: '#1A237E', slug: 'navy' },
  { name: 'Teal', hex: '#009688', slug: 'teal' },
  { name: 'Coral', hex: '#FF7043', slug: 'coral' },
  { name: 'Peach', hex: '#FFCCBC', slug: 'peach' },
] as const;

/**
 * Gender color associations
 */
export const GENDER_COLORS = {
  male: '#2196F3', // Blue
  female: '#E91E63', // Pink
  unisex: '#9E9E9E', // Gray
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Pagination limits
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [12, 24, 48, 96],
} as const;

// ============================================================================
// CURRENCY
// ============================================================================

/**
 * Supported currencies
 */
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
} as const;

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = CURRENCIES.USD;

// ============================================================================
// TAX RATES
// ============================================================================

/**
 * Tax rates by US state (as percentages)
 */
export const TAX_RATES_BY_STATE: Record<string, number> = {
  AL: 4.0,
  AK: 0.0,
  AZ: 5.6,
  AR: 6.5,
  CA: 7.25,
  CO: 2.9,
  CT: 6.35,
  DE: 0.0,
  FL: 6.0,
  GA: 4.0,
  HI: 4.0,
  ID: 6.0,
  IL: 6.25,
  IN: 7.0,
  IA: 6.0,
  KS: 6.5,
  KY: 6.0,
  LA: 4.45,
  ME: 5.5,
  MD: 6.0,
  MA: 6.25,
  MI: 6.0,
  MN: 6.875,
  MS: 7.0,
  MO: 4.225,
  MT: 0.0,
  NE: 5.5,
  NV: 6.85,
  NH: 0.0,
  NJ: 6.625,
  NM: 5.125,
  NY: 4.0,
  NC: 4.75,
  ND: 5.0,
  OH: 5.75,
  OK: 4.5,
  OR: 0.0,
  PA: 6.0,
  RI: 7.0,
  SC: 6.0,
  SD: 4.5,
  TN: 7.0,
  TX: 6.25,
  UT: 5.95,
  VT: 6.0,
  VA: 5.3,
  WA: 6.5,
  WV: 6.0,
  WI: 5.0,
  WY: 4.0,
  DC: 6.0,
} as const;

/**
 * Default tax rate (for states not listed)
 */
export const DEFAULT_TAX_RATE = 6.0;

/**
 * Gets tax rate for a state
 */
export function getTaxRate(state: string): number {
  return TAX_RATES_BY_STATE[state.toUpperCase()] || DEFAULT_TAX_RATE;
}

// ============================================================================
// SHIPPING RATES
// ============================================================================

/**
 * Base shipping rates by weight (in kg)
 */
export const SHIPPING_RATES_BY_WEIGHT = [
  { maxWeight: 1, standard: 5.99, express: 12.99, overnight: 24.99 },
  { maxWeight: 2, standard: 7.99, express: 14.99, overnight: 29.99 },
  { maxWeight: 5, standard: 9.99, express: 18.99, overnight: 34.99 },
  { maxWeight: 10, standard: 12.99, express: 24.99, overnight: 44.99 },
  { maxWeight: 20, standard: 18.99, express: 34.99, overnight: 59.99 },
  { maxWeight: 30, standard: 24.99, express: 44.99, overnight: 74.99 },
] as const;

/**
 * Gets shipping rate based on weight and method
 */
export function getShippingRate(weightKg: number, method: 'standard' | 'express' | 'overnight'): number {
  const tier = SHIPPING_RATES_BY_WEIGHT.find((t) => weightKg <= t.maxWeight);
  if (!tier) {
    // For items over 30kg, calculate additional cost
    const baseTier = SHIPPING_RATES_BY_WEIGHT[SHIPPING_RATES_BY_WEIGHT.length - 1];
    const extraWeight = weightKg - 30;
    const extraCost = Math.ceil(extraWeight / 5) * 5;
    return baseTier[method] + extraCost;
  }
  return tier[method];
}

// ============================================================================
// INVENTORY
// ============================================================================

/**
 * Inventory thresholds
 */
export const INVENTORY = {
  LOW_STOCK_THRESHOLD: 10,
  OUT_OF_STOCK_THRESHOLD: 0,
  REORDER_THRESHOLD: 15,
} as const;

// ============================================================================
// DISCOUNTS
// ============================================================================

/**
 * Discount limits
 */
export const DISCOUNT_LIMITS = {
  MAX_DISCOUNT_PERCENTAGE: 100,
  MAX_FIXED_DISCOUNT: 1000,
  MIN_ORDER_VALUE_FOR_DISCOUNT: 0,
} as const;

// ============================================================================
// REVIEWS
// ============================================================================

/**
 * Review configuration
 */
export const REVIEWS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 200,
  MIN_CONTENT_LENGTH: 10,
  MAX_CONTENT_LENGTH: 2000,
  MAX_IMAGES: 5,
  MAX_PROS_CONS: 5,
} as const;

// ============================================================================
// REGISTRY
// ============================================================================

/**
 * Registry configuration
 */
export const REGISTRY = {
  MIN_ITEMS: 1,
  MAX_ITEMS: 200,
  SHARE_CODE_LENGTH: 8,
  EXPIRY_DAYS: 365,
} as const;

/**
 * Registry item priorities
 */
export const REGISTRY_PRIORITIES = {
  ESSENTIAL: 'essential',
  NICE_TO_HAVE: 'nice_to_have',
  DREAM: 'dream',
} as const;

/**
 * Registry priority labels
 */
export const REGISTRY_PRIORITY_LABELS: Record<string, string> = {
  [REGISTRY_PRIORITIES.ESSENTIAL]: 'Essential',
  [REGISTRY_PRIORITIES.NICE_TO_HAVE]: 'Nice to Have',
  [REGISTRY_PRIORITIES.DREAM]: 'Dream Item',
};

// ============================================================================
// CART
// ============================================================================

/**
 * Cart configuration
 */
export const CART = {
  MAX_QUANTITY_PER_ITEM: 99,
  MAX_ITEMS: 100,
  SESSION_DURATION_DAYS: 30,
} as const;

// ============================================================================
// USER
// ============================================================================

/**
 * User configuration
 */
export const USER = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_RESET_TOKEN_EXPIRY_HOURS: 24,
  EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS: 48,
  SESSION_DURATION_DAYS: 30,
  MAX_ADDRESSES: 10,
} as const;

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_IMAGES_PER_REVIEW: 5,
} as const;

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search configuration
 */
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 200,
  DEFAULT_RESULTS_PER_PAGE: 20,
  MAX_RESULTS_PER_PAGE: 100,
  FACET_MAX_VALUES: 100,
} as const;

// ============================================================================
// API
// ============================================================================

/**
 * API configuration
 */
export const API = {
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// ============================================================================
// CACHE
// ============================================================================

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// ============================================================================
// DATE FORMATS
// ============================================================================

/**
 * Date format presets
 */
export const DATE_FORMATS = {
  SHORT: 'M/d/yyyy',
  MEDIUM: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  FULL: 'EEEE, MMMM d, yyyy',
  ISO: 'yyyy-MM-dd',
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
  DISPLAY: 'MMM d, yyyy h:mm a',
} as const;

// ============================================================================
// TIMEZONES
// ============================================================================

/**
 * Common timezones
 */
export const TIMEZONES = {
  US_EASTERN: 'America/New_York',
  US_CENTRAL: 'America/Chicago',
  US_MOUNTAIN: 'America/Denver',
  US_PACIFIC: 'America/Los_Angeles',
  UTC: 'UTC',
} as const;

/**
 * Default timezone
 */
export const DEFAULT_TIMEZONE = TIMEZONES.US_EASTERN;

// ============================================================================
// SOCIAL MEDIA
// ============================================================================

/**
 * Social media URLs
 */
export const SOCIAL_MEDIA = {
  INSTAGRAM: 'https://instagram.com/babypetite',
  FACEBOOK: 'https://facebook.com/babypetite',
  TWITTER: 'https://twitter.com/babypetite',
  PINTEREST: 'https://pinterest.com/babypetite',
  TIKTOK: 'https://tiktok.com/@babypetite',
} as const;

// ============================================================================
// SUPPORT
// ============================================================================

/**
 * Support contact information
 */
export const SUPPORT = {
  EMAIL: 'support@babypetite.com',
  PHONE: '+1-800-KIDS-PET',
  HOURS: 'Mon-Fri 9am-6pm EST',
} as const;

// ============================================================================
// LEGAL
// ============================================================================

/**
 * Legal page slugs
 */
export const LEGAL_PAGES = {
  PRIVACY_POLICY: 'privacy-policy',
  TERMS_OF_SERVICE: 'terms-of-service',
  SHIPPING_POLICY: 'shipping-policy',
  RETURN_POLICY: 'return-policy',
  REFUND_POLICY: 'refund-policy',
} as const;
