import type { NextAuthConfig } from 'next-auth';

/**
 * NextAuth Configuration
 *
 * This configuration is exported for use in:
 * - src/app/api/auth/[...nextauth]/route.ts
 * - src/middleware.ts
 *
 * The configuration is separated from the main auth.ts file to avoid
 * circular dependencies and to allow middleware to access auth config
 * without importing the full NextAuth instance.
 *
 * @see https://authjs.dev/reference/core/types#nextauthconfig
 */

/**
 * Auth configuration for NextAuth.js v5
 */
export const authConfig: NextAuthConfig = {
  /**
   * List of pages to use for authentication
   */
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    newUser: '/auth/signup',
    verifyRequest: '/auth/verify-request',
  },

  /**
   * Session configuration
   */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  /**
   * JWT configuration
   */
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * Callbacks for customizing session and JWT behavior
   */
  callbacks: {
    /**
     * Authorized callback for middleware
     * Determines if a user is authorized to access a route
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/account');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnCheckout = nextUrl.pathname.startsWith('/checkout');
      const isOnRegistryCreate = nextUrl.pathname === '/registry/create';

      // Admin routes require admin role
      if (isOnAdmin) {
        if (isLoggedIn && auth?.user?.role === 'ADMIN') {
          return true;
        }
        return false;
      }

      // Protected routes require authentication
      if (isOnDashboard || isOnCheckout || isOnRegistryCreate) {
        if (isLoggedIn) {
          return true;
        }
        return false;
      }

      // Allow access to public routes
      return true;
    },

    /**
     * JWT callback - called when token is created or updated
     */
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }

      // Handle OAuth account linking
      if (account?.provider === 'google' && user) {
        token.emailVerified = new Date();
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    /**
     * Session callback - called when session is checked
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'CUSTOMER' | 'ADMIN' | 'STAFF';
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },

  /**
   * Provider configuration
   */
  providers: [],

  /**
   * Secret for JWT signing
   */
  secret: process.env.NEXTAUTH_SECRET,

  /**
   * Debug mode (only in development)
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * Trust host for production deployments
   */
  trustHost: true,
};

/**
 * Role-based access control configuration
 */
export const RBAC_CONFIG = {
  /**
   * Routes that require authentication
   */
  protectedRoutes: [
    '/account',
    '/checkout',
    '/registry/create',
    '/orders',
    '/wishlist',
  ],

  /**
   * Routes that require admin role
   */
  adminRoutes: [
    '/admin',
    '/admin/dashboard',
    '/admin/products',
    '/admin/orders',
    '/admin/customers',
    '/admin/settings',
  ],

  /**
   * Routes that require staff role
   */
  staffRoutes: [
    '/admin/orders',
    '/admin/products',
  ],

  /**
   * Public routes (no authentication required)
   */
  publicRoutes: [
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
  ],
} as const;

/**
 * Check if a route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return RBAC_CONFIG.protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
}

/**
 * Check if a route requires admin role
 */
export function isAdminRoute(pathname: string): boolean {
  return RBAC_CONFIG.adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
}

/**
 * Check if a route requires staff role
 */
export function isStaffRoute(pathname: string): boolean {
  return RBAC_CONFIG.staffRoutes.some((route) =>
    pathname.startsWith(route)
  );
}

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return RBAC_CONFIG.publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
}

/**
 * Get the redirect URL for unauthenticated users
 */
export function getAuthRedirectUrl(pathname: string): string {
  if (isAdminRoute(pathname)) {
    return '/auth/signin?callbackUrl=/admin/dashboard';
  }
  return `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`;
}

/**
 * Get the redirect URL for unauthorized users
 */
export function getUnauthorizedRedirectUrl(pathname: string): string {
  if (isAdminRoute(pathname)) {
    return '/account?error=unauthorized';
  }
  return '/auth/signin?error=unauthorized';
}
