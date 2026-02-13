/**
 * Environment Variable Validation
 *
 * Centralized validation for all environment variables using Zod.
 * Provides type-safe access and clear error messages for missing variables.
 */

import { z } from 'zod';

/**
 * Schema for environment variables
 *
 * Variables are categorized as:
 * - Required: Must be present in all environments
 * - Optional: Have defaults or are conditionally required
 * - Client-side: Prefixed with NEXT_PUBLIC_ (accessible in browser)
 * - Server-side: Only accessible in server code
 */
const envSchema = z.object({
  // ===========================================
  // Node Environment
  // ===========================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ===========================================
  // Sanity CMS
  // ===========================================
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1, 'Sanity Project ID is required'),
  SANITY_API_TOKEN: z.string().min(1, 'Sanity API Token is required'),
  SANITY_DATASET: z.string().default('production'),

  // ===========================================
  // Database (Supabase/PostgreSQL)
  // ===========================================
  DATABASE_URL: z.string().url('Database URL must be a valid URL'),

  // ===========================================
  // Stripe Payments
  // ===========================================
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe Publishable Key is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe Secret Key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe Webhook Secret is required'),

  // ===========================================
  // Algolia Search
  // ===========================================
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().min(1, 'Algolia App ID is required'),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().min(1, 'Algolia Search Key is required'),
  ALGOLIA_ADMIN_KEY: z.string().min(1, 'Algolia Admin Key is required'),

  // ===========================================
  // SendGrid Email
  // ===========================================
  SENDGRID_API_KEY: z.string().min(1, 'SendGrid API Key is required'),
  SENDGRID_FROM_EMAIL: z.string().email('SendGrid From Email must be a valid email'),

  // ===========================================
  // OpenAI (AI/ML Features)
  // ===========================================
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API Key is required'),
  OPENAI_MODEL: z.string().default('gpt-4-turbo'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  // ===========================================
  // NextAuth.js Authentication
  // ===========================================
  NEXTAUTH_SECRET: z.string().min(1, 'NextAuth Secret is required'),
  NEXTAUTH_URL: z.string().url('NextAuth URL must be a valid URL'),

  // ===========================================
  // Application Settings
  // ===========================================
  NEXT_PUBLIC_BASE_URL: z.string().url('Base URL must be a valid URL'),

  // ===========================================
  // OAuth - Google (Optional)
  // ===========================================
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ===========================================
  // OAuth - Facebook (Optional)
  // ===========================================
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),

  // ===========================================
  // Sentry Error Tracking (Optional in development)
  // ===========================================
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // ===========================================
  // Google Maps (Optional - Address Autocomplete)
  // ===========================================
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

/**
 * Schema for client-side only environment variables
 * These are safe to expose to the browser (prefixed with NEXT_PUBLIC_)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().min(1),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  SANITY_DATASET: z.string().default('production'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

/**
 * Type for validated environment variables
 */
type Env = z.infer<typeof envSchema>;
type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validates environment variables and returns typed object
 *
 * In development: Logs warnings for missing optional variables
 * In production: Throws error for missing required variables
 * In test: Uses defaults for missing variables
 */
function validateEnv(): Env {
  const isDev = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const isProd = process.env.NODE_ENV === 'production';

  // In test environment, provide defaults for missing variables
  if (isTest) {
    const testEnv = {
      NODE_ENV: 'test' as const,
      NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'test-project',
      SANITY_API_TOKEN: process.env.SANITY_API_TOKEN || 'test-token',
      SANITY_DATASET: process.env.SANITY_DATASET || 'test',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_xxx',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_xxx',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_xxx',
      NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'test-app-id',
      NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || 'test-search-key',
      ALGOLIA_ADMIN_KEY: process.env.ALGOLIA_ADMIN_KEY || 'test-admin-key',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || 'SG.test-key',
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'test@test.com',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-test-xxx',
      OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret-min-32-chars-long',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
      FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    };
    return envSchema.parse(testEnv);
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missingVars = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `  - ${path}: ${issue.message}`;
      })
      .join('\n');

    const errorMessage = `
❌ Environment Variable Validation Failed
==========================================
The following environment variables are invalid or missing:

${missingVars}

Please check your .env.local file against .env.example
`;

    // In development, log warning but don't throw
    if (isDev) {
      console.warn(errorMessage);
      console.warn('⚠️  Continuing with potentially missing environment variables...');
      console.warn('   Some features may not work correctly.\n');

      // Return partial env with undefined for missing vars
      return process.env as unknown as Env;
    }

    // In production, throw error
    if (isProd) {
      throw new Error(errorMessage);
    }
  }

  return result.data;
}

/**
 * Validates client-side environment variables
 * Call this from client components to ensure public vars are present
 */
function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    SANITY_DATASET: process.env.SANITY_DATASET,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!result.success) {
    const missingVars = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `  - ${path}: ${issue.message}`;
      })
      .join('\n');

    console.error(`
❌ Client Environment Variable Validation Failed
================================================
The following public environment variables are invalid or missing:

${missingVars}

Please check your .env.local file.
`);
  }

  return result.success ? result.data : ({} as ClientEnv);
}

// ===========================================
// Validated Environment Variables
// ===========================================

/**
 * Fully validated environment variables for server-side use
 *
 * @throws Error in production if validation fails
 * @warns in development if validation fails
 */
export const env = validateEnv();

/**
 * Client-safe environment variables
 * Use this in client components
 */
export const clientEnv = typeof window !== 'undefined' ? validateClientEnv() : ({} as ClientEnv);

// ===========================================
// Typed Exports for Convenience
// ===========================================

// Sanity
export const SANITY_PROJECT_ID = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const SANITY_API_TOKEN = env.SANITY_API_TOKEN;
export const SANITY_DATASET = env.SANITY_DATASET;

// Database
export const DATABASE_URL = env.DATABASE_URL;

// Stripe
export const STRIPE_PUBLISHABLE_KEY = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

// Algolia
export const ALGOLIA_APP_ID = env.NEXT_PUBLIC_ALGOLIA_APP_ID;
export const ALGOLIA_SEARCH_KEY = env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
export const ALGOLIA_ADMIN_KEY = env.ALGOLIA_ADMIN_KEY;

// SendGrid
export const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
export const SENDGRID_FROM_EMAIL = env.SENDGRID_FROM_EMAIL;

// OpenAI
export const OPENAI_API_KEY = env.OPENAI_API_KEY;
export const OPENAI_MODEL = env.OPENAI_MODEL;
export const OPENAI_EMBEDDING_MODEL = env.OPENAI_EMBEDDING_MODEL;

// NextAuth
export const NEXTAUTH_SECRET = env.NEXTAUTH_SECRET;
export const NEXTAUTH_URL = env.NEXTAUTH_URL;

// App
export const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

// OAuth - Google
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;

// OAuth - Facebook
export const FACEBOOK_CLIENT_ID = env.FACEBOOK_CLIENT_ID;
export const FACEBOOK_CLIENT_SECRET = env.FACEBOOK_CLIENT_SECRET;

// Sentry
export const SENTRY_DSN = env.NEXT_PUBLIC_SENTRY_DSN;
export const SENTRY_AUTH_TOKEN = env.SENTRY_AUTH_TOKEN;
export const SENTRY_ORG = env.SENTRY_ORG;
export const SENTRY_PROJECT = env.SENTRY_PROJECT;

// Google Maps
export const GOOGLE_MAPS_API_KEY = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Environment helpers
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// ===========================================
// OAuth Configuration Helper
// ===========================================

/**
 * Check if Google OAuth is configured
 */
export const isGoogleOAuthConfigured = (): boolean => {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
};

/**
 * Check if Facebook OAuth is configured
 */
export const isFacebookOAuthConfigured = (): boolean => {
  return Boolean(FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET);
};

/**
 * Get configured OAuth providers
 */
export const getConfiguredOAuthProviders = (): Array<'google' | 'facebook'> => {
  const providers: Array<'google' | 'facebook'> = [];
  if (isGoogleOAuthConfigured()) providers.push('google');
  if (isFacebookOAuthConfigured()) providers.push('facebook');
  return providers;
};

/**
 * Check if Google Maps is configured for address autocomplete
 */
export const isGoogleMapsConfigured = (): boolean => {
  return Boolean(GOOGLE_MAPS_API_KEY);
};