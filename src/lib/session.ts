import { auth as nextAuthAuth } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

/**
 * Session Management Utilities
 *
 * Provides utility functions for:
 * - Getting the current session
 * - Getting the current user
 * - Requiring authentication for protected routes
 * - Requiring admin role for admin routes
 * - Checking authentication status
 *
 * These functions are designed to be used in Server Components and Server Actions.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Extended session type with user information
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
}

/**
 * Session type
 */
export interface Session {
  user: SessionUser;
  expires: string;
}

// ============================================
// SESSION FUNCTIONS
// ============================================

/**
 * Get the current server session
 *
 * This is a wrapper around NextAuth's auth() function that provides
 * consistent session retrieval across the application.
 *
 * @returns The current session or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const session = await getServerSession();
 * if (session) {
 *   console.log('User:', session.user.email);
 * }
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const session = await nextAuthAuth();
    
    if (!session?.user) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
      },
      expires: session.expires,
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Get the current authenticated user
 *
 * Returns the user object from the current session.
 * Returns null if the user is not authenticated.
 *
 * @returns The current user or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Welcome,', user.name);
 * }
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const session = await getServerSession();
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication for a route
 *
 * If the user is not authenticated, redirects to the sign-in page.
 * Optionally redirects to a specific URL after sign-in.
 *
 * @param redirectTo - Optional URL to redirect to after sign-in
 * @returns The current user
 * @throws Redirects to sign-in page if not authenticated
 *
 * @example
 * // In a Server Component
 * const user = await requireAuth();
 * // User is guaranteed to be authenticated here
 */
export async function requireAuth(redirectTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    const callbackUrl = redirectTo || '/account';
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return user;
}

/**
 * Require admin role for a route
 *
 * If the user is not authenticated or does not have admin role,
 * redirects to the appropriate page.
 *
 * @param redirectTo - Optional URL to redirect to after sign-in
 * @returns The current admin user
 * @throws Redirects to sign-in page if not authenticated
 * @throws Redirects to account page if not admin
 *
 * @example
 * // In a Server Component
 * const admin = await requireAdmin();
 * // User is guaranteed to be an admin here
 */
export async function requireAdmin(redirectTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    const callbackUrl = redirectTo || '/admin/dashboard';
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (user.role !== 'ADMIN') {
    redirect('/account?error=unauthorized');
  }

  return user;
}

/**
 * Require staff or admin role for a route
 *
 * If the user is not authenticated or does not have staff or admin role,
 * redirects to the appropriate page.
 *
 * @param redirectTo - Optional URL to redirect to after sign-in
 * @returns The current staff/admin user
 * @throws Redirects to sign-in page if not authenticated
 * @throws Redirects to account page if not staff/admin
 *
 * @example
 * // In a Server Component
 * const staff = await requireStaff();
 * // User is guaranteed to be staff or admin here
 */
export async function requireStaff(redirectTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    const callbackUrl = redirectTo || '/admin/orders';
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    redirect('/account?error=unauthorized');
  }

  return user;
}

/**
 * Check if a user is authenticated
 *
 * Returns true if the user is authenticated, false otherwise.
 * Does not redirect.
 *
 * @returns True if authenticated, false otherwise
 *
 * @example
 * // In a Server Component
 * const isAuthenticated = await isUserAuthenticated();
 * if (isAuthenticated) {
 *   // Show authenticated content
 * }
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}

/**
 * Check if the current user has a specific role
 *
 * Returns true if the user has the specified role, false otherwise.
 * Returns false if the user is not authenticated.
 *
 * @param role - Role to check for
 * @returns True if user has the role, false otherwise
 *
 * @example
 * // In a Server Component
 * const isAdmin = await hasRole('ADMIN');
 * if (isAdmin) {
 *   // Show admin content
 * }
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === role;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Check if the current user is an admin
 *
 * Returns true if the user is an admin, false otherwise.
 * Returns false if the user is not authenticated.
 *
 * @returns True if user is admin, false otherwise
 *
 * @example
 * // In a Server Component
 * const isAdmin = await isAdminUser();
 * if (isAdmin) {
 *   // Show admin content
 * }
 */
export async function isAdminUser(): Promise<boolean> {
  return hasRole('ADMIN');
}

/**
 * Check if the current user is staff or admin
 *
 * Returns true if the user is staff or admin, false otherwise.
 * Returns false if the user is not authenticated.
 *
 * @returns True if user is staff or admin, false otherwise
 *
 * @example
 * // In a Server Component
 * const isStaff = await isStaffUser();
 * if (isStaff) {
 *   // Show staff content
 * }
 */
export async function isStaffUser(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === 'STAFF' || user?.role === 'ADMIN';
  } catch (error) {
    console.error('Error checking if user is staff:', error);
    return false;
  }
}

/**
 * Check if the current user's email is verified
 *
 * Returns true if the user's email is verified, false otherwise.
 * Returns false if the user is not authenticated.
 *
 * @returns True if email is verified, false otherwise
 *
 * @example
 * // In a Server Component
 * const isVerified = await isEmailVerified();
 * if (!isVerified) {
 *   // Show verification prompt
 * }
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.emailVerified !== null;
  } catch (error) {
    console.error('Error checking email verification status:', error);
    return false;
  }
}

/**
 * Require email verification for a route
 *
 * If the user's email is not verified, redirects to the verification page.
 *
 * @returns The current user with verified email
 * @throws Redirects to verification page if email is not verified
 *
 * @example
 * // In a Server Component
 * const user = await requireEmailVerification();
 * // User's email is guaranteed to be verified here
 */
export async function requireEmailVerification(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (!user.emailVerified) {
    redirect('/auth/verify-email');
  }

  return user;
}

/**
 * Get the user's display name
 *
 * Returns the user's full name or email if name is not available.
 * Returns null if the user is not authenticated.
 *
 * @returns Display name or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const displayName = await getUserDisplayName();
 * if (displayName) {
 *   console.log('Hello,', displayName);
 * }
 */
export async function getUserDisplayName(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    if (user.name) {
      return user.name;
    }

    return user.email;
  } catch (error) {
    console.error('Error getting user display name:', error);
    return null;
  }
}

/**
 * Get the user's initials
 *
 * Returns the user's initials based on their name or email.
 * Returns null if the user is not authenticated.
 *
 * @returns User initials or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const initials = await getUserInitials();
 * if (initials) {
 *   console.log('Initials:', initials);
 * }
 */
export async function getUserInitials(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    if (user.name) {
      const parts = user.name.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }

    // Use email if name is not available
    const emailParts = user.email.split('@')[0].split('.');
    if (emailParts.length >= 2) {
      return (emailParts[0][0] + emailParts[emailParts.length - 1][0]).toUpperCase();
    }
    return emailParts[0][0].toUpperCase();
  } catch (error) {
    console.error('Error getting user initials:', error);
    return null;
  }
}

/**
 * Get the user's avatar URL
 *
 * Returns the user's avatar URL or a default avatar if not available.
 * Returns null if the user is not authenticated.
 *
 * @returns Avatar URL or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const avatar = await getUserAvatar();
 * if (avatar) {
 *   console.log('Avatar:', avatar);
 * }
 */
export async function getUserAvatar(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    return user.image;
  } catch (error) {
    console.error('Error getting user avatar:', error);
    return null;
  }
}

/**
 * Get the user's ID
 *
 * Returns the user's ID or null if not authenticated.
 *
 * @returns User ID or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const userId = await getUserId();
 * if (userId) {
 *   console.log('User ID:', userId);
 * }
 */
export async function getUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Get the user's email
 *
 * Returns the user's email or null if not authenticated.
 *
 * @returns User email or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const email = await getUserEmail();
 * if (email) {
 *   console.log('Email:', email);
 * }
 */
export async function getUserEmail(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

/**
 * Get the user's role
 *
 * Returns the user's role or null if not authenticated.
 *
 * @returns User role or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const role = await getUserRole();
 * if (role) {
 *   console.log('Role:', role);
 * }
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const user = await getCurrentUser();
    return user?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}
