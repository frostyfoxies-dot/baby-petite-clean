/**
 * Data Transformation Service
 * Transforms AliExpress product data to Baby Petite format
 */

import type {
  AliExpressProductData,
  AliExpressVariant,
  CategoryPricing,
  VariantMapping,
} from '@/types/dropshipping';
import { PriceCalculator, getPriceCalculator } from './pricing';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

/**
 * Portable Text block for Sanity
 */
export interface PortableTextBlock {
  _type: 'block';
  _key: string;
  children: PortableTextSpan[];
  markDefs?: Array<{
    _type: string;
    _key: string;
    href?: string;
  }>;
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'blockquote';
}

/**
 * Portable Text span
 */
export interface PortableTextSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks?: string[];
}

/**
 * Transformed variant data
 */
export interface TransformedVariant {
  /** Variant SKU */
  sku: string;
  /** Variant name */
  name: string;
  /** Size */
  size: string;
  /** Color */
  color?: string;
  /** Color hex code */
  colorCode?: string;
  /** Retail price */
  price: number;
  /** Compare-at price */
  compareAtPrice?: number;
  /** AliExpress SKU ID */
  aliExpressSku: string;
  /** Stock quantity */
  stock: number;
  /** Variant image URL */
  imageUrl?: string;
}

/**
 * Transformed product data ready for Sanity/PostgreSQL
 */
export interface TransformedProduct {
  /** Product name */
  name: string;
  /** URL slug */
  slug: string;
  /** Description as Portable Text */
  description: PortableTextBlock[];
  /** Short description for listings */
  shortDescription: string;
  /** Base price (first variant or default) */
  basePrice: number;
  /** Compare-at price */
  compareAtPrice?: number;
  /** Cost price from AliExpress */
  costPrice: number;
  /** Generated SKU */
  sku: string;
  /** Category ID */
  categoryId: string;
  /** Tags */
  tags: string[];
  /** SEO meta title */
  metaTitle: string;
  /** SEO meta description */
  metaDescription: string;
  /** Transformed variants */
  variants: TransformedVariant[];
  /** Original image URLs */
  originalImageUrls: string[];
  /** AliExpress product ID */
  aliExpressProductId: string;
  /** AliExpress URL */
  aliExpressUrl: string;
  /** Supplier ID */
  supplierId: string;
  /** Supplier name */
  supplierName: string;
  /** Variant SKU mappings */
  variantMapping: VariantMapping[];
}

/**
 * Title transformation options
 */
export interface TitleTransformOptions {
  /** Maximum title length */
  maxLength?: number;
  /** Remove brand names */
  removeBrands?: boolean;
  /** Convert to title case */
  titleCase?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Words to remove from titles (brand names, spam words)
 */
const REMOVED_WORDS = [
  'aliexpress',
  'free shipping',
  'dropship',
  'dropshipping',
  'wholesale',
  'hot sale',
  'best seller',
  'new arrival',
  'high quality',
  'premium quality',
  'limited time',
  'discount',
  'cheap',
  'affordable',
];

/**
 * Common brand names to detect and remove
 */
const BRAND_PATTERNS = [
  /^[\w\s]+(?:store|shop|brand|official)$/i,
];

/**
 * Size mapping for standardization
 */
const SIZE_MAP: Record<string, string> = {
  'xs': 'XS',
  's': 'S',
  'm': 'M',
  'l': 'L',
  'xl': 'XL',
  'xxl': 'XXL',
  '2xl': 'XXL',
  'xxxl': 'XXXL',
  '3xl': 'XXXL',
  'newborn': 'Newborn',
  'nb': 'Newborn',
  '0-3m': '0-3M',
  '0-3 months': '0-3M',
  '3-6m': '3-6M',
  '3-6 months': '3-6M',
  '6-9m': '6-9M',
  '6-9 months': '6-9M',
  '6-12m': '6-12M',
  '6-12 months': '6-12M',
  '9-12m': '9-12M',
  '9-12 months': '9-12M',
  '12-18m': '12-18M',
  '12-18 months': '12-18M',
  '18-24m': '18-24M',
  '18-24 months': '18-24M',
  '1t': '1T',
  '2t': '2T',
  '3t': '3T',
  '4t': '4T',
  '5t': '5T',
  'one size': 'One Size',
  'onesize': 'One Size',
};

// ============================================
// PRODUCT TRANSFORMER CLASS
// ============================================

/**
 * Product Transformer Service
 * Transforms AliExpress product data to Baby Petite format
 */
export class ProductTransformer {
  private priceCalculator: PriceCalculator;

  constructor() {
    this.priceCalculator = getPriceCalculator();
  }

  /**
   * Transform AliExpress data to Baby Petite format
   *
   * @param aliExpressData - Raw data from AliExpress scraper
   * @param categoryPricing - Category pricing configuration
   * @param categoryId - Target category ID
   * @returns Transformed product data
   */
  transformProduct(
    aliExpressData: AliExpressProductData,
    categoryPricing: CategoryPricing,
    categoryId: string
  ): TransformedProduct {
    // Transform title
    const name = this.transformTitle(aliExpressData.title);

    // Generate slug
    const slug = this.generateSlug(name, aliExpressData.productId);

    // Transform description
    const description = this.transformDescription(aliExpressData.description);

    // Generate short description
    const shortDescription = this.generateShortDescription(aliExpressData.description, name);

    // Calculate prices
    const costPrice = aliExpressData.price;
    const basePrice = this.priceCalculator.calculateRetailPrice(costPrice, categoryPricing);
    const compareAtPrice = this.priceCalculator.calculateCompareAtPrice(basePrice);

    // Generate base SKU
    const sku = this.generateSKU(aliExpressData.productId);

    // Transform variants
    const { variants, variantMapping } = this.mapVariants(
      aliExpressData.variants,
      aliExpressData.productId,
      costPrice,
      categoryPricing
    );

    // Generate tags from specifications
    const tags = this.generateTags(aliExpressData.specifications, aliExpressData.title);

    // Generate SEO metadata
    const metaTitle = this.generateMetaTitle(name);
    const metaDescription = this.generateMetaDescription(shortDescription);

    return {
      name,
      slug,
      description,
      shortDescription,
      basePrice,
      compareAtPrice,
      costPrice,
      sku,
      categoryId,
      tags,
      metaTitle,
      metaDescription,
      variants,
      originalImageUrls: aliExpressData.images,
      aliExpressProductId: aliExpressData.productId,
      aliExpressUrl: aliExpressData.productUrl,
      supplierId: aliExpressData.supplierId,
      supplierName: aliExpressData.supplierName,
      variantMapping,
    };
  }

  /**
   * Clean and optimize product title for SEO
   *
   * @param originalTitle - Original AliExpress title
   * @param options - Transformation options
   * @returns Cleaned title
   */
  transformTitle(
    originalTitle: string,
    options: TitleTransformOptions = {}
  ): string {
    const { maxLength = 100, removeBrands = true, titleCase = true } = options;

    let title = originalTitle;

    // Remove common spam words
    for (const word of REMOVED_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      title = title.replace(regex, '');
    }

    // Remove brand patterns
    if (removeBrands) {
      for (const pattern of BRAND_PATTERNS) {
        title = title.replace(pattern, '');
      }
    }

    // Remove special characters but keep basic punctuation
    title = title.replace(/[^\w\s\-',.&+]/g, ' ');

    // Remove extra whitespace
    title = title.replace(/\s+/g, ' ').trim();

    // Convert to title case
    if (titleCase) {
      title = this.toTitleCase(title);
    }

    // Truncate if needed
    if (title.length > maxLength) {
      // Find last space before maxLength
      const lastSpace = title.lastIndexOf(' ', maxLength - 3);
      if (lastSpace > 0) {
        title = title.substring(0, lastSpace);
      } else {
        title = title.substring(0, maxLength - 3);
      }
      title = title.trim() + '...';
    }

    return title || 'Untitled Product';
  }

  /**
   * Convert description to Portable Text format
   *
   * @param description - Raw description text
   * @returns Portable Text blocks
   */
  transformDescription(description: string): PortableTextBlock[] {
    if (!description || description.trim().length === 0) {
      return [this.createTextBlock('No description available.')];
    }

    const blocks: PortableTextBlock[] = [];

    // Split by double newlines for paragraphs
    const paragraphs = description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .split(/\n\s*\n|\n{2,}/);

    for (const paragraph of paragraphs) {
      const text = paragraph.trim();
      if (text.length > 0) {
        // Split very long paragraphs
        if (text.length > 500) {
          const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
          let currentBlock = '';
          for (const sentence of sentences) {
            if (currentBlock.length + sentence.length > 500) {
              blocks.push(this.createTextBlock(currentBlock.trim()));
              currentBlock = sentence;
            } else {
              currentBlock += sentence;
            }
          }
          if (currentBlock.trim()) {
            blocks.push(this.createTextBlock(currentBlock.trim()));
          }
        } else {
          blocks.push(this.createTextBlock(text));
        }
      }
    }

    return blocks.length > 0 ? blocks : [this.createTextBlock('No description available.')];
  }

  /**
   * Generate unique SKU
   *
   * @param aliExpressProductId - AliExpress product ID
   * @param variant - Optional variant for variant-specific SKU
   * @returns Generated SKU
   */
  generateSKU(aliExpressProductId: string, variant?: AliExpressVariant): string {
    const prefix = 'KP';

    // Create 6-character hash from product ID
    const hash = crypto
      .createHash('sha256')
      .update(aliExpressProductId)
      .digest('hex')
      .slice(0, 6)
      .toUpperCase();

    // Generate variant code
    const variantCode = variant ? this.generateVariantCode(variant) : '00';

    return `${prefix}-${hash}-${variantCode}`;
  }

  /**
   * Map AliExpress variants to local variants
   *
   * @param variants - AliExpress variants
   * @param productId - AliExpress product ID
   * @param baseCostPrice - Base cost price
   * @param categoryPricing - Category pricing configuration
   * @returns Transformed variants and mapping
   */
  mapVariants(
    variants: AliExpressVariant[],
    productId: string,
    baseCostPrice: number,
    categoryPricing: CategoryPricing
  ): { variants: TransformedVariant[]; variantMapping: VariantMapping[] } {
    const transformedVariants: TransformedVariant[] = [];
    const variantMapping: VariantMapping[] = [];

    if (!variants || variants.length === 0) {
      // No variants - create a default one
      const defaultSku = this.generateSKU(productId);
      transformedVariants.push({
        sku: defaultSku,
        name: 'Default',
        size: 'One Size',
        price: this.priceCalculator.calculateRetailPrice(baseCostPrice, categoryPricing),
        aliExpressSku: '',
        stock: 999,
      });
      return { variants: transformedVariants, variantMapping: [] };
    }

    for (const variant of variants) {
      const sku = this.generateSKU(productId, variant);
      const name = this.generateVariantName(variant);
      const { size, color, colorCode } = this.extractVariantAttributes(variant);

      // Calculate variant price
      const variantCost = variant.price > 0 ? variant.price : baseCostPrice;
      const price = this.priceCalculator.calculateRetailPrice(variantCost, categoryPricing);

      transformedVariants.push({
        sku,
        name,
        size,
        color,
        colorCode,
        price,
        aliExpressSku: variant.skuId,
        stock: variant.stock,
        imageUrl: variant.image,
      });

      variantMapping.push({
        localVariantSku: sku,
        aliExpressSku: variant.skuId,
        aliExpressVariantName: variant.name,
      });
    }

    return { variants: transformedVariants, variantMapping };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Create a Portable Text block
   */
  private createTextBlock(text: string): PortableTextBlock {
    return {
      _type: 'block',
      _key: this.generateKey(),
      children: [
        {
          _type: 'span',
          _key: this.generateKey(),
          text,
        },
      ],
      style: 'normal',
    };
  }

  /**
   * Generate a random key for Sanity
   */
  private generateKey(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Generate URL slug from name and product ID
   */
  private generateSlug(name: string, productId: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 80);

    // Add product ID suffix for uniqueness
    const idSuffix = productId.slice(-6);
    return `${baseSlug}-${idSuffix}`;
  }

  /**
   * Generate short description from full description
   */
  private generateShortDescription(description: string, name: string): string {
    if (!description) {
      return `Discover our ${name}, perfect for your little one.`;
    }

    // Get first meaningful sentence
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      let shortDesc = sentences[0].trim();
      if (shortDesc.length > 150) {
        shortDesc = shortDesc.substring(0, 147) + '...';
      }
      return shortDesc;
    }

    return `Discover our ${name}, perfect for your little one.`;
  }

  /**
   * Generate variant code for SKU
   */
  private generateVariantCode(variant: AliExpressVariant): string {
    // Create 2-character code from variant attributes
    const attributes = Object.values(variant.attributes).join('');
    if (attributes.length >= 2) {
      return attributes.slice(0, 2).toUpperCase();
    }

    // Fallback to hash
    return crypto
      .createHash('sha256')
      .update(variant.skuId)
      .digest('hex')
      .slice(0, 2)
      .toUpperCase();
  }

  /**
   * Generate variant name from attributes
   */
  private generateVariantName(variant: AliExpressVariant): string {
    const parts = Object.entries(variant.attributes)
      .map(([key, value]) => {
        // Standardize size values
        if (key.toLowerCase() === 'size') {
          return SIZE_MAP[value.toLowerCase()] || value;
        }
        return value;
      });

    return parts.join(' - ') || variant.name || 'Default';
  }

  /**
   * Extract size and color from variant attributes
   */
  private extractVariantAttributes(
    variant: AliExpressVariant
  ): { size: string; color?: string; colorCode?: string } {
    let size = 'One Size';
    let color: string | undefined;
    let colorCode: string | undefined;

    for (const [key, value] of Object.entries(variant.attributes)) {
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'size' || lowerKey.includes('size')) {
        size = SIZE_MAP[value.toLowerCase()] || value;
      }

      if (lowerKey === 'color' || lowerKey.includes('color') || lowerKey.includes('colour')) {
        color = value;
        // Try to extract hex color if present
        const hexMatch = value.match(/#([0-9A-Fa-f]{6})/);
        if (hexMatch) {
          colorCode = hexMatch[1];
        }
      }
    }

    return { size, color, colorCode };
  }

  /**
   * Generate tags from specifications and title
   */
  private generateTags(
    specifications: Record<string, string>,
    title: string
  ): string[] {
    const tags: Set<string> = new Set();

    // Extract from specifications
    for (const [key, value] of Object.entries(specifications)) {
      const lowerKey = key.toLowerCase();

      if (lowerKey.includes('material')) {
        tags.add(value.toLowerCase());
      }
      if (lowerKey.includes('style')) {
        tags.add(value.toLowerCase());
      }
      if (lowerKey.includes('pattern')) {
        tags.add(value.toLowerCase());
      }
      if (lowerKey.includes('season')) {
        tags.add(value.toLowerCase());
      }
    }

    // Extract keywords from title
    const titleWords = title.toLowerCase().split(/\s+/);
    const keywordTags = titleWords.filter(word =>
      word.length >= 4 &&
      !REMOVED_WORDS.some(removed => word.includes(removed))
    );
    keywordTags.forEach(tag => tags.add(tag));

    // Limit to 10 tags
    return Array.from(tags).slice(0, 10);
  }

  /**
   * Generate meta title for SEO
   */
  private generateMetaTitle(name: string): string {
    const suffix = ' | Baby Petite';
    const maxLength = 60 - suffix.length;

    if (name.length > maxLength) {
      return name.substring(0, maxLength - 3) + '...' + suffix;
    }

    return name + suffix;
  }

  /**
   * Generate meta description for SEO
   */
  private generateMetaDescription(shortDescription: string): string {
    const maxLength = 160;
    const suffix = ' Shop now at Baby Petite.';

    if (shortDescription.length + suffix.length > maxLength) {
      return shortDescription.substring(0, maxLength - suffix.length - 3) + '...' + suffix;
    }

    return shortDescription + suffix;
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let transformerInstance: ProductTransformer | null = null;

/**
 * Get the singleton transformer instance
 */
export function getTransformer(): ProductTransformer {
  if (!transformerInstance) {
    transformerInstance = new ProductTransformer();
  }
  return transformerInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Transform product (convenience function)
 */
export function transformProduct(
  aliExpressData: AliExpressProductData,
  categoryPricing: CategoryPricing,
  categoryId: string
): TransformedProduct {
  return getTransformer().transformProduct(aliExpressData, categoryPricing, categoryId);
}

/**
 * Transform title (convenience function)
 */
export function transformTitle(
  originalTitle: string,
  options?: TitleTransformOptions
): string {
  return getTransformer().transformTitle(originalTitle, options);
}

/**
 * Generate SKU (convenience function)
 */
export function generateSKU(
  aliExpressProductId: string,
  variant?: AliExpressVariant
): string {
  return getTransformer().generateSKU(aliExpressProductId, variant);
}
