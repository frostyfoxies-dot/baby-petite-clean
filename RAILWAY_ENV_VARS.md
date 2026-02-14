# Railway Environment Variables for Baby Petite
# Set these in Railway dashboard: https://railway.com/project/b8fb43e5-34eb-4da7-85bf-4cb94a7c5bff/variables

# ===========================================
# Database (provided by Railway PostgreSQL add-on)
# ===========================================
DATABASE_URL=postgresql://...  # Auto-filled by Railway

# ===========================================
# Sanity CMS
# ===========================================
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
SANITY_API_TOKEN=your_sanity_api_token
SANITY_DATASET=production

# ===========================================
# Stripe Payments (Production)
# ===========================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===========================================
# Algolia Search
# ===========================================
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_key
ALGOLIA_ADMIN_KEY=your_admin_key

# ===========================================
# SendGrid / Resend Email
# ===========================================
# Choose one (Resend recommended for simplicity)
RESEND_API_KEY=re_...
SENDGRID_API_KEY=SG....
EMAIL_FROM=noreply@babypetite.com
EMAIL_FROM_NAME=Baby Petite
SUPPORT_EMAIL=support@babypetite.com

# ===========================================
# NextAuth.js
# ===========================================
NEXTAUTH_SECRET=generate_a_32+_character_random_string_here
NEXTAUTH_URL=https://babypetite.com

# ===========================================
# OpenAI (for Registry AI predictions)
# ===========================================
OPENAI_API_KEY=sk-...

# ===========================================
# Cloudflare CDN (optional for API cache purge)
# ===========================================
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token

# ===========================================
# Google Analytics 4
# ===========================================
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...

# ===========================================
# Google Maps (for address autocomplete)
# ===========================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# ===========================================
# App Settings
# ===========================================
NEXT_PUBLIC_BASE_URL=https://babypetite.com
NODE_ENV=production
