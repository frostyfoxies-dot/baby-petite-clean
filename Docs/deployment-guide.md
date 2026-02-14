# GitHub + Railway Deployment Guide

## GitHub Setup

### Option 1: Create New Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `baby-petite`
3. Public or Private
4. Click "Create repository"
5. Run these commands locally:

```bash
git remote add origin https://github.com/YOUR_USERNAME/baby-petite.git
git branch -M main
git push -u origin main
```

### Option 2: Using GitHub CLI

```bash
gh auth login
gh repo create baby-petite --public --source=. --push
```

---

## Railway Setup

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
cd /Users/adam/Desktop/Projects/Baby
railway init
```

Follow prompts:
- Name: `baby-petite`
- Select "Empty Project"

### Step 3: Add PostgreSQL

```bash
railway add postgres
```

### Step 4: Configure Environment Variables

Set each variable:

```bash
railway variables set NEXT_PUBLIC_SANITY_PROJECT_ID=your_value
railway variables set SANITY_API_TOKEN=your_value
railway variables set STRIPE_SECRET_KEY=your_value
railway variables set STRIPE_WEBHOOK_SECRET=your_value
railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_value
railway variables set ALGOLIA_ADMIN_KEY=your_value
railway variables set SENDGRID_API_KEY=your_value
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=https://baby-petite.up.railway.app
railway variables set NEXT_PUBLIC_BASE_URL=https://baby-petite.up.railway.app
railway variables set NODE_ENV=production
```

### Step 5: Deploy

```bash
railway up
```

Or connect GitHub repo in Railway dashboard for automatic deploys.

---

## Required Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection | Auto-provided by Railway |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project | sanity.io → Project ID |
| `SANITY_API_TOKEN` | Sanity API token | sanity.io → API → Tokens |
| `STRIPE_SECRET_KEY` | Stripe secret | stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | stripe.com → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable | stripe.com → API Keys |
| `ALGOLIA_ADMIN_KEY` | Algolia admin | algolia.com → Application → API Keys |
| `SENDGRID_API_KEY` | SendGrid API | sendgrid.com → API Keys |
| `NEXTAUTH_SECRET` | Auth secret | Generate: `openssl rand -base64 32` |

---

## Post-Deployment

1. **Run Prisma Migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

2. **Setup Stripe Webhook:**
   ```
   Your endpoint: https://baby-petite.up.railway.app/api/webhooks/stripe
   Events: checkout.session.completed, payment_intent.succeeded
   ```

3. **Verify Deployment:**
   Visit `https://baby-petite.up.railway.app`
