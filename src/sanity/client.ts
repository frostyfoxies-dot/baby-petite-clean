import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

/**
 * Sanity Client Configuration
 * Used for fetching data from Sanity CMS
 */
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2024-01-01',
  perspective: 'published',
});

/**
 * Image URL Builder
 * Used for generating optimized image URLs from Sanity image assets
 */
const builder = imageUrlBuilder(client);

/**
 * Generate URL for Sanity images
 * @param source - Sanity image source (can be an image object, reference, or asset)
 * @returns ImageUrlBuilder instance for chaining transformations
 *
 * @example
 * // Basic usage
 * urlFor(image).url()
 *
 * @example
 * // With transformations
 * urlFor(image).width(800).height(600).url()
 * urlFor(image).width(400).height(300).fit('crop').url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Sanity Client for Server-Side Operations
 * Uses token for authenticated requests (drafts, mutations)
 */
export const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

/**
 * Check if Sanity is configured
 */
export function isSanityConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
}

/**
 * Get the Sanity project URL
 */
export function getSanityProjectUrl(): string {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  return `https://www.sanity.io/projects/${projectId}`;
}

/**
 * Get the Sanity Studio URL
 */
export function getSanityStudioUrl(): string {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  return `https://www.sanity.io/studio/project/${projectId}/dataset/${dataset}`;
}

// Export types for use in other modules
export type { SanityImageSource };
