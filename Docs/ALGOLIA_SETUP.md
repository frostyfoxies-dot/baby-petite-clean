# Algolia Free Tier Setup Guide

## Overview

Kids Petite uses Algolia for instant search. The free tier includes:
- 10,000 records
- 100,000 operations/month
- No credit card required (initially)

This is sufficient for a baby clothing store with up to ~5,000 products and variants.

---

## Step-by-Step Setup

### 1. Create Algolia Account

1. Go to https://algolia.com
2. Click **"Start free"** → Sign up with GitHub or email
3. No payment info needed for free tier

### 2. Create an Application

1. In Algolia dashboard, click **"Create Application"**
2. Name: `kids-petite` (or your preferred name)
3. Region: Choose closest to your users (e.g., `us` for US, `de` for Europe)
4. Plan: **Free** (10k records, 100k operations)
5. Click **"Create Application"**

### 3. Get API Keys

After creation, go to **"API Keys"** in the sidebar.

You'll see:

- **Application ID** → Copy this as `NEXT_PUBLIC_ALGOLIA_APP_ID`
- **Search-Only API Key** → Copy as `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`
- **Admin API Key** → Copy as `ALGOLIA_ADMIN_KEY`

**Important:** The Admin Key has full access; keep it secret (only server-side).

### 4. Create an Index

1. Go to **"Search > Indices"**
2. Click **"Create Index"**
3. Index name: `products`
4. Primary key: `objectID` (default)
5. Click **"Create"**

### 5. Configure Index Settings

Click on the `products` index, then **"Configuration"**:

#### a. Searchable Attributes
Set to (in order):
```
name, description, categories.name, tags
```

#### b. Attributes for Faceting
Add these as **"Faceting"** (filterable):
```
categories.name
colors
sizes
inStock
isActive
isFeatured
isNew
```

#### c. Custom Ranking
Add:
```
popularityScore
```

#### d. Replicas (optional)
Create a replica for sorting by price:
```
products_price_asc  (custom ranking: price ascending)
products_price_desc (custom ranking: price descending)
```

### 6. Set Up Indexing (Server-Side)

Your project already has an Algolia integration (`src/lib/algolia.ts`). You need to:

1. Add the API keys to your Railway environment variables (as shown in `.env.production.example`)

2. Run a one-time import script to populate the index from your database:

```bash
# In your local environment with DATABASE_URL set
npx tsx src/scripts/index-products-to-algolia.ts
```

If the script doesn't exist yet, create it:

```typescript
// src/scripts/index-products-to-algolia.ts
import { AlgoliaClient, SearchIndex } from 'algoliasearch';
import { prisma } from '@/lib/prisma';
import { ProductWithVariants } from '@/lib/algolia';

async function indexProducts() {
  const client = new AlgoliaClient({
    appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    apiKey: process.env.ALGOLIA_ADMIN_KEY!,
  });

  const index = client.initIndex('products');

  // Fetch all active products with variants from DB
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
      },
    },
  });

  // Transform to Algolia format
  const records: ProductWithVariants[] = products.map((product) => ({
    objectID: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: parseFloat(product.basePrice.toFixed(2)),
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toFixed(2)) : null,
    category: product.category.name,
    categoryId: product.category.id,
    categorySlug: product.category.slug,
    colors: [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[],
    sizes: [...new Set(product.variants.map((v) => v.size))] as string[],
    inStock: product.variants.some((v) => v.inventory?.available && v.inventory.available > 0),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    updatedAt: product.updatedAt.getTime(),
    // Add other fields as needed
  }));

  // Save to Algolia
  const result = await index.saveObjects(records);
  console.log(`Indexed ${records.length} products`);
  console.log('Task ID:', result.taskID);
}

indexProducts().catch(console.error);
```

3. Run the script once to seed the index.

### 7. Keep Index in Sync

Add webhook or cron job to sync product changes to Algolia:

**Option A: AfterEach DB Mutation**  
Call `index.saveObject()` or `index.deleteObject()` in your server actions after product updates.

**Option B: Scheduled Sync**  
Create a cron job (Railway cron or Vercel cron) that runs daily:

```bash
0 2 * * * cd /app && npx tsx src/scripts/index-products-to-algolia.ts
```

### 8. Test Search

After indexing, test the search API:

```
GET /api/products/search?q=diaper&limit=5
```

You should see results with highlighting, facets, etc.

---

## Environment Variables for Railway

Add these in Railway → Your Service → Variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Your Application ID |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` | Your Search-Only API Key |
| `ALGOLIA_ADMIN_KEY` | Your Admin API Key |

No restart needed if you add after deployment (Next.js reads env at build time; you may need to redeploy).

---

## Free Tier Limits & Monitoring

- **Operations:** 100,000/month (read + write)
- **Records:** 10,000
- **Indexing:** 10GB storage

Monitor usage in Algolia dashboard → **"Usage"**.

If you approach limits:
- Upgrade to paid tier (starts at ~$29/month)
- Or prune old products, reduce variants

---

## Optional: InstantSearch UI

Your project uses `react-instantsearch` (already in dependencies). Example component:

```tsx
import { InstantSearch, SearchBox, Hits, RefinementList } from 'react-instantsearch';

export function SearchPage() {
  return (
    <InstantSearch indexName="products" searchClient={algoliaSearchClient}>
      <SearchBox />
      <RefinementList attribute="categories.name" />
      <Hits hitComponent={ProductHit} />
    </InstantSearch>
  );
}
```

---

## Troubleshooting

- **"Invalid Application-ID"** → Check `NEXT_PUBLIC_ALGOLIA_APP_ID` matches exactly
- **"Missing required parameter: indexName"** → Ensure index `products` exists
- **Zero results** → Verify records were indexed (Algolia dashboard → Indices → Records)
- **Facets not working** → Ensure `attributesForFaceting` is set in index configuration

---

**Status:** Free tier is fully capable for MVP. Move to paid only when you exceed 10k products or need advanced features (personalization, A/B testing).
