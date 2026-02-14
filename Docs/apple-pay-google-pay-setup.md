# Apple Pay & Google Pay Setup Guide

This document provides step-by-step instructions for enabling Apple Pay and Google Pay payment methods in the Baby Petite e-commerce platform.

## Overview

Apple Pay and Google Pay are enabled through Stripe's Payment Request Button, which provides a browser-native payment experience. The implementation supports:

- **Apple Pay**: Available on Safari (macOS, iOS) and supported browsers
- **Google Pay**: Available on Chrome (desktop, Android) and supported browsers

## Prerequisites

- Stripe account with Apple Pay and Google Pay enabled
- HTTPS-enabled domain (required for both Apple Pay and Google Pay)
- Apple Developer account (for Apple Pay only)

## Stripe Configuration

### 1. Enable Payment Methods in Stripe Dashboard

1. Navigate to [Stripe Dashboard → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Enable **Apple Pay** and **Google Pay**
3. Configure any additional settings as needed

### 2. Apple Pay Domain Verification

Apple Pay requires domain verification to ensure only authorized domains can process payments.

#### Step 1: Download Verification File

1. In Stripe Dashboard, go to Settings → Payment methods → Apple Pay
2. Click "Add domain"
3. Download the `apple-developer-merchantid-domain-association` file

#### Step 2: Host the Verification File

Place the file at:
```
public/.well-known/apple-developer-merchantid-domain-association
```

The file must be accessible at:
```
https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
```

#### Step 3: Verify Domain

1. Deploy the file to your production server
2. Return to Stripe Dashboard and click "Verify"
3. Stripe will confirm the file is accessible and verify your domain

### 3. Google Pay Configuration

Google Pay works automatically with Stripe without additional domain verification. However, you should:

1. Review Google Pay's [acceptable use policy](https://pay.google.com/intl/en_us/about/policies/)
2. Ensure your business complies with Google Pay's requirements

## Environment Variables

Add the following optional environment variables to your `.env.local`:

```bash
# Apple Pay Configuration (Optional)
APPLE_PAY_MERCHANT_IDENTIFIER=merchant.com.yourdomain

# Google Pay Configuration (Optional)
GOOGLE_PAY_MERCHANT_ID=your_merchant_id
GOOGLE_PAY_MERCHANT_NAME=Baby Petite
```

## Implementation Details

### Files Modified

1. **`src/actions/checkout.ts`**
   - Updated `createCheckoutSession` to include `apple_pay` and `google_pay` in `payment_method_types`

2. **`src/components/payment/payment-request-button.tsx`**
   - New component for rendering Apple Pay/Google Pay button
   - Uses Stripe's Payment Request Button Element
   - Handles payment authorization flow

3. **`src/app/checkout/payment/page.tsx`**
   - Integrated Payment Request Button
   - Shows Apple Pay/Google Pay when available
   - Falls back to card payment form

4. **`public/.well-known/apple-developer-merchantid-domain-association`**
   - Placeholder file for Apple Pay domain verification
   - Replace with actual file from Stripe Dashboard

### Payment Flow

1. User proceeds to checkout payment page
2. Payment Request Button checks browser/device support
3. If supported, Apple Pay or Google Pay button is displayed
4. User clicks button and completes payment via native UI
5. Payment is processed through Stripe
6. User is redirected to success page

### Fallback Behavior

If Apple Pay or Google Pay is not available:
- The Payment Request Button is hidden
- Card payment form is displayed as the primary payment method
- User can still complete checkout with credit/debit card

## Testing

### Local Development

Apple Pay requires HTTPS and won't work on localhost. For local testing:

1. **Use ngrok or similar tunneling service:**
   ```bash
   ngrok http 3000
   ```
   Then use the HTTPS URL provided by ngrok.

2. **Test on a staging environment** with proper HTTPS.

### Testing Apple Pay

1. Use a Safari browser on macOS or iOS
2. Ensure you have a card added to Apple Wallet
3. Complete a test transaction

### Testing Google Pay

1. Use a Chrome browser
2. Ensure you have Google Pay set up with a payment method
3. Complete a test transaction

### Stripe Test Mode

In Stripe test mode:
- Use test card numbers provided by Stripe
- Apple Pay and Google Pay will work with test cards added to your wallet

## Troubleshooting

### Apple Pay Not Showing

1. **Domain not verified**: Check Stripe Dashboard for verification status
2. **HTTPS required**: Ensure your site is served over HTTPS
3. **Browser not supported**: Apple Pay only works on Safari and supported browsers
4. **No card in wallet**: User must have a card added to Apple Wallet

### Google Pay Not Showing

1. **Browser not supported**: Google Pay works best on Chrome
2. **Region not supported**: Check if Google Pay is available in your region
3. **No payment method**: User must have Google Pay set up

### Payment Fails

1. Check Stripe Dashboard for error details
2. Verify webhook endpoints are configured correctly
3. Ensure payment intent creation is successful

## Security Considerations

- All payment data is handled by Stripe; no sensitive data touches your servers
- Apple Pay and Google Pay use tokenization for enhanced security
- Domain verification prevents unauthorized use of your Apple Pay credentials

## Resources

- [Stripe Apple Pay Documentation](https://stripe.com/docs/apple-pay)
- [Stripe Google Pay Documentation](https://stripe.com/docs/google-pay)
- [Stripe Payment Request Button](https://stripe.com/docs/stripe-js/elements/payment-request-button)
- [Apple Pay on the Web](https://developer.apple.com/apple-pay/web/)
- [Google Pay API](https://developers.google.com/pay/api/web/overview)

## Support

For issues with:
- **Stripe integration**: Contact Stripe Support
- **Apple Pay**: Contact Apple Developer Support
- **Google Pay**: Contact Google Pay Support
- **Implementation**: Refer to this documentation or the code comments
