/**
 * Cloudflare CDN Cache Management Utility
 *
 * Provides functions for managing Cloudflare cache programmatically:
 * - Purge all cache
 * - Purge by URL
 * - Purge by Cache Tag (Enterprise only)
 * - Purge by Host
 *
 * @see https://developers.cloudflare.com/api/operations/zone-purge
 */

// ============================================
// TYPES
// ============================================

/**
 * Cloudflare API response
 */
interface CloudflareResponse<T = unknown> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

/**
 * Purge cache result
 */
interface PurgeResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Purge by files request
 */
interface PurgeFilesRequest {
  files: string[];
}

/**
 * Purge by tags request (Enterprise only)
 */
interface PurgeTagsRequest {
  tags: string[];
}

/**
 * Purge by hosts request
 */
interface PurgeHostsRequest {
  hosts: string[];
}

/**
 * Purge everything request
 */
interface PurgeAllRequest {
  purge_everything: boolean;
}

// ============================================
// CONFIGURATION
// ============================================

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Get Cloudflare configuration from environment
 */
function getConfig() {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  return { zoneId, apiToken };
}

/**
 * Check if Cloudflare is configured
 */
export function isCloudflareConfigured(): boolean {
  const { zoneId, apiToken } = getConfig();
  return !!(zoneId && apiToken);
}

// ============================================
// API CLIENT
// ============================================

/**
 * Make a request to Cloudflare API
 */
async function cloudflareFetch<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<CloudflareResponse<T>> {
  const { zoneId, apiToken } = getConfig();

  if (!zoneId || !apiToken) {
    throw new Error(
      'Cloudflare not configured. Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables.'
    );
  }

  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================
// CACHE PURGE FUNCTIONS
// ============================================

/**
 * Purge all cache for the zone
 *
 * Use with caution - this clears all cached content
 *
 * @example
 * ```ts
 * const result = await purgeAllCache();
 * if (result.success) {
 *   console.log('Cache purged successfully');
 * }
 * ```
 */
export async function purgeAllCache(): Promise<PurgeResult> {
  try {
    const { zoneId } = getConfig();

    if (!zoneId) {
      return {
        success: false,
        message: 'CLOUDFLARE_ZONE_ID not configured',
      };
    }

    const response = await cloudflareFetch<PurgeAllRequest>(
      `/zones/${zoneId}/purge_cache`,
      'POST',
      { purge_everything: true }
    );

    if (response.success) {
      return {
        success: true,
        message: 'All cache purged successfully',
      };
    }

    return {
      success: false,
      message: 'Failed to purge cache',
      errors: response.errors.map((e) => e.message),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error purging cache',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Purge cache for specific URLs
 *
 * @param urls - Array of URLs to purge
 * @returns Purge result
 *
 * @example
 * ```ts
 * const result = await purgeCacheByUrls([
 *   'https://kidspetite.com/products/baby-romper',
 *   'https://kidspetite.com/category/newborn',
 * ]);
 * ```
 */
export async function purgeCacheByUrls(urls: string[]): Promise<PurgeResult> {
  try {
    const { zoneId } = getConfig();

    if (!zoneId) {
      return {
        success: false,
        message: 'CLOUDFLARE_ZONE_ID not configured',
      };
    }

    if (!urls.length) {
      return {
        success: false,
        message: 'No URLs provided',
      };
    }

    // Cloudflare limits to 30 URLs per request
    const batchSize = 30;
    const errors: string[] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      const response = await cloudflareFetch<PurgeFilesRequest>(
        `/zones/${zoneId}/purge_cache`,
        'POST',
        { files: batch }
      );

      if (!response.success) {
        errors.push(...response.errors.map((e) => e.message));
      }
    }

    if (errors.length === 0) {
      return {
        success: true,
        message: `Successfully purged ${urls.length} URL(s)`,
      };
    }

    return {
      success: false,
      message: 'Some URLs failed to purge',
      errors,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error purging URLs',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Purge cache by tags (Enterprise only)
 *
 * @param tags - Array of cache tags to purge
 * @returns Purge result
 *
 * @example
 * ```ts
 * // Purge all product-related cache
 * const result = await purgeCacheByTags(['products', 'product-123']);
 * ```
 */
export async function purgeCacheByTags(tags: string[]): Promise<PurgeResult> {
  try {
    const { zoneId } = getConfig();

    if (!zoneId) {
      return {
        success: false,
        message: 'CLOUDFLARE_ZONE_ID not configured',
      };
    }

    if (!tags.length) {
      return {
        success: false,
        message: 'No tags provided',
      };
    }

    const response = await cloudflareFetch<PurgeTagsRequest>(
      `/zones/${zoneId}/purge_cache`,
      'POST',
      { tags }
    );

    if (response.success) {
      return {
        success: true,
        message: `Successfully purged ${tags.length} tag(s)`,
      };
    }

    return {
      success: false,
      message: 'Failed to purge cache by tags',
      errors: response.errors.map((e) => e.message),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error purging cache by tags',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Purge cache by hosts
 *
 * @param hosts - Array of hosts to purge
 * @returns Purge result
 *
 * @example
 * ```ts
 * const result = await purgeCacheByHosts(['kidspetite.com', 'www.kidspetite.com']);
 * ```
 */
export async function purgeCacheByHosts(hosts: string[]): Promise<PurgeResult> {
  try {
    const { zoneId } = getConfig();

    if (!zoneId) {
      return {
        success: false,
        message: 'CLOUDFLARE_ZONE_ID not configured',
      };
    }

    if (!hosts.length) {
      return {
        success: false,
        message: 'No hosts provided',
      };
    }

    const response = await cloudflareFetch<PurgeHostsRequest>(
      `/zones/${zoneId}/purge_cache`,
      'POST',
      { hosts }
    );

    if (response.success) {
      return {
        success: true,
        message: `Successfully purged ${hosts.length} host(s)`,
      };
    }

    return {
      success: false,
      message: 'Failed to purge cache by hosts',
      errors: response.errors.map((e) => e.message),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error purging cache by hosts',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Purge cache for a product page
 *
 * @param slug - Product slug
 * @param baseUrl - Base URL of the site
 * @returns Purge result
 *
 * @example
 * ```ts
 * const result = await purgeProductCache('baby-romper', 'https://kidspetite.com');
 * ```
 */
export async function purgeProductCache(
  slug: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://kidspetite.com'
): Promise<PurgeResult> {
  return purgeCacheByUrls([
    `${baseUrl}/products/${slug}`,
    `${baseUrl}/api/products/${slug}`,
  ]);
}

/**
 * Purge cache for a category page
 *
 * @param slug - Category slug
 * @param baseUrl - Base URL of the site
 * @returns Purge result
 *
 * @example
 * ```ts
 * const result = await purgeCategoryCache('newborn', 'https://kidspetite.com');
 * ```
 */
export async function purgeCategoryCache(
  slug: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://kidspetite.com'
): Promise<PurgeResult> {
  return purgeCacheByUrls([
    `${baseUrl}/category/${slug}`,
  ]);
}

/**
 * Purge cache for a collection page
 *
 * @param slug - Collection slug
 * @param baseUrl - Base URL of the site
 * @returns Purge result
 *
 * @example
 * ```ts
 * const result = await purgeCollectionCache('summer-sale', 'https://kidspetite.com');
 * ```
 */
export async function purgeCollectionCache(
  slug: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://kidspetite.com'
): Promise<PurgeResult> {
  return purgeCacheByUrls([
    `${baseUrl}/collection/${slug}`,
  ]);
}

/**
 * Purge homepage cache
 *
 * @param baseUrl - Base URL of the site
 * @returns Purge result
 *
 * @example
 * ```ts
 * const result = await purgeHomepageCache('https://kidspetite.com');
 * ```
 */
export async function purgeHomepageCache(
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://kidspetite.com'
): Promise<PurgeResult> {
  return purgeCacheByUrls([
    baseUrl,
    `${baseUrl}/`,
  ]);
}

/**
 * Purge all product-related cache
 *
 * This is useful when product data changes in CMS
 *
 * @param baseUrl - Base URL of the site
 * @returns Purge result
 *
 * @example
 * ```ts
 * // After bulk product update in Sanity
 * const result = await purgeAllProductsCache();
 * ```
 */
export async function purgeAllProductsCache(
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://kidspetite.com'
): Promise<PurgeResult> {
  // Purge product listing pages
  const urls = [
    `${baseUrl}/products`,
    `${baseUrl}/api/products`,
  ];

  // Note: For complete purge, you'd need to fetch all product slugs
  // and purge each individually, or use cache tags (Enterprise)

  return purgeCacheByUrls(urls);
}

// ============================================
// WEBHOOK HANDLERS
// ============================================

/**
 * Handle Sanity webhook for cache purge
 *
 * Call this from a Sanity webhook when content changes
 *
 * @param documentType - The type of document that changed
 * @param slug - The slug of the document (if applicable)
 * @param baseUrl - Base URL of the site
 * @returns Purge result
 *
 * @example
 * ```ts
 * // In an API route for Sanity webhook
 * export async function POST(request: Request) {
 *   const { _type, slug } = await request.json();
 *   const result = await handleSanityWebhook(_type, slug?.current);
 *   return Response.json(result);
 * }
 * ```
 */
export async function handleSanityWebhook(
  documentType: string,
  slug?: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://kidspetite.com'
): Promise<PurgeResult> {
  switch (documentType) {
    case 'product':
      if (slug) {
        return purgeProductCache(slug, baseUrl);
      }
      return purgeAllProductsCache(baseUrl);

    case 'category':
      if (slug) {
        return purgeCategoryCache(slug, baseUrl);
      }
      return purgeCacheByUrls([`${baseUrl}/api/categories`]);

    case 'collection':
      if (slug) {
        return purgeCollectionCache(slug, baseUrl);
      }
      return { success: true, message: 'No specific collection to purge' };

    case 'banner':
    case 'siteSettings':
    case 'navigation':
      // These affect the homepage and potentially all pages
      return purgeHomepageCache(baseUrl);

    case 'pageContent':
      // Custom page content changed
      if (slug) {
        return purgeCacheByUrls([`${baseUrl}/${slug}`]);
      }
      return purgeAllCache();

    default:
      // Unknown document type, purge all to be safe
      console.log(`Unknown document type: ${documentType}, purging all cache`);
      return purgeAllCache();
  }
}

// ============================================
// EXPORTS
// ============================================

export const cloudflare = {
  // Configuration
  isConfigured: isCloudflareConfigured,

  // Purge functions
  purgeAll: purgeAllCache,
  purgeUrls: purgeCacheByUrls,
  purgeTags: purgeCacheByTags,
  purgeHosts: purgeCacheByHosts,

  // Convenience functions
  purgeProduct: purgeProductCache,
  purgeCategory: purgeCategoryCache,
  purgeCollection: purgeCollectionCache,
  purgeHomepage: purgeHomepageCache,
  purgeAllProducts: purgeAllProductsCache,

  // Webhook handlers
  handleSanityWebhook,
};

export default cloudflare;
