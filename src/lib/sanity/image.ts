/**
 * Sanity Image URL Builder
 *
 * Provides utilities for building optimized image URLs from Sanity image sources.
 * Supports:
 * - Automatic format optimization (WebP, AVIF)
 * - Responsive images with srcset
 * - Image transformations (crop, fit, quality)
 * - Placeholder generation for blur-up effects
 */

import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { sanityConfig } from './client';

/**
 * Sanity image URL builder instance
 */
const builder = imageUrlBuilder(sanityConfig);

/**
 * Build a URL for a Sanity image
 *
 * @param source - The Sanity image source (can be an image object, reference, or asset)
 * @returns A URL builder for chaining transformations
 *
 * @example
 * ```ts
 * const url = urlFor(image).width(800).height(600).url();
 * ```
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Image size presets for common use cases
 */
export const imageSizes = {
  // Product images
  productThumbnail: { width: 200, height: 200 },
  productCard: { width: 400, height: 400 },
  productDetail: { width: 800, height: 800 },
  productZoom: { width: 1200, height: 1200 },
  
  // Hero/Banner images
  heroMobile: { width: 640, height: 480 },
  heroTablet: { width: 1024, height: 576 },
  heroDesktop: { width: 1920, height: 1080 },
  
  // Category images
  categoryCard: { width: 300, height: 200 },
  categoryBanner: { width: 1200, height: 400 },
  
  // Collection images
  collectionCard: { width: 400, height: 300 },
  collectionBanner: { width: 1600, height: 500 },
  
  // Avatar/Profile images
  avatarSmall: { width: 40, height: 40 },
  avatarMedium: { width: 80, height: 80 },
  avatarLarge: { width: 160, height: 160 },
  
  // OG/Social images
  ogImage: { width: 1200, height: 630 },
  twitterCard: { width: 1200, height: 600 },
} as const;

/**
 * Image fit modes
 */
export type ImageFit = 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';

/**
 * Build an optimized image URL with common transformations
 *
 * @param source - The Sanity image source
 * @param options - Image transformation options
 * @returns The optimized image URL
 */
export function buildImageUrl(
  source: SanityImageSource,
  options: {
    width?: number;
    height?: number;
    fit?: ImageFit;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png' | 'auto';
    blur?: number;
    sharpen?: number;
  } = {}
): string {
  const { width, height, fit = 'crop', quality = 80, format = 'auto', blur, sharpen } = options;
  
  let urlBuilder = urlFor(source);
  
  if (width) urlBuilder = urlBuilder.width(width);
  if (height) urlBuilder = urlBuilder.height(height);
  if (fit) urlBuilder = urlBuilder.fit(fit);
  if (quality) urlBuilder = urlBuilder.quality(quality);
  if (blur) urlBuilder = urlBuilder.blur(blur);
  if (sharpen) urlBuilder = urlBuilder.sharpen(sharpen);
  
  // Auto format for modern image formats
  if (format === 'auto' || format === 'webp') {
    urlBuilder = urlBuilder.format('webp');
  } else if (format) {
    urlBuilder = urlBuilder.format(format);
  }
  
  return urlBuilder.url();
}

/**
 * Generate srcset for responsive images
 *
 * @param source - The Sanity image source
 * @param widths - Array of widths to generate
 * @param height - Optional fixed height (maintains aspect ratio if not provided)
 * @returns A srcset string
 */
export function buildSrcSet(
  source: SanityImageSource,
  widths: number[],
  height?: number
): string {
  return widths
    .map((width) => {
      const url = buildImageUrl(source, { width, height });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate a low-quality placeholder URL for blur-up effect
 *
 * @param source - The Sanity image source
 * @returns A blurred, low-quality placeholder URL
 */
export function buildPlaceholderUrl(source: SanityImageSource): string {
  return buildImageUrl(source, {
    width: 20,
    quality: 20,
    blur: 10,
    fit: 'clip',
  });
}

/**
 * Get the dominant color of an image (if available from Sanity)
 * This requires the palette plugin to be enabled in Sanity
 *
 * @param source - The Sanity image source with palette data
 * @returns The dominant color or undefined
 */
export function getDominantColor(source: SanityImageSource & { palette?: { dominant?: { background?: string } } }): string | undefined {
  return source?.palette?.dominant?.background;
}

/**
 * Build image props for Next.js Image component
 *
 * @param source - The Sanity image source
 * @param options - Image options
 * @returns Props for Next.js Image component
 */
export function buildImageProps(
  source: SanityImageSource,
  options: {
    width?: number;
    height?: number;
    sizes?: string;
    quality?: number;
    priority?: boolean;
  } = {}
) {
  const { width = 800, height, sizes, quality = 80, priority = false } = options;
  
  return {
    src: buildImageUrl(source, { width, height, quality }),
    width,
    height: height || width,
    sizes,
    quality,
    priority,
    placeholder: 'blur' as const,
    blurDataURL: buildPlaceholderUrl(source),
  };
}

/**
 * Type guard to check if an object is a valid Sanity image
 */
export function isSanityImage(source: unknown): source is SanityImageSource {
  if (!source || typeof source !== 'object') return false;
  
  const obj = source as Record<string, unknown>;
  
  // Check for common Sanity image properties
  return (
    '_ref' in obj || // Reference
    '_id' in obj || // Document
    'asset' in obj || // Image with asset
    'url' in obj // Already resolved URL
  );
}
