/**
 * Stock Validation Service
 * Validates product stock availability for AliExpress products
 */

import type { AliExpressProductData, AliExpressVariant } from '@/types/dropshipping';

/**
 * Result of stock validation
 */
export interface StockValidationResult {
  /** Whether the product has valid stock */
  isValid: boolean;
  /** Variants that are in stock */
  availableVariants: AliExpressVariant[];
  /** SKUs of variants that are out of stock */
  outOfStockVariants: string[];
  /** Human-readable message about stock status */
  message: string;
  /** Total available stock across all variants */
  totalAvailableStock: number;
  /** Whether all variants are out of stock */
  isCompletelyOutOfStock: boolean;
  /** Whether some variants are out of stock */
  hasPartialStock: boolean;
}

/**
 * Configuration for stock validation
 */
export interface StockValidatorConfig {
  /** Minimum stock threshold to consider a variant as available (default: 1) */
  minStockThreshold?: number;
  /** Whether to reject products with any out-of-stock variants (default: false) */
  rejectOnPartialStock?: boolean;
  /** Maximum out-of-stock variants allowed (default: Infinity) */
  maxOutOfStockVariants?: number;
  /** Minimum percentage of variants that must be in stock (default: 0) */
  minInStockPercentage?: number;
}

/**
 * Default stock validator configuration
 */
const DEFAULT_CONFIG: Required<StockValidatorConfig> = {
  minStockThreshold: 1,
  rejectOnPartialStock: false,
  maxOutOfStockVariants: Infinity,
  minInStockPercentage: 0,
};

/**
 * Stock Validator Service
 * Validates stock availability for AliExpress products
 */
export class StockValidator {
  private config: Required<StockValidatorConfig>;

  constructor(config?: StockValidatorConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate stock for all variants of a product
   * @param product - Product data from scraper
   * @returns Stock validation result
   */
  validateProductStock(product: AliExpressProductData): StockValidationResult {
    const variants = product.variants || [];

    // Handle products without variants
    if (variants.length === 0) {
      return this.validateNoVariantProduct(product);
    }

    // Separate available and out-of-stock variants
    const availableVariants: AliExpressVariant[] = [];
    const outOfStockVariants: string[] = [];

    for (const variant of variants) {
      if (this.isVariantInStock(variant)) {
        availableVariants.push(variant);
      } else {
        outOfStockVariants.push(variant.skuId);
      }
    }

    // Calculate totals
    const totalAvailableStock = availableVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const isCompletelyOutOfStock = availableVariants.length === 0;
    const hasPartialStock = outOfStockVariants.length > 0 && availableVariants.length > 0;

    // Determine validity
    const isValid = this.determineValidity(
      availableVariants.length,
      outOfStockVariants.length,
      variants.length
    );

    // Generate message
    const message = this.generateMessage(
      isValid,
      availableVariants.length,
      outOfStockVariants.length,
      variants.length,
      totalAvailableStock
    );

    return {
      isValid,
      availableVariants,
      outOfStockVariants,
      message,
      totalAvailableStock,
      isCompletelyOutOfStock,
      hasPartialStock,
    };
  }

  /**
   * Validate a product without variants
   */
  private validateNoVariantProduct(product: AliExpressProductData): StockValidationResult {
    // For products without variants, check product-level stock
    const hasStock = product.stock !== undefined && product.stock >= this.config.minStockThreshold;
    const isValid = hasStock;
    
    let message: string;
    if (hasStock) {
      message = `Product in stock (${product.stock} units available)`;
    } else if (product.stock === 0) {
      message = 'Product is out of stock';
    } else {
      message = 'Product stock status unknown - assumed unavailable';
    }

    return {
      isValid,
      availableVariants: [],
      outOfStockVariants: [],
      message,
      totalAvailableStock: hasStock ? (product.stock || 0) : 0,
      isCompletelyOutOfStock: !hasStock,
      hasPartialStock: false,
    };
  }

  /**
   * Check if a variant is in stock
   * @param variant - Variant to check
   * @returns True if variant is in stock
   */
  private isVariantInStock(variant: AliExpressVariant): boolean {
    // Check if stock is explicitly 0
    if (variant.stock === 0) {
      return false;
    }

    // Check against minimum threshold
    if (variant.stock !== undefined && variant.stock < this.config.minStockThreshold) {
      return false;
    }

    // If stock is undefined, assume it's available
    return true;
  }

  /**
   * Determine if the product passes validation
   */
  private determineValidity(
    availableCount: number,
    outOfStockCount: number,
    totalCount: number
  ): boolean {
    // All variants out of stock
    if (availableCount === 0) {
      return false;
    }

    // Reject on partial stock setting
    if (this.config.rejectOnPartialStock && outOfStockCount > 0) {
      return false;
    }

    // Max out-of-stock variants check
    if (outOfStockCount > this.config.maxOutOfStockVariants) {
      return false;
    }

    // Minimum in-stock percentage check
    if (totalCount > 0) {
      const inStockPercentage = (availableCount / totalCount) * 100;
      if (inStockPercentage < this.config.minInStockPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate a human-readable message about stock status
   */
  private generateMessage(
    isValid: boolean,
    availableCount: number,
    outOfStockCount: number,
    totalCount: number,
    totalStock: number
  ): string {
    if (!isValid) {
      if (availableCount === 0) {
        return 'Product is completely out of stock';
      }
      if (this.config.rejectOnPartialStock && outOfStockCount > 0) {
        return `Product rejected: ${outOfStockCount} variant(s) out of stock (partial stock not allowed)`;
      }
      if (outOfStockCount > this.config.maxOutOfStockVariants) {
        return `Product rejected: ${outOfStockCount} variant(s) out of stock exceeds maximum allowed (${this.config.maxOutOfStockVariants})`;
      }
      const inStockPercentage = (availableCount / totalCount) * 100;
      if (inStockPercentage < this.config.minInStockPercentage) {
        return `Product rejected: Only ${inStockPercentage.toFixed(1)}% variants in stock (minimum: ${this.config.minInStockPercentage}%)`;
      }
    }

    if (outOfStockCount === 0) {
      return `All ${totalCount} variant(s) in stock (total: ${totalStock} units)`;
    }

    return `${availableCount} of ${totalCount} variant(s) in stock, ${outOfStockCount} out of stock (total available: ${totalStock} units)`;
  }

  /**
   * Check if a product should be rejected based on validation result
   * @param validation - Stock validation result
   * @returns True if product should be rejected
   */
  shouldRejectProduct(validation: StockValidationResult): boolean {
    return !validation.isValid;
  }

  /**
   * Get variants that should be hidden due to out of stock
   * @param validation - Stock validation result
   * @returns Array of SKU IDs that should be hidden
   */
  getVariantsToHide(validation: StockValidationResult): string[] {
    return validation.outOfStockVariants;
  }

  /**
   * Check if product needs stock sync/update
   * @param validation - Stock validation result
   * @returns True if product needs stock update
   */
  needsStockUpdate(validation: StockValidationResult): boolean {
    return validation.hasPartialStock || validation.isCompletelyOutOfStock;
  }

  /**
   * Get stock status for a specific variant
   * @param product - Product data
   * @param skuId - SKU ID to check
   * @returns Stock status object
   */
  getVariantStockStatus(
    product: AliExpressProductData,
    skuId: string
  ): { exists: boolean; inStock: boolean; stock?: number } {
    const variant = product.variants?.find((v) => v.skuId === skuId);

    if (!variant) {
      return { exists: false, inStock: false };
    }

    return {
      exists: true,
      inStock: this.isVariantInStock(variant),
      stock: variant.stock,
    };
  }

  /**
   * Calculate inventory health score (0-100)
   * Higher score means better inventory health
   * @param validation - Stock validation result
   * @returns Health score from 0 to 100
   */
  calculateInventoryHealthScore(validation: StockValidationResult): number {
    if (validation.isCompletelyOutOfStock) {
      return 0;
    }

    const totalVariants = validation.availableVariants.length + validation.outOfStockVariants.length;
    if (totalVariants === 0) {
      return 100; // No variants = assume healthy
    }

    const inStockRatio = validation.availableVariants.length / totalVariants;

    // Factor in total stock quantity
    const stockQuantityScore = Math.min(validation.totalAvailableStock / 100, 1);

    // Weight: 70% variant availability, 30% stock quantity
    const score = inStockRatio * 70 + stockQuantityScore * 30;

    return Math.round(score);
  }

  /**
   * Get recommended action for a product based on stock status
   * @param validation - Stock validation result
   * @returns Recommended action
   */
  getRecommendedAction(validation: StockValidationResult): StockAction {
    if (validation.isCompletelyOutOfStock) {
      return {
        action: 'HIDE_PRODUCT',
        priority: 'HIGH',
        message: 'Product is completely out of stock - consider hiding or marking as unavailable',
      };
    }

    if (validation.hasPartialStock) {
      const healthScore = this.calculateInventoryHealthScore(validation);
      if (healthScore < 30) {
        return {
          action: 'HIDE_VARIANTS',
          priority: 'MEDIUM',
          message: 'Low inventory health - consider hiding out-of-stock variants',
        };
      }
      return {
        action: 'UPDATE_STOCK',
        priority: 'LOW',
        message: 'Some variants out of stock - update inventory display',
      };
    }

    return {
      action: 'NONE',
      priority: 'LOW',
      message: 'All variants in stock - no action needed',
    };
  }
}

/**
 * Recommended action for stock management
 */
export interface StockAction {
  /** Action type */
  action: 'NONE' | 'UPDATE_STOCK' | 'HIDE_VARIANTS' | 'HIDE_PRODUCT';
  /** Priority level */
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Human-readable message */
  message: string;
}

// Export singleton instance for convenience
let validatorInstance: StockValidator | null = null;

/**
 * Get or create a stock validator instance
 * @param config - Validator configuration
 * @returns StockValidator instance
 */
export function getStockValidator(config?: StockValidatorConfig): StockValidator {
  if (!validatorInstance) {
    validatorInstance = new StockValidator(config);
  }
  return validatorInstance;
}
