import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * NextAuth.js v4 Configuration
 *
 * Configures authentication for the Baby Petite e-commerce platform with:
 * - Credentials provider (email/password)
 * - Google OAuth provider
 * - Custom session callback
 * - Custom JWT callback
 * - Custom pages (sign in, sign up, error)
 *
 * @see https://next-auth.js.org/configuration
 */

/**
 * Extended user type for NextAuth
 */
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: Date | null;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
}

/**
 * Extended session type for NextAuth
 */
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  };
}

/**
 * Schema for credentials provider validation
 */
const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Configure NextAuth with providers and callbacks
 */
export const authOptions = {
  providers: [
    /**
     * Credentials Provider
     * Allows users to sign in with email and password
     */
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const validatedFields = credentialsSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.error('Authentication failed for session');
            return null;
          }

          const { email, password } = validatedFields.data;

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              emailVerified: true,
              firstName: true,
              lastName: true,
              password: true,
              role: true,
              avatar: true,
            },
          });

          if (!user) {
            console.error('Authentication failed for session');
            return null;
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            console.error('Authentication failed for session');
            return null;
          }

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Return user object (without password)
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            image: user.avatar,
            role: user.role,
          };
        } catch (error) {
          console.error('Authentication failed for session');
          return null;
        }
      },
    }),

    /**
     * Google OAuth Provider
     * Allows users to sign in with their Google account
     */
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

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
   * Pages configuration
   */
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    newUser: '/auth/signup',
  },

  /**
   * Callbacks for customizing session and JWT behavior
   */
  callbacks: {
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
        // For Google OAuth, ensure email is verified
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

    /**
     * Sign in callback - additional validation
     */
    async signIn({ user, account, profile }) {
      // For Google OAuth, verify email is from allowed domain if configured
      if (account?.provider === 'google' && profile?.email) {
        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
        
        if (allowedDomains.length > 0) {
          const emailDomain = profile.email.split('@')[1];
          if (!allowedDomains.includes(emailDomain)) {
            console.error('Email domain not allowed:', emailDomain);
            return false;
          }
        }

        // Check if user exists, create if not
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!existingUser) {
          // Create new user from Google profile
          const randomPassword = crypto.randomBytes(32).toString('base64');
          await prisma.user.create({
            data: {
              email: profile.email,
              emailVerified: new Date(),
              firstName: profile.given_name || null,
              lastName: profile.family_name || null,
              password: await bcrypt.hash(randomPassword, 12),
              avatar: profile.picture || null,
              role: 'CUSTOMER',
            },
          });
        } else if (!existingUser.emailVerified) {
          // Verify email if not already verified
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          });
        }
      }

      return true;
    },

    /**
     * Redirect callback - custom redirect after sign in/out
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to home page
      return baseUrl;
    },
  },

  /**
   * Event callbacks
   */
  events: {
    /**
     * Called when a user signs in
     */
    async signIn({ user, account, profile }) {
      console.log('User signed in:', user.email, 'via', account?.provider);
    },

    /**
     * Called when a user signs out
     */
    async signOut({ token }) {
      console.log('User signed out:', token.email);
    },

    /**
     * Called when a session is created
     */
    async session({ session }) {
      console.log('Session created for:', session.user?.email);
    },
  },

  /**
   * Debug mode (only in development)
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * Secret for JWT signing
   */
  secret: process.env.NEXTAUTH_SECRET,
};

/* Type definitions for NextAuth */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
      emailVerified: Date | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
    emailVerified?: Date | null;
  }
}

// Create the NextAuth instance
const nextAuthInstance = NextAuth(authOptions);

// Export the NextAuth instance for v4
export default nextAuthInstance;

// Export auth function that works in both client and server components
// This is a wrapper that ensures proper export
export async function auth() {
  return nextAuthInstance.auth();
}

// Export signIn and signOut by accessing them from the instance
export { nextAuthInstance as signIn, nextAuthInstance as signOut };
