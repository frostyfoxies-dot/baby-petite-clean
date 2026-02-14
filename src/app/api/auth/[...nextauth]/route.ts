import NextAuth from 'next-auth';

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
 * @see https://next-auth.js.org/configuration
 */

/**
 * Import auth options and create the NextAuth handler
 */
import { authOptions } from '@/lib/auth';

const NextAuthHandler = NextAuth(authOptions);

/**
 * Export GET and POST handlers from NextAuth
 * These handlers manage all authentication requests
 */
export { NextAuthHandler as GET, NextAuthHandler as POST };
