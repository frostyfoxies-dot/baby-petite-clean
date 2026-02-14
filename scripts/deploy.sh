#!/usr/bin/env bash

# Kids Petite - Quick Deploy Script
# Runs all necessary post-deploy commands on Railway

set -e

echo "🚀 Starting Kids Petite deployment steps..."

# 1. Run database migrations
echo "📦 Running database migrations..."
railway run npx prisma migrate deploy

# 2. Sync Sanity → PostgreSQL
echo "🔄 Syncing products from Sanity to database..."
railway run npx tsx src/scripts/sync-sanity-to-db.ts

# 3. Index products to Algolia
echo "🔍 Indexing products to Algolia..."
railway run npx tsx src/scripts/index-products-to-algolia.ts

# 4. Validate environment
echo "🔐 Validating environment variables..."
railway run npx tsx src/scripts/validate-env.ts

echo ""
echo "✅ Deployment steps complete!"
echo ""
echo "Next actions:"
echo "  1. Ensure Stripe webhook is registered to: https://babypetite.com/api/webhooks/stripe"
echo "  2. Add STRIPE_WEBHOOK_SECRET to Railway env"
echo "  3. Verify Resend domain (or use noreply@resend.dev)"
echo "  4. Add GA4_MEASUREMENT_ID when ready"
echo "  5. Test checkout with Stripe test card: 4242 4242 4242 4242"
echo ""
echo "Happy launching! 🎉"
