/**
 * Order Confirmation Email Template
 *
 * Sent immediately after order is confirmed.
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
  brandColors,
} from './components';
import { emailConfig } from '../config';

export interface OrderConfirmationProps {
  orderNumber: string;
  customerName?: string;
  customerEmail: string;
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingMethod: {
    name: string;
    estimatedDays: string;
  };
  orderDate: Date;
  supportEmail?: string;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  customerEmail,
  items,
  subtotal,
  shipping,
  tax,
  discount = 0,
  total,
  shippingAddress,
  billingAddress,
  shippingMethod,
  orderDate,
  supportEmail = emailConfig.supportEmail,
}: OrderConfirmationProps) {
  const formattedDate = orderDate.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const name = customerName || 'Valued Customer';

  return (
    <EmailLayout preview={`Your order ${orderNumber} is confirmed!`}>
      <EmailHeader>
        <EmailHeading style={{ color: brandColors.primary }}>
          🎉 Order Confirmed!
        </EmailHeading>
        <EmailText>
          Hi {name},
          <br />
          Thank you for shopping with Baby Petite! Your order has been received and is being processed.
        </EmailText>
      </EmailHeader>

      <EmailContainer>
        <EmailSection>
          <EmailText strong>Order #{orderNumber}</EmailText>
          <EmailText style={{ fontSize: '14px', color: '#666' }}>
            Placed on {formattedDate}
          </EmailText>
        </EmailSection>

        <Spacer height={20} />

        {/* Order Items */}
        <EmailSection>
          <EmailText strong style={{ fontSize: '16px', marginBottom: '12px' }}>
            Items in your order:
          </EmailText>
          <ProductList
            items={items.map((item) => ({
              name: item.name,
              variant: item.variant,
              price: item.unitPrice,
              quantity: item.quantity,
              total: item.totalPrice,
              imageUrl: item.imageUrl,
            }))}
          />
        </EmailSection>

        <Spacer height={20} />
        <Divider />

        {/* Order Summary */}
        <OrderSummary
          subtotal={subtotal}
          shipping={shipping}
          tax={tax}
          discount={discount}
          total={total}
          currency="USD"
        />

        <Spacer height={20} />
        <Divider />

        {/* Shipping Address */}
        <EmailSection>
          <EmailText strong style={{ fontSize: '16px', marginBottom: '8px' }}>
            Shipping To:
          </EmailText>
          <EmailText style={{ lineHeight: '1.6' }}>
            {shippingAddress.firstName} {shippingAddress.lastName}
            <br />
            {shippingAddress.line1}
            {shippingAddress.line2 && <><br />{shippingAddress.line2}</>}
            <br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            <br />
            {shippingAddress.country}
            {shippingAddress.phone && <><br />Phone: {shippingAddress.phone}</>}
          </EmailText>
          <Spacer height={12} />
          <EmailText>
            <strong>Method:</strong> {shippingMethod.name}
            <br />
            <span style={{ color: '#666', fontSize: '14px' }}>
              Estimated delivery: {shippingMethod.estimatedDays}
            </span>
          </EmailText>
        </EmailSection>

        {/* Billing Address if different */}
        {(billingAddress.line1 !== shippingAddress.line1 ||
          billingAddress.city !== shippingAddress.city) && (
          <>
            <Spacer height={20} />
            <EmailSection>
              <EmailText strong style={{ fontSize: '16px', marginBottom: '8px' }}>
                Billing Address:
              </EmailText>
              <EmailText style={{ lineHeight: '1.6' }}>
                {billingAddress.firstName} {billingAddress.lastName}
                <br />
                {billingAddress.line1}
                {billingAddress.line2 && <><br />{billingAddress.line2}</>}
                <br />
                {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
                <br />
                {billingAddress.country}
              </EmailText>
            </EmailSection>
          </>
        )}

        <Spacer height={24} />

        {/* CTA Button */}
        <EmailSection align="center">
          <EmailButton
            href={`${emailConfig.baseUrl}/account/orders`}
            style={{ backgroundColor: brandColors.primary, color: '#fff' }}
          >
            View Your Order
          </EmailButton>
          <Spacer height={12} />
          <EmailText style={{ fontSize: '12px', color: '#999' }}>
            Questions? Contact us at {supportEmail}
          </EmailText>
        </EmailSection>
      </EmailContainer>

      <EmailFooter>
        <EmailText style={{ fontSize: '12px', color: '#999' }}>
          © {new Date().getFullYear()} Baby Petite. All rights reserved.
          <br />
          123 Fashion Street, Kuala Lumpur, Malaysia
        </EmailText>
      </EmailFooter>
    </EmailLayout>
  );
}
