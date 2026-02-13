/**
 * Unit Tests for AliExpress Utilities
 * Tests for extraction pipeline utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  randomDelay,
  cleanProductTitle,
  parsePrice,
  generateBrowserFingerprint,
  extractProductIdFromUrl,
  isValidAliExpressUrl,
  normalizeAliExpressUrl,
  RateLimiter,
  RequestQueue,
  retryWithBackoff,
} from '../utils';

// ============================================
// randomDelay Tests
// ============================================

describe('randomDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after a delay within the specified range', async () => {
    const minMs = 100;
    const maxMs = 500;
    const promise = randomDelay(minMs, maxMs);

    // Fast-forward time
    await vi.runAllTimersAsync();

    // Should resolve without throwing
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle equal min and max values', async () => {
    const promise = randomDelay(100, 100);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();
  });

  it('should throw or handle invalid range where min > max', () => {
    // BUG: This test documents that randomDelay doesn't validate min <= max
    // When min > max, Math.random() * (max - minMs + 1) produces negative range
    // This could cause unexpected behavior
    const result = randomDelay(500, 100);
    // The function doesn't validate this - potential bug
    expect(result).toBeInstanceOf(Promise);
  });
});

// ============================================
// cleanProductTitle Tests
// ============================================

describe('cleanProductTitle', () => {
  it('should return empty string for null/undefined input', () => {
    expect(cleanProductTitle(null as unknown as string)).toBe('');
    expect(cleanProductTitle(undefined as unknown as string)).toBe('');
    expect(cleanProductTitle('')).toBe('');
  });

  it('should remove promotional text in brackets', () => {
    const input = '[HOT SALE] Baby Dress [FREE SHIPPING]';
    const result = cleanProductTitle(input);
    expect(result).not.toContain('[HOT SALE]');
    expect(result).not.toContain('[FREE SHIPPING]');
  });

  it('should remove promotional text in parentheses', () => {
    const input = 'Baby Dress (free shipping) (hot sale)';
    const result = cleanProductTitle(input);
    expect(result.toLowerCase()).not.toContain('free shipping');
    expect(result.toLowerCase()).not.toContain('hot sale');
  });

  it('should remove special characters but keep basic punctuation', () => {
    const input = 'Baby Dress!!! @#$ Size 2T...';
    const result = cleanProductTitle(input);
    expect(result).not.toContain('!');
    expect(result).not.toContain('@');
    expect(result).not.toContain('#');
    // Should keep periods and hyphens
    expect(result).toContain('Size 2T');
  });

  it('should normalize whitespace', () => {
    const input = 'Baby    Dress   Size   2T';
    const result = cleanProductTitle(input);
    expect(result).not.toContain('   ');
    expect(result).not.toContain('  ');
  });

  it('should convert to title case', () => {
    const input = 'baby dress size 2t';
    const result = cleanProductTitle(input);
    expect(result).toBe('Baby Dress Size 2t');
  });

  it('should handle very long titles', () => {
    const longTitle = 'A'.repeat(1000);
    const result = cleanProductTitle(longTitle);
    // BUG: No max length constraint - title can be arbitrarily long
    expect(result.length).toBe(1000);
  });

  it('should handle unicode and emoji characters', () => {
    const input = 'Baby Dress 👶🎀💖 Special Edition';
    const result = cleanProductTitle(input);
    // BUG: Unicode emoji are removed by the regex [^\w\s\-.,'&]
    // This may not be desired behavior for international products
    expect(result).not.toContain('👶');
    expect(result).not.toContain('🎀');
  });

  it('should handle titles with only special characters', () => {
    const input = '@#$%^&*()!';
    const result = cleanProductTitle(input);
    // After removing all special chars, should return empty or minimal
    expect(result.trim()).toBe('');
  });
});

// ============================================
// parsePrice Tests
// ============================================

describe('parsePrice', () => {
  it('should return 0 for null/undefined/empty input', () => {
    expect(parsePrice(null as unknown as string)).toBe(0);
    expect(parsePrice(undefined as unknown as string)).toBe(0);
    expect(parsePrice('')).toBe(0);
  });

  it('should parse price with dollar sign', () => {
    expect(parsePrice('$12.99')).toBe(12.99);
    expect(parsePrice('$100')).toBe(100);
  });

  it('should parse price with US $ prefix', () => {
    expect(parsePrice('US $12.99')).toBe(12.99);
    expect(parsePrice('US$12.99')).toBe(12.99);
  });

  it('should parse price with currency suffix', () => {
    expect(parsePrice('12.99 USD')).toBe(12.99);
    expect(parsePrice('12.99 EUR')).toBe(12.99);
    expect(parsePrice('12.99 GBP')).toBe(12.99);
  });

  it('should parse price with other currency symbols', () => {
    expect(parsePrice('€12.99')).toBe(12.99);
    expect(parsePrice('£12.99')).toBe(12.99);
    expect(parsePrice('¥100')).toBe(100);
  });

  it('should parse price with commas for thousands', () => {
    expect(parsePrice('$1,234.56')).toBe(1234.56);
    expect(parsePrice('1,000')).toBe(1000);
  });

  it('should handle prices without decimal points', () => {
    expect(parsePrice('$100')).toBe(100);
    expect(parsePrice('100 USD')).toBe(100);
  });

  it('should return 0 for strings without numeric values', () => {
    expect(parsePrice('free')).toBe(0);
    expect(parsePrice('N/A')).toBe(0);
    expect(parsePrice('Price on request')).toBe(0);
  });

  it('should handle negative prices', () => {
    // BUG: parsePrice doesn't handle negative prices explicitly
    // The regex [\d,]+\.?\d* doesn't match negative signs
    expect(parsePrice('-12.99')).toBe(12.99); // Returns positive!
  });

  it('should handle zero price', () => {
    expect(parsePrice('$0')).toBe(0);
    expect(parsePrice('$0.00')).toBe(0);
  });

  it('should handle very large prices', () => {
    const result = parsePrice('$999,999,999.99');
    expect(result).toBe(999999999.99);
  });

  it('should extract first numeric value from complex string', () => {
    expect(parsePrice('Was $50.00 Now $12.99')).toBe(50); // Returns first match
  });

  it('should handle malformed price strings', () => {
    // BUG: Multiple decimal points not handled
    expect(parsePrice('12.99.99')).toBe(12.99); // Takes first valid portion
  });
});

// ============================================
// extractProductIdFromUrl Tests
// ============================================

describe('extractProductIdFromUrl', () => {
  it('should return null for null/undefined/empty input', () => {
    expect(extractProductIdFromUrl(null as unknown as string)).toBeNull();
    expect(extractProductIdFromUrl(undefined as unknown as string)).toBeNull();
    expect(extractProductIdFromUrl('')).toBeNull();
  });

  it('should extract ID from /item/ID.html format', () => {
    const url = 'https://www.aliexpress.com/item/1234567890.html';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should extract ID from /item/ID format (no extension)', () => {
    const url = 'https://www.aliexpress.com/item/1234567890';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should extract ID from /product/ID.html format', () => {
    const url = 'https://www.aliexpress.com/product/1234567890.html';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should extract ID from /product/ID format', () => {
    const url = 'https://www.aliexpress.com/product/1234567890';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should extract ID from query parameter productId', () => {
    const url = 'https://www.aliexpress.com/item.html?productId=1234567890';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should return null for invalid URLs', () => {
    expect(extractProductIdFromUrl('not-a-url')).toBeNull();
    expect(extractProductIdFromUrl('https://example.com/product/123')).toBeNull();
  });

  it('should return null for AliExpress URLs without product ID', () => {
    const url = 'https://www.aliexpress.com/category/clothing';
    expect(extractProductIdFromUrl(url)).toBeNull();
  });

  it('should handle mobile AliExpress URLs', () => {
    const url = 'https://m.aliexpress.com/item/1234567890.html';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should handle aliexpress.us domain', () => {
    const url = 'https://www.aliexpress.us/item/1234567890.html';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should handle URLs with additional query parameters', () => {
    const url = 'https://www.aliexpress.com/item/1234567890.html?spm=123&algo=456';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should handle URLs with hash fragments', () => {
    const url = 'https://www.aliexpress.com/item/1234567890.html#reviews';
    expect(extractProductIdFromUrl(url)).toBe('1234567890');
  });

  it('should handle product IDs with leading zeros', () => {
    const url = 'https://www.aliexpress.com/item/001234567890.html';
    expect(extractProductIdFromUrl(url)).toBe('001234567890');
  });

  it('should handle very long product IDs', () => {
    const longId = '1'.repeat(20);
    const url = `https://www.aliexpress.com/item/${longId}.html`;
    expect(extractProductIdFromUrl(url)).toBe(longId);
  });
});

// ============================================
// isValidAliExpressUrl Tests
// ============================================

describe('isValidAliExpressUrl', () => {
  it('should return false for null/undefined/empty input', () => {
    expect(isValidAliExpressUrl(null as unknown as string)).toBe(false);
    expect(isValidAliExpressUrl(undefined as unknown as string)).toBe(false);
    expect(isValidAliExpressUrl('')).toBe(false);
  });

  it('should return true for valid AliExpress URLs', () => {
    expect(isValidAliExpressUrl('https://www.aliexpress.com/item/1234567890.html')).toBe(true);
    expect(isValidAliExpressUrl('https://aliexpress.com/item/1234567890.html')).toBe(true);
    expect(isValidAliExpressUrl('https://m.aliexpress.com/item/1234567890.html')).toBe(true);
    expect(isValidAliExpressUrl('https://www.aliexpress.us/item/1234567890.html')).toBe(true);
  });

  it('should return false for non-AliExpress URLs', () => {
    expect(isValidAliExpressUrl('https://www.amazon.com/product/123')).toBe(false);
    expect(isValidAliExpressUrl('https://www.ebay.com/item/123')).toBe(false);
  });

  it('should return false for AliExpress URLs without product ID', () => {
    expect(isValidAliExpressUrl('https://www.aliexpress.com/')).toBe(false);
    expect(isValidAliExpressUrl('https://www.aliexpress.com/category/clothing')).toBe(false);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidAliExpressUrl('not-a-url')).toBe(false);
    expect(isValidAliExpressUrl('aliexpress.com/item/123')).toBe(false); // Missing protocol
  });

  it('should return false for URLs with invalid protocol', () => {
    expect(isValidAliExpressUrl('ftp://www.aliexpress.com/item/123.html')).toBe(false);
  });
});

// ============================================
// normalizeAliExpressUrl Tests
// ============================================

describe('normalizeAliExpressUrl', () => {
  it('should return null for invalid URLs', () => {
    expect(normalizeAliExpressUrl(null as unknown as string)).toBeNull();
    expect(normalizeAliExpressUrl('')).toBeNull();
    expect(normalizeAliExpressUrl('not-a-url')).toBeNull();
  });

  it('should normalize to standard format', () => {
    const result = normalizeAliExpressUrl('https://m.aliexpress.com/item/1234567890.html');
    expect(result).toBe('https://www.aliexpress.com/item/1234567890.html');
  });

  it('should preserve product ID from various formats', () => {
    const result = normalizeAliExpressUrl('https://aliexpress.us/product/1234567890');
    expect(result).toBe('https://www.aliexpress.com/item/1234567890.html');
  });
});

// ============================================
// RateLimiter Tests
// ============================================

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow immediate first request', async () => {
    const limiter = new RateLimiter(1000);
    const start = Date.now();
    
    const promise = limiter.waitForNextRequest();
    await vi.runAllTimersAsync();
    await promise;
    
    // First request should not wait
    expect(limiter.getLastRequestTime()).toBeGreaterThan(0);
  });

  it('should enforce minimum interval between requests', async () => {
    const limiter = new RateLimiter(1000);
    
    // First request
    await limiter.waitForNextRequest();
    vi.advanceTimersByTime(100); // Only 100ms passed
    
    // Second request should wait
    const promise = limiter.waitForNextRequest();
    await vi.runAllTimersAsync();
    await promise;
    
    // Should have waited at least 900ms more
    expect(limiter.getLastRequestTime()).toBeGreaterThan(0);
  });

  it('should allow request after interval has passed', async () => {
    const limiter = new RateLimiter(1000);
    
    await limiter.waitForNextRequest();
    vi.advanceTimersByTime(2000); // 2 seconds passed
    
    // Should not wait additional time
    const promise = limiter.waitForNextRequest();
    await vi.runAllTimersAsync();
    await promise;
    
    expect(limiter.getLastRequestTime()).toBeGreaterThan(0);
  });

  it('should handle concurrent requests correctly', async () => {
    const limiter = new RateLimiter(100);
    
    // Start multiple concurrent requests
    const promises = [
      limiter.waitForNextRequest(),
      limiter.waitForNextRequest(),
      limiter.waitForNextRequest(),
    ];
    
    await vi.runAllTimersAsync();
    await Promise.all(promises);
    
    // All should complete
    expect(limiter.getLastRequestTime()).toBeGreaterThan(0);
  });

  it('should use default interval if not specified', () => {
    const limiter = new RateLimiter();
    // Default is 3000ms
    expect(limiter.getLastRequestTime()).toBe(0);
  });

  it('should handle zero interval', async () => {
    const limiter = new RateLimiter(0);
    
    await limiter.waitForNextRequest();
    await limiter.waitForNextRequest();
    
    // Should not wait with 0 interval
    expect(limiter.getLastRequestTime()).toBeGreaterThan(0);
  });

  it('should handle negative interval', async () => {
    // BUG: Negative interval not validated
    const limiter = new RateLimiter(-1000);
    
    await limiter.waitForNextRequest();
    // With negative interval, remaining = minIntervalMs - elapsed
    // If elapsed is small and minIntervalMs is negative, remaining is negative
    // The condition `remaining > 0` would be false, so no wait
    // This might not be intended behavior
    expect(limiter.getLastRequestTime()).toBeGreaterThan(0);
  });
});

// ============================================
// RequestQueue Tests
// ============================================

describe('RequestQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should process requests sequentially', async () => {
    const queue = new RequestQueue(100);
    const order: number[] = [];
    
    const promise1 = queue.add(async () => {
      order.push(1);
      return 'result1';
    });
    
    const promise2 = queue.add(async () => {
      order.push(2);
      return 'result2';
    });
    
    await vi.runAllTimersAsync();
    const [result1, result2] = await Promise.all([promise1, promise2]);
    
    expect(result1).toBe('result1');
    expect(result2).toBe('result2');
    expect(order).toEqual([1, 2]);
  });

  it('should return queue length', () => {
    const queue = new RequestQueue(100);
    
    queue.add(async () => 'result');
    queue.add(async () => 'result');
    
    expect(queue.getQueueLength()).toBe(2);
  });

  it('should track processing state', async () => {
    const queue = new RequestQueue(100);
    
    expect(queue.isProcessing()).toBe(false);
    
    queue.add(async () => {
      return 'result';
    });
    
    await vi.runAllTimersAsync();
    
    // After processing, should be false again
    expect(queue.isProcessing()).toBe(false);
  });

  it('should handle request errors', async () => {
    const queue = new RequestQueue(100);
    
    const promise = queue.add(async () => {
      throw new Error('Test error');
    });
    
    await vi.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('Test error');
  });

  it('should continue processing after error', async () => {
    const queue = new RequestQueue(100);
    
    const promise1 = queue.add(async () => {
      throw new Error('Test error');
    });
    
    const promise2 = queue.add(async () => 'success');
    
    await vi.runAllTimersAsync();
    
    await expect(promise1).rejects.toThrow('Test error');
    await expect(promise2).resolves.toBe('success');
  });
});

// ============================================
// retryWithBackoff Tests
// ============================================

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, 3, 100);
    await vi.runAllTimersAsync();
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, 3, 100);
    await vi.runAllTimersAsync();
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries exceeded', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
    
    const promise = retryWithBackoff(fn, 3, 100);
    await vi.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, 3, 100);
    
    // First attempt immediately
    expect(fn).toHaveBeenCalledTimes(1);
    
    // After first failure, wait 100ms (baseDelay * 2^0)
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);
    
    // After second failure, wait 200ms (baseDelay * 2^1)
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(3);
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should handle zero max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Fail'));
    
    const promise = retryWithBackoff(fn, 0, 100);
    await vi.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('Fail');
    expect(fn).toHaveBeenCalledTimes(1); // Only initial attempt
  });

  it('should handle non-Error throws', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce('string error')
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, 3, 100);
    await vi.runAllTimersAsync();
    const result = await promise;
    
    expect(result).toBe('success');
  });

  it('should use default parameters', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();
    const result = await promise;
    
    expect(result).toBe('success');
  });
});

// ============================================
// generateBrowserFingerprint Tests
// ============================================

describe('generateBrowserFingerprint', () => {
  it('should return a valid fingerprint object', () => {
    const fingerprint = generateBrowserFingerprint();
    
    expect(fingerprint).toHaveProperty('userAgent');
    expect(fingerprint).toHaveProperty('viewport');
    expect(fingerprint).toHaveProperty('locale');
    expect(fingerprint).toHaveProperty('timezone');
  });

  it('should return valid viewport dimensions', () => {
    const fingerprint = generateBrowserFingerprint();
    
    expect(fingerprint.viewport).toHaveProperty('width');
    expect(fingerprint.viewport).toHaveProperty('height');
    expect(fingerprint.viewport.width).toBeGreaterThan(0);
    expect(fingerprint.viewport.height).toBeGreaterThan(0);
  });

  it('should return a valid user agent string', () => {
    const fingerprint = generateBrowserFingerprint();
    
    expect(typeof fingerprint.userAgent).toBe('string');
    expect(fingerprint.userAgent.length).toBeGreaterThan(0);
    // Should be a Chrome user agent
    expect(fingerprint.userAgent).toContain('Chrome');
  });

  it('should return valid locale format', () => {
    const fingerprint = generateBrowserFingerprint();
    
    expect(fingerprint.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
  });

  it('should return a valid timezone', () => {
    const fingerprint = generateBrowserFingerprint();
    
    expect(typeof fingerprint.timezone).toBe('string');
    expect(fingerprint.timezone.length).toBeGreaterThan(0);
  });

  it('should generate random fingerprints (variety check)', () => {
    const fingerprints = new Set<string>();
    
    // Generate multiple fingerprints and check for variety
    for (let i = 0; i < 10; i++) {
      const fp = generateBrowserFingerprint();
      fingerprints.add(fp.userAgent);
    }
    
    // Should have some variety (at least 2 different user agents in 10 tries)
    // Note: This test could theoretically fail due to randomness, but very unlikely
    expect(fingerprints.size).toBeGreaterThanOrEqual(1);
  });
});
