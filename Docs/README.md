# Baby Petite - Documentation Index

**Project:** Baby Petite Children's Clothing E-Commerce Platform  
**Version:** 2.1  
**Date:** February 2026  
**Status:** Production Ready - Sprint 1 & 2 Complete

---

## Overview

This documentation suite provides comprehensive specifications for the Baby Petite children's clothing e-commerce platform. All documents are production-ready and designed for immediate development handoff.

### Implementation Progress

**Sprint 1 & 2: Foundation Complete** ✅

All critical P0 infrastructure tasks have been completed:
- ✅ Environment variable validation ([`src/lib/env.ts`](../src/lib/env.ts))
- ✅ Sentry error tracking integration
- ✅ Mock data replacement in all pages
- ✅ Sanity CMS integration ([`src/lib/sanity/`](../src/lib/sanity/), [`sanity/schemas/`](../sanity/schemas/))
- ✅ Cloudflare CDN configuration ([cloudflare-setup.md](./cloudflare-setup.md))
- ✅ Address validation with Google Places API ([`src/components/address/`](../src/components/address/))
- ✅ Apple Pay/Google Pay in Stripe ([apple-pay-google-pay-setup.md](./apple-pay-google-pay-setup.md))

## Brand Identity

**Brand Name:** Baby Petite  
**Tagline:** Curated Style for Little Ones  
**Positioning:** High-density, minimalist e-commerce platform for children's clothing

**Design Philosophy:**
- High product density with compact grids
- Minimalist interface with white/yellow color palette
- Color vibrancy from product photography only
- Efficient, streamlined shopping experience

---

## Documentation Index

### Specification Documents

| # | Document | Description | Status |
|---|----------|-------------|--------|
| 00 | [Competitive Analysis](./00-competitive-analysis.md) | Market analysis of Carter's, H&M Kids, and competitors | ✅ Final |
| 01 | [CMS Evaluation](./01-cms-evaluation.md) | Comparison of Sanity, Payload, and Keystatic (Sanity selected) | ✅ Final |
| 02 | [Technical Stack](./02-technical-stack.md) | Complete technology stack with Next.js 15, Sanity, PostgreSQL, Stripe | ✅ Final |
| 03 | [Brand Guidelines](./03-brand-guidelines.md) | Visual identity, white/yellow palette, minimalist design principles | ✅ Final |
| 04 | [System Architecture](./04-system-architecture.md) | Infrastructure, API structure, security, monitoring | ✅ Final |
| 05 | [Database Schema](./05-database-schema.md) | 18 tables with detailed relationships for products, inventory, users, orders | ✅ Final |
| 06 | [Frontend Specification](./06-frontend-specification.md) | React/Next.js components, high-density layout, WCAG 2.1 AA accessibility | ✅ Final |
| 07 | [E-Commerce Features](./07-ecommerce-features.md) | User journeys for checkout, payments, account management | ✅ Final |
| 08 | [AI-Powered Registry](./08-ai-registry-specification.md) | Predictive sizing, smart recommendations, automated inventory | ✅ Final |
| 09 | [Documentation Review Report](./09-documentation-review-report.md) | Documentation audit and gap analysis | ✅ Final |
| 10 | [E-Commerce UX Best Practices](./10-ecommerce-ux-best-practices.md) | Industry standards for high-converting e-commerce user flows | ✅ Final |

### Implementation Guides

| # | Document | Description | Status |
|---|----------|-------------|--------|
| 09 | [Cloudflare CDN Setup](./cloudflare-setup.md) | CDN configuration, DNS, caching rules, security settings | ✅ Implemented |
| 10 | [Apple Pay & Google Pay Setup](./apple-pay-google-pay-setup.md) | Payment method integration via Stripe Payment Request Button | ✅ Implemented |

---

## Quick Reference

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4.x |
| **CMS** | Sanity 3.x |
| **Database** | PostgreSQL 16, Prisma 6.x |
| **Payments** | Stripe 17.x |
| **Search** | Algolia 5.x |
| **Email** | SendGrid 8.x |
| **AI/ML** | OpenAI 5.x |
| **Hosting** | Vercel, Supabase, Cloudflare |

### Key Features

- ✅ High-density product grid (up to 6 columns on large screens)
- ✅ Minimalist white/yellow interface
- ✅ AI-powered product recommendations
- ✅ Predictive sizing for children's growth
- ✅ Smart registry with size predictions
- ✅ Automated inventory management
- ✅ Multi-step checkout
- ✅ User accounts & order management
- ✅ Product reviews & ratings
- ✅ Wishlist functionality
- ✅ Promo codes & discounts
- ✅ Mobile-responsive design

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| White | #FFFFFF | Primary background, cards |
| Yellow | #FFD700 | CTAs, active states, highlights (max 5% of interface) |
| Off White | #FAFAFA | Secondary backgrounds |
| Gray 200 | #E5E7EB | Borders, dividers |
| Gray 600 | #4B5563 | Body text |
| Gray 900 | #111827 | Headings, primary text |

**Design Rule:** Color vibrancy comes exclusively from product photography. Interface elements remain monochromatic (white/gray/yellow).

### High-Density Grid System

| Screen Size | Columns | Gap | Card Width |
|-------------|---------|-----|------------|
| Mobile (< 640px) | 2 | 8px | 160px |
| Tablet (640-1024px) | 3 | 12px | 200px |
| Desktop (1024-1280px) | 4-5 | 12px | 220px |
| Large (> 1280px) | 6 | 12px | 240px |

---

## Development Handoff

### Getting Started

1. **Review the documentation** in order:
   - Start with [Competitive Analysis](./00-competitive-analysis.md) for market context
   - Review [Technical Stack](./02-technical-stack.md) for technology choices
   - Study [System Architecture](./04-system-architecture.md) for infrastructure
   - Reference [Database Schema](./05-database-schema.md) for data models
   - Follow [Frontend Specification](./06-frontend-specification.md) for UI implementation
   - Implement [E-Commerce Features](./07-ecommerce-features.md) for functionality
   - Build [AI-Powered Registry](./08-ai-registry-specification.md) for smart features

2. **Set up the development environment:**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd baby-petite-platform
   
   # Install dependencies
   pnpm install
   
   # Set up environment variables
   cp .env.example .env.local
   
   # Run development server
   pnpm dev
   ```

3. **Configure services:**
   - Create Sanity project
   - Set up Supabase database
   - Configure Stripe account
   - Set up Algolia index
   - Configure SendGrid
   - Set up OpenAI API key

### Project Structure

```
baby-petite-platform/
├── Docs/                    # Documentation (this folder)
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   ├── lib/                # Utilities and clients
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   └── types/              # TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
└── public/                 # Static assets
```

### Key Files to Reference

| File | Purpose |
|------|---------|
| [`prisma/schema.prisma`](../prisma/schema.prisma) | Database schema |
| [`src/lib/sanity/`](../src/lib/sanity/) | Sanity CMS client |
| [`src/lib/prisma/`](../src/lib/prisma/) | Prisma ORM client |
| [`src/lib/stripe/`](../src/lib/stripe/) | Stripe payment client |
| [`src/lib/openai/`](../src/lib/openai/) | OpenAI AI client |
| [`tailwind.config.ts`](../tailwind.config.ts) | Tailwind CSS configuration |

---

## Implementation Phases

### Phase 1: MVP (Months 1-3) - **IN PROGRESS**

**Goal:** Launch core e-commerce functionality

**Sprint 1 & 2 Complete:** ✅
- [x] Environment variable validation
- [x] Sentry error tracking integration
- [x] Mock data replacement (products, category, cart, checkout, account, registry)
- [x] Sanity CMS integration
- [x] Cloudflare CDN configuration
- [x] Address validation (Google Places API)
- [x] Apple Pay/Google Pay payment methods

**Sprint 3 In Progress:**
- [ ] CI/CD pipeline setup
- [ ] Database seeding enhancement
- [ ] Production deployment checklist

**Remaining MVP Tasks:**
- [ ] Product catalog (500-800 SKUs)
- [ ] High-density product grid
- [ ] Product browsing and search
- [ ] Shopping cart
- [ ] Guest checkout
- [ ] User registration/login
- [ ] Payment processing (Stripe)
- [ ] Order management
- [ ] Basic registry functionality

### Phase 2: Growth (Months 4-12)

**Goal:** Add AI-powered features and enhance experience

- [ ] AI product recommendations
- [ ] Predictive sizing
- [ ] Smart registry suggestions
- [ ] Advanced search (Algolia)
- [ ] Product reviews
- [ ] Wishlist
- [ ] Promo codes
- [ ] Order tracking
- [ ] Email marketing integration

### Phase 3: Scale (Year 2+)

**Goal:** Expand features and markets

- [ ] Mobile app (iOS/Android)
- [ ] International markets
- [ ] Advanced analytics
- [ ] Loyalty program
- [ ] Subscription boxes
- [ ] Marketplace features

---

## API Endpoints Summary

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| GET | `/api/products/[slug]` | Get product details |
| GET | `/api/categories` | List categories |
| GET | `/api/search` | Search products |
| GET | `/api/registry/[shareUrl]` | View public registry |

### Authenticated Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get current user |
| GET | `/api/cart` | Get user cart |
| POST | `/api/cart/items` | Add to cart |
| POST | `/api/checkout` | Create checkout session |
| GET | `/api/orders` | List user orders |
| GET | `/api/registry` | Get user registry |
| POST | `/api/registry/items` | Add registry item |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/predict-sizes` | Generate size predictions |
| POST | `/api/ai/recommend` | Generate recommendations |
| GET | `/api/ai/trending` | Get trending products |

---

## Environment Variables

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
SANITY_API_TOKEN=your_api_token

# Database
DATABASE_URL=your_database_url

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Stripe webhook signing secret for verifying webhook events

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_key
ALGOLIA_ADMIN_KEY=your_admin_key

# SendGrid
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@babypetite.com  # Default sender email address for transactional emails

# OpenAI
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4-turbo  # Model for AI-powered features (e.g., product recommendations)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # Model for generating text embeddings (e.g., semantic search)

# NextAuth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=your_app_url

# App
NEXT_PUBLIC_BASE_URL=https://babypetite.com

# Sentry (NEW - Required for error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_slug

# Google Places API (NEW - Required for address validation)
GOOGLE_PLACES_API_KEY=your_places_api_key

# Apple Pay (Optional - for custom merchant configuration)
APPLE_PAY_MERCHANT_IDENTIFIER=merchant.com.yourdomain

# Google Pay (Optional - for custom merchant configuration)
GOOGLE_PAY_MERCHANT_ID=your_merchant_id
GOOGLE_PAY_MERCHANT_NAME=Baby Petite
```

---

## Testing Strategy

### Unit Testing
- Component testing with Vitest
- Utility function testing
- Hook testing

### Integration Testing
- API endpoint testing
- Database integration testing
- Service integration testing

### E2E Testing
- User flow testing with Playwright
- Checkout flow testing
- Registry flow testing

### Performance Testing
- Lighthouse CI
- Load testing
- API response time monitoring

---

## Deployment

### Preview Deployments
- Automatic on every pull request
- URL: `https://<branch-name>.babypetite.vercel.app`

### Staging
- Manual deployment from `develop` branch
- URL: `https://staging.babypetite.com`

### Production
- Manual deployment from `main` branch
- URL: `https://babypetite.com`

### Deployment Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] CDN cache cleared
- [ ] Monitoring configured
- [ ] Rollback plan ready

---

## Monitoring & Support

### Monitoring Tools
- **Sentry:** Error tracking
- **Vercel Analytics:** Performance monitoring
- **Custom Logging:** Event tracking
- **Uptime Monitoring:** Site availability

### Support Channels
- **Email:** support@babypetite.com
- **Documentation:** https://docs.babypetite.com
- **Status Page:** https://status.babypetite.com

---

## Contact

### Development Team
- **Product Manager:** product@babypetite.com
- **Engineering Lead:** engineering@babypetite.com
- **Design Lead:** design@babypetite.com
- **AI/ML Lead:** ai@babypetite.com

### Business Team
- **CEO:** ceo@babypetite.com
- **CTO:** cto@babypetite.com
- **Marketing:** marketing@babypetite.com

---

## Document Control

| Document | Version | Last Updated | Next Review |
|----------|---------|--------------|-------------|
| Competitive Analysis | 1.0 | February 2026 | May 2026 |
| CMS Evaluation | 1.0 | February 2026 | May 2026 |
| Technical Stack | 1.0 | February 2026 | August 2026 |
| Brand Guidelines | 2.0 | February 2026 | May 2026 |
| System Architecture | 1.0 | February 2026 | August 2026 |
| Database Schema | 1.0 | February 2026 | August 2026 |
| Frontend Specification | 2.0 | February 2026 | August 2026 |
| E-Commerce Features | 2.0 | February 2026 | August 2026 |
| AI-Powered Registry | 2.0 | February 2026 | August 2026 |
| Documentation Review Report | 1.0 | February 2026 | May 2026 |
| E-Commerce UX Best Practices | 1.0 | February 2026 | May 2026 |
| Cloudflare CDN Setup | 1.0 | February 2026 | August 2026 |
| Apple Pay & Google Pay Setup | 1.0 | February 2026 | August 2026 |

---

## License

All documentation is proprietary and confidential to Baby Petite.

---

**Last Updated:** February 12, 2026  
**Document Owner:** Product & Architecture Team  
**Approved By:** CTO
