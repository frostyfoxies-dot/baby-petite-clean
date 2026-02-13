/**
 * AliExpress Services - Main Entry Point
 * Exports all services for the AliExpress extraction pipeline
 */

// ============================================
// TYPE EXPORTS
// ============================================

// Re-export types from dropshipping types
export type {
  AliExpressProductData,
  AliExpressVariant,
  AliExpressShippingOption,
  ScrapeProductInput,
} from '@/types/dropshipping';

// ============================================
// SCRAPER SERVICE
// ============================================

export {
  AliExpressScraper,
  getScraper,
  closeScraper,
  type ScraperConfig,
} from './scraper';

// ============================================
// STOCK VALIDATOR SERVICE
// ============================================

export {
  StockValidator,
  getStockValidator,
  type StockValidationResult,
  type StockValidatorConfig,
  type StockAction,
} from './stock-validator';

// ============================================
// IMAGE DOWNLOADER SERVICE
// ============================================

export {
  ImageDownloader,
  getImageDownloader,
  type ImageDownloaderConfig,
  type DownloadResult,
} from './image-downloader';

// ============================================
// UTILITY FUNCTIONS
// ============================================

export {
  // Delay functions
  randomDelay,
  
  // Data cleaning
  cleanProductTitle,
  parsePrice,
  
  // Browser fingerprint
  generateBrowserFingerprint,
  
  // URL utilities
  extractProductIdFromUrl,
  isValidAliExpressUrl,
  normalizeAliExpressUrl,
  
  // Rate limiting
  RateLimiter,
  RequestQueue,
  
  // Retry logic
  retryWithBackoff,
} from './utils';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { AliExpressScraper, type ScraperConfig } from './scraper';
import { StockValidator, type StockValidatorConfig } from './stock-validator';
import { ImageDownloader, type ImageDownloaderConfig } from './image-downloader';
import type { AliExpressProductData } from '@/types/dropshipping';

/**
 * Scrape a single product from AliExpress URL
 * Convenience function that creates a scraper instance, scrapes, and closes
 * @param url - AliExpress product URL
 * @param config - Optional scraper configuration
 * @returns Product data
 */
export async function scrapeAliExpressProduct(
  url: string,
  config?: ScraperConfig
): Promise<AliExpressProductData> {
  const scraper = new AliExpressScraper(config);
  try {
    return await scraper.scrapeProduct(url);
  } finally {
    await scraper.close();
  }
}

/**
 * Validate stock for a product
 * Convenience function for quick stock validation
 * @param product - Product data to validate
 * @param config - Optional validator configuration
 * @returns Stock validation result
 */
export function validateProductStock(
  product: AliExpressProductData,
  config?: StockValidatorConfig
): ReturnType<StockValidator['validateProductStock']> {
  const validator = new StockValidator(config);
  return validator.validateProductStock(product);
}

/**
 * Download images from URLs
 * Convenience function for quick image downloads
 * @param urls - Array of image URLs
 * @param config - Optional downloader configuration
 * @returns Array of download results
 */
export async function downloadAliExpressImages(
  urls: string[],
  config?: ImageDownloaderConfig
): Promise<ReturnType<ImageDownloader['downloadImages']>> {
  const downloader = new ImageDownloader(config);
  return downloader.downloadImages(urls);
}

// ============================================
// PIPELINE FUNCTIONS
// ============================================

/**
 * Complete extraction pipeline result
 */
export interface ExtractionPipelineResult {
  /** Product data from scraper */
  product: AliExpressProductData;
  /** Stock validation result */
  stockValidation: ReturnType<StockValidator['validateProductStock']>;
  /** Downloaded images (if requested) */
  images?: Array<{ url: string; buffer: Buffer }>;
  /** Whether the extraction was successful */
  success: boolean;
  /** Error message if extraction failed */
  error?: string;
}

/**
 * Pipeline configuration
 */
export interface ExtractionPipelineConfig {
  /** Scraper configuration */
  scraper?: ScraperConfig;
  /** Stock validator configuration */
  stockValidator?: StockValidatorConfig;
  /** Image downloader configuration */
  imageDownloader?: ImageDownloaderConfig;
  /** Whether to download images */
  downloadImages?: boolean;
  /** Whether to validate stock */
  validateStock?: boolean;
}

/**
 * Run the complete extraction pipeline
 * Scrapes product, validates stock, and optionally downloads images
 * @param url - AliExpress product URL
 * @param config - Pipeline configuration
 * @returns Complete extraction result
 */
export async function runExtractionPipeline(
  url: string,
  config: ExtractionPipelineConfig = {}
): Promise<ExtractionPipelineResult> {
  const { downloadImages = false, validateStock = true } = config;

  const scraper = new AliExpressScraper(config.scraper);

  try {
    // Step 1: Scrape product
    const product = await scraper.scrapeProduct(url);

    // Step 2: Validate stock
    let stockValidation: ReturnType<StockValidator['validateProductStock']>;
    if (validateStock) {
      const validator = new StockValidator(config.stockValidator);
      stockValidation = validator.validateProductStock(product);
    } else {
      // Default validation result
      stockValidation = {
        isValid: true,
        availableVariants: product.variants || [],
        outOfStockVariants: [],
        message: 'Stock validation skipped',
        totalAvailableStock: 0,
        isCompletelyOutOfStock: false,
        hasPartialStock: false,
      };
    }

    // Step 3: Download images (optional)
    let images: Array<{ url: string; buffer: Buffer }> | undefined;
    if (downloadImages && product.images.length > 0) {
      const downloader = new ImageDownloader(config.imageDownloader);
      const downloadResults = await downloader.downloadImages(product.images);
      images = downloadResults.map((result) => ({
        url: result.url,
        buffer: result.buffer,
      }));
    }

    return {
      product,
      stockValidation,
      images,
      success: true,
    };
  } catch (error) {
    // Log the actual error internally for debugging
    console.error('Product extraction error:', error);
    
    // Return a sanitized generic error message to the client
    return {
      product: null as unknown as AliExpressProductData,
      stockValidation: {
        isValid: false,
        availableVariants: [],
        outOfStockVariants: [],
        message: 'Extraction failed',
        totalAvailableStock: 0,
        isCompletelyOutOfStock: true,
        hasPartialStock: false,
      },
      success: false,
      error: 'Failed to fetch product data. Please check the URL and try again.',
    };
  } finally {
    await scraper.close();
  }
}
