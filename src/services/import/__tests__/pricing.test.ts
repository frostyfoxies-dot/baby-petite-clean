/**
 * Unit Tests for Price Calculation Service
 * Tests for retail price calculation, validation, and margin calculations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PriceCalculator,
  getPriceCalculator,
  calculateRetailPrice,
  calculateMargin,
  validatePrice,
  DEFAULT_PRICING_CONFIG,
  type PriceBreakdown,
  type MarginInfo,
  type PriceValidationResult,
} from '../pricing';
import type { CategoryPricing } from '@/types/dropshipping';

// ============================================
// Test Fixtures
// ============================================

const defaultCategoryPricing: CategoryPricing = {
  categoryId: 'cat-123',
  categoryName: 'Test Category',
  markupFactor: 2.5,
  shippingBuffer: 3.0,
  platformFees: 0.05,
  roundToNearest: 0.99,
};

const categoryWithMinMax: CategoryPricing = {
  categoryId: 'cat-456',
  categoryName: 'Premium Category',
  markupFactor: 3.0,
  shippingBuffer: 5.0,
  minPrice: 15.0,
  maxPrice: 200.0,
};

const categoryWithLowMarkup: CategoryPricing = {
  categoryId: 'cat-789',
  categoryName: 'Budget Category',
  markupFactor: 1.5,
  shippingBuffer: 2.0,
};

// ============================================
// PriceCalculator Class Tests
// ============================================

describe('PriceCalculator', () => {
  let calculator: PriceCalculator;

  beforeEach(() => {
    calculator = new PriceCalculator();
  });

  // ============================================
  // calculateRetailPrice Tests
  // ============================================

  describe('calculateRetailPrice', () => {
    it('should calculate retail price with default settings', () => {
      const costPrice = 10.0;
      const result = calculator.calculateRetailPrice(costPrice, defaultCategoryPricing);

      // Expected: (10 * 2.5 + 3.0) * 1.05 = 29.25, rounded to 28.99
      expect(result).toBe(28.99);
    });

    it('should handle zero cost price', () => {
      const result = calculator.calculateRetailPrice(0, defaultCategoryPricing);
      // Expected: (0 * 2.5 + 3.0) * 1.05 = 3.15, rounded to 2.99
      expect(result).toBe(2.99);
    });

    it('should handle very small cost prices', () => {
      const result = calculator.calculateRetailPrice(0.01, defaultCategoryPricing);
      // Expected: (0.01 * 2.5 + 3.0) * 1.05 = 3.17625, rounded to 2.99
      expect(result).toBe(2.99);
    });

    it('should handle large cost prices', () => {
      const result = calculator.calculateRetailPrice(1000, defaultCategoryPricing);
      // Expected: (1000 * 2.5 + 3.0) * 1.05 = 2628.15, rounded to 2628.99
      expect(result).toBe(2628.99);
    });

    it('should apply minimum price constraint', () => {
      const result = calculator.calculateRetailPrice(1.0, categoryWithMinMax);
      // Without min: (1 * 3 + 5) * 1.05 = 8.4, rounded to 7.99
      // With min of 15: should be 15
      expect(result).toBe(15.0);
    });

    it('should apply maximum price constraint', () => {
      const result = calculator.calculateRetailPrice(100, categoryWithMinMax);
      // Without max: (100 * 3 + 5) * 1.05 = 320.25, rounded to 319.99
      // With max of 200: should be 200
      expect(result).toBe(200.0);
    });

    it('should use default values when category pricing is partial', () => {
      const partialPricing: CategoryPricing = {
        categoryId: 'cat-partial',
        categoryName: 'Partial Category',
      };
      
      const result = calculator.calculateRetailPrice(10, partialPricing);
      // Should use default markupFactor (2.5), shippingBuffer (3.0)
      expect(result).toBe(28.99);
    });

    it('should handle decimal cost prices correctly', () => {
      const result = calculator.calculateRetailPrice(5.99, defaultCategoryPricing);
      // Expected: (5.99 * 2.5 + 3.0) * 1.05 = 19.02375, rounded to 18.99
      expect(result).toBe(18.99);
    });

    it('should handle very high markup factors', () => {
      const highMarkupPricing: CategoryPricing = {
        categoryId: 'cat-high',
        categoryName: 'High Markup',
        markupFactor: 10.0,
        shippingBuffer: 5.0,
      };
      
      const result = calculator.calculateRetailPrice(10, highMarkupPricing);
      // Expected: (10 * 10 + 5) * 1.05 = 110.25, rounded to 109.99
      expect(result).toBe(109.99);
    });

    it('should handle markup factor of 1 (no markup)', () => {
      const noMarkupPricing: CategoryPricing = {
        categoryId: 'cat-no-markup',
        categoryName: 'No Markup',
        markupFactor: 1.0,
        shippingBuffer: 0,
      };
      
      const result = calculator.calculateRetailPrice(10, noMarkupPricing);
      // Expected: (10 * 1 + 0) * 1.05 = 10.5, rounded to 9.99
      // BUG: This results in a price LOWER than cost after rounding!
      expect(result).toBe(9.99);
    });

    it('should handle markup factor below 1 (loss)', () => {
      const lossPricing: CategoryPricing = {
        categoryId: 'cat-loss',
        categoryName: 'Loss Category',
        markupFactor: 0.5,
        shippingBuffer: 0,
      };
      
      const result = calculator.calculateRetailPrice(10, lossPricing);
      // Expected: (10 * 0.5 + 0) * 1.05 = 5.25, rounded to 4.99
      // BUG: No validation for markup < 1, results in selling at a loss
      expect(result).toBe(4.99);
    });

    it('should handle negative cost price', () => {
      // BUG: No validation for negative cost prices
      const result = calculator.calculateRetailPrice(-10, defaultCategoryPricing);
      // Expected: (-10 * 2.5 + 3.0) * 1.05 = -23.25, rounded to -24.01
      // This is a bug - negative prices should be handled
      expect(result).toBeLessThan(0);
    });
  });

  // ============================================
  // calculatePriceBreakdown Tests
  // ============================================

  describe('calculatePriceBreakdown', () => {
    it('should return detailed price breakdown', () => {
      const breakdown = calculator.calculatePriceBreakdown(10, defaultCategoryPricing);

      expect(breakdown).toHaveProperty('costPrice', 10);
      expect(breakdown).toHaveProperty('markedUpPrice');
      expect(breakdown).toHaveProperty('withShippingBuffer');
      expect(breakdown).toHaveProperty('withPlatformFees');
      expect(breakdown).toHaveProperty('finalPrice');
      expect(breakdown).toHaveProperty('markupFactor');
      expect(breakdown).toHaveProperty('shippingBuffer');
      expect(breakdown).toHaveProperty('platformFeePercentage');
    });

    it('should calculate correct breakdown values', () => {
      const breakdown = calculator.calculatePriceBreakdown(10, defaultCategoryPricing);

      // markedUpPrice = 10 * 2.5 = 25
      expect(breakdown.markedUpPrice).toBe(25);
      
      // withShippingBuffer = 25 + 3 = 28
      expect(breakdown.withShippingBuffer).toBe(28);
      
      // withPlatformFees = 28 * 1.05 = 29.4
      expect(breakdown.withPlatformFees).toBe(29.4);
      
      // finalPrice = floor(29.4) + 0.99 = 28.99
      expect(breakdown.finalPrice).toBe(28.99);
    });

    it('should show when min price constraint is applied', () => {
      const breakdown = calculator.calculatePriceBreakdown(1, categoryWithMinMax);
      
      // Without min: would be ~7.99
      // With min: should be 15
      expect(breakdown.finalPrice).toBe(15);
      // BUG: breakdown doesn't indicate that min/max was applied
    });

    it('should show when max price constraint is applied', () => {
      const breakdown = calculator.calculatePriceBreakdown(100, categoryWithMinMax);
      
      // Without max: would be ~319.99
      // With max: should be 200
      expect(breakdown.finalPrice).toBe(200);
    });
  });

  // ============================================
  // validatePrice Tests
  // ============================================

  describe('validatePrice', () => {
    it('should return valid for price within constraints', () => {
      const result = calculator.validatePrice(25, defaultCategoryPricing);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for price below minimum', () => {
      const result = calculator.validatePrice(10, categoryWithMinMax);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('below minimum'));
      expect(result.adjustedPrice).toBe(15);
    });

    it('should return error for price above maximum', () => {
      const result = calculator.validatePrice(250, categoryWithMinMax);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('above maximum'));
      expect(result.adjustedPrice).toBe(200);
    });

    it('should warn for very low prices', () => {
      const result = calculator.validatePrice(4, defaultCategoryPricing);

      expect(result.warnings).toContainEqual(expect.stringContaining('very low'));
    });

    it('should warn for very high prices', () => {
      const result = calculator.validatePrice(250, defaultCategoryPricing);

      expect(result.warnings).toContainEqual(expect.stringContaining('very high'));
    });

    it('should warn for low markup factor', () => {
      const result = calculator.validatePrice(25, categoryWithLowMarkup);

      expect(result.warnings).toContainEqual(expect.stringContaining('Markup factor'));
    });

    it('should handle zero price', () => {
      const result = calculator.validatePrice(0, defaultCategoryPricing);

      // Zero price should trigger low price warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle negative price', () => {
      // BUG: No explicit handling for negative prices
      const result = calculator.validatePrice(-10, defaultCategoryPricing);
      
      // Negative price triggers low price warning but no specific error
      expect(result.warnings).toContainEqual(expect.stringContaining('very low'));
    });

    it('should not adjust price when within range', () => {
      const result = calculator.validatePrice(50, categoryWithMinMax);

      expect(result.adjustedPrice).toBeUndefined();
    });
  });

  // ============================================
  // calculateMargin Tests
  // ============================================

  describe('calculateMargin', () => {
    it('should calculate margin correctly', () => {
      const margin = calculator.calculateMargin(10, 25);

      expect(margin.margin).toBe(15);
      expect(margin.marginPercentage).toBe(60); // 15/25 * 100
      expect(margin.markupFactor).toBe(2.5);
    });

    it('should handle zero retail price', () => {
      const margin = calculator.calculateMargin(10, 0);

      // BUG: Division by zero potential - marginPercentage would be NaN or Infinity
      // Looking at implementation: marginPercentage = costPrice > 0 ? (margin / retailPrice) * 100 : 0
      // But retailPrice is 0, so margin / retailPrice = Infinity
      expect(margin.margin).toBe(-10);
      expect(margin.marginPercentage).toBe(0); // Due to costPrice > 0 check
    });

    it('should handle zero cost price', () => {
      const margin = calculator.calculateMargin(0, 25);

      expect(margin.margin).toBe(25);
      expect(margin.marginPercentage).toBe(100); // 100% margin when cost is 0
      expect(margin.markupFactor).toBe(Infinity); // 25/0
    });

    it('should handle equal cost and retail price', () => {
      const margin = calculator.calculateMargin(25, 25);

      expect(margin.margin).toBe(0);
      expect(margin.marginPercentage).toBe(0);
      expect(margin.markupFactor).toBe(1);
    });

    it('should handle retail price below cost (loss)', () => {
      const margin = calculator.calculateMargin(25, 10);

      expect(margin.margin).toBe(-15);
      expect(margin.marginPercentage).toBe(-150); // -15/10 * 100
      expect(margin.markupFactor).toBe(0.4);
    });

    it('should handle very large numbers', () => {
      const margin = calculator.calculateMargin(1000000, 2500000);

      expect(margin.margin).toBe(1500000);
      expect(margin.marginPercentage).toBe(60);
      expect(margin.markupFactor).toBe(2.5);
    });

    it('should handle decimal precision correctly', () => {
      const margin = calculator.calculateMargin(9.99, 24.99);

      expect(margin.margin).toBeCloseTo(15, 2);
      expect(margin.marginPercentage).toBeCloseTo(60.02, 1);
    });
  });

  // ============================================
  // calculateVariantPrice Tests
  // ============================================

  describe('calculateVariantPrice', () => {
    it('should use variant cost when provided', () => {
      const result = calculator.calculateVariantPrice(10, 15, defaultCategoryPricing);
      
      // Should use 15 as cost, not 10
      expect(result).toBeGreaterThan(calculator.calculateRetailPrice(10, defaultCategoryPricing));
    });

    it('should fall back to base cost when variant cost is 0', () => {
      const result = calculator.calculateVariantPrice(10, 0, defaultCategoryPricing);
      
      // Should use 10 as cost
      expect(result).toBe(calculator.calculateRetailPrice(10, defaultCategoryPricing));
    });

    it('should fall back to base cost when variant cost is negative', () => {
      // BUG: Negative variant cost is not validated
      const result = calculator.calculateVariantPrice(10, -5, defaultCategoryPricing);
      
      // Uses base cost because variantCost > 0 check fails
      expect(result).toBe(calculator.calculateRetailPrice(10, defaultCategoryPricing));
    });
  });

  // ============================================
  // calculateCompareAtPrice Tests
  // ============================================

  describe('calculateCompareAtPrice', () => {
    it('should calculate compare-at price with default markup', () => {
      const result = calculator.calculateCompareAtPrice(25);
      
      // 25 * 1.20 = 30, rounded to 29.99
      expect(result).toBe(29.99);
    });

    it('should calculate compare-at price with custom markup', () => {
      const result = calculator.calculateCompareAtPrice(25, 50);
      
      // 25 * 1.50 = 37.5, rounded to 36.99
      expect(result).toBe(36.99);
    });

    it('should handle zero retail price', () => {
      const result = calculator.calculateCompareAtPrice(0);
      
      expect(result).toBe(0.99); // 0 * 1.20 = 0, rounded to 0.99
    });

    it('should handle zero markup percentage', () => {
      const result = calculator.calculateCompareAtPrice(25, 0);
      
      // 25 * 1.0 = 25, rounded to 24.99
      // BUG: Compare-at price is LOWER than retail price with 0% markup!
      expect(result).toBe(24.99);
    });

    it('should handle negative markup percentage', () => {
      // BUG: No validation for negative markup
      const result = calculator.calculateCompareAtPrice(25, -10);
      
      // 25 * 0.9 = 22.5, rounded to 21.99
      // Compare-at price is LOWER than retail price!
      expect(result).toBeLessThan(25);
    });
  });

  // ============================================
  // isPriceChangeSignificant Tests
  // ============================================

  describe('isPriceChangeSignificant', () => {
    it('should return true for significant price increase', () => {
      const result = calculator.isPriceChangeSignificant(100, 120, 10);
      
      expect(result).toBe(true); // 20% change
    });

    it('should return true for significant price decrease', () => {
      const result = calculator.isPriceChangeSignificant(100, 80, 10);
      
      expect(result).toBe(true); // 20% change
    });

    it('should return false for minor price change', () => {
      const result = calculator.isPriceChangeSignificant(100, 105, 10);
      
      expect(result).toBe(false); // 5% change
    });

    it('should return true when threshold is exactly met', () => {
      const result = calculator.isPriceChangeSignificant(100, 110, 10);
      
      expect(result).toBe(true); // Exactly 10% change
    });

    it('should handle zero old price', () => {
      const result = calculator.isPriceChangeSignificant(0, 10, 10);
      
      expect(result).toBe(true); // Any change from 0 is significant
    });

    it('should handle zero new price', () => {
      const result = calculator.isPriceChangeSignificant(100, 0, 10);
      
      expect(result).toBe(true); // 100% change
    });

    it('should handle both prices being zero', () => {
      const result = calculator.isPriceChangeSignificant(0, 0, 10);
      
      // BUG: 0 > 0 is false, so returns false
      // But this is a degenerate case
      expect(result).toBe(false);
    });

    it('should handle negative prices', () => {
      // BUG: No validation for negative prices
      const result = calculator.isPriceChangeSignificant(-100, -80, 10);
      
      // Math.abs((-80 - -100) / -100) * 100 = 20%
      expect(result).toBe(true);
    });
  });

  // ============================================
  // toCents / fromCents Tests
  // ============================================

  describe('toCents / fromCents', () => {
    it('should convert dollars to cents correctly', () => {
      expect(calculator.toCents(10)).toBe(1000);
      expect(calculator.toCents(10.99)).toBe(1099);
      expect(calculator.toCents(0.01)).toBe(1);
    });

    it('should convert cents to dollars correctly', () => {
      expect(calculator.fromCents(1000)).toBe(10);
      expect(calculator.fromCents(1099)).toBe(10.99);
      expect(calculator.fromCents(1)).toBe(0.01);
    });

    it('should handle zero values', () => {
      expect(calculator.toCents(0)).toBe(0);
      expect(calculator.fromCents(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(calculator.toCents(-10)).toBe(-1000);
      expect(calculator.fromCents(-1000)).toBe(-10);
    });

    it('should round fractional cents', () => {
      // 10.999 cents should round to 11
      expect(calculator.toCents(0.10999)).toBe(11);
    });

    it('should be reversible', () => {
      const original = 25.99;
      const cents = calculator.toCents(original);
      const back = calculator.fromCents(cents);
      
      expect(back).toBe(original);
    });
  });
});

// ============================================
// Singleton Instance Tests
// ============================================

describe('getPriceCalculator', () => {
  it('should return a PriceCalculator instance', () => {
    const instance = getPriceCalculator();
    
    expect(instance).toBeInstanceOf(PriceCalculator);
  });

  it('should return the same instance on multiple calls', () => {
    const instance1 = getPriceCalculator();
    const instance2 = getPriceCalculator();
    
    expect(instance1).toBe(instance2);
  });
});

// ============================================
// Convenience Function Tests
// ============================================

describe('Convenience Functions', () => {
  describe('calculateRetailPrice', () => {
    it('should delegate to singleton instance', () => {
      const result = calculateRetailPrice(10, defaultCategoryPricing);
      
      expect(result).toBe(28.99);
    });
  });

  describe('calculateMargin', () => {
    it('should delegate to singleton instance', () => {
      const result = calculateMargin(10, 25);
      
      expect(result.margin).toBe(15);
      expect(result.marginPercentage).toBe(60);
    });
  });

  describe('validatePrice', () => {
    it('should delegate to singleton instance', () => {
      const result = validatePrice(10, categoryWithMinMax);
      
      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================
// Edge Cases and Bug Documentation
// ============================================

describe('Edge Cases and Potential Bugs', () => {
  let calculator: PriceCalculator;

  beforeEach(() => {
    calculator = new PriceCalculator();
  });

  it('BUG: Rounding can result in price below cost for low markups', () => {
    const lowMarkupPricing: CategoryPricing = {
      categoryId: 'cat-low',
      markupFactor: 1.0,
      shippingBuffer: 0,
    };
    
    const costPrice = 5.0;
    const retailPrice = calculator.calculateRetailPrice(costPrice, lowMarkupPricing);
    
    // (5 * 1 + 0) * 1.05 = 5.25, rounded to 4.99
    // Retail price is LESS than cost price!
    expect(retailPrice).toBeLessThan(costPrice);
  });

  it('BUG: No validation for negative cost prices', () => {
    const result = calculator.calculateRetailPrice(-10, defaultCategoryPricing);
    
    // Negative prices are calculated without error
    expect(result).toBeLessThan(0);
  });

  it('BUG: No validation for markup factor < 1', () => {
    const lossPricing: CategoryPricing = {
      categoryId: 'cat-loss',
      markupFactor: 0.5,
    };
    
    const result = calculator.calculateRetailPrice(10, lossPricing);
    
    // Results in selling at a loss
    expect(result).toBeLessThan(10);
  });

  it('BUG: Compare-at price can be lower than retail price', () => {
    const compareAt = calculator.calculateCompareAtPrice(25, 0);
    
    // With 0% markup, compare-at is 24.99, lower than 25
    expect(compareAt).toBeLessThan(25);
  });

  it('BUG: PriceBreakdown does not indicate when min/max constraints are applied', () => {
    const breakdown = calculator.calculatePriceBreakdown(1, categoryWithMinMax);
    
    // The breakdown shows finalPrice as 15 (min applied)
    // But there's no flag indicating this was constrained
    expect(breakdown.finalPrice).toBe(15);
    // Missing: breakdown.wasMinApplied or similar flag
  });

  it('EDGE: Very small prices may round to 0.99', () => {
    const result = calculator.calculateRetailPrice(0.001, defaultCategoryPricing);
    
    // Very small cost still results in minimum price due to shipping buffer
    expect(result).toBe(2.99);
  });

  it('EDGE: Platform fees compound with other costs', () => {
    const noFeesPricing: CategoryPricing = {
      categoryId: 'cat-no-fees',
      markupFactor: 2.5,
      shippingBuffer: 3.0,
      platformFees: 0,
    };
    
    const withFees = calculator.calculateRetailPrice(10, defaultCategoryPricing);
    const withoutFees = calculator.calculateRetailPrice(10, noFeesPricing);
    
    // Platform fees add ~5% to final price
    expect(withFees).toBeGreaterThan(withoutFees);
  });

  it('EDGE: Precision issues with floating point', () => {
    const result = calculator.calculateRetailPrice(1/3, defaultCategoryPricing);
    
    // Should handle irrational numbers gracefully
    expect(typeof result).toBe('number');
    expect(Number.isNaN(result)).toBe(false);
  });
});
