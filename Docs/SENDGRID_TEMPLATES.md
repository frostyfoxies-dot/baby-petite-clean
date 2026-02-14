# SendGrid Email Templates Specification

## Overview

Kids Petite uses SendGrid for all transactional emails. Templates are dynamic and must be created in the SendGrid UI with the following designs and variables.

**Sender:** `noreply@babypetite.com` (needs domain verification)

---

## 1. Order Confirmation Template

**Template Name:** `order_confirmation`  
**Subject:** `Your Kids Petite Order #{order_number} is Confirmed!`

**Purpose:** Sent immediately after payment succeeds.

**Variables (substitution tags):**
```
{{order_number}}
{{customer_name}} (default to first name from shipping address)
{{order_date}} (formatted: February 13, 2026)
{{items}} (HTML list of products with variant, quantity, unit_price, total_price)
{{subtotal}} (formatted currency)
{{shipping}} (formatted)
{{tax}} (formatted)
{{total}} (formatted)
{{shipping_address}} (multi-line HTML)
{{billing_address}} (multi-line HTML)
{{shipping_method}} (e.g., "Standard Shipping (5-7 business days)")
{{tracking_number}} (empty at first, will be added later via dynamic template if shipping later)
{{tracking_url}}
{{company_name}} Kids Petite
{{support_email}} support@babypetite.com
{{website_url}} https://babypetite.up.railway.app
```

**Design:**
- Header: Kids Petite logo (linked to homepage)
- Hero: "Thank you for your order!" in warm yellow
- Order summary table
- Shipping address block
- Billing address block (if different)
- Footer: contact info, social links, unsubscribe (mandatory)

---

## 2. Shipping Update Template

**Template Name:** `shipping_update`  
**Subject:** `Your Kids Petite Order #{order_number} is on its way!`

**Purpose:** Sent when order status changes to SHIPPED.

**Variables:**
```
{{order_number}}
{{customer_name}}
{{shipping_carrier}} (e.g., "USPS", "FedEx", "DHL")
{{tracking_number}}
{{tracking_url}} (full tracking link)
{{estimated_delivery}} (e.g., "February 18-20, 2026")
{{items}} (list of items in shipment – may be partial)
{{support_email}}
```

**Design:**
- "Your order is shipped!" heading
- Tracking button linking to carrier tracking page
- Items in this shipment (if partial fulfillment)
- Delivery estimate

---

## 3. Registry Invitation Template

**Template Name:** `registry_invite`  
**Subject:** `{{inviter_name}} has created a Baby Registry on Kids Petite`

**Purpose:** Email sent to friends/family when a user shares their baby registry.

**Variables:**
```
{{inviter_name}} (e.g., "Sarah & John")
{{registry_name}} (e.g., "Emma's First Year")
{{registry_url}} (link to public registry page)
{{event_date}} (baby's due date or birthday)
{{message}} (optional personal message from inviter)
{{babypetite_logo_url}}
```

**Design:**
- Personalized header with inviter names
- "View My Registry" CTA button (yellow)
- Event details (date)
- Optional message in italic
- Footer: explain what a registry is, link to create own

---

## 4. Password Reset Template

**Template Name:** `password_reset`  
**Subject:** `Reset your Kids Petite password`

**Variables:**
```
{{reset_url}} (signed token link from NextAuth)
{{expires_in}} (e.g., "This link expires in 1 hour")
{{support_email}}
```

**Design:** Standard NextAuth reset template (copy from docs, customize colors)

---

## 5. Email Verification Template

**Template Name:** `email_verification`  
**Subject:** `Verify your email address for Kids Petite`

**Variables:**
```
{{verify_url}} (signed token link)
{{expires_in}}
```

---

## 6. Order Cancellation Template

**Template Name:** `order_cancelled`  
**Subject:** `Your Kids Petite Order #{order_number} has been cancelled`

**Variables:**
```
{{order_number}}
{{cancellation_reason}} (e.g., "payment failed", "requested by customer")
{{refund_amount}} (if any)
{{support_email}}
```

---

## 7. Refund Processed Template

**Template Name:** `refund_processed`  
**Subject:** `Refund for Order #{order_number} has been processed`

**Variables:**
```
{{order_number}}
{{refund_amount}}
{{refund_reason}} (e.g., "return", "cancellation")
{{restock_message}} (e.g., "The item is eligible for exchange within 30 days.")
```

---

## Implementation Notes

### Setting Up Templates in SendGrid

1. Login to SendGrid → Email API → Dynamic Templates
2. Create new template for each above
3. Add version (drag-drop editor or code)
4. Publish template
5. Copy Template ID (e.g., `d-12345678901234567890123456789012`)
6. Add to `.env.production` as:
   ```
   SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-...
   SENDGRID_TEMPLATE_SHIPPING_UPDATE=d-...
   SENDGRID_TEMPLATE_REGISTRY_INVITE=d-...
   SENDGRID_TEMPLATE_PASSWORD_RESET=d-...
   SENDGRID_TEMPLATE_EMAIL_VERIFICATION=d-...
   SENDGRID_TEMPLATE_ORDER_CANCELLED=d-...
   SENDGRID_TEMPLATE_REFUND_PROCESSED=d-...
   ```

### Code Integration

In `src/lib/email.ts` (to be created), use:

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendOrderConfirmation(order: Order) {
  const msg: MailDataRequired = {
    to: order.customerEmail,
    from: 'noreply@babypetite.com',
    templateId: process.env.SENDGRID_TEMPLATE_ORDER_CONFIRMATION,
    dynamic_template_data: {
      order_number: order.orderNumber,
      // ... other variables
    },
  };
  await sgMail.send(msg);
}
```

### Transactional Email Best Practices

- **Send from same domain** as website for SPF/DKIM alignment
- **Include List-Unsubscribe header** (even for transactional – required by some providers)
- **Add proper Message-ID** (auto by SendGrid)
- **Monitor reputation** in SendGrid dashboard (avoid spam folder)
- **Rate limit:** We won't hit limits; <1000 emails/day at this stage

---

## Environment Variables Reference

```bash
# Required
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@babypetite.com

# Template IDs (all required)
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-...
SENDGRID_TEMPLATE_SHIPPING_UPDATE=d-...
SENDGRID_TEMPLATE_REGISTRY_INVITE=d-...
SENDGRID_TEMPLATE_PASSWORD_RESET=d-...
SENDGRID_TEMPLATE_EMAIL_VERIFICATION=d-...
SENDGRID_TEMPLATE_ORDER_CANCELLED=d-...
SENDGRID_TEMPLATE_REFUND_PROCESSED=d-...
```

---

**Owner:** CEO  
**Last Updated:** 2026-02-14 16:00 MYT  
**Status:** Pre-launch – awaiting template creation
