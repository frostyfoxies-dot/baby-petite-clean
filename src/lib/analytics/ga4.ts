/**
 * Google Analytics 4 (GA4) Integration
 *
 * Provides client-side event tracking for GA4.
 * Uses gtag.js script with config from environment.
 */

export interface GA4EventParams {
  // Standard GA4 event parameters
  event_name: string;
  [key: string]: any;
}

/**
 * Initialize GA4 on the client
 * Call this in a useEffect in your root layout or app
 */
export function initGA4(): void {
  if (typeof window === 'undefined') return;

  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('GA4 measurement ID not configured');
    return;
  }

  // Load gtag script if not already present
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);
  }

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', measurementId, {
    // Anonymize IP for GDPR compliance
    anonymize_ip: true,
    // Send automatically on page view
  });

  // Expose globally for debugging
  (window as any).gtag = gtag;
}

/**
 * Send a GA4 event
 */
export function ga4Event(params: GA4EventParams): void {
  if (typeof window === 'undefined') return;

  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  if (!measurementId) {
    // Silently ignore if not configured
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', params.event_name, params);
  } else {
    // Queue for later if gtag not ready
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['event', params.event_name, params]);
  }
}

/**
 * Predefined e-commerce events
 */
export const GA4Ecommerce = {
  /**
   * Track when a user views a product
   */
  viewItem(params: {
    item_id: string;
    item_name: string;
    item_category?: string;
    price: number;
    quantity?: number;
  }): void {
    ga4Event({
      event_name: 'view_item',
      items: [params],
    });
  },

  /**
   * Track when a user adds an item to cart
   */
  addToCart(params: {
    item_id: string;
    item_name: string;
    item_category?: string;
    price: number;
    quantity: number;
  }): void {
    ga4Event({
      event_name: 'add_to_cart',
      items: [params],
    });
  },

  /**
   * Track when a user begins checkout
   */
  beginCheckout(params: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>;
  }): void {
    ga4Event({
      event_name: 'begin_checkout',
      currency: params.currency,
      value: params.value,
      items: params.items,
    });
  },

  /**
   * Track a purchase (conversion)
   */
  purchase(params: {
    transaction_id: string;
    value: number;
    currency: string;
    tax: number;
    shipping: number;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>;
  }): void {
    ga4Event({
      event_name: 'purchase',
      transaction_id: params.transaction_id,
      value: params.value,
      currency: params.currency,
      tax: params.tax,
      shipping: params.shipping,
      items: params.items,
    });
  },

  /**
   * Track page view (auto if using gtag config, but can be manual)
   */
  pageView(params: {
    page_title?: string;
    page_location?: string;
    page_path?: string;
  }): void {
    ga4Event({
      event_name: 'page_view',
      ...params,
    });
  },
};

/**
 * Utility: safely get current URL components for page tracking
 */
export function getPageInfo() {
  if (typeof window === 'undefined') return null;

  return {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
  };
}

/**
 * Type declaration for window.gtag
 */
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
