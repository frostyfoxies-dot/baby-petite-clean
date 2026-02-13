/**
 * Dropshipping types for the Kids Petite e-commerce platform
 * AliExpress integration v2.2
 */

// ============================================
// ENUMS
// ============================================

/** Supplier status enumeration */
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/** Source product status enumeration */
export type SourceStatus = 'ACTIVE' | 'UNAVAILABLE' | 'DISCONTINUED' | 'PRICE_CHANGED';

/** Inventory status enumeration */
export type InventoryStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

/** Dropship order status enumeration */
export type DropshipOrderStatus = 
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'ISSUE';

// ============================================
// SUPPLIER TYPES
// ============================================

/**
 * AliExpress supplier information
 */
export interface Supplier {
  /** Unique identifier */
  id: string;
  /** AliExpress store ID */
  aliExpressId: string;
  /** Supplier/store name */
  name: string;
  /** Store URL on AliExpress */
  storeUrl?: string;
  /** Supplier rating (0-5) */
  rating?: number;
  /** Total orders placed with this supplier */
  totalOrders: number;
  /** Current supplier status */
  status: SupplierStatus;
  /** Date of last order placed */
  lastOrderAt?: Date;
  /** Record creation timestamp */
  createdAt: Date;
  /** Record update timestamp */
  updatedAt: Date;
}

/**
 * Data for creating a new supplier
 */
export interface CreateSupplierInput {
  aliExpressId: string;
  name: string;
  storeUrl?: string;
  rating?: number;
  status?: SupplierStatus;
}

/**
 * Data for updating a supplier
 */
export interface UpdateSupplierInput {
  name?: string;
  storeUrl?: string;
  rating?: number;
  status?: SupplierStatus;
  totalOrders?: number;
  lastOrderAt?: Date;
}

// ============================================
// PRODUCT SOURCE TYPES
// ============================================

/**
 * Variant mapping for AliExpress SKU tracking
 */
export interface VariantMapping {
  /** Local variant SKU in Kids Petite system */
  localVariantSku: string;
  /** AliExpress SKU ID */
  aliExpressSku: string;
  /** AliExpress variant name */
  aliExpressVariantName: string;
}

/**
 * Links Kids Petite products to AliExpress source
 */
export interface ProductSource {
  /** Unique identifier */
  id: string;
  /** Sanity product document ID */
  sanityProductId: string;
  /** Product slug for quick lookups */
  productSlug: string;
  /** AliExpress product ID */
  aliExpressProductId: string;
  /** AliExpress product URL */
  aliExpressUrl: string;
  /** Default AliExpress SKU (if no variants) */
  aliExpressSku?: string;
  /** Supplier ID */
  supplierId: string;
  /** Supplier relation */
  supplier?: Supplier;
  /** Original cost price */
  originalPrice: number;
  /** Original currency code */
  originalCurrency: string;
  /** Category ID for markup calculation */
  categoryId: string;
  /** URLs to original AliExpress images */
  originalImageUrls: string[];
  /** Last sync timestamp */
  lastSyncedAt: Date;
  /** Source product status */
  sourceStatus: SourceStatus;
  /** Inventory availability status */
  inventoryStatus: InventoryStatus;
  /** Variant SKU mappings */
  variantMapping?: VariantMapping[];
  /** Record creation timestamp */
  createdAt: Date;
  /** Record update timestamp */
  updatedAt: Date;
}

/**
 * Data for creating a new product source
 */
export interface CreateProductSourceInput {
  sanityProductId: string;
  productSlug: string;
  aliExpressProductId: string;
  aliExpressUrl: string;
  aliExpressSku?: string;
  supplierId: string;
  originalPrice: number;
  originalCurrency?: string;
  categoryId: string;
  originalImageUrls: string[];
  variantMapping?: VariantMapping[];
}

/**
 * Data for updating a product source
 */
export interface UpdateProductSourceInput {
  aliExpressSku?: string;
  originalPrice?: number;
  originalCurrency?: string;
  originalImageUrls?: string[];
  lastSyncedAt?: Date;
  sourceStatus?: SourceStatus;
  inventoryStatus?: InventoryStatus;
  variantMapping?: VariantMapping[];
}

// ============================================
// DROPSHIP ORDER TYPES
// ============================================

/**
 * Shipping address for AliExpress orders
 */
export interface DropshipShippingAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

/**
 * Tracks orders placed on AliExpress for fulfillment
 */
export interface DropshipOrder {
  /** Unique identifier */
  id: string;
  /** Related Kids Petite order ID */
  orderId: string;
  /** AliExpress order ID (populated after placing order) */
  aliExpressOrderId?: string;
  /** AliExpress order status string */
  aliExpressOrderStatus?: string;
  /** Current fulfillment status */
  status: DropshipOrderStatus;
  /** Customer email for AliExpress order */
  customerEmail: string;
  /** Customer phone for AliExpress order */
  customerPhone?: string;
  /** Full shipping address for AliExpress */
  shippingAddress: DropshipShippingAddress;
  /** Tracking number from AliExpress */
  trackingNumber?: string;
  /** Tracking URL from AliExpress */
  trackingUrl?: string;
  /** Carrier name */
  carrier?: string;
  /** Estimated delivery date */
  estimatedDelivery?: Date;
  /** Actual delivery date */
  actualDelivery?: Date;
  /** Total cost paid to AliExpress */
  totalCost: number;
  /** Shipping cost paid to AliExpress */
  shippingCost: number;
  /** When order was placed on AliExpress */
  placedAt?: Date;
  /** When order was shipped by supplier */
  shippedAt?: Date;
  /** When order was delivered */
  deliveredAt?: Date;
  /** Items in this dropship order */
  items?: DropshipOrderItem[];
  /** Record creation timestamp */
  createdAt: Date;
  /** Record update timestamp */
  updatedAt: Date;
}

/**
 * Individual items in a dropship order
 */
export interface DropshipOrderItem {
  /** Unique identifier */
  id: string;
  /** Parent dropship order ID */
  dropshipOrderId: string;
  /** Dropship order relation */
  dropshipOrder?: DropshipOrder;
  /** Product source ID */
  productSourceId: string;
  /** Product source relation */
  productSource?: ProductSource;
  /** AliExpress SKU for this item */
  aliExpressSku: string;
  /** Quantity ordered */
  quantity: number;
  /** Unit cost from AliExpress */
  unitCost: number;
  /** Total cost for this line item */
  totalCost: number;
  /** Original Kids Petite order item ID */
  orderItemId: string;
  /** Record creation timestamp */
  createdAt: Date;
}

/**
 * Data for creating a new dropship order
 */
export interface CreateDropshipOrderInput {
  orderId: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: DropshipShippingAddress;
  totalCost: number;
  shippingCost?: number;
  items: CreateDropshipOrderItemInput[];
}

/**
 * Data for creating a dropship order item
 */
export interface CreateDropshipOrderItemInput {
  productSourceId: string;
  aliExpressSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  orderItemId: string;
}

/**
 * Data for updating a dropship order
 */
export interface UpdateDropshipOrderInput {
  aliExpressOrderId?: string;
  aliExpressOrderStatus?: string;
  status?: DropshipOrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  placedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

// ============================================
// CATEGORY PRICING TYPES
// ============================================

/**
 * Category pricing configuration for dropshipping
 */
export interface CategoryPricing {
  /** Category ID */
  categoryId: string;
  /** Category name */
  categoryName: string;
  /** Markup multiplier (e.g., 2.5 = 150% markup) */
  markupFactor: number;
  /** Additional shipping buffer in dollars */
  shippingBuffer: number;
  /** Minimum price floor */
  minPrice?: number;
  /** Maximum price ceiling */
  maxPrice?: number;
}

/**
 * Data for updating category pricing
 */
export interface UpdateCategoryPricingInput {
  markupFactor?: number;
  shippingBuffer?: number;
  minPrice?: number;
  maxPrice?: number;
}

// ============================================
// ALIEXPRESS SCRAPER TYPES
// ============================================

/**
 * AliExpress product variant data from scraper
 */
export interface AliExpressVariant {
  /** AliExpress SKU ID */
  skuId: string;
  /** Variant name/display name */
  name: string;
  /** Variant attributes (e.g., color, size) */
  attributes: Record<string, string>;
  /** Variant price */
  price: number;
  /** Available stock */
  stock: number;
  /** Variant image URL */
  image?: string;
}

/**
 * Shipping option from AliExpress
 */
export interface AliExpressShippingOption {
  /** Shipping method name */
  name: string;
  /** Shipping cost */
  cost: number;
  /** Estimated delivery days */
  estimatedDays: number;
  /** Carrier name */
  carrier?: string;
}

/**
 * Complete AliExpress product data from scraper
 */
export interface AliExpressProductData {
  /** AliExpress product ID */
  productId: string;
  /** Product title */
  title: string;
  /** Product description */
  description: string;
  /** Current price */
  price: number;
  /** Original price (before discount) */
  originalPrice?: number;
  /** Currency code */
  currency: string;
  /** Product images */
  images: string[];
  /** Product videos */
  videos?: string[];
  /** Available variants */
  variants: AliExpressVariant[];
  /** Product specifications */
  specifications: Record<string, string>;
  /** Available shipping options */
  shippingOptions: AliExpressShippingOption[];
  /** Supplier/store ID */
  supplierId: string;
  /** Supplier/store name */
  supplierName: string;
  /** Supplier store URL */
  storeUrl: string;
  /** Supplier rating */
  supplierRating?: number;
  /** Original product URL */
  productUrl: string;
  /** When data was scraped */
  scrapedAt: Date;
}

/**
 * Input for scraping an AliExpress product
 */
export interface ScrapeProductInput {
  /** AliExpress product URL */
  url: string;
  /** Whether to include images */
  includeImages?: boolean;
  /** Whether to include variants */
  includeVariants?: boolean;
  /** Whether to include shipping options */
  includeShipping?: boolean;
}

/**
 * Result of a product sync operation
 */
export interface ProductSyncResult {
  /** Whether sync was successful */
  success: boolean;
  /** Product source ID */
  productSourceId?: string;
  /** Sanity product ID */
  sanityProductId?: string;
  /** Error message if failed */
  error?: string;
  /** Whether price changed */
  priceChanged?: boolean;
  /** Whether inventory status changed */
  inventoryChanged?: boolean;
  /** Whether product is now unavailable */
  becameUnavailable?: boolean;
}
