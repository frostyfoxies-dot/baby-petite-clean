/**
 * Price Calculation Service
 * Handles retail price calculation based on category pricing settings
 */

import type { CategoryPricing } from '@/types/dropshipping';

// ============================================
// TYPES
// ============================================

/**
 * Result of price validation
 */
export interface PriceValidationResult {
  /** Whether the price is valid */
  isValid: boolean;
  /** Validation errors if any */
  errors: string[];
  /** Warnings (e.g., price near limits) */
  warnings: string[];
  /** The validated price (may be adjusted) */
  adjustedPrice?: number;
}

/**
 * Margin information
 */
export interface MarginInfo {
  /** Absolute profit margin in dollars */
  margin: number;
  /** Profit margin as percentage */
  marginPercentage: number;
  /** Markup factor applied */
  markupFactor: number;
  /** Cost price */
  costPrice: number;
  /** Retail price */
  retailPrice: number;
}

/**
 * Price breakdown for transparency
 */
export interface PriceBreakdown {
  /** Original cost price */
  costPrice: number;
  /** Price after markup */
  markedUpPrice: number;
  /** Price after shipping buffer */
  withShippingBuffer: number;
  /** Price after platform fees */
  withPlatformFees: number;
  /** Final rounded price */
  finalPrice: number;
  /** Applied markup factor */
  markupFactor: number;
  /** Applied shipping buffer */
  shippingBuffer: number;
  /** Applied platform fee percentage */
  platformFeePercentage: number;
}

/**
 * Default pricing configuration
 */
export const DEFAULT_PRICING_CONFIG: Required<Omit<CategoryPricing, 'categoryId' | 'categoryName'>> = {
  markupFactor: 2.5,
  shippingBuffer: 3.0,
  platformFees: 0.05, // 5%
  roundToNearest: 0.99,
  minPrice: undefined,
  maxPrice: undefined,
};

// ============================================
// PRICE CALCULATOR CLASS
// ============================================

/**
 * Price Calculator Service
 * Calculates retail prices based on category pricing configuration
 */
export class PriceCalculator {
  private defaultPlatformFees: number = DEFAULT_PRICING_CONFIG.platformFees;
  private defaultRoundToNearest: number = DEFAULT_PRICING_CONFIG.roundToNearest;

  /**
   * Calculate retail price based on category settings
   *
   * @param costPrice - The cost price from AliExpress
   * @param categoryPricing - Category pricing configuration
   * @returns The calculated retail price in dollars
   * @throws Error if costPrice is negative or markupFactor is less than 1.0
   *
   * @example
   * ```ts
   * const calculator = new PriceCalculator();
   * const retailPrice = calculator.calculateRetailPrice(5.99, {
   *   categoryId: 'cat123',
   *   categoryName: 'Bodysuits',
   *   markupFactor: 2.5,
   *   shippingBuffer: 3.0,
   * });
   * // Returns: 19.99
   * ```
   */
  calculateRetailPrice(
    costPrice: number,
    categoryPricing: CategoryPricing
  ): number {
    const breakdown = this.calculatePriceBreakdown(costPrice, categoryPricing);
    return breakdown.finalPrice;
  }

  /**
   * Get detailed price breakdown
   *
   * @param costPrice - The cost price from AliExpress
   * @param categoryPricing - Category pricing configuration
   * @returns Detailed price breakdown
   * @throws Error if costPrice is negative or markupFactor is less than 1.0
   */
  calculatePriceBreakdown(
    costPrice: number,
    categoryPricing: CategoryPricing
  ): PriceBreakdown {
    // Validate inputs
    if (costPrice < 0) {
      throw new Error('Cost price cannot be negative');
    }

    // Get pricing values with defaults
    const markupFactor = categoryPricing.markupFactor ?? DEFAULT_PRICING_CONFIG.markupFactor;

    if (markupFactor < 1.0) {
      throw new Error('Markup factor must be at least 1.0 to avoid selling at a loss');
    }

    const shippingBuffer = categoryPricing.shippingBuffer ?? DEFAULT_PRICING_CONFIG.shippingBuffer;
    const platformFees = this.defaultPlatformFees;
    const roundToNearest = this.defaultRoundToNearest;

    // Calculate price steps
    const markedUpPrice = costPrice * markupFactor;
    const withShippingBuffer = markedUpPrice + shippingBuffer;
    const withPlatformFees = withShippingBuffer * (1 + platformFees);

    // Round to .99
    let finalPrice = Math.floor(withPlatformFees) + roundToNearest;

    // Apply min/max constraints
    if (categoryPricing.minPrice !== undefined && finalPrice < categoryPricing.minPrice) {
      finalPrice = categoryPricing.minPrice;
    }
    if (categoryPricing.maxPrice !== undefined && finalPrice > categoryPricing.maxPrice) {
      finalPrice = categoryPricing.maxPrice;
    }

    return {
      costPrice,
      markedUpPrice,
      withShippingBuffer,
      withPlatformFees,
      finalPrice,
      markupFactor,
      shippingBuffer,
      platformFeePercentage: platformFees,
    };
  }

  /**
   * Validate price against category constraints
   *
   * @param retailPrice - The retail price to validate
   * @param categoryPricing - Category pricing configuration
   * @returns Validation result with any errors or warnings
   */
  validatePrice(
    retailPrice: number,
    categoryPricing: CategoryPricing
  ): PriceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let adjustedPrice: number | undefined;

    // Check minimum price
    if (categoryPricing.minPrice !== undefined && retailPrice < categoryPricing.minPrice) {
      errors.push(`Price $${retailPrice.toFixed(2)} is below minimum $${categoryPricing.minPrice.toFixed(2)}`);
      adjustedPrice = categoryPricing.minPrice;
    }

    // Check maximum price
    if (categoryPricing.maxPrice !== undefined && retailPrice > categoryPricing.maxPrice) {
      errors.push(`Price $${retailPrice.toFixed(2)} is above maximum $${categoryPricing.maxPrice.toFixed(2)}`);
      adjustedPrice = categoryPricing.maxPrice;
    }

    // Check if price is reasonable (warning only)
    if (retailPrice < 5) {
      warnings.push('Price is very low. Consider if this covers costs and fees.');
    }
    if (retailPrice > 200) {
      warnings.push('Price is very high. This may affect conversion rates.');
    }

    // Check margin warning
    const markupFactor = categoryPricing.markupFactor ?? DEFAULT_PRICING_CONFIG.markupFactor;
    if (markupFactor < 2) {
      warnings.push(`Markup factor of ${markupFactor}x is low. Consider higher markup for better margins.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      adjustedPrice,
    };
  }

  /**
   * Calculate profit margin
   *
   * @param costPrice - The cost price
   * @param retailPrice - The retail price
   * @returns Margin information
   */
  calculateMargin(costPrice: number, retailPrice: number): MarginInfo {
    const margin = retailPrice - costPrice;
    const marginPercentage = costPrice > 0 ? (margin / retailPrice) * 100 : 0;
    const markupFactor = costPrice > 0 ? retailPrice / costPrice : 0;

    return {
      margin,
      marginPercentage,
      markupFactor,
      costPrice,
      retailPrice,
    };
  }

  /**
   * Calculate price for a variant with different cost
   *
   * @param baseCostPrice - Base product cost price
   * @param variantCostPrice - Variant cost price (if different)
   * @param categoryPricing - Category pricing configuration
   * @returns Calculated variant price
   */
  calculateVariantPrice(
    baseCostPrice: number,
    variantCostPrice: number,
    categoryPricing: CategoryPricing
  ): number {
    // If variant has its own cost, use it; otherwise use base
    const effectiveCost = variantCostPrice > 0 ? variantCostPrice : baseCostPrice;
    return this.calculateRetailPrice(effectiveCost, categoryPricing);
  }

  /**
   * Calculate compare-at price (original/higher price for showing discount)
   *
   * @param retailPrice - Current retail price
   * @param markupPercent - Additional markup percentage (default: 20%)
   * @returns Compare-at price
   */
  calculateCompareAtPrice(retailPrice: number, markupPercent: number = 20): number {
    const compareAt = retailPrice * (1 + markupPercent / 100);
    // Round to .99
    return Math.floor(compareAt) + DEFAULT_PRICING_CONFIG.roundToNearest;
  }

  /**
   * Check if a price change is significant enough to trigger alerts
   *
   * @param oldPrice - Previous price
   * @param newPrice - New price
   * @param thresholdPercent - Threshold percentage for significance (default: 10%)
   * @returns Whether the change is significant
   */
  isPriceChangeSignificant(
    oldPrice: number,
    newPrice: number,
    thresholdPercent: number = 10
  ): boolean {
    if (oldPrice === 0) return newPrice > 0;
    const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
    return changePercent >= thresholdPercent;
  }

  /**
   * Convert price to cents for storage
   *
   * @param price - Price in dollars
   * @returns Price in cents
   */
  toCents(price: number): number {
    return Math.round(price * 100);
  }

  /**
   * Convert price from cents to dollars
   *
   * @param cents - Price in cents
   * @returns Price in dollars
   */
  fromCents(cents: number): number {
    return cents / 100;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let priceCalculatorInstance: PriceCalculator | null = null;

/**
 * Get the singleton price calculator instance
 */
export function getPriceCalculator(): PriceCalculator {
  if (!priceCalculatorInstance) {
    priceCalculatorInstance = new PriceCalculator();
  }
  return priceCalculatorInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Calculate retail price (convenience function)
 */
export function calculateRetailPrice(
  costPrice: number,
  categoryPricing: CategoryPricing
): number {
  return getPriceCalculator().calculateRetailPrice(costPrice, categoryPricing);
}

/**
 * Calculate margin (convenience function)
 */
export function calculateMargin(costPrice: number, retailPrice: number): MarginInfo {
  return getPriceCalculator().calculateMargin(costPrice, retailPrice);
}

/**
 * Validate price (convenience function)
 */
export function validatePrice(
  retailPrice: number,
  categoryPricing: CategoryPricing
): PriceValidationResult {
  return getPriceCalculator().validatePrice(retailPrice, categoryPricing);
}
