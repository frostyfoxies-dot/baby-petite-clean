/**
 * Sentry Utility Functions
 *
 * Provides helper functions for manual error reporting and user context management.
 * These utilities wrap Sentry SDK methods with consistent patterns and TypeScript types.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';
import type { CaptureContext, SeverityLevel } from '@sentry/types';

/**
 * User information for Sentry context
 */
interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

/**
 * Additional context for error capture
 */
interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: SentryUser;
  level?: SeverityLevel;
}

/**
 * Captures an exception and sends it to Sentry.
 *
 * @param error - The error to capture
 * @param context - Optional context including tags, extra data, and user info
 * @returns The event ID if Sentry is enabled, undefined otherwise
 *
 * @example
 * // Basic usage
 * captureException(new Error('Something went wrong'));
 *
 * @example
 * // With context
 * captureException(error, {
 *   tags: { component: 'Checkout' },
 *   extra: { orderId: '12345' },
 *   user: { id: 'user-1', email: 'user@example.com' }
 * });
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext
): string | undefined {
  const captureContext: CaptureContext = {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  };

  // Set user context if provided
  if (context?.user) {
    Sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      username: context.user.username,
      role: context.user.role,
    });
  }

  return Sentry.captureException(error, captureContext);
}

/**
 * Captures a message event and sends it to Sentry.
 *
 * @param message - The message to send
 * @param level - The severity level (default: 'info')
 * @param context - Optional context including tags and extra data
 * @returns The event ID if Sentry is enabled, undefined otherwise
 *
 * @example
 * // Basic usage
 * captureMessage('User attempted invalid action');
 *
 * @example
 * // With level and context
 * captureMessage('Payment gateway timeout', 'warning', {
 *   tags: { gateway: 'stripe' },
 *   extra: { attemptCount: 3 }
 * });
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: Omit<ErrorContext, 'level'>
): string | undefined {
  const captureContext: CaptureContext = {
    tags: context?.tags,
    extra: context?.extra,
    level,
  };

  // Set user context if provided
  if (context?.user) {
    Sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      username: context.user.username,
      role: context.user.role,
    });
  }

  return Sentry.captureMessage(message, captureContext);
}

/**
 * Sets the user context for all subsequent events.
 * Call this when a user logs in to associate errors with the user.
 *
 * @param user - User information to set
 *
 * @example
 * setUserContext({
 *   id: 'user-123',
 *   email: 'john@example.com',
 *   username: 'john_doe',
 *   role: 'customer'
 * });
 */
export function setUserContext(user: SentryUser): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
}

/**
 * Clears the user context.
 * Call this when a user logs out.
 *
 * @example
 * // On logout
 * clearUserContext();
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Adds a breadcrumb to the Sentry event.
 * Breadcrumbs provide context for what happened before an error.
 *
 * @param message - The breadcrumb message
 * @param category - Optional category for grouping
 * @param level - Optional severity level
 * @param data - Optional additional data
 *
 * @example
 * addBreadcrumb('User clicked checkout button', 'ui.click');
 * addBreadcrumb('API request started', 'http', 'info', { url: '/api/checkout' });
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: SeverityLevel = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Wraps an async function with automatic error capture.
 * Useful for wrapping server actions or API handlers.
 *
 * @param fn - The async function to wrap
 * @param context - Optional context for error capture
 * @returns The wrapped function
 *
 * @example
 * const safeAction = withErrorCapture(
 *   async (data) => { ... },
 *   { tags: { action: 'submitOrder' } }
 * );
 */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Creates a transaction for performance monitoring.
 *
 * @param name - The transaction name
 * @param op - The operation type
 * @returns The transaction object
 *
 * @example
 * const transaction = startTransaction('checkout', 'http.server');
 * // ... do work
 * transaction.finish();
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction | undefined {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Checks if Sentry is configured and enabled.
 *
 * @returns True if Sentry DSN is configured
 */
export function isSentryEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

// Re-export Sentry for direct access if needed
export { Sentry };