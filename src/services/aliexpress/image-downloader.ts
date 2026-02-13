/**
 * Image Downloader Service
 * Downloads and processes images from AliExpress
 */

import { randomDelay, retryWithBackoff, RateLimiter } from './utils';

/**
 * Configuration for the image downloader
 */
export interface ImageDownloaderConfig {
  /** Maximum concurrent downloads (default: 3) */
  maxConcurrent?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Minimum delay between requests in ms (default: 500) */
  minRequestDelay?: number;
  /** Maximum retries on failure (default: 3) */
  maxRetries?: number;
  /** User agent for requests */
  userAgent?: string;
}

/**
 * Default image downloader configuration
 */
const DEFAULT_CONFIG: Required<ImageDownloaderConfig> = {
  maxConcurrent: 3,
  timeout: 30000,
  minRequestDelay: 500,
  maxRetries: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/**
 * Download result with metadata
 */
export interface DownloadResult {
  /** Original URL */
  url: string;
  /** Image buffer */
  buffer: Buffer;
  /** Content type (MIME type) */
  contentType: string;
  /** File size in bytes */
  size: number;
  /** Image width if available */
  width?: number;
  /** Image height if available */
  height?: number;
}

/**
 * Image Downloader Service
 * Handles downloading and processing images from AliExpress
 */
export class ImageDownloader {
  private config: Required<ImageDownloaderConfig>;
  private rateLimiter: RateLimiter;

  constructor(config?: ImageDownloaderConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimiter = new RateLimiter(this.config.minRequestDelay);
  }

  /**
   * Download a single image from URL
   * @param url - Image URL to download
   * @returns Download result with buffer and metadata
   */
  async downloadImage(url: string): Promise<DownloadResult> {
    // Validate URL
    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid image URL: ${url}`);
    }

    // Wait for rate limiter
    await this.rateLimiter.waitForNextRequest();

    // Download with retry logic
    return retryWithBackoff(
      async () => {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.config.userAgent,
            Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }

        // Get content type
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Get buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract dimensions if possible (basic JPEG/PNG detection)
        const dimensions = this.extractDimensions(buffer, contentType);

        return {
          url,
          buffer,
          contentType,
          size: buffer.length,
          ...dimensions,
        };
      },
      this.config.maxRetries,
      1000
    );
  }

  /**
   * Download multiple images with concurrency control
   * @param urls - Array of image URLs
   * @returns Array of download results
   */
  async downloadImages(urls: string[]): Promise<DownloadResult[]> {
    if (!urls || urls.length === 0) {
      return [];
    }

    const results: DownloadResult[] = [];
    const errors: Array<{ url: string; error: Error }> = [];

    // Process in batches for concurrency control
    for (let i = 0; i < urls.length; i += this.config.maxConcurrent) {
      const batch = urls.slice(i, i + this.config.maxConcurrent);

      const batchResults = await Promise.allSettled(
        batch.map(async (url) => {
          // Add random delay between downloads
          await randomDelay(100, 500);
          return this.downloadImage(url);
        })
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const url = batch[j];

        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            url,
            error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          });
        }
      }

      // Delay between batches
      if (i + this.config.maxConcurrent < urls.length) {
        await randomDelay(500, 1000);
      }
    }

    // Log errors but don't throw - return successful downloads
    if (errors.length > 0) {
      console.warn(`Failed to download ${errors.length} images:`, errors.map((e) => e.url));
    }

    return results;
  }

  /**
   * Convert image to WebP format
   * Note: This is a placeholder for WebP conversion
   * In production, you would use sharp or another image processing library
   * @param buffer - Original image buffer
   * @param quality - WebP quality (1-100, default: 85)
   * @returns WebP image buffer
   */
  async convertToWebP(buffer: Buffer, quality: number = 85): Promise<Buffer> {
    // This is a placeholder implementation
    // In production, you would use a library like sharp:
    //
    // import sharp from 'sharp';
    // return sharp(buffer)
    //   .webp({ quality })
    //   .toBuffer();

    // For now, return the original buffer
    // The actual WebP conversion should be implemented when sharp is added
    console.warn('WebP conversion not implemented - returning original buffer');
    return buffer;
  }

  /**
   * Download and convert image to WebP in one step
   * @param url - Image URL
   * @param quality - WebP quality (1-100)
   * @returns WebP image buffer
   */
  async downloadAsWebP(url: string, quality: number = 85): Promise<Buffer> {
    const result = await this.downloadImage(url);
    return this.convertToWebP(result.buffer, quality);
  }

  /**
   * Download multiple images and convert to WebP
   * @param urls - Array of image URLs
   * @param quality - WebP quality (1-100)
   * @returns Array of WebP buffers
   */
  async downloadAllAsWebP(urls: string[], quality: number = 85): Promise<Buffer[]> {
    const results = await this.downloadImages(urls);
    return Promise.all(results.map((r) => this.convertToWebP(r.buffer, quality)));
  }

  /**
   * Get image metadata without downloading full content
   * @param url - Image URL
   * @returns Image metadata
   */
  async getImageMetadata(url: string): Promise<{
    contentType: string | null;
    contentLength: number | null;
    lastModified: string | null;
  }> {
    await this.rateLimiter.waitForNextRequest();

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': this.config.userAgent,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to get image metadata: ${response.status}`);
    }

    return {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
        ? parseInt(response.headers.get('content-length')!, 10)
        : null,
      lastModified: response.headers.get('last-modified'),
    };
  }

  /**
   * Validate image URL format
   * @param url - URL to validate
   * @returns True if valid image URL
   */
  isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check for common image extensions or AliExpress image domains
      const imagePatterns = [
        /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i,
        /ae01\.alicdn\.com/,
        /alicdn\.com/,
        /img\.aliexpress\.com/,
        /i\d+\.wp\.com/,
      ];

      return imagePatterns.some((pattern) => pattern.test(url));
    } catch {
      return false;
    }
  }

  /**
   * Normalize AliExpress image URL to get highest quality version
   * @param url - Original image URL
   * @returns Normalized URL for highest quality
   */
  normalizeImageUrl(url: string): string {
    if (!url) return url;

    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }

    // Remove size suffixes from AliExpress CDN URLs
    // e.g., image_800x800.jpg -> image.jpg
    url = url.replace(/_\d+x\d+/g, '');

    // Remove quality suffixes
    url = url.replace(/_[qQ]\d+/g, '');

    return url;
  }

  /**
   * Extract image dimensions from buffer (basic implementation)
   * Supports JPEG and PNG
   */
  private extractDimensions(
    buffer: Buffer,
    contentType: string
  ): { width?: number; height?: number } {
    try {
      if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
        return this.extractJpegDimensions(buffer);
      }

      if (contentType === 'image/png') {
        return this.extractPngDimensions(buffer);
      }

      return {};
    } catch {
      return {};
    }
  }

  /**
   * Extract JPEG dimensions from buffer
   */
  private extractJpegDimensions(buffer: Buffer): { width?: number; height?: number } {
    // JPEG SOI marker
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
      return {};
    }

    let offset = 2;
    while (offset < buffer.length - 1) {
      if (buffer[offset] !== 0xff) {
        break;
      }

      const marker = buffer[offset + 1];

      // SOF0, SOF1, SOF2 markers contain dimensions
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }

      // Skip to next marker
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    }

    return {};
  }

  /**
   * Extract PNG dimensions from buffer
   */
  private extractPngDimensions(buffer: Buffer): { width?: number; height?: number } {
    // PNG signature
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!buffer.subarray(0, 8).equals(pngSignature)) {
      return {};
    }

    // IHDR chunk contains dimensions
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return { width, height };
  }

  /**
   * Filter out invalid or duplicate image URLs
   * @param urls - Array of URLs to filter
   * @returns Filtered array of unique valid URLs
   */
  filterValidUrls(urls: string[]): string[] {
    const seen = new Set<string>();
    const valid: string[] = [];

    for (const url of urls) {
      // Normalize URL
      const normalized = this.normalizeImageUrl(url);

      // Skip if invalid
      if (!this.isValidImageUrl(normalized)) {
        continue;
      }

      // Skip duplicates
      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      valid.push(normalized);
    }

    return valid;
  }
}

// Export singleton instance for convenience
let downloaderInstance: ImageDownloader | null = null;

/**
 * Get or create an image downloader instance
 * @param config - Downloader configuration
 * @returns ImageDownloader instance
 */
export function getImageDownloader(config?: ImageDownloaderConfig): ImageDownloader {
  if (!downloaderInstance) {
    downloaderInstance = new ImageDownloader(config);
  }
  return downloaderInstance;
}
