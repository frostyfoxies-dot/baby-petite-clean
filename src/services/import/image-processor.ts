/**
 * Image Processing Service
 * Downloads, processes, and uploads product images from AliExpress
 */

import { sanityClient } from '@/lib/sanity';
import crypto from 'crypto';
import sharp from 'sharp';

// ============================================
// TYPES
// ============================================

/**
 * Processed image result
 */
export interface ProcessedImage {
  /** Original URL */
  originalUrl: string;
  /** Sanity asset ID */
  assetId: string;
  /** Sanity asset document ID */
  sanityId: string;
  /** Public URL */
  url: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Alt text */
  altText?: string;
  /** Whether this is the primary image */
  isPrimary: boolean;
}

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  /** Maximum width for processing */
  maxWidth?: number;
  /** Maximum height for processing */
  maxHeight?: number;
  /** Image quality (1-100) */
  quality?: number;
  /** Convert to WebP */
  convertToWebP?: boolean;
  /** Maximum images to process */
  maxImages?: number;
  /** Concurrency limit for parallel processing */
  concurrency?: number;
}

/**
 * Sanity image asset response
 */
export interface SanityImageAsset {
  _id: string;
  _type: 'sanity.imageAsset';
  assetId: string;
  url: string;
  path: string;
  originalFilename: string;
  extension: string;
  mimeType: string;
  sha1hash: string;
  size: number;
  metadata: {
    dimensions: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    hasAlpha: boolean;
    isOpaque: boolean;
  };
}

/**
 * Image download result
 */
interface DownloadResult {
  buffer: Buffer;
  contentType: string;
  originalUrl: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 85,
  convertToWebP: true,
  maxImages: 10,
  concurrency: 3,
};

/**
 * Supported image formats
 */
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif'] as const;

// ============================================
// CONCURRENCY LIMITER
// ============================================

/**
 * Simple concurrency limiter for parallel processing
 */
class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private limit: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.next();
        }
      };

      if (this.running < this.limit) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  private next() {
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
}

// ============================================
// IMAGE PROCESSOR CLASS
// ============================================

/**
 * Image Processor Service
 * Handles downloading, processing, and uploading images
 */
export class ImageProcessor {
  private options: Required<ImageProcessingOptions>;

  constructor(options?: ImageProcessingOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Process images from AliExpress with parallel processing
   *
   * @param imageUrls - Array of image URLs to process
   * @param productId - Product ID for naming
   * @returns Array of processed images
   *
   * @example
   * ```ts
   * const processor = new ImageProcessor();
   * const images = await processor.processImages(
   *   ['https://ae01.alicdn.com/image1.jpg', 'https://ae01.alicdn.com/image2.jpg'],
   *   'product-123'
   * );
   * ```
   */
  async processImages(
    imageUrls: string[],
    productId: string
  ): Promise<ProcessedImage[]> {
    const urlsToProcess = imageUrls.slice(0, this.options.maxImages);
    const limiter = new ConcurrencyLimiter(this.options.concurrency);

    // Process images concurrently with limit
    const tasks = urlsToProcess.map((url, index) =>
      limiter.run(async () => {
        const isPrimary = index === 0;
        try {
          return await this.processAndUpload(url, productId, index, isPrimary);
        } catch (error) {
          console.error(`Failed to process image ${index} for product ${productId}:`, error);
          return null;
        }
      })
    );

    const results = await Promise.all(tasks);

    // Filter out failed images and return successful ones
    return results.filter((result): result is ProcessedImage => result !== null);
  }

  /**
   * Download, convert to WebP, and upload to storage
   *
   * @param url - Image URL
   * @param productId - Product ID
   * @param index - Image index
   * @param isPrimary - Whether this is the primary image
   * @returns Processed image result
   */
  async processAndUpload(
    url: string,
    productId: string,
    index: number,
    isPrimary: boolean
  ): Promise<ProcessedImage> {
    // Download image
    const downloaded = await this.downloadImage(url);

    // Process image (resize, convert to WebP)
    const processed = await this.processImageBuffer(downloaded.buffer);

    // Upload to Sanity
    const asset = await this.uploadToSanity(
      processed.buffer,
      productId,
      index,
      processed.width,
      processed.height
    );

    return {
      originalUrl: url,
      assetId: asset.assetId,
      sanityId: asset._id,
      url: asset.url,
      width: asset.metadata.dimensions.width,
      height: asset.metadata.dimensions.height,
      isPrimary,
    };
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<DownloadResult> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      contentType,
      originalUrl: url,
    };
  }

  /**
   * Process image buffer (resize, convert to WebP)
   */
  private async processImageBuffer(
    buffer: Buffer
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    let image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if needed
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > this.options.maxWidth || metadata.height > this.options.maxHeight)
    ) {
      image = image.resize(this.options.maxWidth, this.options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to WebP if enabled
    if (this.options.convertToWebP) {
      image = image.webp({ quality: this.options.quality });
    } else {
      // Keep original format but recompress
      image = image.jpeg({ quality: this.options.quality });
    }

    const processedBuffer = await image.toBuffer();
    const processedMetadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
    };
  }

  /**
   * Upload to Sanity as image asset
   */
  private async uploadToSanity(
    buffer: Buffer,
    productId: string,
    index: number,
    width: number,
    height: number
  ): Promise<SanityImageAsset> {
    const filename = this.generateFilename(productId, index);
    const extension = this.options.convertToWebP ? 'webp' : 'jpg';
    const mimeType = this.options.convertToWebP ? 'image/webp' : 'image/jpeg';

    // Upload to Sanity
    const asset = await sanityClient.assets.upload('image', buffer, {
      filename: `${filename}.${extension}`,
      contentType: mimeType,
      metadata: {
        dimensions: { width, height },
      },
    });

    return asset as SanityImageAsset;
  }

  /**
   * Generate filename for image
   */
  private generateFilename(productId: string, index: number): string {
    const hash = crypto
      .createHash('md5')
      .update(`${productId}-${index}`)
      .digest('hex')
      .slice(0, 8);
    return `${productId}-${index}-${hash}`;
  }

  /**
   * Create Sanity image reference from asset
   */
  createSanityImageReference(asset: SanityImageAsset): {
    _type: 'image';
    asset: { _type: 'reference'; _ref: string };
  } {
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    };
  }

  /**
   * Validate image URL
   */
  isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const extension = parsed.pathname.split('.').pop()?.toLowerCase();
      return (
        SUPPORTED_FORMATS.includes(extension as typeof SUPPORTED_FORMATS[number]) ||
        parsed.hostname.includes('alicdn.com') ||
        parsed.hostname.includes('aliexpress.com')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get image dimensions without downloading full image
   */
  async getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) return null;

      // Download just enough bytes to get dimensions
      const rangeResponse = await fetch(url, {
        headers: {
          Range: 'bytes=0-32768',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const buffer = Buffer.from(await rangeResponse.arrayBuffer());
      const metadata = await sharp(buffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Batch process images with progress callback
   */
  async processImagesWithProgress(
    imageUrls: string[],
    productId: string,
    onProgress?: (current: number, total: number, success: boolean) => void
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const urlsToProcess = imageUrls.slice(0, this.options.maxImages);
    const total = urlsToProcess.length;

    for (let i = 0; i < urlsToProcess.length; i++) {
      const url = urlsToProcess[i];
      const isPrimary = i === 0;

      try {
        const processed = await this.processAndUpload(url, productId, i, isPrimary);
        results.push(processed);
        onProgress?.(i + 1, total, true);
      } catch (error) {
        console.error(`Failed to process image ${i}:`, error);
        onProgress?.(i + 1, total, false);
      }
    }

    return results;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let imageProcessorInstance: ImageProcessor | null = null;

/**
 * Get the singleton image processor instance
 */
export function getImageProcessor(options?: ImageProcessingOptions): ImageProcessor {
  if (!imageProcessorInstance || options) {
    imageProcessorInstance = new ImageProcessor(options);
  }
  return imageProcessorInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Process images (convenience function)
 */
export async function processImages(
  imageUrls: string[],
  productId: string,
  options?: ImageProcessingOptions
): Promise<ProcessedImage[]> {
  return getImageProcessor(options).processImages(imageUrls, productId);
}

/**
 * Process single image (convenience function)
 */
export async function processAndUpload(
  url: string,
  productId: string,
  index: number,
  isPrimary: boolean,
  options?: ImageProcessingOptions
): Promise<ProcessedImage> {
  return getImageProcessor(options).processAndUpload(url, productId, index, isPrimary);
}
