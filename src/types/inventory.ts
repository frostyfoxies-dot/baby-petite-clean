/**
 * Inventory types for the Kids Petite e-commerce platform
 */

/**
 * Represents inventory for a product variant
 */
export interface Inventory {
  /** Unique identifier */
  id: string;
  /** ID of the product variant */
  variantId: string;
  /** Current quantity in stock */
  quantity: number;
  /** Threshold for low stock alerts */
  lowStockThreshold: number;
  /** Quantity reserved for pending orders */
  reservedQuantity: number;
  /** Inventory record creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Input type for inventory updates
 */
export interface InventoryUpdate {
  /** ID of the product variant */
  variantId: string;
  /** New quantity to set or adjust */
  quantity: number;
  /** Reason for the inventory update */
  reason: string;
}
