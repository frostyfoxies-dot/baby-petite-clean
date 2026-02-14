# Railway Deployment Guide

**Last Updated:** 2025-02-14 20:30 KL  
**Project:** Baby Petite  
**GitHub Repo:** https://github.com/frostyfoxies-dot/baby-petite-clean (branch: main)

---

## Prerequisites

- Railway account connected to GitHub
- Project `calm-emotion` already exists (or use new project `agile-heart`)
- All required environment variables are ready (see RAILWAY_ENV_VARS.md)

---

## Option 1: Deploy via Railway Dashboard (Recommended)

### Step 1: Create a Web Service

1. Go to the Railway dashboard: https://railway.com/project/b8fb43e5-34eb-4da7-85bf-4cb94a7c5bff (calm-emotion) OR use the new project: https://railway.com/project/2b8d1476-de20-49aa-b68d-02246cb882df (agile-heart)

2. Click **"New"** → **"Service"** → **"Web Service"**

3. Choose **"GitHub"** as the source

4. Select repository: `frostyfoxies-dot/baby-petite-clean`

5. Select branch: `main`

6. Configure service:
   - **Name:** `web` (or any name)
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** leave blank (root of repo)

7. Click **"Deploy"**

### Step 2: Set Environment Variables

After service creation, go to the service **"Variables"** tab and add all variables from `RAILWAY_ENV_VARS.md`.

**Important:** The following are already set in calm-emotion if using that project. If using a new project, copy them all.

At minimum, ensure these required variables are set:

```
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://babypetite.com
DATABASE_URL=postgresql://... ( provided by Railway Postgres add-on )
NEXTAUTH_SECRET=generate_random_32_char_string
NEXTAUTH_URL=https://babypetite.com
NEXT_PUBLIC_SANITY_PROJECT_ID=eo48q9uq
SANITY_API_TOKEN=skDTGwc...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# etc.
```

**Critical:** Add `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to avoid Playwright Chromium download errors during build.

### Step 3: Add Railway PostgreSQL (if not already)

If your project doesn't have a PostgreSQL database:

1. Click **"New"** → **"Service"** → **"PostgreSQL"**
2. Wait for it to provision
3. Copy the `DATABASE_URL` from the PostgreSQL service variables
4. Paste it into your web service variables as `DATABASE_URL`

### Step 4: Deploy

Once variables are set, the service will automatically build and deploy on the next push. You can also manually trigger:

- Click **"Deployments"** tab
- Click **"Deploy Latest"**

---

## Option 2: Deploy via Railway CLI (Advanced)

If you prefer CLI and have a service already created:

1. Link project (already done):
   ```bash
   railway link --project b8fb43e5-34eb-4da7-85bf-4cb94a7c5bff
   ```

2. Link to a specific service (you need service ID):
   ```bash
   railway service link <SERVICE_ID>
   ```

3. Set required variables (Playwright skip):
   ```bash
   railway variables set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
   ```

4. Deploy:
   ```bash
   railway up
   ```

---

## Verification

After deployment succeeds:

1. Visit your Railway domain (e.g., `https://your-service.up.railway.app`)
2. Test:
   - Homepage loads
   - Products page
   - Search
   - Checkout (use test Stripe card: 4242 4242 4242 4242)
3. Check logs in Railway for any runtime errors
4. Connect custom domain `babypetite.com` (if ready)

---

## Troubleshooting

### Build fails with Playwright Chrome error
**Fix:** Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` in service variables.

### Database connection errors
**Fix:** Ensure `DATABASE_URL` is correctly set from Railway Postgres add-on. Run migrations:
```bash
railway run npx prisma migrate deploy
```

### Missing environment variables
**Fix:** All required variables listed in `RAILWAY_ENV_VARS.md`. Set them in the service "Variables" tab.

### Sticky deployments (old code persists)
**Fix:** Clear build cache: `railway cache clear`

---

## Next Steps After Deploy

1. Update DNS for `babypetite.com` to point to Railway
2. Set up Cloudflare CDN if desired
3. Configure GitHub Actions CI/CD if not using Railway Git integration
4. Test all critical user flows
5. Enable monitoring (Sentry DSN may need to be set)

---

**Status:** Build verified locally. Code on GitHub: `baby-petite-clean` (main branch). Ready for one-click deploy.
