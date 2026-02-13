/**
 * Reusable Email Components
 *
 * A collection of reusable React Email components for building email templates.
 * These components follow mobile-first responsive design principles.
 */

import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
  Heading,
} from '@react-email/components';
import * as React from 'react';

// ============================================================================
// BRAND STYLING
// ============================================================================

const brandColors = {
  primary: '#E91E63', // Pink/Magenta brand color
  primaryDark: '#C2185B',
  secondary: '#4A5568',
  accent: '#FF6B9D',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1A202C',
  textLight: '#718096',
  border: '#E2E8F0',
  success: '#48BB78',
  warning: '#ED8936',
} as const;

const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  serif: "'Georgia', serif",
} as const;

// ============================================================================
// BASE LAYOUT COMPONENTS
// ============================================================================

export interface EmailLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

/**
 * Base email layout wrapper with consistent styling
 */
export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: ${fontFamily.sans};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          img {
            border: 0;
            outline: none;
            text-decoration: none;
            display: block;
          }
          a {
            text-decoration: none;
            color: inherit;
          }
        `}</style>
      </Head>
      <Preview>{preview || 'Kids Petite'}</Preview>
      <Body
        style={{
          backgroundColor: brandColors.background,
          fontFamily: fontFamily.sans,
          margin: 0,
          padding: '20px 0',
        }}
      >
        {children}
      </Body>
    </Html>
  );
}

export interface EmailContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

/**
 * Centered container for email content
 */
export function EmailContainer({ children, maxWidth = 600 }: EmailContainerProps) {
  return (
    <Container
      style={{
        backgroundColor: brandColors.surface,
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        margin: '0 auto',
        maxWidth: `${maxWidth}px`,
        overflow: 'hidden',
      }}
    >
      {children}
    </Container>
  );
}

// ============================================================================
// HEADER COMPONENTS
// ============================================================================

export interface EmailHeaderProps {
  logoUrl?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
}

/**
 * Email header with brand logo
 */
export function EmailHeader({
  logoUrl = 'https://kidspetite.com/logo.png',
  logoAlt = 'Kids Petite',
  logoWidth = 150,
  logoHeight = 40,
}: EmailHeaderProps) {
  return (
    <Section
      style={{
        backgroundColor: brandColors.surface,
        padding: '24px 32px',
        textAlign: 'center',
        borderBottom: `1px solid ${brandColors.border}`,
      }}
    >
      <Img
        src={logoUrl}
        alt={logoAlt}
        width={logoWidth}
        height={logoHeight}
        style={{
          margin: '0 auto',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </Section>
  );
}

// ============================================================================
// CONTENT COMPONENTS
// ============================================================================

export interface EmailSectionProps {
  children: React.ReactNode;
  backgroundColor?: string;
  padding?: string;
}

/**
 * Generic email section
 */
export function EmailSection({
  children,
  backgroundColor = brandColors.surface,
  padding = '32px',
}: EmailSectionProps) {
  return (
    <Section
      style={{
        backgroundColor,
        padding,
      }}
    >
      {children}
    </Section>
  );
}

export interface EmailHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

/**
 * Email heading with consistent styling
 */
export function EmailHeading({
  children,
  level = 1,
  align = 'center',
  color = brandColors.text,
}: EmailHeadingProps) {
  const sizes = {
    1: '28px',
    2: '24px',
    3: '20px',
  };

  return (
    <Heading
      as={`h${level}`}
      style={{
        color,
        fontSize: sizes[level],
        fontWeight: 600,
        lineHeight: 1.3,
        margin: '0 0 16px 0',
        textAlign: align,
      }}
    >
      {children}
    </Heading>
  );
}

export interface EmailTextProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Email paragraph text
 */
export function EmailText({
  children,
  align = 'left',
  color = brandColors.text,
  size = 'md',
}: EmailTextProps) {
  const sizes = {
    sm: '14px',
    md: '16px',
    lg: '18px',
  };

  return (
    <Text
      style={{
        color,
        fontSize: sizes[size],
        lineHeight: 1.6,
        margin: '0 0 16px 0',
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

export interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

/**
 * CTA button with brand styling
 */
export function EmailButton({
  href,
  children,
  variant = 'primary',
  fullWidth = false,
}: EmailButtonProps) {
  const variants = {
    primary: {
      backgroundColor: brandColors.primary,
      color: '#FFFFFF',
      border: `2px solid ${brandColors.primary}`,
    },
    secondary: {
      backgroundColor: brandColors.secondary,
      color: '#FFFFFF',
      border: `2px solid ${brandColors.secondary}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: brandColors.primary,
      border: `2px solid ${brandColors.primary}`,
    },
  };

  const styles = variants[variant];

  return (
    <Button
      href={href}
      style={{
        backgroundColor: styles.backgroundColor,
        border: styles.border,
        borderRadius: '8px',
        color: styles.color,
        display: 'inline-block',
        fontSize: '16px',
        fontWeight: 600,
        padding: '14px 32px',
        textAlign: 'center',
        textDecoration: 'none',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {children}
    </Button>
  );
}

// ============================================================================
// PRODUCT COMPONENTS
// ============================================================================

export interface ProductItemProps {
  name: string;
  image: string;
  price: number;
  quantity?: number;
  variant?: string;
  productUrl?: string;
}

/**
 * Product item display for cart/order emails
 */
export function ProductItem({
  name,
  image,
  price,
  quantity,
  variant,
  productUrl,
}: ProductItemProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);

  const content = (
    <Row
      style={{
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: `1px solid ${brandColors.border}`,
      }}
    >
      <Column
        style={{
          paddingRight: '16px',
          verticalAlign: 'middle',
          width: '80px',
        }}
      >
        <Img
          src={image}
          alt={name}
          width={80}
          height={80}
          style={{
            borderRadius: '8px',
            objectFit: 'cover',
          }}
        />
      </Column>
      <Column style={{ verticalAlign: 'middle' }}>
        <Text
          style={{
            color: brandColors.text,
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          {name}
        </Text>
        {variant && (
          <Text
            style={{
              color: brandColors.textLight,
              fontSize: '14px',
              margin: '0 0 4px 0',
            }}
          >
            {variant}
          </Text>
        )}
        {quantity && (
          <Text
            style={{
              color: brandColors.textLight,
              fontSize: '14px',
              margin: '0 0 4px 0',
            }}
          >
            Qty: {quantity}
          </Text>
        )}
      </Column>
      <Column
        style={{
          textAlign: 'right',
          verticalAlign: 'middle',
          width: '100px',
        }}
      >
        <Text
          style={{
            color: brandColors.text,
            fontSize: '16px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {formattedPrice}
        </Text>
      </Column>
    </Row>
  );

  if (productUrl) {
    return (
      <Link href={productUrl} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}

export interface ProductListProps {
  products: Array<{
    name: string;
    image: string;
    price: number;
    quantity?: number;
    variant?: string;
    productUrl?: string;
  }>;
}

/**
 * List of product items
 */
export function ProductList({ products }: ProductListProps) {
  return (
    <Section>
      {products.map((product, index) => (
        <ProductItem key={index} {...product} />
      ))}
    </Section>
  );
}

// ============================================================================
// SUMMARY COMPONENTS
// ============================================================================

export interface OrderSummaryProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  discountCode?: string;
  total: number;
}

/**
 * Order/cart summary with pricing breakdown
 */
export function OrderSummary({
  subtotal,
  shipping,
  tax,
  discount,
  discountCode,
  total,
}: OrderSummaryProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

  return (
    <Section
      style={{
        backgroundColor: brandColors.background,
        borderRadius: '8px',
        padding: '20px',
        marginTop: '16px',
      }}
    >
      <Row style={{ marginBottom: '8px' }}>
        <Column>
          <Text style={{ color: brandColors.textLight, fontSize: '14px', margin: 0 }}>
            Subtotal
          </Text>
        </Column>
        <Column style={{ textAlign: 'right' }}>
          <Text style={{ color: brandColors.text, fontSize: '14px', margin: 0 }}>
            {formatPrice(subtotal)}
          </Text>
        </Column>
      </Row>

      {shipping !== undefined && (
        <Row style={{ marginBottom: '8px' }}>
          <Column>
            <Text style={{ color: brandColors.textLight, fontSize: '14px', margin: 0 }}>
              Shipping
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ color: brandColors.text, fontSize: '14px', margin: 0 }}>
              {shipping === 0 ? 'FREE' : formatPrice(shipping)}
            </Text>
          </Column>
        </Row>
      )}

      {tax !== undefined && (
        <Row style={{ marginBottom: '8px' }}>
          <Column>
            <Text style={{ color: brandColors.textLight, fontSize: '14px', margin: 0 }}>
              Tax
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ color: brandColors.text, fontSize: '14px', margin: 0 }}>
              {formatPrice(tax)}
            </Text>
          </Column>
        </Row>
      )}

      {discount !== undefined && discount > 0 && (
        <Row style={{ marginBottom: '8px' }}>
          <Column>
            <Text style={{ color: brandColors.success, fontSize: '14px', margin: 0 }}>
              Discount {discountCode && `(${discountCode})`}
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ color: brandColors.success, fontSize: '14px', margin: 0 }}>
              -{formatPrice(discount)}
            </Text>
          </Column>
        </Row>
      )}

      <Hr style={{ borderColor: brandColors.border, margin: '12px 0' }} />

      <Row>
        <Column>
          <Text style={{ color: brandColors.text, fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Total
          </Text>
        </Column>
        <Column style={{ textAlign: 'right' }}>
          <Text style={{ color: brandColors.text, fontSize: '16px', fontWeight: 600, margin: 0 }}>
            {formatPrice(total)}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

// ============================================================================
// FOOTER COMPONENTS
// ============================================================================

export interface EmailFooterProps {
  unsubscribeUrl?: string;
  showSocial?: boolean;
  year?: number;
}

/**
 * Email footer with unsubscribe link and social links
 */
export function EmailFooter({
  unsubscribeUrl,
  showSocial = true,
  year = new Date().getFullYear(),
}: EmailFooterProps) {
  return (
    <Section
      style={{
        backgroundColor: brandColors.background,
        padding: '24px 32px',
        textAlign: 'center',
      }}
    >
      <Text
        style={{
          color: brandColors.textLight,
          fontSize: '14px',
          margin: '0 0 16px 0',
        }}
      >
        Kids Petite — Quality clothing for your little ones
      </Text>

      {showSocial && (
        <Section style={{ marginBottom: '16px' }}>
          <Link
            href="https://facebook.com/kidspetite"
            style={{ margin: '0 8px', display: 'inline-block' }}
          >
            <Img
              src="https://kidspetite.com/icons/facebook.png"
              alt="Facebook"
              width={24}
              height={24}
            />
          </Link>
          <Link
            href="https://instagram.com/kidspetite"
            style={{ margin: '0 8px', display: 'inline-block' }}
          >
            <Img
              src="https://kidspetite.com/icons/instagram.png"
              alt="Instagram"
              width={24}
              height={24}
            />
          </Link>
          <Link
            href="https://pinterest.com/kidspetite"
            style={{ margin: '0 8px', display: 'inline-block' }}
          >
            <Img
              src="https://kidspetite.com/icons/pinterest.png"
              alt="Pinterest"
              width={24}
              height={24}
            />
          </Link>
        </Section>
      )}

      <Text
        style={{
          color: brandColors.textLight,
          fontSize: '12px',
          margin: '0 0 8px 0',
        }}
      >
        © {year} Kids Petite. All rights reserved.
      </Text>

      <Text
        style={{
          color: brandColors.textLight,
          fontSize: '12px',
          margin: '0 0 8px 0',
        }}
      >
        123 Baby Street, Children's City, CC 12345
      </Text>

      {unsubscribeUrl && (
        <Text
          style={{
            color: brandColors.textLight,
            fontSize: '12px',
            margin: 0,
          }}
        >
          <Link
            href={unsubscribeUrl}
            style={{
              color: brandColors.textLight,
              textDecoration: 'underline',
            }}
          >
            Unsubscribe from these emails
          </Link>{' '}
          ·{' '}
          <Link
            href="https://kidspetite.com/privacy"
            style={{
              color: brandColors.textLight,
              textDecoration: 'underline',
            }}
          >
            Privacy Policy
          </Link>
        </Text>
      )}
    </Section>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Horizontal divider
 */
export function Divider({ color = brandColors.border }: { color?: string }) {
  return (
    <Hr
      style={{
        borderColor: color,
        margin: '24px 0',
      }}
    />
  );
}

/**
 * Spacer component for vertical spacing
 */
export function Spacer({ height = 16 }: { height?: number }) {
  return (
    <Section
      style={{
        height: `${height}px`,
        lineHeight: `${height}px`,
      }}
    >
      &nbsp;
    </Section>
  );
}

/**
 * Discount code badge
 */
export function DiscountBadge({
  code,
  discount,
}: {
  code: string;
  discount: string;
}) {
  return (
    <Section
      style={{
        backgroundColor: '#FFF5F7',
        border: `2px dashed ${brandColors.primary}`,
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
      }}
    >
      <Text
        style={{
          color: brandColors.primary,
          fontSize: '14px',
          fontWeight: 600,
          margin: '0 0 8px 0',
        }}
      >
        Use code:
      </Text>
      <Text
        style={{
          color: brandColors.primary,
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '2px',
          margin: '0 0 8px 0',
        }}
      >
        {code}
      </Text>
      <Text
        style={{
          color: brandColors.primaryDark,
          fontSize: '14px',
          margin: 0,
        }}
      >
        for {discount} off your order
      </Text>
    </Section>
  );
}

/**
 * Social proof/reviews section
 */
export function SocialProof({
  reviews,
}: {
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
  }>;
}) {
  return (
    <Section
      style={{
        backgroundColor: brandColors.background,
        borderRadius: '8px',
        padding: '20px',
        marginTop: '16px',
      }}
    >
      <EmailHeading level={3} align="center">
        What our customers say
      </EmailHeading>
      {reviews.map((review, index) => (
        <Section key={index} style={{ marginBottom: '16px' }}>
          <Text
            style={{
              color: brandColors.text,
              fontSize: '14px',
              fontStyle: 'italic',
              margin: '0 0 4px 0',
            }}
          >
            "{review.text}"
          </Text>
          <Text
            style={{
              color: brandColors.textLight,
              fontSize: '12px',
              margin: 0,
            }}
          >
            — {review.author} {'⭐'.repeat(review.rating)}
          </Text>
        </Section>
      ))}
    </Section>
  );
}

// Export brand colors for use in other templates
export { brandColors, fontFamily };
