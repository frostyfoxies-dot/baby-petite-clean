# Kids Petite - Baby Clothing E-Commerce Platform

A modern, value-oriented baby clothing e-commerce platform with AI-powered registry features.

## Implementation Status

**Current Phase:** Sprint 1 & 2 Complete ✅

### Completed Infrastructure (February 2026)

| Feature | Status | Documentation |
|---------|--------|---------------|
| Environment Variable Validation | ✅ Complete | [`src/lib/env.ts`](src/lib/env.ts) |
| Sentry Error Tracking | ✅ Complete | [`sentry.client.config.ts`](sentry.client.config.ts) |
| Mock Data Replacement | ✅ Complete | All pages fetch real data |
| Sanity CMS Integration | ✅ Complete | [`sanity/schemas/`](sanity/schemas/) |
| Cloudflare CDN | ✅ Complete | [`Docs/cloudflare-setup.md`](Docs/cloudflare-setup.md) |
| Address Validation | ✅ Complete | [`src/components/address/`](src/components/address/) |
| Apple Pay/Google Pay | ✅ Complete | [`Docs/apple-pay-google-pay-setup.md`](Docs/apple-pay-google-pay-setup.md) |

### Remaining Work

- CI/CD Pipeline setup
- Database seeding enhancement
- Promo code system
- Inventory management
- Order tracking integration

## Features

- **Product Catalog**: Browse products by category, size, and color
- **Shopping Cart**: Add items, apply discounts, checkout
- **Baby Registry**: Create and share registries with AI-powered size predictions
- **User Accounts**: Manage addresses, orders, and wishlists
- **Admin Dashboard**: Manage products, orders, and customers
- **Payment Methods**: Credit card, Apple Pay, Google Pay
- **Address Validation**: Google Places API autocomplete

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **CMS**: Sanity 3.x
- **Database**: PostgreSQL with Prisma 6.x
- **Payments**: Stripe 17.x
- **Search**: Algolia 5.x
- **Email**: SendGrid 8.x
- **AI**: OpenAI 4.x

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- pnpm (recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/kids-petite.git
   cd kids-petite
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy `.env.example` to `.env` and fill in values:
   ```bash
   cp .env.example .env
   ```

4. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

5. Start development server:
   ```bash
   pnpm dev
   ```

### Environment Variables

See `.env.example` for required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth.js secret key |
| `NEXTAUTH_URL` | Application URL |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Algolia application ID |
| `ALGOLIA_ADMIN_KEY` | Algolia admin API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `SENDGRID_API_KEY` | SendGrid API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `GOOGLE_PLACES_API_KEY` | Google Places API key for address validation |
| `APPLE_PAY_MERCHANT_IDENTIFIER` | Apple Pay merchant ID (optional) |
| `GOOGLE_PAY_MERCHANT_ID` | Google Pay merchant ID (optional) |

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── about/              # About page
│   │   ├── account/            # User account pages
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   ├── cart/               # Shopping cart
│   │   ├── category/           # Category pages
│   │   ├── checkout/           # Checkout flow
│   │   ├── products/           # Product pages
│   │   └── registry/           # Baby registry
│   ├── components/             # React components
│   │   ├── cart/               # Cart components
│   │   ├── checkout/           # Checkout components
│   │   ├── product/            # Product components
│   │   └── ui/                 # UI primitives
│   ├── lib/                    # Utility libraries
│   │   ├── utils.ts            # Helper functions
│   │   └── validators.ts       # Zod schemas
│   ├── actions/                # Server actions
│   ├── store/                  # Zustand stores
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript types
├── prisma/                     # Database schema
├── e2e/                        # E2E tests
├── scripts/                    # Utility scripts
└── Docs/                       # Project documentation
```

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests

Run end-to-end tests with Playwright:

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e auth.spec.ts

# Run tests in UI mode
pnpm test:e2e:ui
```

## Database Management

### Migrations

```bash
# Create a new migration
pnpm db:migrate

# Reset database (development only)
pnpm db:reset

# Open Prisma Studio
pnpm db:studio
```

### Seeding

Seed the database with sample data:

```bash
pnpm db:seed
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

### Manual Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development server |
| `build` | Build for production |
| `start` | Start production server |
| `lint` | Run ESLint |
| `test` | Run unit tests |
| `test:e2e` | Run E2E tests |
| `db:migrate` | Run database migrations |
| `db:seed` | Seed database with sample data |
| `db:studio` | Open Prisma Studio |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Documentation

Comprehensive documentation is available in the `Docs/` directory:

### Specification Documents

- [Competitive Analysis](./Docs/00-competitive-analysis.md)
- [CMS Evaluation](./Docs/01-cms-evaluation.md)
- [Technical Stack](./Docs/02-technical-stack.md)
- [Brand Guidelines](./Docs/03-brand-guidelines.md)
- [System Architecture](./Docs/04-system-architecture.md)
- [Database Schema](./Docs/05-database-schema.md)
- [Frontend Specification](./Docs/06-frontend-specification.md)
- [E-commerce Features](./Docs/07-ecommerce-features.md)
- [AI Registry Specification](./Docs/08-ai-registry-specification.md)

### Implementation Guides

- [Cloudflare CDN Setup](./Docs/cloudflare-setup.md) - CDN configuration, DNS, caching rules
- [Apple Pay & Google Pay Setup](./Docs/apple-pay-google-pay-setup.md) - Payment method integration

### Planning Documents

- [Action Plan](./plans/action-plan.md) - Prioritized implementation roadmap
- [Gap Analysis](./plans/gap-analysis.md) - Implementation vs specifications analysis

## License

MIT

## Support

For support, please open an issue on GitHub or contact support@babypetite.com
