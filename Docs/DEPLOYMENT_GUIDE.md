# Baby Petite - Production Deployment & Configuration Guide

**Last Updated:** 2026-02-14  
**Target Platform:** Railway (backend + DB) + Vercel (frontend)  
**Goal:** Go-live with all integrations configured

---

## Pre-Flight Checklist

Before you begin, ensure you have:

- [ ] Railway account (https://railway.app)
- [ ] Vercel account (https://vercel.com)
- [ ] Stripe account (test mode keys provided)
- [ ] Resend account (free tier) – for email
- [ ] Algolia account (free tier) – for search
- [ ] Sanity account (already have project)
- [ ] Cloudflare account (free) – for CDN
- [ ] OpenRouter account (free tier) – for AI features

---

## Step 1: Railway Project Setup (Backend + Database)

### 1.1 Create Railway Project

1. Login to Railway
2. Click **"New Project"**
3. Connect your GitHub repo (baby-petite)
4. Choose **"Deploy from GitHub"**
5. Select repository
6. Railway will detect `railway.json` and provision:
   - PostgreSQL 16 database
   - Node.js web service

### 1.2 Get Database URL

After deployment, Railway automatically injects `DATABASE_URL` into the environment.

In Railway dashboard → your service → **"Variables"**, you'll see `DATABASE_URL` (read-only).

### 1.3 Set Environment Variables

Add all variables from `.env.production.example` to Railway:

**Required:**
```
DATABASE_URL                    # Provided by Railway (do not edit)
NEXT_PUBLIC_SANITY_PROJECT_ID
SANITY_API_TOKEN
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_BASE_URL
```

**Payments:**
```
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET           # Set after webhook registration
```

**Search:**
```
NEXT_PUBLIC_ALGOLIA_APP_ID
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
ALGOLIA_ADMIN_KEY
```

**Email:**
```
RESEND_API_KEY
EMAIL_FROM
EMAIL_FROM_NAME
```

**AI:**
```
OPENROUTER_API_KEY
```

**CDN:**
```
CLOUDFLARE_ZONE_ID
CLOUDFLARE_API_TOKEN
```

**Analytics:**
```
NEXT_PUBLIC_GA4_MEASUREMENT_ID
```

**Note:** Do not commit real secrets to Git. Railway stores them securely.

### 1.4 Deploy

Railway will automatically:
- Run `npm install` (or `pnpm install`)
- Build with `npm run build`
- Start with `npm start`

Watch build logs for errors. If Prisma fails, ensure `DATABASE_URL` is set and PostgreSQL is ready.

---

## Step 2: Vercel Project Setup (Frontend)

### 2.1 Create Vercel Project

1. Login to Vercel
2. Click **"New Project"**
3. Import the same GitHub repository
4. Framework preset: **Next.js**
5. Build command: `npm run build`
6. Output directory: `.next`

### 2.2 Set Environment Variables

In Vercel → Project Settings → Environment Variables:

Add (Production):
```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_ALGOLIA_APP_ID
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_BASE_URL=https://babypetite.com
NEXT_PUBLIC_GA4_MEASUREMENT_ID
```

**Note:** Vercel handles frontend only; backend API routes run on Vercel serverless functions. But we need the backend (DB, Stripe webhooks) on Railway.

---

## Step 3: Database Migrations & Seeding

### 3.1 Run Migrations

In Railway console (or local with `DATABASE_URL`):

```bash
# Option A: Railway run (recommended)
railway run npx prisma migrate deploy

# Option B: Local
npx prisma migrate deploy
```

### 3.2 Generate Prisma Client

Already done during build, but if needed:

```bash
npx prisma generate
```

### 3.3 Seed Initial Data (Optional)

Create some sample categories and products in Sanity first, then run:

```bash
npx tsx src/scripts/sync-sanity-to-db.ts
```

(You'll need to create this script to pull products from Sanity into PostgreSQL.)

---

## Step 4: Stripe Configuration

### 4.1 Get Webhook URL

Your production webhook endpoint will be:

```
https://babypetite.up.railway.app/api/webhooks/stripe
```

### 4.2 Register Webhook in Stripe Dashboard

1. Login to Stripe → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: paste above
4. Events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
5. Click **"Add endpoint"**
6. Stripe will show you a **Signing secret** (`whsec_...`)
7. Copy that to Railway env as `STRIPE_WEBHOOK_SECRET`

### 4.3 Test Webhook Locally (Optional)

Use Stripe CLI to forward webhooks to your local dev:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Then trigger test events from Stripe dashboard.

---

## Step 5: Sanity CMS

You should already have a Sanity project. Ensure:

- Dataset is `production`
- `NEXT_PUBLIC_SANITY_PROJECT_ID` is set
- `SANITY_API_TOKEN` (with **Editor** role) is set

Test connection in Railway logs: any Sanity fetch errors will appear.

---

## Step 6: Algolia Indexing

### 6.1 One-Time Index

After Railway deployment and DB migrations:

```bash
# Set env locally or use Railway run
railway run npx tsx src/scripts/index-products-to-algolia.ts
```

See `Docs/ALGOLIA_SETUP.md` for full details.

### 6.2 Verify

Visit: `https://babypetite.up.railway.app/api/products/search?q=test`

Should return JSON results.

---

## Step 7: Cloudflare Cache Purge

### 7.1 Add Zone ID & Token

Add to Railway env (see Cloudflare setup guide):

```
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 7.2 Test Purge

Trigger a product update in admin; check Cloudflare API response.

---

## Step 8: Resend Email Verification

### 8.1 Verify Domain (Recommended)

Follow `Docs/RESEND_SETUP.md` to verify `babypetite.com` or use Railway subdomain.

### 8.2 Test Order Confirmation

1. Place a test order on your site (use Stripe test card `4242 4242 4242 4242`)
2. Check email delivery in Resend dashboard
3. You should receive order confirmation

---

## Step 9: AI Features (OpenRouter)

Your OpenRouter API key is set in Railway env:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

The registry size predictor uses this key. Ensure `src/lib/ai/registry.ts` (or equivalent) is configured to use `https://openrouter.ai/api/v1` as base URL.

Test by visiting a registry page and checking that predictions load.

---

## Step 10: Go/No-Go QA

Before announcing launch, run through this checklist:

### Functionality

- [ ] Homepage loads, images from Sanity appear
- [ ] Product search works (Algolia)
- [ ] Add to cart works, inventory decrements
- [ ] Checkout creates Stripe session
- [ ] Test payment (`4242...`) succeeds
- [ ] Order confirmation email received
- [ ] Admin can view orders
- [ ] Admin can mark order shipped (sends shipping email)
- [ ] Registry creation works
- [ ] AI size predictions display (if using OpenRouter)

### Compliance & SEO

- [ ] All product pages have meta title & description
- [ ] Compliance badges show (age, certifications, choking hazard)
- [ ] Privacy policy & terms pages accessible
- [ ] robots.txt allows search engines
- [ ] sitemap.xml returns products/categories

### Performance

- [ ] PageSpeed Insights score > 80
- [ ] Largest Contentful Paint < 2.5s
- [ ] No console errors

### Monitoring

- [ ] Sentry is capturing errors (deploy a test error)
- [ ] Stripe dashboard shows test transactions
- [ ] Resend dashboard shows delivered emails

---

## Post-Launch Checklist

- [ ] Rotate Stripe keys to live mode (change `sk_test_` → `sk_live_`)
- [ ] Update Stripe webhook to use live secret
- [ ] Add real domain to Cloudflare (if not using Railway subdomain)
- [ ] Set up daily DB backup export to S3 (see `scripts/backup-db.sh`)
- [ ] Schedule weekly Algolia re-index (cron)
- [ ] Enable Cloudflare analytics and set up alerts

---

## Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| 500 error on `/api/products` | `DATABASE_URL` missing | Set in Railway |
| "Invalid API key" from Algolia | Wrong keys | Check `NEXT_PUBLIC_ALGOLIA_*` |
| No email sent | `RESEND_API_KEY` missing/invalid | Verify in Railway |
| Webhook 404 | Railway URL wrong | Use `babypetite.up.railway.app` |
| Images not loading | Sanity CORS | Add Vercel/railway URLs in Sanity CORS settings |
| Build fails on `prisma generate` | Missing `DATABASE_URL` at build | Add to Railway build env |

---

## Support Resources

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Algolia Docs:** https://docs.algolia.com
- **Resend Docs:** https://resend.com/docs
- **Cloudflare Docs:** https://developers.cloudflare.com

---

**You are now ready to launch.**  
All components are integrated; only configuration and key entry remain.

Once all env vars are set, deploy both services and run the QA checklist.

Need help? Ping me with the specific error.
