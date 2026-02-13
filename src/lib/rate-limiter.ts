/**
 * Rate Limiter Utility
 * Provides in-memory rate limiting for API endpoints
 * 
 * Note: In production with multiple server instances, use Redis
 * or a similar distributed cache for consistent rate limiting.
 */

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Optional prefix for keys */
  prefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining requests in current window */
  remaining: number;
  /** Seconds until the rate limit resets */
  resetAfter: number;
  /** Whether the limit was exceeded */
  limited: boolean;
}

// ============================================
// RATE LIMITER CLASS
// ============================================

/**
 * In-memory rate limiter
 */
class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check rate limit for an identifier
   *
   * @param identifier - Unique identifier (e.g., user ID, IP address)
   * @param config - Rate limit configuration
   * @returns Rate limit result
   */
  limit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = config.prefix ? `${config.prefix}:${identifier}` : identifier;
    const record = this.store.get(key);

    if (!record) {
      // First request
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetAfter: Math.ceil(config.windowMs / 1000),
        limited: false,
      };
    }

    // Check if window has expired
    if (now > record.resetTime) {
      // Reset counter
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetAfter: Math.ceil(config.windowMs / 1000),
        limited: false,
      };
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      const resetAfter = Math.ceil((record.resetTime - now) / 1000);
      return {
        success: false,
        remaining: 0,
        resetAfter,
        limited: true,
      };
    }

    // Increment counter
    record.count++;
    const remaining = config.maxRequests - record.count;
    const resetAfter = Math.ceil((record.resetTime - now) / 1000);

    return {
      success: true,
      remaining,
      resetAfter,
      limited: false,
    };
  }

  /**
   * Reset rate limit for an identifier
   *
   * @param identifier - Unique identifier
   * @param prefix - Optional prefix
   */
  reset(identifier: string, prefix?: string): void {
    const key = prefix ? `${prefix}:${identifier}` : identifier;
    this.store.delete(key);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let rateLimiterInstance: RateLimiter | null = null;

/**
 * Get the singleton rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
    // Run cleanup every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => rateLimiterInstance?.cleanup(), 5 * 60 * 1000);
    }
  }
  return rateLimiterInstance;
}

// ============================================
// PRECONFIGURED LIMITERS
// ============================================

/**
 * Import API rate limit configuration
 * 10 requests per minute per user
 */
export const IMPORT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  prefix: 'import',
};

/**
 * Preview API rate limit configuration
 * 20 requests per minute per user
 */
export const PREVIEW_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  prefix: 'preview',
};

// ============================================
// CONVENIENCE EXPORT
// ============================================

export const rateLimiter = {
  limit: (identifier: string, config: RateLimitConfig) => 
    getRateLimiter().limit(identifier, config),
  reset: (identifier: string, prefix?: string) => 
    getRateLimiter().reset(identifier, prefix),
};
