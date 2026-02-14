# Cloudflare CDN Setup Guide

## Role in Production

Cloudflare provides:
- Global CDN for static assets
- DDoS protection
- Cache purging on product updates
- SSL termination (if using custom domain)
- Security headers (via Workers or Transform Rules)

For MVP, we use **Free plan** with manual cache purges.

---

## Step 1: Add Site to Cloudflare

1. Login to https://cloudflare.com
2. Click **"Add a Site"**
3. Enter `babypetite.up.railway.app` (or your custom domain later)
4. Choose **Free** plan
5. Cloudflare will import existing DNS records from Railway

**Note:** Railway's free tier includes automatic SSL via Let's Encrypt. Cloudflare will proxy traffic through their network.

---

## Step 2: Update Domain Nameservers (Only for Custom Domains)

If you're using the Railway subdomain (`*.up.railway.app`), you **cannot** change nameservers. Instead, use the **Cloudflare for SaaS** feature or just rely on Railway's built-in CDN.

For custom domains (e.g., `babypetite.com`):
- Cloudflare gives you two nameservers (e.g., `lara.ns.cloudflare.com`)
- Update your domain registrar's NS records to these
- Wait 24–48 hours for propagation

---

## Step 3: Create API Token for Cache Purge

We need an API token so the app can purge cache when products are updated.

1. In Cloudflare dashboard, go to **"User Profile" → "API Tokens"**
2. Click **"Create Token"**
3. Use **"Custom token"**
4. Permissions:
   - **Zone** → **Cache Purge** → **Purge**
   - **Zone** → **Zone** → **Read**
5. Zone resources:
   - Select `babypetite.com` (or your domain)
6. Click **"Create Token"**
7. Copy the token (looks like `8YFcROzHksQgyIAsV6-jKOYOIjXAboWQjqOnOYH9`)

Add to Railway environment variables:

```
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_API_TOKEN=8YFcROzHksQgyIAsV6-jKOYOIjXAboWQjqOnOYH9
```

**How to find Zone ID:**
- In Cloudflare dashboard, select your site
- Look at the right sidebar → **"Zone ID"** (click to copy)

---

## Step 4: Cache Rules (Free Plan)

In Cloudflare dashboard → **"Rules" → "Cache Rules"**:

Create rules to optimize caching:

### Rule 1: Static Assets (Aggressive Caching)
- **Expression:** `http.request.uri.path matches "^/_next/(static|images)/.*"`
- **Cacheability:** **Cache**
- **Edge TTL:** 1 month
- **Browser TTL:** 1 month
- **Cache Key:** Include query string? **No**

### Rule 2: API Routes (No Cache)
- **Expression:** `http.request.uri.path starts with "/api/"`
- **Cacheability:** **Bypass**

### Rule 3: Admin/Auth (No Cache)
- **Expression:** `http.request.uri.path starts with "/admin" or http.request.uri.path starts with "/auth"`
- **Cacheability:** **Bypass**

### Rule 4: Product Pages (Short-term Cache)
- **Expression:** `http.request.uri.path matches "^/products/[^/]+$"`
- **Cacheability:** **Cache**
- **Edge TTL:** 1 hour
- **Stale-while-revalidate:** 24 hours

These rules complement the `Cache-Control` headers already set in `next.config.ts`.

---

## Step 5: Test CDN

1. Visit your site: `https://babypetite.up.railway.app`
2. Check response headers:
   ```
   cf-cache-status: HIT (after first request)
   cf-ray: <ID>
   ```
3. Use `curl -I https://babypetite.up.railway.app/products`
   Should see `cf-cache-status: HIT` or `DYNAMIC`

4. Purge cache manually (test):
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
     -H "Authorization: Bearer CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

---

## Step 6: Automatic Purge Integration (Optional)

In your product update server actions (`src/actions/admin/`), call Cloudflare purge API when a product is edited:

```typescript
async function purgeProductCache(productSlug: string) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!zoneId || !token) {
    console.warn('Cloudflare not configured, skipping cache purge');
    return;
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [
        `${baseUrl}/products/${productSlug}`,
        `${baseUrl}/category/${productSlug}`, // if applicable
        `${baseUrl}/`, // purge homepage if featured changed
      ],
    }),
  });

  const result = await response.json();
  if (result.success) {
    console.log('Cache purged successfully');
  } else {
    console.error('Cache purge failed:', result.errors);
  }
}
```

Call this after product updates in admin actions.

---

## Troubleshooting

- **"Invalid API token"** → Token is scoped incorrectly; recreate with correct permissions
- **"Zone ID not found"** → Ensure token has access to the correct zone
- **Cache not purging** → Check that `cf-cache-status` changes from `HIT` to `MISS` after purge
- **SSL errors** → Wait for Cloudflare SSL to activate (can take 24h); use **"Full (strict)"** mode

---

**Cost:** Free (within limits). Upgrade if you need advanced WAF, image optimization, or Argo Smart Routing.
