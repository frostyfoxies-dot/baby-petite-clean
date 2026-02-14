# Resend Email Setup Guide (Free Tier)

## Why Resend?

- **Free tier:** 3,000 emails/month, no credit card required
- **Simple API:** Compatible with SendGrid syntax (our abstraction layer supports both)
- **Deliverability:** Excellent for transactional emails
- **Domain-friendly:** Can use Railway subdomain or custom domain

---

## Step 1: Create Resend Account

1. Go to https://resend.com
2. Click **"Sign up"** (use GitHub or email)
3. Verify email

---

## Step 2: Get API Key

1. In dashboard, click **"API Keys"** in sidebar
2. Click **"Create API Key"**
3. Name: `Baby Petite Production`
4. Copy the key (starts with `re_`)

Add to Railway environment variables:

```
RESEND_API_KEY=
```

---

## Step 3: Verify Sender Domain (Optional but Recommended)

### Option A: Use Railway subdomain (quick start)

For testing, you can send from Resend's default domain:

```
From: noreply@resend.dev
```

But emails may land in spam. For production, verify your own domain.

### Option B: Verify custom domain (recommended)

1. In Resend, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter `babypetite.com` (or your domain)
4. Resend provides DNS records to add to Cloudflare:
   - MX records (for inbound, optional)
   - TXT records (SPF, DKIM)
   - CNAME for tracking (optional)
5. Add these records in Cloudflare DNS
6. Wait 10–30 minutes for propagation
7. Resend shows "Verified"

Once verified, update:

```
EMAIL_FROM=noreply@babypetite.com
```

---

## Step 4: Test Email

Use the Railway console to send a test:

```bash
# Connect to Railway console
railway run bash

# Run a Node script
cat > test-email.ts << 'EOF'
import { sendEmail } from '@/lib/email/service';

await sendEmail({
  to: 'your-personal-email@gmail.com',
  subject: 'Test from Baby Petite',
  html: '<h1>It works!</h1><p>Resend is configured.</p>',
});
EOF

npx tsx test-email.ts
```

Or use the built-in email verification flow by signing up on your site.

---

## Step 5: Template Migration (Optional)

Currently, our code calls `sendEmail` with HTML strings. If you want to use Resend's **dynamic templates** (recommended for better tracking and editing), you can:

1. Create templates in Resend UI
2. Add template IDs to Railway env:

```
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-... (not used with Resend)
# Instead, create custom logic or use Resend's template system directly
```

Our abstraction layer (`src/lib/email/service.ts`) already uses Resend when `RESEND_API_KEY` is present. The templates we created as React components can be rendered to HTML and passed to `sendEmail`.

---

## Step 6: Monitor Deliverability

In Resend dashboard:
- Check **"Emails"** for delivery status
- Watch bounce rates (< 2% is acceptable)
- If spam rate rises, check domain authentication

---

## Environment Variables Summary

Add to Railway:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | ` |
| `EMAIL_FROM` | `noreply@babypetite.com` (or your verified sender) |
| `EMAIL_FROM_NAME` | `Baby Petite` |

That's it. Resend will handle the rest.

---

**Next:** After Resend is working, test the full order confirmation flow by placing a test order (use Stripe test card `4242 4242 4242 4242`).
