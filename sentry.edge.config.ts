/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for the edge runtime (middleware, edge functions).
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

    // Edge runtime has limited integrations available
    integrations: [],

    // Ignore specific errors that are not actionable
    ignoreErrors: [
      // Network errors
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
    ],

    // Filter out noisy transactions
    ignoreTransactions: [
      // Health checks
      '/api/health',
      // Static assets
      '/_next/static/*',
      '/favicon.ico',
    ],

    // Set release version if available
    release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.NODE_ENV,
  });
} else {
  // In development without DSN, log to console instead
  if (!isProduction) {
    console.info(
      'Sentry is disabled in development. Set NEXT_PUBLIC_SENTRY_DSN to enable.'
    );
  }
}