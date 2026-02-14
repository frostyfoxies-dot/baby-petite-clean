# Stripe Webhook Registration Guide

## Goal

Register your production webhook endpoint so Stripe sends events to your Railway app.

**Webhook URL:**
```
https://babypetite.up.railway.app/api/webhooks/stripe
```

## Method 1: Using Stripe Dashboard (Easiest)

1. Login to https://dashboard.stripe.com
2. Navigate to **Developers** → **Webhooks**
3. Click **"Add endpoint"**
4. Paste the URL above
5. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
6. Click **"Add endpoint"**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to Railway env: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Method 2: Using Stripe CLI (Local Development)

For local testing, use Stripe CLI to forward webhooks to your dev server:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward events to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

This helps you test webhook handling before deploying.

---

## Verify Webhook

After registration, test:

```bash
curl -X POST https://babypetite.up.railway.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"test"}}}'
```

Should return `{ "received": true }` (signature verification may fail without proper signature; use test webhook secret in Stripe dashboard → "Send test webhook").

---

## Important Notes

- **Do not** share your webhook secret publicly.
- In production, ensure your endpoint is HTTPS (Railway provides automatic SSL).
- If you change your Railway domain, you must re-register the webhook URL.

---

That's it. Once `STRIPE_WEBHOOK_SECRET` is set, your webhook will be fully operational.
