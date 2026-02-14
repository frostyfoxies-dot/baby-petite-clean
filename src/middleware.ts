import { withAuth } from 'next-auth/middleware';
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
  static: 'public, max-age=31536000, immutable',
  noStore: 'no-store, no-cache, must-revalidate, proxy-revalidate',
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

// ============================================
// HELPER FUNCTIONS
// ============================================

function isStaticAsset(pathname: string): boolean {
  return STATIC_ASSETS.some((asset) => pathname.startsWith(asset));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

function isStaffRoute(pathname: string): boolean {
  return STAFF_ROUTES.some((route) => pathname.startsWith(route));
}

function getAuthRedirectUrl(pathname: string): string {
  const callbackUrl = encodeURIComponent(pathname);
  return `/auth/signin?callbackUrl=${callbackUrl}`;
}

function getUnauthorizedRedirectUrl(pathname: string): string {
  if (isAdminRoute(pathname)) {
    return '/account?error=unauthorized';
  }
  return '/auth/signin?error=unauthorized';
}

function isNoCacheRoute(pathname: string): boolean {
  return NO_CACHE_ROUTES.some((route) => pathname.startsWith(route));
}

function applyCacheHeaders(
  response: NextResponse,
  cacheControl: string
): NextResponse {
  response.headers.set('Cache-Control', cacheControl);
  
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
 * Main middleware function with NextAuth
 */
export default withAuth(
  function middleware(req: NextRequest) {
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;

    // Skip middleware for static assets
    if (isStaticAsset(pathname)) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', CACHE_CONFIG.static);
      return response;
    }

    // Get token from request (set by withAuth)
    const token = (req as any).nextauth?.token;
    const isAuthenticated = !!token;

    // Handle protected routes
    if (isProtectedRoute(pathname)) {
      if (!isAuthenticated) {
        const redirectUrl = getAuthRedirectUrl(pathname);
        return NextResponse.redirect(new URL(redirectUrl, nextUrl));
      }
      const response = NextResponse.next();
      return applyCacheHeaders(response, CACHE_CONFIG.private);
    }

    // Handle admin routes
    if (isAdminRoute(pathname)) {
      if (!isAuthenticated) {
        const redirectUrl = getAuthRedirectUrl(pathname);
        return NextResponse.redirect(new URL(redirectUrl, nextUrl));
      }

      if (token?.role !== 'ADMIN') {
        const redirectUrl = getUnauthorizedRedirectUrl(pathname);
        return NextResponse.redirect(new URL(redirectUrl, nextUrl));
      }

      const response = NextResponse.next();
      return applyCacheHeaders(response, CACHE_CONFIG.noStore);
    }

    // Handle staff routes
    if (isStaffRoute(pathname)) {
      if (!isAuthenticated) {
        const redirectUrl = getAuthRedirectUrl(pathname);
        return NextResponse.redirect(new URL(redirectUrl, nextUrl));
      }

      const userRole = token?.role;
      if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
        const redirectUrl = getUnauthorizedRedirectUrl(pathname);
        return NextResponse.redirect(new URL(redirectUrl, nextUrl));
      }

      const response = NextResponse.next();
      return applyCacheHeaders(response, CACHE_CONFIG.noStore);
    }

    // For other routes, apply appropriate caching
    const response = NextResponse.next();
    if (isNoCacheRoute(pathname)) {
      return applyCacheHeaders(response, CACHE_CONFIG.noStore);
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    '/account/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/registry/create/:path*',
  ],
};
