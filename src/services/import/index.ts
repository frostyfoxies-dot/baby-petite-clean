/**
 * Import Services - Main Entry Point
 * Exports all services for the AliExpress-to-Kids Petite import pipeline
 */

// ============================================
// PRICE CALCULATION SERVICE
// ============================================

export {
  PriceCalculator,
  getPriceCalculator,
  calculateRetailPrice,
  calculateMargin,
  validatePrice,
  DEFAULT_PRICING_CONFIG,
  type PriceValidationResult,
  type MarginInfo,
  type PriceBreakdown,
} from './pricing';

// ============================================
// DATA TRANSFORMATION SERVICE
// ============================================

export {
  ProductTransformer,
  getTransformer,
  transformProduct,
  transformTitle,
  generateSKU,
  type PortableTextBlock,
  type PortableTextSpan,
  type TransformedVariant,
  type TransformedProduct,
  type TitleTransformOptions,
} from './transformer';

// ============================================
// IMAGE PROCESSING SERVICE
// ============================================

export {
  ImageProcessor,
  getImageProcessor,
  processImages,
  processAndUpload,
  type ProcessedImage,
  type ImageProcessingOptions,
  type SanityImageAsset,
} from './image-processor';

// ============================================
// PRODUCT IMPORT SERVICE
// ============================================

export {
  ProductImportService,
  getImportService,
  importProduct,
  previewImport,
  type ImportProductInput,
  type ImportResult,
  type ImportPreview,
  type ImportJobStatus,
} from './product-import';
