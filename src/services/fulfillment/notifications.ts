import client from '@sendgrid/mail';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Order interface for notifications
 */
interface Order {
  orderNumber: string;
  customerEmail: string;
  shippingAddress: Record<string, unknown>;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Email template data
 */
interface EmailTemplateData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// FULFILLMENT NOTIFICATION SERVICE
// ============================================

/**
 * Fulfillment Notification Service
 *
 * Handles email notifications for fulfillment events using SendGrid.
 */
export class FulfillmentNotificationService {
  private fromEmail: string;
  private adminEmail: string;
  private storeName: string;
  private storeUrl: string;

  constructor() {
    // Initialize SendGrid client
    if (process.env.SENDGRID_API_KEY) {
      client.setApiKey(process.env.SENDGRID_API_KEY);
    }

    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@kidspetite.com';
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@kidspetite.com';
    this.storeName = process.env.STORE_NAME || 'Kids Petite';
    this.storeUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://kidspetite.com';
  }

  /**
   * Send shipping notification to customer
   *
   * Notifies the customer that their order has been shipped.
   *
   * @param order - The order that was shipped
   * @param trackingNumber - The tracking number
   * @param carrier - Optional carrier name
   */
  async sendShippingNotification(
    order: Order,
    trackingNumber: string,
    carrier?: string
  ): Promise<void> {
    const address = order.shippingAddress as any;
    const customerName = `${address.firstName || ''} ${address.lastName || ''}`.trim();

    const emailData: EmailTemplateData = {
      to: order.customerEmail,
      subject: `Your ${this.storeName} Order Has Shipped! - ${order.orderNumber}`,
      html: this.generateShippingEmailHtml({
        orderNumber: order.orderNumber,
        customerName,
        trackingNumber,
        carrier,
        items: order.items,
        shippingAddress: address,
      }),
      text: this.generateShippingEmailText({
        orderNumber: order.orderNumber,
        customerName,
        trackingNumber,
        carrier,
        items: order.items,
        shippingAddress: address,
      }),
    };

    await this.sendEmail(emailData);
  }

  /**
   * Send delivery confirmation
   *
   * Notifies the customer that their order has been delivered.
   *
   * @param order - The order that was delivered
   */
  async sendDeliveryNotification(order: Order): Promise<void> {
    const address = order.shippingAddress as any;
    const customerName = `${address.firstName || ''} ${address.lastName || ''}`.trim();

    const emailData: EmailTemplateData = {
      to: order.customerEmail,
      subject: `Your ${this.storeName} Order Has Been Delivered! - ${order.orderNumber}`,
      html: this.generateDeliveryEmailHtml({
        orderNumber: order.orderNumber,
        customerName,
        items: order.items,
      }),
      text: this.generateDeliveryEmailText({
        orderNumber: order.orderNumber,
        customerName,
        items: order.items,
      }),
    };

    await this.sendEmail(emailData);
  }

  /**
   * Send issue notification to admin
   *
   * Alerts admin about a fulfillment issue.
   *
   * @param order - The order with an issue
   * @param issue - Description of the issue
   */
  async sendIssueNotification(
    order: Order,
    issue: string
  ): Promise<void> {
    const emailData: EmailTemplateData = {
      to: this.adminEmail,
      subject: `[${this.storeName}] Fulfillment Issue - Order ${order.orderNumber}`,
      html: this.generateIssueEmailHtml({
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        issue,
        items: order.items,
      }),
      text: this.generateIssueEmailText({
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        issue,
        items: order.items,
      }),
    };

    await this.sendEmail(emailData);
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Send an email using SendGrid
   */
  private async sendEmail(data: EmailTemplateData): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent:', data.subject);
      return;
    }

    try {
      await client.send({
        to: data.to,
        from: this.fromEmail,
        subject: data.subject,
        html: data.html,
        text: data.text,
      });

      console.log(`Email sent successfully: ${data.subject} to ${data.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for shipping notification email
   */
  private generateShippingEmailHtml(data: {
    orderNumber: string;
    customerName: string;
    trackingNumber: string;
    carrier?: string;
    items: Array<{ productName: string; variantName: string; quantity: number }>;
    shippingAddress: any;
  }): string {
    const trackingUrl = this.getTrackingUrl(data.trackingNumber, data.carrier);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Order Has Shipped</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚚 Your Order Has Shipped!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi ${data.customerName || 'there'},</p>
          
          <p>Great news! Your order <strong>${data.orderNumber}</strong> has been shipped and is on its way to you.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">📦 Tracking Information</h3>
            <p style="margin-bottom: 5px;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            ${data.carrier ? `<p style="margin-bottom: 5px;"><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
            ${trackingUrl ? `<p><a href="${trackingUrl}" style="color: #667eea;">Track Your Package →</a></p>` : ''}
          </div>
          
          <h3 style="color: #333;">Order Items</h3>
          <ul style="padding-left: 20px;">
            ${data.items.map(item => `
              <li style="margin-bottom: 10px;">
                <strong>${item.productName}</strong>
                ${item.variantName !== 'Default' ? ` - ${item.variantName}` : ''}
                <br><span style="color: #666;">Quantity: ${item.quantity}</span>
              </li>
            `).join('')}
          </ul>
          
          <h3 style="color: #333;">Shipping Address</h3>
          <p style="color: #666;">
            ${data.shippingAddress.firstName || ''} ${data.shippingAddress.lastName || ''}<br>
            ${data.shippingAddress.line1 || ''}<br>
            ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
            ${data.shippingAddress.city || ''}, ${data.shippingAddress.state || ''} ${data.shippingAddress.zip || ''}<br>
            ${data.shippingAddress.country || 'US'}
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.storeUrl}/account/orders/${data.orderNumber}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              View Order Details
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Thank you for shopping with ${this.storeName}!
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} ${this.storeName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text for shipping notification email
   */
  private generateShippingEmailText(data: {
    orderNumber: string;
    customerName: string;
    trackingNumber: string;
    carrier?: string;
    items: Array<{ productName: string; variantName: string; quantity: number }>;
    shippingAddress: any;
  }): string {
    const trackingUrl = this.getTrackingUrl(data.trackingNumber, data.carrier);

    return `
Your Order Has Shipped!

Hi ${data.customerName || 'there'},

Great news! Your order ${data.orderNumber} has been shipped and is on its way to you.

TRACKING INFORMATION
--------------------
Tracking Number: ${data.trackingNumber}
${data.carrier ? `Carrier: ${data.carrier}` : ''}
${trackingUrl ? `Track Your Package: ${trackingUrl}` : ''}

ORDER ITEMS
-----------
${data.items.map(item => 
  `- ${item.productName}${item.variantName !== 'Default' ? ` - ${item.variantName}` : ''} (Qty: ${item.quantity})`
).join('\n')}

SHIPPING ADDRESS
----------------
${data.shippingAddress.firstName || ''} ${data.shippingAddress.lastName || ''}
${data.shippingAddress.line1 || ''}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city || ''}, ${data.shippingAddress.state || ''} ${data.shippingAddress.zip || ''}
${data.shippingAddress.country || 'US'}

View your order details: ${this.storeUrl}/account/orders/${data.orderNumber}

Thank you for shopping with ${this.storeName}!

© ${new Date().getFullYear()} ${this.storeName}. All rights reserved.
    `.trim();
  }

  /**
   * Generate HTML for delivery confirmation email
   */
  private generateDeliveryEmailHtml(data: {
    orderNumber: string;
    customerName: string;
    items: Array<{ productName: string; variantName: string; quantity: number }>;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Order Has Been Delivered</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Your Order Has Been Delivered!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi ${data.customerName || 'there'},</p>
          
          <p>Your order <strong>${data.orderNumber}</strong> has been delivered. We hope you love your purchase!</p>
          
          <h3 style="color: #333;">Order Items</h3>
          <ul style="padding-left: 20px;">
            ${data.items.map(item => `
              <li style="margin-bottom: 10px;">
                <strong>${item.productName}</strong>
                ${item.variantName !== 'Default' ? ` - ${item.variantName}` : ''}
                <br><span style="color: #666;">Quantity: ${item.quantity}</span>
              </li>
            `).join('')}
          </ul>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #666;">How did we do?</p>
            <a href="${this.storeUrl}/account/orders/${data.orderNumber}" 
               style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Leave a Review
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Thank you for shopping with ${this.storeName}!
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} ${this.storeName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text for delivery confirmation email
   */
  private generateDeliveryEmailText(data: {
    orderNumber: string;
    customerName: string;
    items: Array<{ productName: string; variantName: string; quantity: number }>;
  }): string {
    return `
Your Order Has Been Delivered!

Hi ${data.customerName || 'there'},

Your order ${data.orderNumber} has been delivered. We hope you love your purchase!

ORDER ITEMS
-----------
${data.items.map(item => 
  `- ${item.productName}${item.variantName !== 'Default' ? ` - ${item.variantName}` : ''} (Qty: ${item.quantity})`
).join('\n')}

How did we do? Leave a review: ${this.storeUrl}/account/orders/${data.orderNumber}

Thank you for shopping with ${this.storeName}!

© ${new Date().getFullYear()} ${this.storeName}. All rights reserved.
    `.trim();
  }

  /**
   * Generate HTML for issue notification email
   */
  private generateIssueEmailHtml(data: {
    orderNumber: string;
    customerEmail: string;
    issue: string;
    items: Array<{ productName: string; variantName: string; quantity: number }>;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fulfillment Issue - Order ${data.orderNumber}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">⚠️ Fulfillment Issue</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">An issue has been reported for order <strong>${data.orderNumber}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eb3349;">
            <h3 style="margin-top: 0; color: #eb3349;">Issue Details</h3>
            <p style="white-space: pre-wrap;">${data.issue}</p>
          </div>
          
          <h3 style="color: #333;">Order Information</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Customer Email:</strong> ${data.customerEmail}</p>
          
          <h3 style="color: #333;">Order Items</h3>
          <ul style="padding-left: 20px;">
            ${data.items.map(item => `
              <li style="margin-bottom: 10px;">
                <strong>${item.productName}</strong>
                ${item.variantName !== 'Default' ? ` - ${item.variantName}` : ''}
                <br><span style="color: #666;">Quantity: ${item.quantity}</span>
              </li>
            `).join('')}
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.storeUrl}/admin/fulfillment/${data.orderNumber}" 
               style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              View in Admin
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} ${this.storeName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text for issue notification email
   */
  private generateIssueEmailText(data: {
    orderNumber: string;
    customerEmail: string;
    issue: string;
    items: Array<{ productName: string; variantName: string; quantity: number }>;
  }): string {
    return `
Fulfillment Issue - Order ${data.orderNumber}

An issue has been reported for order ${data.orderNumber}.

ISSUE DETAILS
-------------
${data.issue}

ORDER INFORMATION
-----------------
Order Number: ${data.orderNumber}
Customer Email: ${data.customerEmail}

ORDER ITEMS
-----------
${data.items.map(item => 
  `- ${item.productName}${item.variantName !== 'Default' ? ` - ${item.variantName}` : ''} (Qty: ${item.quantity})`
).join('\n')}

View in Admin: ${this.storeUrl}/admin/fulfillment/${data.orderNumber}

© ${new Date().getFullYear()} ${this.storeName}. All rights reserved.
    `.trim();
  }

  /**
   * Get tracking URL based on carrier
   */
  private getTrackingUrl(trackingNumber: string, carrier?: string): string | null {
    if (!trackingNumber) return null;

    const carrierLower = carrier?.toLowerCase() || '';
    
    // Common carrier tracking URLs
    if (carrierLower.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    }
    if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    }
    if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    }
    if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    }

    // Return null for unknown carriers
    return null;
  }
}
