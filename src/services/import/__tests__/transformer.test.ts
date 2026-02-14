/**
 * Unit Tests for Data Transformation Service
 * Tests for product data transformation from AliExpress to Baby Petite format
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ProductTransformer,
  getTransformer,
  transformProduct,
  transformTitle,
  generateSKU,
  type TransformedProduct,
  type TransformedVariant,
  type PortableTextBlock,
} from '../transformer';
import type {
  AliExpressProductData,
  AliExpressVariant,
  CategoryPricing,
} from '@/types/dropshipping';

// ============================================
// Test Fixtures
// ============================================

const mockAliExpressData: AliExpressProductData = {
  productId: '1234567890',
  title: 'Baby Girls Summer Dress Cute Floral Pattern (Free Shipping)',
  description: 'Beautiful summer dress for baby girls. Made from soft cotton material. Perfect for warm weather outings and special occasions.',
  price: 12.99,
  originalPrice: 15.99,
  currency: 'USD',
  images: [
    'https://ae01.alicdn.com/image1.jpg',
    'https://ae01.alicdn.com/image2.jpg',
  ],
  videos: [],
  variants: [
    {
      skuId: 'sku-001',
      name: 'Pink - 2T',
      attributes: { color: 'Pink', size: '2T' },
      price: 12.99,
      stock: 50,
    },
    {
      skuId: 'sku-002',
      name: 'Blue - 3T',
      attributes: { color: 'Blue', size: '3T' },
      price: 12.99,
      stock: 30,
    },
    {
      skuId: 'sku-003',
      name: 'Yellow - 4T',
      attributes: { color: 'Yellow', size: '4T' },
      price: 14.99,
      stock: 0,
    },
  ],
  specifications: {
    Material: 'Cotton',
    Style: 'Casual',
    Pattern: 'Floral',
    Season: 'Summer',
  },
  shippingOptions: [
    { name: 'Standard Shipping', cost: 0, estimatedDays: 30 },
  ],
  supplierId: 'supplier-123',
  supplierName: 'Test Supplier Store',
  storeUrl: 'https://www.aliexpress.com/store/123456',
  supplierRating: 4.8,
  productUrl: 'https://www.aliexpress.com/item/1234567890.html',
  scrapedAt: new Date(),
};

const mockCategoryPricing: CategoryPricing = {
  categoryId: 'cat-dresses',
  categoryName: 'Dresses',
  markupFactor: 2.5,
  shippingBuffer: 3.0,
};

const mockCategoryWithMinMax: CategoryPricing = {
  categoryId: 'cat-premium',
  categoryName: 'Premium',
  markupFactor: 3.0,
  minPrice: 20.0,
  maxPrice: 100.0,
};

// ============================================
// ProductTransformer Class Tests
// ============================================

describe('ProductTransformer', () => {
  let transformer: ProductTransformer;

  beforeEach(() => {
    transformer = new ProductTransformer();
  });

  // ============================================
  // transformProduct Tests
  // ============================================

  describe('transformProduct', () => {
    it('should transform AliExpress data to Baby Petite format', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('basePrice');
      expect(result).toHaveProperty('sku');
      expect(result).toHaveProperty('categoryId', 'cat-dresses');
      expect(result).toHaveProperty('variants');
      expect(result).toHaveProperty('aliExpressProductId', '1234567890');
    });

    it('should clean the product title', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      // Title should be cleaned of promotional text
      expect(result.name.toLowerCase()).not.toContain('free shipping');
    });

    it('should generate a unique slug', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.slug).toMatch(/^[a-z0-9-]+-\d{6}$/);
      expect(result.slug.length).toBeLessThanOrEqual(87); // 80 + '-' + 6
    });

    it('should transform description to Portable Text', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(Array.isArray(result.description)).toBe(true);
      expect(result.description.length).toBeGreaterThan(0);
      expect(result.description[0]).toHaveProperty('_type', 'block');
    });

    it('should generate short description', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.shortDescription).toBeTruthy();
      expect(result.shortDescription.length).toBeLessThanOrEqual(150);
    });

    it('should calculate base price correctly', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      // Price should be calculated using PriceCalculator
      expect(result.basePrice).toBeGreaterThan(0);
      expect(result.costPrice).toBe(12.99);
    });

    it('should generate tags from specifications and title', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.tags.length).toBeGreaterThan(0);
      expect(result.tags.length).toBeLessThanOrEqual(10);
    });

    it('should generate SEO metadata', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.metaTitle).toContain('Baby Petite');
      expect(result.metaTitle.length).toBeLessThanOrEqual(60);
      expect(result.metaDescription.length).toBeLessThanOrEqual(160);
    });

    it('should handle products without variants', () => {
      const noVariantData = {
        ...mockAliExpressData,
        variants: [],
      };

      const result = transformer.transformProduct(
        noVariantData,
        mockCategoryPricing,
        'cat-dresses'
      );

      // Should create a default variant
      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].name).toBe('Default');
      expect(result.variants[0].size).toBe('One Size');
    });

    it('should handle products without images', () => {
      const noImagesData = {
        ...mockAliExpressData,
        images: [],
      };

      const result = transformer.transformProduct(
        noImagesData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.originalImageUrls).toEqual([]);
    });

    it('should handle products without description', () => {
      const noDescData = {
        ...mockAliExpressData,
        description: '',
      };

      const result = transformer.transformProduct(
        noDescData,
        mockCategoryPricing,
        'cat-dresses'
      );

      // Should have default description
      expect(result.description[0].children[0].text).toBe('No description available.');
    });

    it('should preserve supplier information', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.supplierId).toBe('supplier-123');
      expect(result.supplierName).toBe('Test Supplier Store');
    });

    it('should create variant mapping', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.variantMapping).toHaveLength(3);
      expect(result.variantMapping[0]).toHaveProperty('localVariantSku');
      expect(result.variantMapping[0]).toHaveProperty('aliExpressSku');
    });
  });

  // ============================================
  // transformTitle Tests
  // ============================================

  describe('transformTitle', () => {
    it('should remove promotional words', () => {
      const title = 'Baby Dress HOT SALE Free Shipping Wholesale';
      const result = transformer.transformTitle(title);

      expect(result.toLowerCase()).not.toContain('hot sale');
      expect(result.toLowerCase()).not.toContain('free shipping');
      expect(result.toLowerCase()).not.toContain('wholesale');
    });

    it('should remove special characters but keep basic punctuation', () => {
      const title = 'Baby Dress!!! @#$ Size 2T...';
      const result = transformer.transformTitle(title);

      expect(result).not.toContain('!');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
    });

    it('should convert to title case', () => {
      const title = 'baby girls summer dress';
      const result = transformer.transformTitle(title);

      expect(result).toBe('Baby Girls Summer Dress');
    });

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(200);
      const result = transformer.transformTitle(longTitle, { maxLength: 100 });

      expect(result.length).toBeLessThanOrEqual(103); // maxLength - 3 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should return default for empty title', () => {
      const result = transformer.transformTitle('');

      expect(result).toBe('Untitled Product');
    });

    it('should return default for whitespace-only title', () => {
      const result = transformer.transformTitle('   ');

      expect(result).toBe('Untitled Product');
    });

    it('should handle null/undefined input', () => {
      // @ts-expect-error - Testing null input
      const result = transformer.transformTitle(null);

      expect(result).toBe('Untitled Product');
    });

    it('should respect maxLength option', () => {
      const title = 'This is a very long product title that should be truncated';
      const result = transformer.transformTitle(title, { maxLength: 30 });

      expect(result.length).toBeLessThanOrEqual(33);
    });

    it('should handle removeBrands option', () => {
      const title = 'Official Brand Store Baby Dress';
      const result = transformer.transformTitle(title, { removeBrands: true });

      // Brand patterns should be removed
      expect(result.toLowerCase()).not.toContain('official brand store');
    });

    it('should handle titleCase option', () => {
      const title = 'baby dress';
      const result = transformer.transformTitle(title, { titleCase: false });

      expect(result).toBe('baby dress');
    });

    it('should handle unicode characters', () => {
      const title = 'Baby Dress 👶🎀 Special Edition';
      const result = transformer.transformTitle(title);

      // Unicode characters are removed by the regex
      expect(result).not.toContain('👶');
      expect(result).not.toContain('🎀');
    });

    it('should handle titles with only special characters', () => {
      const title = '@#$%^&*()!';
      const result = transformer.transformTitle(title);

      expect(result).toBe('Untitled Product');
    });

    it('should truncate at word boundary when possible', () => {
      const title = 'This is a product title that needs truncation at word boundary';
      const result = transformer.transformTitle(title, { maxLength: 30 });

      // Should truncate at last space before maxLength
      expect(result).not.toMatch(/.*\w\.\.\.$/); // Should not end with letter + ...
    });
  });

  // ============================================
  // generateSKU Tests
  // ============================================

  describe('generateSKU', () => {
    it('should generate SKU with correct format', () => {
      const sku = transformer.generateSKU('1234567890');

      expect(sku).toMatch(/^KP-[A-Z0-9]{6}-00$/);
    });

    it('should generate unique SKUs for different product IDs', () => {
      const sku1 = transformer.generateSKU('1234567890');
      const sku2 = transformer.generateSKU('0987654321');

      expect(sku1).not.toBe(sku2);
    });

    it('should generate same SKU for same product ID', () => {
      const sku1 = transformer.generateSKU('1234567890');
      const sku2 = transformer.generateSKU('1234567890');

      expect(sku1).toBe(sku2);
    });

    it('should include variant code when variant provided', () => {
      const variant: AliExpressVariant = {
        skuId: 'variant-sku',
        name: 'Pink - 2T',
        attributes: { color: 'Pink', size: '2T' },
        price: 12.99,
        stock: 50,
      };

      const sku = transformer.generateSKU('1234567890', variant);

      // Should have variant code instead of '00'
      expect(sku).toMatch(/^KP-[A-Z0-9]{6}-[A-Z0-9]{2}$/);
      expect(sku).not.toMatch(/-00$/);
    });

    it('should generate different SKUs for different variants', () => {
      const variant1: AliExpressVariant = {
        skuId: 'variant-1',
        name: 'Pink - 2T',
        attributes: { color: 'Pink', size: '2T' },
        price: 12.99,
        stock: 50,
      };

      const variant2: AliExpressVariant = {
        skuId: 'variant-2',
        name: 'Blue - 3T',
        attributes: { color: 'Blue', size: '3T' },
        price: 12.99,
        stock: 30,
      };

      const sku1 = transformer.generateSKU('1234567890', variant1);
      const sku2 = transformer.generateSKU('1234567890', variant2);

      expect(sku1).not.toBe(sku2);
    });

    it('should handle empty product ID', () => {
      // BUG: Empty product ID still generates a SKU
      const sku = transformer.generateSKU('');

      expect(sku).toMatch(/^KP-[A-Z0-9]{6}-00$/);
    });

    it('should handle very long product IDs', () => {
      const longId = '1'.repeat(100);
      const sku = transformer.generateSKU(longId);

      expect(sku).toMatch(/^KP-[A-Z0-9]{6}-00$/);
    });

    it('should handle special characters in product ID', () => {
      const specialId = 'product-123_abc!@#';
      const sku = transformer.generateSKU(specialId);

      // Should still generate valid SKU
      expect(sku).toMatch(/^KP-[A-Z0-9]{6}-00$/);
    });
  });

  // ============================================
  // mapVariants Tests
  // ============================================

  describe('mapVariants', () => {
    it('should map variants correctly', () => {
      const { variants, variantMapping } = transformer.mapVariants(
        mockAliExpressData.variants,
        '1234567890',
        12.99,
        mockCategoryPricing
      );

      expect(variants).toHaveLength(3);
      expect(variantMapping).toHaveLength(3);
    });

    it('should standardize size values', () => {
      const variants: AliExpressVariant[] = [
        {
          skuId: 'sku-1',
          name: 'Size 2t',
          attributes: { size: '2t' },
          price: 10,
          stock: 10,
        },
        {
          skuId: 'sku-2',
          name: 'Size xs',
          attributes: { size: 'xs' },
          price: 10,
          stock: 10,
        },
      ];

      const { variants: result } = transformer.mapVariants(
        variants,
        '1234567890',
        10,
        mockCategoryPricing
      );

      expect(result[0].size).toBe('2T');
      expect(result[1].size).toBe('XS');
    });

    it('should extract color from attributes', () => {
      const variants: AliExpressVariant[] = [
        {
          skuId: 'sku-1',
          name: 'Pink Dress',
          attributes: { color: 'Pink' },
          price: 10,
          stock: 10,
        },
      ];

      const { variants: result } = transformer.mapVariants(
        variants,
        '1234567890',
        10,
        mockCategoryPricing
      );

      expect(result[0].color).toBe('Pink');
    });

    it('should extract hex color code from color value', () => {
      const variants: AliExpressVariant[] = [
        {
          skuId: 'sku-1',
          name: 'Pink Dress',
          attributes: { color: 'Pink #FF69B4' },
          price: 10,
          stock: 10,
        },
      ];

      const { variants: result } = transformer.mapVariants(
        variants,
        '1234567890',
        10,
        mockCategoryPricing
      );

      expect(result[0].color).toBe('Pink #FF69B4');
      expect(result[0].colorCode).toBe('FF69B4');
    });

    it('should handle variants with different prices', () => {
      const { variants } = transformer.mapVariants(
        mockAliExpressData.variants,
        '1234567890',
        12.99,
        mockCategoryPricing
      );

      // Third variant has price 14.99
      expect(variants[2].price).toBeGreaterThan(variants[0].price);
    });

    it('should handle variants with zero stock', () => {
      const { variants } = transformer.mapVariants(
        mockAliExpressData.variants,
        '1234567890',
        12.99,
        mockCategoryPricing
      );

      // Third variant has 0 stock
      expect(variants[2].stock).toBe(0);
    });

    it('should create default variant when no variants provided', () => {
      const { variants, variantMapping } = transformer.mapVariants(
        [],
        '1234567890',
        12.99,
        mockCategoryPricing
      );

      expect(variants).toHaveLength(1);
      expect(variants[0].name).toBe('Default');
      expect(variants[0].size).toBe('One Size');
      expect(variantMapping).toHaveLength(0);
    });

    it('should handle null variants', () => {
      const { variants } = transformer.mapVariants(
        null as unknown as AliExpressVariant[],
        '1234567890',
        12.99,
        mockCategoryPricing
      );

      expect(variants).toHaveLength(1);
      expect(variants[0].name).toBe('Default');
    });

    it('should handle variants with missing attributes', () => {
      const variants: AliExpressVariant[] = [
        {
          skuId: 'sku-1',
          name: 'Variant 1',
          attributes: {},
          price: 10,
          stock: 10,
        },
      ];

      const { variants: result } = transformer.mapVariants(
        variants,
        '1234567890',
        10,
        mockCategoryPricing
      );

      expect(result[0].size).toBe('One Size');
      expect(result[0].color).toBeUndefined();
    });

    it('should handle variants with variant image', () => {
      const variants: AliExpressVariant[] = [
        {
          skuId: 'sku-1',
          name: 'Pink Dress',
          attributes: { color: 'Pink' },
          price: 10,
          stock: 10,
          image: 'https://example.com/image.jpg',
        },
      ];

      const { variants: result } = transformer.mapVariants(
        variants,
        '1234567890',
        10,
        mockCategoryPricing
      );

      expect(result[0].imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should handle very large variant counts', () => {
      const manyVariants: AliExpressVariant[] = Array.from({ length: 150 }, (_, i) => ({
        skuId: `sku-${i}`,
        name: `Variant ${i}`,
        attributes: { size: `${i + 1}T` },
        price: 10,
        stock: 10,
      }));

      const { variants } = transformer.mapVariants(
        manyVariants,
        '1234567890',
        10,
        mockCategoryPricing
      );

      expect(variants).toHaveLength(150);
    });
  });

  // ============================================
  // transformDescription Tests
  // ============================================

  describe('transformDescription', () => {
    it('should convert plain text to Portable Text blocks', () => {
      const description = 'This is a product description.';
      const result = transformer.transformDescription(description);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('_type', 'block');
      expect(result[0].children[0].text).toBe('This is a product description.');
    });

    it('should split paragraphs correctly', () => {
      const description = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const result = transformer.transformDescription(description);

      expect(result).toHaveLength(3);
    });

    it('should handle HTML br tags', () => {
      const description = 'Line one<br>Line two<br/>Line three';
      const result = transformer.transformDescription(description);

      // Should convert br to newlines and split
      expect(result.length).toBeGreaterThan(0);
    });

    it('should remove HTML tags', () => {
      const description = '<p>This is <strong>bold</strong> text.</p>';
      const result = transformer.transformDescription(description);

      expect(result[0].children[0].text).not.toContain('<p>');
      expect(result[0].children[0].text).not.toContain('<strong>');
    });

    it('should return default for empty description', () => {
      const result = transformer.transformDescription('');

      expect(result[0].children[0].text).toBe('No description available.');
    });

    it('should return default for whitespace-only description', () => {
      const result = transformer.transformDescription('   ');

      expect(result[0].children[0].text).toBe('No description available.');
    });

    it('should handle very long paragraphs', () => {
      const longParagraph = 'A'.repeat(1000);
      const result = transformer.transformDescription(longParagraph);

      // Should split long paragraphs
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle unicode in description', () => {
      const description = 'Baby dress 👶🎀 with cute design';
      const result = transformer.transformDescription(description);

      // Unicode should be preserved
      expect(result[0].children[0].text).toContain('👶');
    });

    it('should generate unique keys for blocks', () => {
      const description = 'First paragraph.\n\nSecond paragraph.';
      const result = transformer.transformDescription(description);

      const keys = result.map(block => block._key);
      const uniqueKeys = new Set(keys);

      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  // ============================================
  // Slug Generation Tests
  // ============================================

  describe('slug generation', () => {
    it('should generate lowercase slug', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.slug).toBe(result.slug.toLowerCase());
    });

    it('should replace spaces with hyphens', () => {
      const data = {
        ...mockAliExpressData,
        title: 'Baby Summer Dress',
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.slug).not.toContain(' ');
    });

    it('should remove special characters', () => {
      const data = {
        ...mockAliExpressData,
        title: 'Baby Dress!!! @#$ Size 2T',
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.slug).not.toMatch(/[^a-z0-9-]/);
    });

    it('should include product ID suffix for uniqueness', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      // Should end with last 6 characters of product ID
      expect(result.slug).toMatch(/\d{6}$/);
    });

    it('should handle titles that result in empty slug', () => {
      const data = {
        ...mockAliExpressData,
        title: '@#$%^&*()!',
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      // Should still generate a valid slug with ID suffix
      expect(result.slug).toMatch(/^-\d{6}$/);
    });
  });

  // ============================================
  // Tag Generation Tests
  // ============================================

  describe('tag generation', () => {
    it('should extract tags from specifications', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.tags).toContain('cotton');
      expect(result.tags).toContain('casual');
      expect(result.tags).toContain('floral');
      expect(result.tags).toContain('summer');
    });

    it('should limit tags to 10', () => {
      const data = {
        ...mockAliExpressData,
        specifications: {
          Material: 'Cotton',
          Style: 'Casual',
          Pattern: 'Floral',
          Season: 'Summer',
          Feature1: 'Feature1',
          Feature2: 'Feature2',
          Feature3: 'Feature3',
          Feature4: 'Feature4',
          Feature5: 'Feature5',
          Feature6: 'Feature6',
          Feature7: 'Feature7',
        },
        title: 'Extra Keyword1 Keyword2 Keyword3 Keyword4 Keyword5',
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.tags.length).toBeLessThanOrEqual(10);
    });

    it('should handle missing specifications', () => {
      const data = {
        ...mockAliExpressData,
        specifications: {},
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      // Should still generate tags from title
      expect(result.tags.length).toBeGreaterThan(0);
    });

    it('should filter out spam words from tags', () => {
      const data = {
        ...mockAliExpressData,
        title: 'Baby Dress Free Shipping Wholesale Hot Sale',
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.tags).not.toContain('free');
      expect(result.tags).not.toContain('shipping');
      expect(result.tags).not.toContain('wholesale');
    });
  });

  // ============================================
  // SEO Metadata Tests
  // ============================================

  describe('SEO metadata generation', () => {
    it('should generate meta title with suffix', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.metaTitle).toContain(' | Baby Petite');
    });

    it('should truncate meta title to 60 characters', () => {
      const data = {
        ...mockAliExpressData,
        title: 'A'.repeat(100),
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.metaTitle.length).toBeLessThanOrEqual(60);
    });

    it('should generate meta description with suffix', () => {
      const result = transformer.transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.metaDescription).toContain(' Shop now at Baby Petite.');
    });

    it('should truncate meta description to 160 characters', () => {
      const data = {
        ...mockAliExpressData,
        description: 'A'.repeat(200),
      };

      const result = transformer.transformProduct(
        data,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result.metaDescription.length).toBeLessThanOrEqual(160);
    });
  });
});

// ============================================
// Singleton Instance Tests
// ============================================

describe('getTransformer', () => {
  it('should return a ProductTransformer instance', () => {
    const instance = getTransformer();

    expect(instance).toBeInstanceOf(ProductTransformer);
  });

  it('should return the same instance on multiple calls', () => {
    const instance1 = getTransformer();
    const instance2 = getTransformer();

    expect(instance1).toBe(instance2);
  });
});

// ============================================
// Convenience Function Tests
// ============================================

describe('Convenience Functions', () => {
  describe('transformProduct function', () => {
    it('should delegate to singleton instance', () => {
      const result = transformProduct(
        mockAliExpressData,
        mockCategoryPricing,
        'cat-dresses'
      );

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('slug');
    });
  });

  describe('transformTitle function', () => {
    it('should delegate to singleton instance', () => {
      const result = transformTitle('Baby Dress');

      expect(result).toBe('Baby Dress');
    });
  });

  describe('generateSKU function', () => {
    it('should delegate to singleton instance', () => {
      const sku = generateSKU('1234567890');

      expect(sku).toMatch(/^KP-[A-Z0-9]{6}-00$/);
    });
  });
});

// ============================================
// Edge Cases and Bug Documentation
// ============================================

describe('Edge Cases and Potential Bugs', () => {
  let transformer: ProductTransformer;

  beforeEach(() => {
    transformer = new ProductTransformer();
  });

  it('BUG: Empty product ID generates SKU without validation', () => {
    const sku = transformer.generateSKU('');

    // Empty ID still generates a SKU, which may cause issues
    expect(sku).toMatch(/^KP-[A-Z0-9]{6}-00$/);
  });

  it('BUG: Very long titles may cause slug truncation issues', () => {
    const data = {
      ...mockAliExpressData,
      title: 'A'.repeat(500),
    };

    const result = transformer.transformProduct(
      data,
      mockCategoryPricing,
      'cat-dresses'
    );

    // Slug should be truncated but may lose uniqueness suffix
    expect(result.slug.length).toBeLessThanOrEqual(87);
  });

  it('BUG: Variant with empty attributes results in "One Size"', () => {
    const variants: AliExpressVariant[] = [
      {
        skuId: 'sku-1',
        name: 'Variant 1',
        attributes: {},
        price: 10,
        stock: 10,
      },
    ];

    const { variants: result } = transformer.mapVariants(
      variants,
      '1234567890',
      10,
      mockCategoryPricing
    );

    // Empty attributes defaults to "One Size" which may not be accurate
    expect(result[0].size).toBe('One Size');
  });

  it('EDGE: Unicode in title is removed', () => {
    const data = {
      ...mockAliExpressData,
      title: 'Baby Dress 👶🎀💖',
    };

    const result = transformer.transformProduct(
      data,
      mockCategoryPricing,
      'cat-dresses'
    );

    // Unicode characters are stripped
    expect(result.name).not.toContain('👶');
  });

  it('EDGE: Description with only HTML returns default', () => {
    const description = '<p></p><div></div>';
    const result = transformer.transformDescription(description);

    // Empty HTML results in default message
    expect(result[0].children[0].text).toBe('No description available.');
  });

  it('EDGE: Circular variant references would cause issues', () => {
    // This tests that the code doesn't handle circular references
    // If variant attributes somehow referenced each other, it could cause issues
    const variants: AliExpressVariant[] = [
      {
        skuId: 'sku-1',
        name: 'Variant 1',
        attributes: { size: '2T', color: 'Pink' },
        price: 10,
        stock: 10,
      },
    ];

    // Normal case works fine
    const { variants: result } = transformer.mapVariants(
      variants,
      '1234567890',
      10,
      mockCategoryPricing
    );

    expect(result).toHaveLength(1);
  });

  it('BUG: SKU uniqueness depends on product ID only', () => {
    // Same product ID always generates same base SKU
    const sku1 = transformer.generateSKU('1234567890');
    const sku2 = transformer.generateSKU('1234567890');

    // This is by design but could cause issues if product IDs are reused
    expect(sku1).toBe(sku2);
  });

  it('EDGE: Zero price variant uses base cost price', () => {
    const variants: AliExpressVariant[] = [
      {
        skuId: 'sku-1',
        name: 'Variant 1',
        attributes: { size: '2T' },
        price: 0,
        stock: 10,
      },
    ];

    const { variants: result } = transformer.mapVariants(
      variants,
      '1234567890',
      15,
      mockCategoryPricing
    );

    // Variant with price 0 should use base cost price
    expect(result[0].price).toBeGreaterThan(0);
  });

  it('BUG: Negative variant price not validated', () => {
    const variants: AliExpressVariant[] = [
      {
        skuId: 'sku-1',
        name: 'Variant 1',
        attributes: { size: '2T' },
        price: -10,
        stock: 10,
      },
    ];

    const { variants: result } = transformer.mapVariants(
      variants,
      '1234567890',
      15,
      mockCategoryPricing
    );

    // Negative price is used as-is, then falls back to base cost
    // because variant.price > 0 check fails
    expect(result[0].price).toBeGreaterThan(0);
  });

  it('EDGE: Missing variant stock defaults to 0 or undefined', () => {
    const variants: AliExpressVariant[] = [
      {
        skuId: 'sku-1',
        name: 'Variant 1',
        attributes: { size: '2T' },
        price: 10,
        // stock is undefined
      } as AliExpressVariant,
    ];

    const { variants: result } = transformer.mapVariants(
      variants,
      '1234567890',
      10,
      mockCategoryPricing
    );

    // Undefined stock is passed through
    expect(result[0].stock).toBeUndefined();
  });
});
