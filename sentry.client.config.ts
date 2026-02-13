/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for the client-side (browser) environment.
 * It is automatically loaded by the Sentry Next.js SDK.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

// Only initialize Sentry in production or if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: !isProduction,

    // Replay configuration for session replay
    replaysOnErrorSampleRate: isProduction ? 0.1 : 1.0,
    replaysSessionSampleRate: isProduction ? 0.1 : 0.0,

    integrations: [
      // Add browser profiling integration
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Ignore specific errors that are not actionable
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'atomicSearchCloseError',
      'fb_xd_fragment',
      // Random plugins/extensions
      'window.sidebar',
      'Script error.',
      'Javascript error: Event not defined',
      // Network errors that users can't control
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'ImportError',
      // ResizeObserver errors (benign)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],

    // Filter out noisy transactions
    ignoreTransactions: [
      // Health checks
      '/api/health',
      // Static assets
      '/_next/static/*',
      '/favicon.ico',
    ],
  });
} else {
  // In development without DSN, log to console instead
  if (!isProduction) {
    console.info(
      'Sentry is disabled in development. Set NEXT_PUBLIC_SENTRY_DSN to enable.'
    );
  }
}