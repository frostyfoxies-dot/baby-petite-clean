# Kids Petite - Master Technical & Operational Specification

## 1. Executive Summary

**Vision:** To become the most trusted destination for premium baby clothing in Southeast Asia, combining exceptional product curation with AI-powered personalization.

**MVP Scope:** Full-featured e-commerce store supporting:
- Product catalog with variants & inventory
- Shopping cart & checkout with Stripe
- Baby registry with growth-based size predictions
- Admin dashboard for order fulfillment & supplier management
- Dropshipping integration with AliExpress

**Success Metrics (Launch Day 30):**
- Revenue: $5,000 MRR
- Orders: 150+ monthly
- Conversion rate: ≥2.5%
- Average order value: ≥$75
- Customer satisfaction: NPS ≥40

**Tech Stack Finalized:**
- Frontend: Next.js 15, React 19, Tailwind CSS 4
- Backend: Next.js API Routes (serverless)
- Database: PostgreSQL (hosted on Railway)
- CMS: Sanity (product content)
- Search: Algolia
- Payments: Stripe (cards, Apple Pay, Google Pay)
- Email: SendGrid
- Error tracking: Sentry
- CDN: Cloudflare
- Hosting: Vercel (frontend) + Railway (backend/db)

---

## 2. System Architecture

### Component Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Vercel        │    │   Railway        │    │  External   │
│   (Frontend)    │◄──►│   (Backend/DB)   │◄──►│  Services   │
└─────────────────┘    └──────────────────┘    └─────────────┘
       │                        │                        │
       │ Next.js App            │ Prisma + PostgreSQL   │
       │ Server Components      │ REST APIs             │
       │ Server Actions         │ Webhooks              │
       │                        │                       │
       ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Cloudflare    │    │   Sanity CMS      │    │  Stripe     │
│   CDN + Proxy   │    │   (Products)      │    │  Payments   │
└─────────────────┘    └──────────────────┘    └─────────────┘
                               │                       │
                               ▼                       ▼
                        ┌─────────────────┐    ┌─────────────┐
                        │   Algolia       │    │  SendGrid   │
                        │   Search        │    │  Email      │
                        └─────────────────┘    └─────────────┘
```

### Data Flow: Checkout

1. User adds product to cart → cart stored in DB (via server action)
2. User proceeds to checkout → authenticated or guest session
3. POST `/api/checkout` → creates Stripe Checkout Session, stores checkout session in DB
4. User redirected to Stripe → enters payment details
5. Stripe sends webhook to `/api/webhooks/stripe` → `checkout.session.completed`
6. Webhook handler creates Order, reserves inventory, clears cart, sends confirmation email
7. User redirected to success page with order details

### Environment Strategy

| Environment | URLs | Database | Secrets |
|-------------|------|----------|---------|
| Development | localhost:3000 | Local PostgreSQL | `.env.local` |
| Staging | `babypetite.railway.app` | Railway staging DB | Railway variables |
| Production | `babypetite.up.railway.app` | Railway production DB | Railway + Vercel env vars |

---

## 3. Database Schema (Prisma)

**Models:** 31 (see `prisma/schema.prisma`)

Core tables:
- `User`, `Address`, `Cart`, `CartItem`
- `Category`, `Product`, `Variant`, `ProductImage`, `Inventory`
- `Order`, `OrderItem`, `Shipping`, `Payment`
- `Review`, `Wishlist`, `WishlistItem`
- `Registry`, `RegistryItem`, `GrowthEntry`
- `Supplier`, `ProductSource`, `DropshipOrder`, `DropshipOrderItem`
- `DiscountCode`, `ImportJob`, `Notification`, `UserBehavior`, `RecommendationLog`

**Key Relationships:**
- Product → Variants (1:N)
- Variant → Inventory (1:1)
- Order → OrderItems (1:N)
- Order → Payment (1:1)
- Order → Shipping (1:1)
- User → Registry (1:1)
- Product → ProductSource (1:1 AliExpress link)

**Indexes:** All foreign keys + frequently queried fields (slug, SKU, email, status fields)

---

## 4. API Contracts

### Authentication

- **Provider:** NextAuth.js with Credentials (email/password) + Google OAuth optional
- **Protected Routes:** `/account/*`, `/checkout/*`, `/admin/*` (role-based)
- **Session Cookie:** `next-auth.session-token` (HTTPOnly, Secure in production)

### Core Endpoints (Abbreviated)

#### `GET /api/products/[slug]`
Fetch single product with variants, inventory, reviews, related products.

**Response:** `ProductDetailResponse` (see `src/app/api/products/[slug]/route.ts`)

#### `POST /api/checkout`
Create Stripe checkout session.

**Body:** `CheckoutCreateRequest` (email, shippingAddress, billingAddress, shippingMethodId, discountCode?, notes?)

**Response:** `{ sessionId: string; url: string }`

#### `GET /api/checkout/session/[sessionId]`
Retrieve checkout session details (used by checkout success page).

#### `POST /api/webhooks/stripe`
Stripe webhook endpoint.

**Events handled:**
- `checkout.session.completed` → creates order, reserves inventory
- `payment_intent.succeeded` → marks payment complete
- `payment_intent.payment_failed` → marks order failed
- `charge.refunded` → handles refunds
- `charge.dispute.created` → logs dispute for manual review

#### `POST /api/admin/import/product`
Admin product import from AliExpress (preview + bulk import).

#### `GET /api/recommendations`
AI-based product recommendations (collaborative filtering + rules).

---

## 5. Frontend Specifications

### Design System

- **Colors:** Primary yellow (`#FFD700`) for CTAs, warm neutrals, soft shadows
- **Typography:** Inter (body), Playfair Display (headings)
- **Components:** All from `@/components/ui` (shadcn/ui based)
- **Responsive:** Mobile-first, breakpoints: 640, 768, 1024, 1280

### Page Routes

| Route | Purpose | SEO |
|-------|---------|-----|
| `/` | Homepage with featured products, categories | Index |
| `/products` | Full product catalog with filters | Index |
| `/products/[slug]` | Product detail page | Index, rich snippets |
| `/category/[slug]` | Category listing | Index |
| `/collection/[slug]` | Curated collections | Index |
| `/cart` | Shopping cart | Noindex |
| `/checkout` | Checkout flow | Noindex |
| `/account/*` | User account | Noindex |
| `/admin/*` | Admin dashboard | `X-Robots-Tag: noindex` |

### Metadata Generation

- `src/app/sitemap.ts` – dynamic from DB (products + categories)
- `src/app/robots.ts` – standard rules
- Per-page `generateMetadata` for title, description, canonical

---

## 6. Integrations

### Stripe

**Products:** Use Stripe Prices linked to Product+ variants
**Webhooks:** `https://babypetite.com/api/webhooks/stripe`
**Events:** checkout.session.completed, payment_intent.*

**Secret:** `STRIPE_WEBHOOK_SECRET`

**Local testing:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Sanity

**Project ID:** `localproject` (dev) → change for prod
**Dataset:** `production`
**Schemas:** `product`, `category`, `collection`, `page`

### Algolia

**Index:** `products` with attributes for faceting (category, colors, sizes, inStock)
**Search API:** client-side instantsearch + server-side `/api/products/search`

### SendGrid

**Templates needed:**
- `order_confirmation` – with order items, totals, tracking link placeholder
- `shipping_update` – when order status changes to SHIPPED
- `registry_invite` – shareable registry invitation
- `password_reset` – NextAuth default
- `email_verification` – if using email auth

**Sender:** `noreply@babypetite.com` (needs domain verification)

---

## 7. Compliance Requirements

### CPSIA (US Baby Product Safety)

**Required on product pages:**
- Age grading (e.g., "0–6 months", "6–12 months")
- Choking hazard warnings if applicable
- Lead and phthalate compliance statement
- Care instructions & washing labels
- Country of origin

**Implementation:**
Add fields to Sanity `product` schema:
- `minAge`, `maxAge` (number, months)
- `chokingHazard` (boolean + description)
- `certifications` (array of strings: "CPSIA", "ASTM F963", "CE")
- `careInstructions` (array of blocks)
- `countryOfOrigin` (string)

Display in product page component above add-to-cart.

### GDPR (EU)

- Cookie consent banner (tracking cookies)
- Data deletion request endpoint
- Privacy policy & terms of service (present)
- Right to data export (NextAuth can provide user data)

### PCI DSS

- **Scope:** We are **SAQ A** (Stripe-hosted checkout). No card data touches our servers.
- Must ensure: TLS 1.2+, secure webhook endpoints, no logging of sensitive data.

### WCAG 2.1 AA

- Keyboard navigation testing
- Color contrast ratio ≥4.5:1
- Alt text on all images (product images need alt from Sanity)
- ARIA labels on interactive elements
- Focus management for modals/checkout

**Audit tool:** `@axe-core/react` in dev, manual screen reader testing.

---

## 8. Deployment Pipeline

### Vercel (Frontend)

**Environment variables** (in Vercel dashboard):
```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_ALGOLIA_APP_ID
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_BASE_URL=https://babypetite.com
```

**Build command:** `npm run build`
**Output directory:** `.next`

### Railway (Backend + DB)

**Services:**
1. PostgreSQL 16 (auto-backup enabled, daily retention 7 days)
2. Web service (Node.js) – runs `npm start` (Next.js standalone)

**Environment variables** (in Railway):
```
DATABASE_URL (provided by railway link)
SANITY_API_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ALGOLIA_ADMIN_KEY
SENDGRID_API_KEY
OPENAI_API_KEY
NEXTAUTH_SECRET (32+ char random)
NEXTAUTH_URL=https://babypetite.com
```

**Domain:** Railway assigns `*.up.railway.app`. Set custom domain if purchased.

### Database Backups

**Strategy:**
- Railway automatic daily backups (keep 7 days)
- Additionally, export to S3-compatible storage weekly via cron:
  ```bash
  pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
  curl -X PUT -H "Authorization: Bearer $S3_SECRET" -T backup-*.sql.gz s3://bucket/backups/
  ```

**Retention:** Keep 30 days of weekly backups in S3.

---

## 9. Operational Runbooks

### Incident: Payment Fails (Webhook)

1. Check Stripe Dashboard → PaymentIntent status
2. If `requires_payment_method`, email customer with link to update payment
3. Reserve inventory on `checkout.session.completed`; no reserve on failed payment
4. Order status remains `PENDING` until payment succeeds

### Incident: Inventory Out of Sync

1. Manual inventory adjustment in Prisma Studio or admin UI
2. Run inventory reconciliation script against AliExpress supplier API
3. If oversold, contact supplier to expedite or source alternative

### Incident: Webhook Timeouts

- Stripe retries webhook 3 times with exponential backoff
- Ensure idempotency: use `checkout.session.id` as idempotency key
- Log every webhook event to database table `webhook_event_log` for audit

### Daily Ops Checklist

- Monitor Sentry for new errors
- Check Stripe dispute dashboard
- Review low stock alerts (inventory < threshold)
- Validate email deliverability (SendGrid stats)

---

## 10. Launch Checklist

### Pre-Launch (T−7 to T−1)

- [ ] All environment variables set in production (Vercel + Railway)
- [ ] Stripe webhook endpoint registered to production URL
- [ ] SendGrid templates created and IDs in `.env.production`
- [ ] Cloudflare DNS proxying enabled, cache rules applied
- [ ] Algolia index populated with all products
- [ ] Sanity dataset published to production
- [ ] GA4 measurement ID added and events instrumented
- [ ] Privacy policy & terms updated with company address
- [ ] CPSIA compliance fields filled in Sanity for all products
- [ ] Admin accounts created (STAFF/ADMIN roles)
- [ ] Database backup tested (restore from Railway)
- [ ] Load test checkout flow (10 concurrent users minimum)

### Launch Day (T)

- [ ] Deploy Vercel (production branch)
- [ ] Deploy Railway (trigger rebuild)
- [ ] Enable Sentry alerts (new issues, error rate > 1%)
- [ ] Enable Stripe webhook (switch from test to live mode)
- [ ] Test live checkout with $1 donation (use test card 4242...)
- [ ] Verify confirmation email received
- [ ] Monitor webhook logs for errors
- [ ] Announce on social media + email list

### Post-Launch (T+1 to T+30)

- [ ] Daily Sentry review
- [ ] Weekly Stripe settlement reconciliation
- [ ] Weekly inventory health report
- [ ] Monthly GA4 analysis (conversion funnel)
- [ ] Customer support tickets triage

---

## 11. Master Spec Living Document

This document is the **Single Source of Truth** for all technical and operational decisions. Any deviation must be recorded here with rationale.

**Last updated:** 2026-02-14 15:44 MYT  
**Owner:** CEO (100,000× Exit) – Extreme Ownership

---

**END OF SPECIFICATION**
