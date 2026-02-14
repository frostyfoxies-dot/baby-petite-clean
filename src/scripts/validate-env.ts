/**
 * Validate Production Environment Variables
 *
 * Run this script to verify all required env vars are set before deployment.
 *
 * Usage: npx tsx src/scripts/validate-env.ts
 */

const requiredEnvVars = [
  // Database
  'DATABASE_URL',

  // Sanity
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'SANITY_API_TOKEN',

  // NextAuth
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',

  // Stripe
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  // STRIPE_WEBHOOK_SECRET can be added later after registration

  // Algolia
  'NEXT_PUBLIC_ALGOLIA_APP_ID',
  'NEXT_PUBLIC_ALGOLIA_SEARCH_KEY',
  'ALGOLIA_ADMIN_KEY',

  // Email (Resend)
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'EMAIL_FROM_NAME',

  // AI (OpenRouter)
  'OPENROUTER_API_KEY',

  // CDN
  'CLOUDFLARE_ZONE_ID',
  'CLOUDFLARE_API_TOKEN',

  // Analytics
  'NEXT_PUBLIC_GA4_MEASUREMENT_ID',

  // App
  'NEXT_PUBLIC_BASE_URL',
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET', // set after webhook registration
  'SENDGRID_API_KEY', // if using SendGrid instead of Resend
];

interface CheckResult {
  name: string;
  present: boolean;
  value: string | null;
}

function validate() {
  console.log('🔍 Validating environment variables...\n');

  const results: CheckResult[] = requiredEnvVars.map((name) => ({
    name,
    present: !!process.env[name],
    value: process.env[name] || null,
  }));

  const missing = results.filter((r) => !r.present);
  const present = results.filter((r) => r.present);

  present.forEach((r) => {
    console.log(`✅ ${r.name}=${maskSecret(r.name, r.value)}`);
  });

  if (missing.length > 0) {
    console.log('\n❌ Missing required environment variables:');
    missing.forEach((r) => {
      console.log(`   - ${r.name}`);
    });
    console.log('\nPlease set these in your Railway environment and redeploy.');
    process.exit(1);
  } else {
    console.log('\n✅ All required environment variables are set.');
  }

  // Check optional
  const missingOptional = optionalEnvVars.filter((name) => !process.env[name]);
  if (missingOptional.length > 0) {
    console.log('\n⚠️  Optional environment variables not set (can be added later):');
    missingOptional.forEach((name) => {
      console.log(`   - ${name}`);
    });
  }

  // Additional checks
  console.log('\n🔍 Performing sanity checks...');

  // Check NEXTAUTH_SECRET length
  const authSecret = process.env.NEXTAUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    console.log('❌ NEXTAUTH_SECRET should be at least 32 characters long.');
  } else {
    console.log('✅ NEXTAUTH_SECRET length is sufficient.');
  }

  // Check BASE_URL format
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl && !baseUrl.startsWith('https://')) {
    console.log('❌ NEXT_PUBLIC_BASE_URL should start with https://');
  } else {
    console.log('✅ NEXT_PUBLIC_BASE_URL looks good.');
  }

  console.log('\n🎉 Validation complete!');
}

function maskSecret(name: string, value: string | null): string {
  if (!value) return 'NOT SET';
  const secretKeywords = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
  const isSecret = secretKeywords.some((kw) => name.toUpperCase().includes(kw));
  if (isSecret) {
    return `***${value.slice(-4)}`;
  }
  return value;
}

validate();
