/**
 * AliExpress Product Scraper Service
 * Uses Playwright for browser automation with anti-detection measures
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import * as cheerio from 'cheerio';
import type {
  AliExpressProductData,
  AliExpressVariant,
  AliExpressShippingOption,
} from '@/types/dropshipping';
import {
  randomDelay,
  parsePrice,
  generateBrowserFingerprint,
  extractProductIdFromUrl,
  isValidAliExpressUrl,
  normalizeAliExpressUrl,
  RateLimiter,
  retryWithBackoff,
} from './utils';

/**
 * Configuration options for the AliExpress scraper
 */
export interface ScraperConfig {
  /** Headless mode (default: true) */
  headless?: boolean;
  /** Minimum delay between requests in ms (default: 3000) */
  minRequestDelay?: number;
  /** Maximum retries on failure (default: 3) */
  maxRetries?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Proxy configuration */
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
}

/**
 * Default scraper configuration
 */
const DEFAULT_CONFIG: Required<Omit<ScraperConfig, 'proxy'>> & { proxy?: ScraperConfig['proxy'] } = {
  headless: true,
  minRequestDelay: 3000,
  maxRetries: 3,
  timeout: 30000,
  proxy: undefined,
};

/**
 * AliExpress Product Scraper
 * Extracts product data from AliExpress product pages
 */
export class AliExpressScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: Required<Omit<ScraperConfig, 'proxy'>> & { proxy?: ScraperConfig['proxy'] };
  private rateLimiter: RateLimiter;
  private fingerprint: ReturnType<typeof generateBrowserFingerprint>;

  constructor(config?: ScraperConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimiter = new RateLimiter(this.config.minRequestDelay);
    this.fingerprint = generateBrowserFingerprint();
  }

  /**
   * Initialize the browser instance
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) return;

    this.browser = await chromium.launch({
      headless: this.config.headless,
      proxy: this.config.proxy,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: this.fingerprint.userAgent,
      viewport: this.fingerprint.viewport,
      locale: this.fingerprint.locale,
      timezoneId: this.fingerprint.timezone,
      // Disable automation flags
      javaScriptEnabled: true,
      bypassCSP: true,
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Add scripts to hide automation
    await this.context.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Override navigator.plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override navigator.languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Hide Chrome automation
      // @ts-expect-error - chrome property may not exist
      window.chrome = {
        runtime: {},
      };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      // @ts-expect-error - permissions override
      window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters);
    });
  }

  /**
   * Main entry point - scrape product from URL
   * @param url - AliExpress product URL
   * @returns Complete product data
   */
  async scrapeProduct(url: string): Promise<AliExpressProductData> {
    // Validate URL
    if (!isValidAliExpressUrl(url)) {
      throw new Error('Invalid AliExpress product URL');
    }

    // Normalize URL
    const normalizedUrl = normalizeAliExpressUrl(url);
    if (!normalizedUrl) {
      throw new Error('Could not normalize AliExpress URL');
    }

    // Extract product ID
    const productId = extractProductIdFromUrl(normalizedUrl);
    if (!productId) {
      throw new Error('Could not extract product ID from URL');
    }

    // Wait for rate limiter
    await this.rateLimiter.waitForNextRequest();

    // Initialize browser if needed
    await this.initBrowser();

    // Create new page
    const page = await this.context!.newPage();

    try {
      // Scrape with retry logic
      const result = await retryWithBackoff(
        async () => {
          // Navigate to product page
          await this.navigateToProduct(page, normalizedUrl);

          // Wait for content to load
          await this.waitForContent(page);

          // Add random delay for anti-detection
          await randomDelay(2000, 5000);

          // Extract all data
          const [title, description, price, originalPrice, currency, images, videos, variants, specifications, shippingOptions, supplierInfo, stockInfo] =
            await Promise.all([
              this.extractTitle(page),
              this.extractDescription(page),
              this.extractPrice(page),
              this.extractOriginalPrice(page),
              this.extractCurrency(page),
              this.extractImages(page),
              this.extractVideos(page),
              this.extractVariants(page),
              this.extractSpecifications(page),
              this.extractShippingOptions(page),
              this.extractSupplierInfo(page),
              this.validateStock(page),
            ]);

          return {
            productId,
            title,
            description,
            price,
            originalPrice,
            currency,
            images,
            videos,
            variants,
            specifications,
            shippingOptions,
            supplierId: supplierInfo.id,
            supplierName: supplierInfo.name,
            storeUrl: supplierInfo.url,
            supplierRating: supplierInfo.rating,
            productUrl: normalizedUrl,
            scrapedAt: new Date(),
          } as AliExpressProductData;
        },
        this.config.maxRetries,
        2000
      );

      return result;
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * Navigate to product page with error handling
   */
  private async navigateToProduct(page: Page, url: string): Promise<void> {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout,
      });

      // Wait for the page to be ready
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    } catch (error) {
      // Log the actual error internally for debugging
      console.error('Navigation error:', error);
      // Throw a sanitized generic error message
      throw new Error('Failed to navigate to product page. Please try again later.');
    }
  }

  /**
   * Wait for critical content to load
   */
  private async waitForContent(page: Page): Promise<void> {
    try {
      // Wait for product title or main content
      await Promise.race([
        page.waitForSelector('[class*="title"]', { timeout: 10000 }),
        page.waitForSelector('[class*="product-title"]', { timeout: 10000 }),
        page.waitForSelector('h1', { timeout: 10000 }),
        page.waitForSelector('[data-pl="product-title"]', { timeout: 10000 }),
      ]);
    } catch {
      // Continue even if selector not found - page might have different structure
    }
  }

  /**
   * Extract product title
   */
  private async extractTitle(page: Page): Promise<string> {
    const selectors = [
      '[class*="title"]',
      '[class*="product-title"]',
      'h1',
      '[data-pl="product-title"]',
      '.product-title-text',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text?.trim()) {
            return text.trim();
          }
        }
      } catch {
        continue;
      }
    }

    // Fallback: extract from page title
    const pageTitle = await page.title();
    return pageTitle.split('|')[0].trim() || 'Unknown Product';
  }

  /**
   * Extract product description
   */
  private async extractDescription(page: Page): Promise<string> {
    const selectors = [
      '[class*="description"]',
      '[class*="product-description"]',
      '[data-pl="product-description"]',
      '#product-description',
      '.product-description',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text?.trim()) {
            return text.trim();
          }
        }
      } catch {
        continue;
      }
    }

    return '';
  }

  /**
   * Extract current price
   */
  private async extractPrice(page: Page): Promise<number> {
    const selectors = [
      '[class*="price-current"]',
      '[class*="price"]',
      '[data-pl="price"]',
      '.uniform-banner-box-price',
      '.product-price-value',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            const price = parsePrice(text);
            if (price > 0) return price;
          }
        }
      } catch {
        continue;
      }
    }

    // Try to extract from JSON-LD or page data
    try {
      const priceData = await page.evaluate(() => {
        // Try JSON-LD
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd.textContent || '{}');
            return data.offers?.price || data.price;
          } catch {
            // Continue to other methods
          }
        }
        return null;
      });

      if (priceData) {
        return typeof priceData === 'number' ? priceData : parsePrice(priceData);
      }
    } catch {
      // Continue
    }

    return 0;
  }

  /**
   * Extract original price (before discount)
   */
  private async extractOriginalPrice(page: Page): Promise<number | undefined> {
    const selectors = [
      '[class*="price-original"]',
      '[class*="original-price"]',
      '[class*="was-price"]',
      '.uniform-banner-box-price-original',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            const price = parsePrice(text);
            if (price > 0) return price;
          }
        }
      } catch {
        continue;
      }
    }

    return undefined;
  }

  /**
   * Extract currency code
   */
  private async extractCurrency(page: Page): Promise<string> {
    try {
      const currencyData = await page.evaluate(() => {
        // Try JSON-LD
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd.textContent || '{}');
            return data.offers?.priceCurrency || data.priceCurrency;
          } catch {
            // Continue
          }
        }

        // Try meta tags
        const metaCurrency = document.querySelector('meta[property="product:price:currency"]');
        if (metaCurrency) {
          return metaCurrency.getAttribute('content');
        }

        return null;
      });

      if (currencyData) {
        return currencyData;
      }
    } catch {
      // Continue
    }

    // Default to USD
    return 'USD';
  }

  /**
   * Extract product images
   */
  private async extractImages(page: Page): Promise<string[]> {
    const images: string[] = [];

    try {
      const imageData = await page.evaluate(() => {
        const imgs: string[] = [];

        // Try main gallery images
        const gallerySelectors = [
          '[class*="gallery"] img',
          '[class*="product-image"] img',
          '[class*="main-image"] img',
          '.product-preview img',
          '[data-pl="product-image"] img',
        ];

        for (const selector of gallerySelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((img) => {
            const src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src && !src.includes('placeholder') && !src.includes('loading')) {
              // Get high-resolution version
              const highRes = src.replace(/_\d+x\d+\./, '.').replace(/\.jpg_.*/, '.jpg');
              imgs.push(highRes.startsWith('http') ? highRes : `https:${highRes}`);
            }
          });
        }

        // Try to find images in JSON data
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent || '';
          // Look for image URLs in the page data
          const matches = content.match(/https?:\/\/[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi);
          if (matches) {
            matches.forEach((url) => {
              if (!url.includes('placeholder') && !url.includes('avatar')) {
                imgs.push(url);
              }
            });
          }
        }

        return [...new Set(imgs)]; // Remove duplicates
      });

      images.push(...imageData);
    } catch {
      // Return empty array on error
    }

    return images;
  }

  /**
   * Extract product videos
   */
  private async extractVideos(page: Page): Promise<string[]> {
    const videos: string[] = [];

    try {
      const videoData = await page.evaluate(() => {
        const vids: string[] = [];

        // Try video elements
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach((video) => {
          const src = video.getAttribute('src') || video.querySelector('source')?.getAttribute('src');
          if (src) {
            vids.push(src.startsWith('http') ? src : `https:${src}`);
          }
        });

        // Try to find video URLs in page data
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent || '';
          const matches = content.match(/https?:\/\/[^"'\s]*\.(?:mp4|webm)/gi);
          if (matches) {
            vids.push(...matches);
          }
        }

        return [...new Set(vids)];
      });

      videos.push(...videoData);
    } catch {
      // Return empty array on error
    }

    return videos;
  }

  /**
   * Extract variants (sizes, colors, etc.)
   */
  private async extractVariants(page: Page): Promise<AliExpressVariant[]> {
    const variants: AliExpressVariant[] = [];

    try {
      // Wait for variant selector to be visible
      await page.waitForSelector('[class*="sku"], [class*="variant"], [class*="option"]', {
        timeout: 5000,
      }).catch(() => {});

      const variantData = await page.evaluate(() => {
        const results: Array<{
          skuId: string;
          name: string;
          attributes: Record<string, string>;
          price: number;
          stock: number;
          image?: string;
        }> = [];

        // Try to extract from page data
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent || '';

          // Look for SKU data in various formats
          try {
            // Try to find SKU data objects
            const skuMatch = content.match(/skuMap\s*[:=]\s*(\{[\s\S]*?\})\s*[;,]/);
            if (skuMatch) {
              const skuMap = JSON.parse(skuMatch[1]);
              Object.entries(skuMap).forEach(([skuId, data]: [string, unknown]) => {
                const skuData = data as Record<string, unknown>;
                results.push({
                  skuId,
                  name: (skuData.skuName as string) || skuId,
                  attributes: (skuData.attributes as Record<string, string>) || {},
                  price: (skuData.price as number) || 0,
                  stock: (skuData.stock as number) || 0,
                  image: skuData.image as string | undefined,
                });
              });
            }

            // Try another format
            const variantsMatch = content.match(/variants\s*[:=]\s*(\[[\s\S]*?\])\s*[;,]/);
            if (variantsMatch) {
              const variantsArray = JSON.parse(variantsMatch[1]);
              variantsArray.forEach((variant: Record<string, unknown>, index: number) => {
                results.push({
                  skuId: (variant.skuId as string) || `variant-${index}`,
                  name: (variant.name as string) || `Variant ${index + 1}`,
                  attributes: (variant.attributes as Record<string, string>) || {},
                  price: (variant.price as number) || 0,
                  stock: (variant.stock as number) || 0,
                  image: variant.image as string | undefined,
                });
              });
            }
          } catch {
            // Continue to next script
          }
        }

        // If no data found in scripts, try DOM extraction
        if (results.length === 0) {
          const skuItems = document.querySelectorAll('[class*="sku-item"], [class*="variant-item"], [class*="option-item"]');
          skuItems.forEach((item, index) => {
            const name = item.textContent?.trim() || `Variant ${index + 1}`;
            const priceEl = item.querySelector('[class*="price"]');
            const price = priceEl ? parseFloat(priceEl.textContent?.replace(/[^0-9.]/g, '') || '0') : 0;

            results.push({
              skuId: item.getAttribute('data-sku-id') || item.getAttribute('data-id') || `sku-${index}`,
              name,
              attributes: { name },
              price,
              stock: item.classList.contains('disabled') || item.classList.contains('sold-out') ? 0 : 999,
              image: item.querySelector('img')?.src,
            });
          });
        }

        return results;
      });

      variants.push(...variantData);
    } catch {
      // Return empty array on error
    }

    return variants;
  }

  /**
   * Extract product specifications
   */
  private async extractSpecifications(page: Page): Promise<Record<string, string>> {
    const specifications: Record<string, string> = {};

    try {
      const specData = await page.evaluate(() => {
        const specs: Record<string, string> = {};

        // Try specification tables
        const specSelectors = [
          '[class*="specification"] tr',
          '[class*="specs"] tr',
          '[class*="attribute"] tr',
          '.product-attribute tr',
          '[data-pl="specification"] tr',
        ];

        for (const selector of specSelectors) {
          const rows = document.querySelectorAll(selector);
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const key = cells[0].textContent?.trim() || '';
              const value = cells[1].textContent?.trim() || '';
              if (key && value) {
                specs[key] = value;
              }
            }
          });
        }

        // Try definition lists
        const dlElements = document.querySelectorAll('dl');
        dlElements.forEach((dl) => {
          const dts = dl.querySelectorAll('dt');
          const dds = dl.querySelectorAll('dd');
          dts.forEach((dt, index) => {
            const key = dt.textContent?.trim() || '';
            const value = dds[index]?.textContent?.trim() || '';
            if (key && value) {
              specs[key] = value;
            }
          });
        });

        return specs;
      });

      Object.assign(specifications, specData);
    } catch {
      // Return empty object on error
    }

    return specifications;
  }

  /**
   * Extract shipping options
   */
  private async extractShippingOptions(page: Page): Promise<AliExpressShippingOption[]> {
    const shippingOptions: AliExpressShippingOption[] = [];

    try {
      // Try to click on shipping info to expand
      const shippingButton = await page.$('[class*="shipping"], [class*="delivery"]');
      if (shippingButton) {
        await shippingButton.click().catch(() => {});
        await randomDelay(500, 1000);
      }

      const shippingData = await page.evaluate(() => {
        const options: Array<{
          name: string;
          cost: number;
          estimatedDays: number;
          carrier?: string;
        }> = [];

        // Try shipping option elements
        const shippingSelectors = [
          '[class*="shipping-option"]',
          '[class*="delivery-option"]',
          '[class*="logistics"]',
        ];

        for (const selector of shippingSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            const text = el.textContent || '';

            // Extract shipping method name
            const nameMatch = text.match(/([A-Za-z\s]+(?:Shipping|Delivery|Express|Standard))/i);
            const name = nameMatch ? nameMatch[1].trim() : 'Standard Shipping';

            // Extract cost
            const costMatch = text.match(/\$?([\d.]+)/);
            const cost = costMatch ? parseFloat(costMatch[1]) : 0;

            // Extract estimated days
            const daysMatch = text.match(/(\d+)\s*-?\s*(?:to\s*\d+\s*)?days?/i);
            const estimatedDays = daysMatch ? parseInt(daysMatch[1], 10) : 30;

            // Extract carrier
            const carrierMatch = text.match(/(?:via|by)\s+([A-Za-z]+)/i);
            const carrier = carrierMatch ? carrierMatch[1] : undefined;

            options.push({ name, cost, estimatedDays, carrier });
          });
        }

        return options;
      });

      shippingOptions.push(...shippingData);
    } catch {
      // Return empty array on error
    }

    // Add default shipping option if none found
    if (shippingOptions.length === 0) {
      shippingOptions.push({
        name: 'Standard Shipping',
        cost: 0,
        estimatedDays: 30,
      });
    }

    return shippingOptions;
  }

  /**
   * Extract supplier/store info
   */
  private async extractSupplierInfo(page: Page): Promise<{ id: string; name: string; url: string; rating?: number }> {
    try {
      const supplierData = await page.evaluate(() => {
        // Try to find store link
        const storeLink = document.querySelector('[class*="store"] a, [class*="seller"] a, a[href*="store"]');
        const storeUrl = storeLink?.getAttribute('href') || '';
        const storeName = storeLink?.textContent?.trim() || 'Unknown Store';

        // Extract store ID from URL
        const storeIdMatch = storeUrl.match(/store\/(\d+)/);
        const storeId = storeIdMatch ? storeIdMatch[1] : '';

        // Try to find rating
        const ratingEl = document.querySelector('[class*="rating"], [class*="score"]');
        const ratingText = ratingEl?.textContent || '';
        const ratingMatch = ratingText.match(/([\d.]+)\s*(?:out of|\/)?\s*5/i);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

        return {
          id: storeId,
          name: storeName,
          url: storeUrl.startsWith('http') ? storeUrl : `https:${storeUrl}`,
          rating,
        };
      });

      return supplierData;
    } catch {
      return {
        id: '',
        name: 'Unknown Store',
        url: '',
      };
    }
  }

  /**
   * Validate stock availability
   */
  private async validateStock(page: Page): Promise<{ available: boolean; stock?: number }> {
    try {
      const stockData = await page.evaluate(() => {
        // Check for out of stock indicators
        const outOfStockIndicators = [
          '[class*="out-of-stock"]',
          '[class*="sold-out"]',
          '[class*="unavailable"]',
          '.product-unavailable',
        ];

        for (const selector of outOfStockIndicators) {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            return { available: false, stock: 0 };
          }
        }

        // Try to find stock quantity
        const stockText = document.body.textContent || '';
        const stockMatch = stockText.match(/(\d+)\s*(?:pieces?|items?|units?)\s*(?:left|available)/i);
        const stock = stockMatch ? parseInt(stockMatch[1], 10) : undefined;

        return { available: true, stock };
      });

      return stockData;
    } catch {
      return { available: true };
    }
  }

  /**
   * Clean up browser resources
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}

// Export singleton instance for convenience
let scraperInstance: AliExpressScraper | null = null;

/**
 * Get or create a scraper instance
 * @param config - Scraper configuration
 * @returns AliExpressScraper instance
 */
export function getScraper(config?: ScraperConfig): AliExpressScraper {
  if (!scraperInstance) {
    scraperInstance = new AliExpressScraper(config);
  }
  return scraperInstance;
}

/**
 * Close the scraper instance
 */
export async function closeScraper(): Promise<void> {
  if (scraperInstance) {
    await scraperInstance.close();
    scraperInstance = null;
  }
}
