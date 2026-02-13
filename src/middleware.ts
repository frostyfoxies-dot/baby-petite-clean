import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 *
 * Protects routes based on authentication and authorization requirements:
 * - /account/* (authenticated users only)
 * - /admin/* (admin users only)
 * - /checkout/* (authenticated users only)
 * - /registry/create (authenticated users only)
 *
 * Also handles cache control headers for CDN optimization:
 * - Static assets: Long-term caching
 * - Product pages: Moderate caching with stale-while-revalidate
 * - API routes: No caching
 *
 * The middleware runs before the request reaches the page handler,
 * allowing for early redirects and access control.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

// ============================================
// ROUTE CONFIGURATION
// ============================================

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/account',
  '/checkout',
  '/orders',
  '/wishlist',
  '/registry/create',
];

/**
 * Routes that require admin role
 */
const ADMIN_ROUTES = [
  '/admin',
];

/**
 * Routes that require staff or admin role
 */
const STAFF_ROUTES = [
  '/admin/orders',
  '/admin/products',
];

/**
 * Public routes that should not be protected
 */
const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/categories',
  '/collections',
  '/registry',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/api/auth',
  '/api/webhooks',
];

/**
 * Static assets that should bypass middleware
 */
const STATIC_ASSETS = [
  '/_next',
  '/static',
  '/images',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

// ============================================
// CACHE CONFIGURATION
// ============================================

/**
 * Cache control settings for different content types
 */
const CACHE_CONFIG = {
  // Static assets - 1 year cache
  static: 'public, max-age=31536000, immutable',
  // Images - 30 days cache with stale-while-revalidate
  image: 'public, max-age=2592000, stale-while-revalidate=86400',
  // Product pages - 1 hour cache with stale-while-revalidate
  product: 'public, max-age=3600, stale-while-revalidate=86400',
  // Category/collection pages - 5 minutes cache
  category: 'public, max-age=300, stale-while-revalidate=3600',
  // Homepage - 5 minutes cache
  homepage: 'public, max-age=300, stale-while-revalidate=1800',
  // No cache for authenticated/dynamic content
  noStore: 'no-store, no-cache, must-revalidate, proxy-revalidate',
  // Private cache for user-specific content
  private: 'private, no-cache, no-store, must-revalidate',
} as const;

/**
 * Routes that should never be cached
 */
const NO_CACHE_ROUTES = [
  '/account',
  '/checkout',
  '/admin',
  '/api',
  '/auth',
  '/cart',
];

/**
 * Routes with custom cache settings
 */
const CACHE_ROUTES: Array<{
  pattern: RegExp;
  cacheControl: string;
}> = [
  { pattern: /^\/products\/[^/]+$/, cacheControl: CACHE_CONFIG.product },
  { pattern: /^\/category\/[^/]+$/, cacheControl: CACHE_CONFIG.category },
  { pattern: /^\/collection\/[^/]+$/, cacheControl: CACHE_CONFIG.category },
  { pattern: /^\/$/, cacheControl: CACHE_CONFIG.homepage },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a path is a static asset
 */
function isStaticAsset(pathname: string): boolean {
  return STATIC_ASSETS.some((asset) => pathname.startsWith(asset));
}

/**
 * Check if a path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is a protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is an admin route
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is a staff route
 */
function isStaffRoute(pathname: string): boolean {
  return STAFF_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Get the redirect URL for unauthenticated users
 */
function getAuthRedirectUrl(pathname: string): string {
  const callbackUrl = encodeURIComponent(pathname);
  return `/auth/signin?callbackUrl=${callbackUrl}`;
}

/**
 * Get the redirect URL for unauthorized users
 */
function getUnauthorizedRedirectUrl(pathname: string): string {
  if (isAdminRoute(pathname)) {
    return '/account?error=unauthorized';
  }
  return '/auth/signin?error=unauthorized';
}

/**
 * Check if a path should never be cached
 */
function isNoCacheRoute(pathname: string): boolean {
  return NO_CACHE_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Get cache control header for a path
 */
function getCacheControl(pathname: string, isAuthenticated: boolean): string | null {
  // Never cache authenticated user content
  if (isAuthenticated && isProtectedRoute(pathname)) {
    return CACHE_CONFIG.private;
  }

  // Never cache specific routes
  if (isNoCacheRoute(pathname)) {
    return CACHE_CONFIG.noStore;
  }

  // Check for matching cache route patterns
  for (const { pattern, cacheControl } of CACHE_ROUTES) {
    if (pattern.test(pathname)) {
      return cacheControl;
    }
  }

  // Default: short cache for public content
  return CACHE_CONFIG.category;
}

/**
 * Apply cache headers to response
 */
function applyCacheHeaders(
  response: NextResponse,
  cacheControl: string
): NextResponse {
  response.headers.set('Cache-Control', cacheControl);
  
  // Add CDN-specific headers for Cloudflare
  // CDN-Cache-Control tells CDN how to cache independently of browser
  if (cacheControl.includes('public')) {
    response.headers.set('CDN-Cache-Control', cacheControl);
  } else {
    response.headers.set('CDN-Cache-Control', 'no-store');
  }
  
  return response;
}

// ============================================
// MIDDLEWARE FUNCTION
// ============================================

/**
 * Main middleware function
 *
 * This function is called on every request (except for static assets)
 * and determines whether the user has access to the requested route.
 * Also applies appropriate cache headers for CDN optimization.
 */
export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // Skip middleware for static assets
  if (isStaticAsset(pathname)) {
    const response = NextResponse.next();
    // Apply long-term cache for static assets
    response.headers.set('Cache-Control', CACHE_CONFIG.static);
    return response;
  }

  // Check if user is authenticated
  const isAuthenticated = !!session?.user;

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const redirectUrl = getAuthRedirectUrl(pathname);
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }
    const response = NextResponse.next();
    // Never cache authenticated content
    return applyCacheHeaders(response, CACHE_CONFIG.private);
  }

  // Handle admin routes
  if (isAdminRoute(pathname)) {
    if (!isAuthenticated) {
      const redirectUrl = getAuthRedirectUrl(pathname);
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    // Check if user has admin role
    if (session?.user?.role !== 'ADMIN') {
      const redirectUrl = getUnauthorizedRedirectUrl(pathname);
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    const response = NextResponse.next();
    // Never cache admin content
    return applyCacheHeaders(response, CACHE_CONFIG.noStore);
  }

  // Handle staff routes
  if (isStaffRoute(pathname)) {
    if (!isAuthenticated) {
      const redirectUrl = getAuthRedirectUrl(pathname);
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    // Check if user has staff or admin role
    const userRole = session?.user?.role;
    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      const redirectUrl = getUnauthorizedRedirectUrl(pathname);
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    const response = NextResponse.next();
    return applyCacheHeaders(response, CACHE_CONFIG.noStore);
  }

  // For public routes, apply appropriate caching
  const cacheControl = getCacheControl(pathname, isAuthenticated);
  const response = NextResponse.next();
  
  if (cacheControl) {
    return applyCacheHeaders(response, cacheControl);
  }

  return response;
});

/**
 * Middleware configuration
 *
 * Limits middleware to protected routes only for better performance.
 * Middleware runs only on routes that need authentication/authorization:
 * - /account/* - User account pages
 * - /admin/* - Admin dashboard pages
 * - /checkout/* - Checkout flow
 * - /registry/create/* - Registry creation
 */
export const config = {
  /**
   * Matcher for routes to include
   * Only run middleware on protected routes to reduce latency
   */
  matcher: [
    '/account/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/registry/create/:path*',
  ],
};

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Extended auth request type
 */
interface AuthRequest extends NextRequest {
  auth: {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
      emailVerified: Date | null;
    };
    expires: string;
  } | null;
}
