/**
 * Sanity CMS Client Configuration
 *
 * Configures the Sanity client for fetching content from the Sanity CMS.
 * Uses the next-sanity package for optimal Next.js integration with:
 * - Automatic caching and revalidation
 * - Live preview mode support
 * - TypeScript support
 */

import { createClient } from 'next-sanity';
import { SANITY_PROJECT_ID, SANITY_API_TOKEN, SANITY_DATASET } from '../env';

/**
 * Sanity API version
 * Use the current date to ensure we're using the latest API features
 */
const SANITY_API_VERSION = '2024-01-01';

/**
 * Sanity client configuration
 *
 * This client is configured for server-side usage with:
 * - Token authentication for private datasets
 * - CDN caching for better performance
 * - Perspective for draft/preview support
 */
export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true, // Use CDN for better performance
  token: SANITY_API_TOKEN, // Required for private datasets
  perspective: 'published', // Default to published content
});

/**
 * Sanity client for draft/preview mode
 *
 * Use this client when you need to fetch draft content
 * for preview mode in the CMS
 */
export const sanityPreviewClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: false, // Don't use CDN for preview
  token: SANITY_API_TOKEN,
  perspective: 'previewDrafts', // Include draft content
});

/**
 * Get the appropriate Sanity client based on preview mode
 *
 * @param preview - Whether to use preview mode
 * @returns The appropriate Sanity client
 */
export function getSanityClient(preview: boolean = false) {
  return preview ? sanityPreviewClient : sanityClient;
}

/**
 * Sanity configuration object for next-sanity integration
 * Used with the createClient from next-sanity for Image components
 */
export const sanityConfig = {
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
};

/**
 * Re-export types from Sanity for convenience
 */
export type { SanityImageSource } from '@sanity/image-url/lib/types/types';
