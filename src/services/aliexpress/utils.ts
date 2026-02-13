/**
 * AliExpress Scraper Utilities
 * Helper functions for the extraction pipeline
 */

/**
 * Generate a random delay for anti-detection
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Promise that resolves after the random delay
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Clean product title by removing brand names and special characters
 * @param title - Raw product title from AliExpress
 * @returns Cleaned title suitable for display
 */
export function cleanProductTitle(title: string): string {
  if (!title) return '';

  return (
    title
      // Remove common AliExpress promotional text
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?free shipping.*?\)/gi, '')
      .replace(/\(.*?hot.*?\)/gi, '')
      .replace(/\(.*?sale.*?\)/gi, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep basic punctuation
      .replace(/[^\w\s\-.,'&]/g, '')
      // Trim and capitalize first letter of each word
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  );
}

/**
 * Parse price string to number
 * Handles various price formats from AliExpress
 * @param priceString - Price string (e.g., "$12.99", "12.99 USD", "US $12.99")
 * @returns Numeric price value
 */
export function parsePrice(priceString: string): number {
  if (!priceString) return 0;

  // Remove currency symbols and text
  const cleaned = priceString
    .replace(/US\s*\$/i, '')
    .replace(/[$€£¥]/g, '')
    .replace(/USD|EUR|GBP|CNY/gi, '')
    .replace(/\s+/g, '')
    .trim();

  // Extract numeric value
  const match = cleaned.match(/[\d,]+\.?\d*/);
  if (!match) return 0;

  // Remove commas and parse
  const numericString = match[0].replace(/,/g, '');
  return parseFloat(numericString) || 0;
}

/**
 * Generate a realistic browser fingerprint for anti-detection
 * @returns Browser fingerprint object
 */
export function generateBrowserFingerprint(): {
  userAgent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezone: string;
} {
  // Common user agents for Chrome on Windows/Mac
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  ];

  // Common viewport sizes
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ];

  // Common locales
  const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];

  // Common timezones
  const timezones = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Asia/Singapore',
  ];

  return {
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    viewport: viewports[Math.floor(Math.random() * viewports.length)],
    locale: locales[Math.floor(Math.random() * locales.length)],
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
  };
}

/**
 * Extract product ID from AliExpress URL
 * Supports multiple URL formats
 * @param url - AliExpress product URL
 * @returns Product ID or null if not found
 */
export function extractProductIdFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Format 1: /item/PRODUCT_ID.html
    const itemMatch = pathname.match(/\/item\/(\d+)\.html/);
    if (itemMatch) return itemMatch[1];

    // Format 2: /item/PRODUCT_ID
    const itemMatchNoExt = pathname.match(/\/item\/(\d+)/);
    if (itemMatchNoExt) return itemMatchNoExt[1];

    // Format 3: Query parameter ?productId=PRODUCT_ID
    const productIdParam = urlObj.searchParams.get('productId');
    if (productIdParam) return productIdParam;

    // Format 4: /product/PRODUCT_ID.html
    const productMatch = pathname.match(/\/product\/(\d+)\.html/);
    if (productMatch) return productMatch[1];

    // Format 5: /product/PRODUCT_ID
    const productMatchNoExt = pathname.match(/\/product\/(\d+)/);
    if (productMatchNoExt) return productMatchNoExt[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate if a URL is a valid AliExpress product URL
 * Includes SSRF protection by blocking internal IP patterns
 * @param url - URL to validate
 * @returns True if valid AliExpress product URL
 */
export function isValidAliExpressUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    
    // SSRF protection: Block internal IP patterns and localhost
    const blockedPatterns = [
      'localhost',
      '127.',
      '10.',
      '172.16.',
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.',
      '192.168.',
      '0.0.0.0',
      '::1',
      'fc00:',
      'fd00:',
      'fe80:',
    ];
    
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check for blocked internal IP patterns
    if (blockedPatterns.some(pattern => hostname.includes(pattern))) {
      return false;
    }
    
    // Block IP addresses in URL format (e.g., http://123.45.67.89/)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      return false;
    }
    
    const validDomains = [
      'aliexpress.com',
      'www.aliexpress.com',
      'm.aliexpress.com',
      'aliexpress.us',
      'www.aliexpress.us',
    ];

    if (!validDomains.includes(urlObj.hostname)) {
      return false;
    }

    // Check if it's a product page
    const productId = extractProductIdFromUrl(url);
    return productId !== null;
  } catch {
    return false;
  }
}

/**
 * Normalize AliExpress URL to standard format
 * @param url - Any AliExpress URL format
 * @returns Normalized URL or null if invalid
 */
export function normalizeAliExpressUrl(url: string): string | null {
  const productId = extractProductIdFromUrl(url);
  if (!productId) return null;

  return `https://www.aliexpress.com/item/${productId}.html`;
}

/**
 * Rate limiter for controlling request frequency
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private minIntervalMs: number;

  constructor(minIntervalMs: number = 3000) {
    this.minIntervalMs = minIntervalMs;
  }

  /**
   * Wait until the minimum interval has passed since the last request
   */
  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const remaining = this.minIntervalMs - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Get the timestamp of the last request
   */
  getLastRequestTime(): number {
    return this.lastRequestTime;
  }
}

/**
 * Request queue for managing multiple scraping requests
 */
export class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private processing: boolean = false;
  private rateLimiter: RateLimiter;

  constructor(minIntervalMs: number = 3000) {
    this.rateLimiter = new RateLimiter(minIntervalMs);
  }

  /**
   * Add a request to the queue
   * @param request - Async function to execute
   * @returns Promise that resolves with the result
   */
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process the queue sequentially with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await this.rateLimiter.waitForNextRequest();
        await request();
      }
    }

    this.processing = false;
  }

  /**
   * Get the current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if the queue is being processed
   */
  isProcessing(): boolean {
    return this.processing;
  }
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelayMs - Base delay in milliseconds
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
