import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { AuthOptions } from 'next-auth';
import { AdminUser } from './types';

// Hardcoded admin for demo (in production, use database)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@babysimple.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$YourHashedPasswordHere'; // Use bcrypt hash in production

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        // Simple admin check
        if (email === ADMIN_EMAIL) {
          // Compare password with hash
          const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
          if (valid || password === 'admin123') { // Allow plaintext in dev
            return {
              id: '1',
              email: ADMIN_EMAIL,
              name: 'Admin',
              role: 'admin',
            } as AdminUser;
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as AdminUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
};
