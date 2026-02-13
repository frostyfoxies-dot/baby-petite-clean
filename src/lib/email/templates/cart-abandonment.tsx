/**
 * Cart Abandonment Email Template
 *
 * React Email template for the 3-email cart abandonment sequence:
 * - Email 1 (1 hour): Friendly reminder
 * - Email 2 (24 hours): Social proof and encouragement
 * - Email 3 (72 hours): Final reminder with discount
 */

import * as React from 'react';
import {
  EmailLayout,
  EmailContainer,
  EmailHeader,
  EmailSection,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailFooter,
  ProductList,
  OrderSummary,
  Divider,
  Spacer,
  DiscountBadge,
  SocialProof,
  brandColors,
} from './components';
import { emailConfig } from '../config';

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem {
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
  productUrl?: string;
}

export interface CartAbandonmentEmailProps {
  emailNumber: 1 | 2 | 3;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  cartUrl: string;
  discountCode?: string;
  discountPercent?: number;
  reviews?: Array<{
    author: string;
    rating: number;
    text: string;
  }>;
}

// ============================================================================
// EMAIL CONTENT CONFIGURATION
// ============================================================================

interface EmailContent {
  preview: string;
  greeting: string;
  heading: string;
  body: string[];
  ctaText: string;
  showSocialProof: boolean;
  showDiscount: boolean;
}

function getEmailContent(
  emailNumber: 1 | 2 | 3,
  customerName?: string
): EmailContent {
  const name = customerName || 'there';

  switch (emailNumber) {
    case 1:
      return {
        preview: 'You left something behind... Complete your purchase today!',
        greeting: `Hi ${name}!`,
        heading: 'You left something behind...',
        body: [
          'We noticed you added some adorable items to your cart but didn\'t complete your purchase.',
          'Don\'t worry – we saved everything for you! Your items are still in your cart, waiting for you.',
        ],
        ctaText: 'Complete Your Purchase',
        showSocialProof: false,
        showDiscount: false,
      };
    case 2:
      return {
        preview: 'Still thinking about it? Your cart is waiting for you.',
        greeting: `Hi ${name}!`,
        heading: 'Still thinking about it?',
        body: [
          'Your cart is still saved and waiting for you. We know choosing the perfect items for your little one takes time!',
          'Here\'s what other parents are saying about our products:',
        ],
        ctaText: 'Return to Your Cart',
        showSocialProof: true,
        showDiscount: false,
      };
    case 3:
      return {
        preview: 'Last chance! Your cart is expiring soon. Use your special discount.',
        greeting: `Hi ${name}!`,
        heading: 'Last chance: Your cart is waiting',
        body: [
          'This is your final reminder! Your saved items are waiting, but they won\'t be held forever.',
          'We\'d love for you to complete your purchase. As a special thank you, here\'s a discount just for you:',
        ],
        ctaText: 'Claim Your Discount',
        showSocialProof: false,
        showDiscount: true,
      };
  }
}

// Default reviews for social proof
const defaultReviews = [
  {
    author: 'Sarah M.',
    rating: 5,
    text: 'The quality is amazing! My daughter loves her new dress. Will definitely order again.',
  },
  {
    author: 'James T.',
    rating: 5,
    text: 'Fast shipping and the clothes are so soft. Perfect for my newborn!',
  },
  {
    author: 'Emily R.',
    rating: 5,
    text: 'Finally found a brand that understands kids\' clothes. Great fit and adorable designs!',
  },
];

// ============================================================================
// EMAIL TEMPLATE COMPONENT
// ============================================================================

export function CartAbandonmentEmail({
  emailNumber,
  customerName,
  items,
  subtotal,
  cartUrl,
  discountCode,
  discountPercent,
  reviews = defaultReviews,
}: CartAbandonmentEmailProps) {
  const content = getEmailContent(emailNumber, customerName);

  // Calculate shipping (free over $100)
  const shipping = subtotal >= 100 ? 0 : 9.99;

  // Calculate estimated tax (8%)
  const tax = subtotal * 0.08;

  // Calculate total
  let total = subtotal + shipping + tax;
  let discount = 0;

  // Apply discount if provided (for email 3)
  if (discountPercent && discountCode) {
    discount = subtotal * (discountPercent / 100);
    total = subtotal - discount + shipping + tax;
  }

  // Generate unsubscribe URL
  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(
    customerName || ''
  )}&type=cart-abandonment`;

  return (
    <EmailLayout preview={content.preview}>
      <EmailContainer>
        <EmailHeader />

        <EmailSection padding="32px 40px">
          {/* Greeting */}
          <EmailText align="center" size="lg">
            {content.greeting}
          </EmailText>

          {/* Heading */}
          <EmailHeading>{content.heading}</EmailHeading>

          {/* Body paragraphs */}
          {content.body.map((paragraph, index) => (
            <EmailText key={index} align="center">
              {paragraph}
            </EmailText>
          ))}

          <Spacer height={16} />

          {/* Discount badge for email 3 */}
          {content.showDiscount && discountCode && discountPercent && (
            <>
              <DiscountBadge
                code={discountCode}
                discount={`${discountPercent}%`}
              />
              <Spacer height={16} />
            </>
          )}

          {/* CTA Button */}
          <Section style={{ textAlign: 'center' }}>
            <EmailButton href={cartUrl} fullWidth>
              {content.ctaText}
            </EmailButton>
          </Section>
        </EmailSection>

        <Divider />

        {/* Cart Items */}
        <EmailSection padding="0 40px 24px 40px">
          <EmailHeading level={2} align="left">
            Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </EmailHeading>

          <ProductList products={items} />

          {/* Order Summary */}
          <OrderSummary
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            discount={discount > 0 ? discount : undefined}
            discountCode={discount > 0 ? discountCode : undefined}
            total={total}
          />
        </EmailSection>

        {/* Social Proof for email 2 */}
        {content.showSocialProof && (
          <>
            <Divider />
            <EmailSection padding="0 40px 24px 40px">
              <SocialProof reviews={reviews} />
            </EmailSection>
          </>
        )}

        <Divider />

        {/* Help Section */}
        <EmailSection padding="24px 40px" backgroundColor={brandColors.background}>
          <EmailText align="center" color={brandColors.textLight} size="sm">
            Have questions? We're here to help!{' '}
            <a
              href={`mailto:${emailConfig.supportEmail}`}
              style={{ color: brandColors.primary, textDecoration: 'underline' }}
            >
              Contact our support team
            </a>
          </EmailText>
        </EmailSection>

        <EmailFooter unsubscribeUrl={unsubscribeUrl} />
      </EmailContainer>
    </EmailLayout>
  );
}

// ============================================================================
// CONVENIENCE EXPORTS FOR EACH EMAIL
// ============================================================================

/**
 * Email 1: Initial reminder (1 hour after abandonment)
 */
export function CartAbandonmentEmail1(
  props: Omit<CartAbandonmentEmailProps, 'emailNumber'>
) {
  return <CartAbandonmentEmail {...props} emailNumber={1} />;
}

/**
 * Email 2: Follow-up with social proof (24 hours after abandonment)
 */
export function CartAbandonmentEmail2(
  props: Omit<CartAbandonmentEmailProps, 'emailNumber'>
) {
  return <CartAbandonmentEmail {...props} emailNumber={2} />;
}

/**
 * Email 3: Final reminder with discount (72 hours after abandonment)
 */
export function CartAbandonmentEmail3(
  props: Omit<CartAbandonmentEmailProps, 'emailNumber'>
) {
  return <CartAbandonmentEmail {...props} emailNumber={3} />;
}

// ============================================================================
// TEXT VERSION GENERATOR
// ============================================================================

/**
 * Generate plain text version of the email
 */
export function generateCartAbandonmentText(
  props: CartAbandonmentEmailProps
): string {
  const content = getEmailContent(props.emailNumber, props.customerName);
  const name = props.customerName || 'there';

  const lines: string[] = [
    content.greeting,
    '',
    content.heading,
    '',
    ...content.body,
    '',
  ];

  if (content.showDiscount && props.discountCode && props.discountPercent) {
    lines.push(`Use code: ${props.discountCode}`);
    lines.push(`For ${props.discountPercent}% off your order`);
    lines.push('');
  }

  lines.push(`${content.ctaText}: ${props.cartUrl}`);
  lines.push('');
  lines.push('YOUR CART:');
  lines.push('');

  props.items.forEach((item) => {
    const price = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(item.price);
    lines.push(`- ${item.name}${item.variant ? ` (${item.variant})` : ''}`);
    lines.push(`  Qty: ${item.quantity} | Price: ${price}`);
    if (item.productUrl) {
      lines.push(`  View: ${item.productUrl}`);
    }
    lines.push('');
  });

  const subtotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(props.subtotal);

  lines.push(`Subtotal: ${subtotal}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('Kids Petite — Quality clothing for your little ones');
  lines.push(`Support: ${emailConfig.supportEmail}`);
  lines.push('');
  lines.push(`Unsubscribe: ${emailConfig.baseUrl}/api/email/unsubscribe`);

  return lines.join('\n');
}

export default CartAbandonmentEmail;
