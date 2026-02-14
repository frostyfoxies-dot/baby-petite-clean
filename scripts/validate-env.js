/**
 * Validate Production Environment Variables
 * Plain JavaScript (CommonJS) version
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'SANITY_API_TOKEN',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_ALGOLIA_APP_ID',
  'NEXT_PUBLIC_ALGOLIA_SEARCH_KEY',
  'ALGOLIA_ADMIN_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'EMAIL_FROM_NAME',
  'OPENROUTER_API_KEY',
  'CLOUDFLARE_ZONE_ID',
  'CLOUDFLARE_API_TOKEN',
  'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
  'NEXT_PUBLIC_BASE_URL',
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
];

function validate() {
  console.log('🔍 Validating environment variables...\n');

  const results = requiredEnvVars.map((name) => ({
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

  const missingOptional = optionalEnvVars.filter((name) => !process.env[name]);
  if (missingOptional.length > 0) {
    console.log('\n⚠️  Optional environment variables not set (can be added later):');
    missingOptional.forEach((name) => {
      console.log(`   - ${name}`);
    });
  }

  console.log('\n🔍 Performing sanity checks...');

  const authSecret = process.env.NEXTAUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    console.log('❌ NEXTAUTH_SECRET should be at least 32 characters long.');
  } else {
    console.log('✅ NEXTAUTH_SECRET length is sufficient.');
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl && !baseUrl.startsWith('https://')) {
    console.log('❌ NEXT_PUBLIC_BASE_URL should start with https://');
  } else {
    console.log('✅ NEXT_PUBLIC_BASE_URL looks good.');
  }

  console.log('\n🎉 Validation complete!');
}

function maskSecret(name, value) {
  if (!value) return 'NOT SET';
  const secretKeywords = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
  const isSecret = secretKeywords.some((kw) => name.toUpperCase().includes(kw));
  if (isSecret) {
    return `***${value.slice(-4)}`;
  }
  return value;
}

validate();
