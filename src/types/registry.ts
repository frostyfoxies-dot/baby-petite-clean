/**
 * Registry types for the Kids Petite e-commerce platform
 */

import type { User } from './user';
import type { ProductVariant } from './product';

/** Registry status enumeration */
export type RegistryStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

/** Priority level enumeration */
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Represents a gift registry
 */
export interface Registry {
  /** Unique identifier */
  id: string;
  /** ID of the user who owns this registry */
  userId: string;
  /** User who owns this registry (optional, populated on fetch) */
  user?: User;
  /** Registry name (e.g., "Baby Smith's Registry") */
  name: string;
  /** Registry description (optional) */
  description?: string;
  /** Event date (e.g., baby shower date) */
  eventDate?: Date;
  /** Unique share code for registry access */
  shareCode: string;
  /** Whether the registry is publicly accessible */
  isPublic: boolean;
  /** Current registry status */
  status: RegistryStatus;
  /** Items in the registry */
  items: RegistryItem[];
  /** Registry creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents an item in a gift registry
 */
export interface RegistryItem {
  /** Unique identifier */
  id: string;
  /** ID of the registry this item belongs to */
  registryId: string;
  /** ID of the product variant */
  variantId: string;
  /** Product variant details */
  variant: ProductVariant;
  /** Quantity desired */
  quantity: number;
  /** Quantity already purchased */
  quantityPurchased: number;
  /** Priority level for this item */
  priority: Priority;
  /** Notes about this item (optional) */
  notes?: string;
  /** Item creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents a child's growth measurement entry
 */
export interface GrowthEntry {
  /** Unique identifier */
  id: string;
  /** ID of the user who owns this entry */
  userId: string;
  /** Child's name */
  childName: string;
  /** Child's birth date */
  childBirthDate: Date;
  /** Height measurement in cm (optional) */
  height?: number;
  /** Weight measurement in kg (optional) */
  weight?: number;
  /** Date when measurement was recorded */
  recordedAt: Date;
  /** Notes about this measurement (optional) */
  notes?: string;
  /** Entry creation timestamp */
  createdAt: Date;
}

/**
 * Represents a size prediction based on growth data
 */
export interface SizePrediction {
  /** Current recommended size */
  currentSize: string;
  /** Predicted future size */
  predictedSize: string;
  /** Confidence level of prediction (0-1) */
  confidence: number;
  /** Human-readable recommendation */
  recommendation: string;
  /** Growth percentile (optional) */
  growthPercentile?: number;
}
