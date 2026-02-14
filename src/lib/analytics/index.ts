/**
 * Analytics Abstraction Layer
 *
 * Provides a unified interface for analytics providers (currently GA4).
 * Future: add support for other providers (Mixpanel, Amplitude).
 */

import { GA4Ecommerce, initGA4, getPageInfo } from './ga4';

export const Analytics = {
  /**
   * Initialize analytics on client startup
   */
  init(): void {
    if (typeof window !== 'undefined') {
      initGA4();
    }
  },

  /**
   * Track a custom event
   */
  event(name: string, params?: Record<string, any>): void {
    if (typeof window === 'undefined') return;
    // Use GA4 for now
    const ga4Module = require('./ga4');
    ga4Module.ga4Event({ event_name: name, ...params });
  },

  /**
   * Ecommerce tracking
   */
  ecommerce: GA4Ecommerce,

  /**
   * Get current page info for manual tracking
   */
  getPageInfo: getPageInfo,
};

// Export types for convenience
export type { GA4EventParams };
