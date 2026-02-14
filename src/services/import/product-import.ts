/**
 * Product Import Service
 * Main service for importing products from AliExpress to Baby Petite
 */

import { prisma } from '@/lib/prisma';
import { sanityClient } from '@/lib/sanity';
import type {
  AliExpressProductData,
  CategoryPricing,
  CreateProductSourceInput,
  CreateSupplierInput,
  InventoryStatus,
  SourceStatus,
  SupplierStatus,
} from '@/types/dropshipping';
import { ProductTransformer, getTransformer, type TransformedProduct } from './transformer';
import { PriceCalculator, getPriceCalculator } from './pricing';
import { ImageProcessor, getImageProcessor, type ProcessedImage } from './image-processor';
import { AliExpressScraper, StockValidator } from '@/services/aliexpress';

// ============================================
// TYPES
// ============================================

/**
 * Input for importing a product
 */
export interface ImportProductInput {
  /** AliExpress product URL */
  url: string;
  /** Target category ID */
  categoryId: string;
  /** Optional overrides for transformed data */
  overrides?: Partial<TransformedProduct>;
  /** Whether to process images */
  processImages?: boolean;
}

/**
 * Result of a product import
 */
export interface ImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Sanity product document ID */
  sanityProductId?: string;
  /** Product slug */
  productSlug?: string;
  /** ProductSource record ID */
  productSourceId?: string;
  /** Error message if failed */
  error?: string;
  /** Detailed error information */
  errorDetails?: Record<string, unknown>;
}

/**
 * Preview of an import before committing
 */
export interface ImportPreview {
  /** Original AliExpress data */
  aliExpressData: AliExpressProductData;
  /** Transformed product data */
  transformedProduct: TransformedProduct;
  /** Category pricing used */
  categoryPricing: CategoryPricing;
  /** Stock validation result */
  stockStatus: {
    isAvailable: boolean;
    totalStock: number;
    hasVariants: boolean;
    outOfStockVariants: number;
  };
  /** Price breakdown */
  priceBreakdown: {
    costPrice: number;
    retailPrice: number;
    compareAtPrice: number;
    margin: number;
    marginPercentage: number;
  };
  /** Any warnings */
  warnings: string[];
}

/**
 * Import job status for async imports
 */
export interface ImportJobStatus {
  /** Job ID */
  jobId: string;
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current step description */
  currentStep?: string;
  /** Result if completed */
  result?: ImportResult;
  /** Error if failed */
  error?: string;
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Supplier info extracted from AliExpress data
 */
interface SupplierInfo {
  aliExpressId: string;
  name: string;
  storeUrl?: string;
  rating?: number;
}

// ============================================
// PRODUCT IMPORT SERVICE CLASS
// ============================================

/**
 * Product Import Service
 * Orchestrates the complete import flow from AliExpress to Baby Petite
 */
export class ProductImportService {
  private transformer: ProductTransformer;
  private priceCalculator: PriceCalculator;
  private imageProcessor: ImageProcessor;
  private scraper: AliExpressScraper;
  private stockValidator: StockValidator;

  constructor() {
    this.transformer = getTransformer();
    this.priceCalculator = getPriceCalculator();
    this.imageProcessor = getImageProcessor();
    this.scraper = new AliExpressScraper();
    this.stockValidator = new StockValidator();
  }

  /**
   * Main import flow
   *
   * @param input - Import input with URL and category
   * @returns Import result
   */
  async importProduct(input: ImportProductInput): Promise<ImportResult> {
    const { url, categoryId, overrides, processImages = true } = input;

    try {
      // Step 1: Scrape product data from AliExpress
      const aliExpressData = await this.scraper.scrapeProduct(url);

      // Step 2: Get category pricing
      const categoryPricing = await this.getCategoryPricing(categoryId);

      // Step 3: Validate stock
      const stockValidation = this.stockValidator.validateProductStock(aliExpressData);
      if (stockValidation.isCompletelyOutOfStock) {
        return {
          success: false,
          error: 'Product is completely out of stock',
        };
      }

      // Step 4: Transform product data
      let transformedProduct = this.transformer.transformProduct(
        aliExpressData,
        categoryPricing,
        categoryId
      );

      // Apply overrides
      if (overrides) {
        transformedProduct = { ...transformedProduct, ...overrides };
      }

      // Step 5: Process and upload images
      let processedImages: ProcessedImage[] = [];
      if (processImages && aliExpressData.images.length > 0) {
        processedImages = await this.imageProcessor.processImages(
          aliExpressData.images,
          aliExpressData.productId
        );
      }

      // Step 6: Create product in Sanity
      const sanityProductId = await this.createSanityProduct(transformedProduct, processedImages);

      // Step 7: Create supplier record
      const supplier = await this.upsertSupplier({
        aliExpressId: aliExpressData.supplierId,
        name: aliExpressData.supplierName,
        storeUrl: aliExpressData.storeUrl,
        rating: aliExpressData.supplierRating,
      });

      // Step 8: Create ProductSource record in PostgreSQL
      const productSource = await this.createProductSource(
        sanityProductId,
        transformedProduct,
        supplier.id,
        aliExpressData
      );

      // Step 9: Create variants and inventory in PostgreSQL
      await this.createVariantsAndInventory(sanityProductId, transformedProduct);

      return {
        success: true,
        sanityProductId,
        productSlug: transformedProduct.slug,
        productSourceId: productSource.id,
      };
    } catch (error) {
      console.error('Product import error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during import',
        errorDetails: error instanceof Error ? { stack: error.stack } : undefined,
      };
    }
  }

  /**
   * Preview import without committing
   *
   * @param url - AliExpress product URL
   * @param categoryId - Target category ID
   * @returns Preview data
   */
  async previewImport(url: string, categoryId: string): Promise<ImportPreview> {
    // Scrape product data
    const aliExpressData = await this.scraper.scrapeProduct(url);

    // Get category pricing
    const categoryPricing = await this.getCategoryPricing(categoryId);

    // Validate stock
    const stockValidation = this.stockValidator.validateProductStock(aliExpressData);

    // Transform product
    const transformedProduct = this.transformer.transformProduct(
      aliExpressData,
      categoryPricing,
      categoryId
    );

    // Calculate price breakdown
    const margin = this.priceCalculator.calculateMargin(
      transformedProduct.costPrice,
      transformedProduct.basePrice
    );

    // Generate warnings
    const warnings: string[] = [];
    if (stockValidation.hasPartialStock) {
      warnings.push('Some variants are out of stock');
    }
    if (aliExpressData.images.length === 0) {
      warnings.push('No images found for this product');
    }
    if (transformedProduct.variants.length === 0) {
      warnings.push('No variants found - will create default variant');
    }
    if (margin.marginPercentage < 30) {
      warnings.push('Low profit margin - consider adjusting category markup');
    }

    return {
      aliExpressData,
      transformedProduct,
      categoryPricing,
      stockStatus: {
        isAvailable: !stockValidation.isCompletelyOutOfStock,
        totalStock: stockValidation.totalAvailableStock,
        hasVariants: aliExpressData.variants.length > 0,
        outOfStockVariants: stockValidation.outOfStockVariants.length,
      },
      priceBreakdown: {
        costPrice: transformedProduct.costPrice,
        retailPrice: transformedProduct.basePrice,
        compareAtPrice: transformedProduct.compareAtPrice || transformedProduct.basePrice,
        margin: margin.margin,
        marginPercentage: margin.marginPercentage,
      },
      warnings,
    };
  }

  /**
   * Create product in Sanity
   */
  private async createSanityProduct(
    product: TransformedProduct,
    images: ProcessedImage[]
  ): Promise<string> {
    // Build Sanity document
    const doc: Record<string, unknown> = {
      _type: 'product',
      name: product.name,
      slug: { _type: 'slug', current: product.slug },
      description: product.description,
      shortDescription: product.shortDescription,
      basePrice: this.priceCalculator.toCents(product.basePrice),
      compareAtPrice: product.compareAtPrice
        ? this.priceCalculator.toCents(product.compareAtPrice)
        : null,
      sku: product.sku,
      category: { _type: 'reference', _ref: product.categoryId },
      tags: product.tags,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      isActive: true,
      isFeatured: false,
      isNew: true,
      isOnSale: false,
      publishedAt: new Date().toISOString(),
      // Source tracking
      sourceData: {
        aliExpressProductId: product.aliExpressProductId,
        aliExpressUrl: product.aliExpressUrl,
        supplierId: product.supplierId,
        originalPrice: this.priceCalculator.toCents(product.costPrice),
        originalCurrency: 'USD',
        lastSynced: new Date().toISOString(),
        sourceStatus: 'active',
      },
      variantMapping: product.variantMapping.map(m => ({
        localVariantSku: m.localVariantSku,
        aliExpressSku: m.aliExpressSku,
        aliExpressVariantName: m.aliExpressVariantName,
        _key: m.localVariantSku,
      })),
    };

    // Add images if available
    if (images.length > 0) {
      doc.featuredImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: images[0].sanityId },
        alt: product.name,
      };
      doc.images = images.map((img, index) => ({
        _type: 'image',
        _key: `image-${index}`,
        asset: { _type: 'reference', _ref: img.sanityId },
        alt: product.name,
      }));
    }

    // Create document
    const result = await sanityClient.create(doc);
    return result._id;
  }

  /**
   * Create ProductSource record in PostgreSQL
   */
  private async createProductSource(
    sanityProductId: string,
    product: TransformedProduct,
    supplierId: string,
    aliExpressData: AliExpressProductData
  ): Promise<{ id: string }> {
    const input: CreateProductSourceInput = {
      sanityProductId,
      productSlug: product.slug,
      aliExpressProductId: product.aliExpressProductId,
      aliExpressUrl: product.aliExpressUrl,
      supplierId,
      originalPrice: product.costPrice,
      originalCurrency: 'USD',
      categoryId: product.categoryId,
      originalImageUrls: product.originalImageUrls,
      variantMapping: product.variantMapping,
    };

    // Determine inventory status
    const stockValidation = this.stockValidator.validateProductStock(aliExpressData);
    let inventoryStatus: InventoryStatus = 'AVAILABLE';
    if (stockValidation.isCompletelyOutOfStock) {
      inventoryStatus = 'OUT_OF_STOCK';
    } else if (stockValidation.hasPartialStock) {
      inventoryStatus = 'LOW_STOCK';
    }

    const productSource = await prisma.productSource.create({
      data: {
        sanityProductId: input.sanityProductId,
        productSlug: input.productSlug,
        aliExpressProductId: input.aliExpressProductId,
        aliExpressUrl: input.aliExpressUrl,
        supplierId: input.supplierId,
        originalPrice: input.originalPrice,
        originalCurrency: input.originalCurrency || 'USD',
        categoryId: input.categoryId,
        originalImageUrls: input.originalImageUrls,
        variantMapping: input.variantMapping,
        lastSyncedAt: new Date(),
        sourceStatus: 'ACTIVE' as SourceStatus,
        inventoryStatus,
      },
    });

    return { id: productSource.id };
  }

  /**
   * Create or update supplier
   */
  private async upsertSupplier(supplierInfo: SupplierInfo): Promise<{ id: string }> {
    const input: CreateSupplierInput = {
      aliExpressId: supplierInfo.aliExpressId,
      name: supplierInfo.name,
      storeUrl: supplierInfo.storeUrl,
      rating: supplierInfo.rating,
      status: 'ACTIVE' as SupplierStatus,
    };

    const supplier = await prisma.supplier.upsert({
      where: { aliExpressId: input.aliExpressId },
      create: {
        aliExpressId: input.aliExpressId,
        name: input.name,
        storeUrl: input.storeUrl,
        rating: input.rating,
        status: input.status || 'ACTIVE',
        totalOrders: 0,
      },
      update: {
        name: input.name,
        storeUrl: input.storeUrl,
        rating: input.rating,
      },
    });

    return { id: supplier.id };
  }

  /**
   * Create variants and inventory records in PostgreSQL
   */
  private async createVariantsAndInventory(
    sanityProductId: string,
    product: TransformedProduct
  ): Promise<void> {
    // Get the PostgreSQL product by slug
    const pgProduct = await prisma.product.findFirst({
      where: { slug: product.slug },
    });

    if (!pgProduct) {
      // Create product in PostgreSQL if it doesn't exist
      const newProduct = await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.shortDescription,
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice,
          costPrice: product.costPrice,
          sku: product.sku,
          categoryId: product.categoryId,
          tags: product.tags,
          isActive: true,
          isNew: true,
        },
      });

      // Create all variants in batch
      const variantsData = product.variants.map((variant) => ({
        productId: newProduct.id,
        name: variant.name,
        size: variant.size,
        color: variant.color,
        colorCode: variant.colorCode,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        sku: variant.sku,
        isActive: true,
      }));

      const createdVariants = await prisma.variant.createMany({
        data: variantsData,
        returning: true, // PostgreSQL supports returning created records
      });

      // Create all inventory records in batch
      const inventoryData = createdVariants.map((variant, index) => ({
        variantId: variant.id,
        quantity: product.variants[index].stock,
        reservedQuantity: 0,
        available: product.variants[index].stock,
        lowStockThreshold: 10,
        reorderPoint: 20,
        reorderQuantity: 50,
      }));

      await prisma.inventory.createMany({
        data: inventoryData,
      });
    }
  }

  /**
   * Get category pricing configuration
   */
  private async getCategoryPricing(categoryId: string): Promise<CategoryPricing> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        markupFactor: true,
        shippingBuffer: true,
        minPrice: true,
        maxPrice: true,
      },
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    return {
      categoryId: category.id,
      categoryName: category.name,
      markupFactor: category.markupFactor,
      shippingBuffer: Number(category.shippingBuffer),
      minPrice: category.minPrice ? Number(category.minPrice) : undefined,
      maxPrice: category.maxPrice ? Number(category.maxPrice) : undefined,
    };
  }

  /**
   * Close the scraper browser
   */
  async close(): Promise<void> {
    await this.scraper.close();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let importServiceInstance: ProductImportService | null = null;

/**
 * Get the singleton import service instance
 */
export function getImportService(): ProductImportService {
  if (!importServiceInstance) {
    importServiceInstance = new ProductImportService();
  }
  return importServiceInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Import product (convenience function)
 */
export async function importProduct(input: ImportProductInput): Promise<ImportResult> {
  const service = getImportService();
  try {
    return await service.importProduct(input);
  } finally {
    await service.close();
  }
}

/**
 * Preview import (convenience function)
 */
export async function previewImport(url: string, categoryId: string): Promise<ImportPreview> {
  const service = getImportService();
  try {
    return await service.previewImport(url, categoryId);
  } finally {
    await service.close();
  }
}
