/**
 * Shipping Update Email Template
 *
 * Sent when order status changes to SHIPPED.
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

export interface ShippingUpdateProps {
  orderNumber: string;
  customerName?: string;
  customerEmail: string;
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    imageUrl?: string;
  }>;
  shippingCarrier: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery: string;
  supportEmail?: string;
}

export function ShippingUpdateEmail({
  orderNumber,
  customerName,
  items,
  shippingCarrier,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
  supportEmail = emailConfig.supportEmail,
}: ShippingUpdateProps) {
  const name = customerName || 'Valued Customer';

  return (
    <EmailLayout preview={`Your order ${orderNumber} is on its way!`}>
      <EmailHeader>
        <EmailHeading style={{ color: brandColors.primary }}>
          📦 Your Order is On Its Way!
        </EmailHeading>
        <EmailText>
          Hi {name},
          <br />
          Great news! Your Kids Petite order has been shipped and is on its way to you.
        </EmailText>
      </EmailHeader>

      <EmailContainer>
        <EmailSection>
          <EmailText strong>Order #{orderNumber}</EmailText>
        </EmailSection>

        <Spacer height={20} />

        {/* Tracking Info */}
        <EmailSection
          style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
          }}
        >
          <EmailText strong style={{ fontSize: '16px', marginBottom: '8px' }}>
            Tracking Information
          </EmailText>
          <EmailText>
            <strong>Carrier:</strong> {shippingCarrier}
            <br />
            <strong>Tracking Number:</strong> {trackingNumber}
          </EmailText>
          <Spacer height={12} />
          <EmailButton
            href={trackingUrl}
            style={{ backgroundColor: brandColors.primary, color: '#fff' }}
          >
            Track Your Package
          </EmailButton>
        </EmailSection>

        <Spacer height={20} />
        <Divider />

        {/* Items in Shipment */}
        <EmailSection>
          <EmailText strong style={{ fontSize: '16px', marginBottom: '12px' }}>
            Items in this shipment:
          </EmailText>
          <ProductList
            items={items.map((item) => ({
              name: item.name,
              variant: item.variant,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
            }))}
            showPrice={false}
          />
        </EmailSection>

        <Spacer height={20} />
        <Divider />

        {/* Delivery Estimate */}
        <EmailSection>
          <EmailText>
            <strong>Estimated Delivery:</strong> {estimatedDelivery}
          </EmailText>
          <Spacer height={12} />
          <EmailText style={{ fontSize: '14px', color: '#666' }}>
            Please note that delivery times are estimates and may vary based on your location.
          </EmailText>
        </EmailSection>

        <Spacer height={24} />

        {/* Footer CTA */}
        <EmailSection align="center">
          <EmailButton
            href={`${emailConfig.baseUrl}/account/orders`}
            style={{ backgroundColor: brandColors.primary, color: '#fff' }}
          >
            View Order Details
          </EmailButton>
          <Spacer height={12} />
          <EmailText style={{ fontSize: '12px', color: '#999' }}>
            Questions? Contact us at {supportEmail}
          </EmailText>
        </EmailSection>
      </EmailContainer>

      <EmailFooter>
        <EmailText style={{ fontSize: '12px', color: '#999' }}>
          © {new Date().getFullYear()} Kids Petite. All rights reserved.
        </EmailText>
      </EmailFooter>
    </EmailLayout>
  );
}
