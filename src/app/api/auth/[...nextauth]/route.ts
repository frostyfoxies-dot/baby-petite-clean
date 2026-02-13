import { handlers } from '@/lib/auth';

/**
 * NextAuth API Route Handler
 *
 * This route handles all NextAuth.js authentication requests including:
 * - Sign in with credentials
 * - Sign in with OAuth providers
 * - Sign out
 * - Session management
 * - CSRF protection
 *
 * The route is located at /api/auth/[...nextauth] which is the standard
 * NextAuth.js route pattern.
 *
 * @see https://authjs.dev/getting-started/installation
 */

/**
 * Export GET and POST handlers from NextAuth
 * These handlers manage all authentication requests
 */
export const { GET, POST } = handlers;
