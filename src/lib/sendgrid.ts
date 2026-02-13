import sgMail, { MailDataRequired } from '@sendgrid/mail';

/**
 * SendGrid Email Client Configuration
 *
 * Provides a configured SendGrid client and email templates for various notifications.
 * Used for order confirmations, shipping updates, welcome emails, and more.
 *
 * @see https://docs.sendgrid.com/api-reference
 */

// Validate required environment variable
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Email configuration constants
 */
export const EMAIL_CONFIG = {
  FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@kidspetite.com',
  FROM_NAME: 'Kids Petite',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@kidspetite.com',
} as const;

/**
 * SendGrid template IDs (Dynamic Transactional Templates)
 */
export const TEMPLATE_IDS = {
  ORDER_CONFIRMATION: 'd-order-confirmation',
  SHIPPING_NOTIFICATION: 'd-shipping-notification',
  DELIVERY_CONFIRMATION: 'd-delivery-confirmation',
  WELCOME_EMAIL: 'd-welcome-email',
  PASSWORD_RESET: 'd-password-reset',
  EMAIL_VERIFICATION: 'd-email-verification',
  REGISTRY_INVITATION: 'd-registry-invitation',
  REGISTRY_SHARE: 'd-registry-share',
  LOW_STOCK_ALERT: 'd-low-stock-alert',
  BACK_IN_STOCK: 'd-back-in-stock',
  ABANDONED_CART: 'd-abandoned-cart',
  REVIEW_REQUEST: 'd-review-request',
} as const;

/**
 * Base email data interface
 */
interface BaseEmailData {
  to: string;
  subject: string;
}

/**
 * Order item for email templates
 */
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variant?: string;
}

/**
 * Order confirmation email data
 */
export interface OrderConfirmationData extends BaseEmailData {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
  orderUrl: string;
}

/**
 * Shipping notification email data
 */
export interface ShippingNotificationData extends BaseEmailData {
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier: string;
  shippedAt: string;
  estimatedDelivery?: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  orderUrl: string;
}

/**
 * Welcome email data
 */
export interface WelcomeEmailData extends BaseEmailData {
  customerName: string;
  loginUrl: string;
  discountCode?: string;
  discountPercent?: number;
}

/**
 * Password reset email data
 */
export interface PasswordResetData extends BaseEmailData {
  customerName: string;
  resetUrl: string;
  expiresIn: string;
}

/**
 * Email verification data
 */
export interface EmailVerificationData extends BaseEmailData {
  customerName: string;
  verificationUrl: string;
  expiresIn: string;
}

/**
 * Registry invitation email data
 */
export interface RegistryInvitationData extends BaseEmailData {
  registryOwnerName: string;
  registryName: string;
  registryUrl: string;
  message?: string;
  dueDate?: string;
}

/**
 * Registry share email data
 */
export interface RegistryShareData extends BaseEmailData {
  senderName: string;
  registryName: string;
  registryUrl: string;
  message?: string;
  babyName?: string;
  dueDate?: string;
}

/**
 * Low stock alert email data (admin)
 */
export interface LowStockAlertData extends BaseEmailData {
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    reorderLevel: number;
    variant?: string;
  }>;
  adminUrl: string;
}

/**
 * Back in stock notification email data
 */
export interface BackInStockData extends BaseEmailData {
  customerName: string;
  productName: string;
  productUrl: string;
  productImage?: string;
  price: number;
}

/**
 * Abandoned cart email data
 */
export interface AbandonedCartData extends BaseEmailData {
  customerName: string;
  items: OrderItem[];
  cartTotal: number;
  cartUrl: string;
  discountCode?: string;
  discountPercent?: number;
  expiresAt?: string;
}

/**
 * Review request email data
 */
export interface ReviewRequestData extends BaseEmailData {
  customerName: string;
  orderNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    reviewUrl: string;
  }>;
  incentive?: string;
}

/**
 * Sends an order confirmation email
 *
 * @param data - Order confirmation email data
 * @returns SendGrid response
 */
export async function sendOrderConfirmation(
  data: OrderConfirmationData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.ORDER_CONFIRMATION,
    dynamicTemplateData: {
      subject: data.subject || `Order Confirmation #${data.orderNumber}`,
      order_number: data.orderNumber,
      customer_name: data.customerName,
      items: data.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: formatCurrency(item.price),
        image: item.image,
        variant: item.variant,
      })),
      subtotal: formatCurrency(data.subtotal),
      shipping: formatCurrency(data.shipping),
      tax: formatCurrency(data.tax),
      total: formatCurrency(data.total),
      shipping_address: {
        name: data.shippingAddress.name,
        line1: data.shippingAddress.line1,
        line2: data.shippingAddress.line2,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postal_code: data.shippingAddress.postalCode,
        country: data.shippingAddress.country,
      },
      estimated_delivery: data.estimatedDelivery,
      order_url: data.orderUrl,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw new Error('Failed to send order confirmation email');
  }
}

/**
 * Sends a shipping notification email
 *
 * @param data - Shipping notification email data
 * @returns SendGrid response
 */
export async function sendShippingNotification(
  data: ShippingNotificationData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.SHIPPING_NOTIFICATION,
    dynamicTemplateData: {
      subject: data.subject || `Your order #${data.orderNumber} has shipped!`,
      order_number: data.orderNumber,
      customer_name: data.customerName,
      tracking_number: data.trackingNumber,
      tracking_url: data.trackingUrl,
      carrier: data.carrier,
      shipped_at: data.shippedAt,
      estimated_delivery: data.estimatedDelivery,
      shipping_address: {
        name: data.shippingAddress.name,
        line1: data.shippingAddress.line1,
        line2: data.shippingAddress.line2,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postal_code: data.shippingAddress.postalCode,
        country: data.shippingAddress.country,
      },
      items: data.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
      })),
      order_url: data.orderUrl,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send shipping notification email:', error);
    throw new Error('Failed to send shipping notification email');
  }
}

/**
 * Sends a welcome email to new customers
 *
 * @param data - Welcome email data
 * @returns SendGrid response
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.WELCOME_EMAIL,
    dynamicTemplateData: {
      subject: data.subject || 'Welcome to Kids Petite!',
      customer_name: data.customerName,
      login_url: data.loginUrl,
      discount_code: data.discountCode,
      discount_percent: data.discountPercent,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
}

/**
 * Sends a password reset email
 *
 * @param data - Password reset email data
 * @returns SendGrid response
 */
export async function sendPasswordReset(
  data: PasswordResetData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.PASSWORD_RESET,
    dynamicTemplateData: {
      subject: data.subject || 'Reset Your Password',
      customer_name: data.customerName,
      reset_url: data.resetUrl,
      expires_in: data.expiresIn,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Sends an email verification email
 *
 * @param data - Email verification data
 * @returns SendGrid response
 */
export async function sendEmailVerification(
  data: EmailVerificationData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.EMAIL_VERIFICATION,
    dynamicTemplateData: {
      subject: data.subject || 'Verify Your Email Address',
      customer_name: data.customerName,
      verification_url: data.verificationUrl,
      expires_in: data.expiresIn,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send email verification:', error);
    throw new Error('Failed to send email verification');
  }
}

/**
 * Sends a registry invitation email
 *
 * @param data - Registry invitation email data
 * @returns SendGrid response
 */
export async function sendRegistryInvitation(
  data: RegistryInvitationData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.REGISTRY_INVITATION,
    dynamicTemplateData: {
      subject: data.subject || `${data.registryOwnerName} has invited you to view their baby registry!`,
      registry_owner_name: data.registryOwnerName,
      registry_name: data.registryName,
      registry_url: data.registryUrl,
      message: data.message,
      due_date: data.dueDate,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send registry invitation email:', error);
    throw new Error('Failed to send registry invitation email');
  }
}

/**
 * Sends a registry share email
 *
 * @param data - Registry share email data
 * @returns SendGrid response
 */
export async function sendRegistryShare(
  data: RegistryShareData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.REGISTRY_SHARE,
    dynamicTemplateData: {
      subject: data.subject || `${data.senderName} shared a baby registry with you!`,
      sender_name: data.senderName,
      registry_name: data.registryName,
      registry_url: data.registryUrl,
      message: data.message,
      baby_name: data.babyName,
      due_date: data.dueDate,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send registry share email:', error);
    throw new Error('Failed to send registry share email');
  }
}

/**
 * Sends a low stock alert email to admin
 *
 * @param data - Low stock alert email data
 * @returns SendGrid response
 */
export async function sendLowStockAlert(
  data: LowStockAlertData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.LOW_STOCK_ALERT,
    dynamicTemplateData: {
      subject: data.subject || `Low Stock Alert: ${data.items.length} items need attention`,
      items: data.items.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        sku: item.sku,
        current_stock: item.currentStock,
        reorder_level: item.reorderLevel,
        variant: item.variant,
      })),
      admin_url: data.adminUrl,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send low stock alert email:', error);
    throw new Error('Failed to send low stock alert email');
  }
}

/**
 * Sends a back in stock notification email
 *
 * @param data - Back in stock notification email data
 * @returns SendGrid response
 */
export async function sendBackInStockNotification(
  data: BackInStockData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.BACK_IN_STOCK,
    dynamicTemplateData: {
      subject: data.subject || `${data.productName} is back in stock!`,
      customer_name: data.customerName,
      product_name: data.productName,
      product_url: data.productUrl,
      product_image: data.productImage,
      price: formatCurrency(data.price),
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send back in stock notification:', error);
    throw new Error('Failed to send back in stock notification');
  }
}

/**
 * Sends an abandoned cart email
 *
 * @param data - Abandoned cart email data
 * @returns SendGrid response
 */
export async function sendAbandonedCartEmail(
  data: AbandonedCartData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.ABANDONED_CART,
    dynamicTemplateData: {
      subject: data.subject || 'You left something in your cart!',
      customer_name: data.customerName,
      items: data.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: formatCurrency(item.price),
        image: item.image,
      })),
      cart_total: formatCurrency(data.cartTotal),
      cart_url: data.cartUrl,
      discount_code: data.discountCode,
      discount_percent: data.discountPercent,
      expires_at: data.expiresAt,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send abandoned cart email:', error);
    throw new Error('Failed to send abandoned cart email');
  }
}

/**
 * Sends a review request email
 *
 * @param data - Review request email data
 * @returns SendGrid response
 */
export async function sendReviewRequest(
  data: ReviewRequestData
): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    templateId: TEMPLATE_IDS.REVIEW_REQUEST,
    dynamicTemplateData: {
      subject: data.subject || `How was your order #${data.orderNumber}?`,
      customer_name: data.customerName,
      order_number: data.orderNumber,
      items: data.items.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        review_url: item.reviewUrl,
      })),
      incentive: data.incentive,
    },
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send review request email:', error);
    throw new Error('Failed to send review request email');
  }
}

/**
 * Sends a custom email with raw HTML content
 *
 * @param data - Custom email data
 * @returns SendGrid response
 */
export async function sendCustomEmail(data: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ messageId: string }> {
  const msg: MailDataRequired = {
    to: data.to,
    from: {
      email: EMAIL_CONFIG.FROM_EMAIL,
      name: EMAIL_CONFIG.FROM_NAME,
    },
    subject: data.subject,
    html: data.html,
    text: data.text,
    replyTo: data.replyTo,
  };

  try {
    const response = await sgMail.send(msg);
    return { messageId: response[0].headers['x-message-id'] || '' };
  } catch (error) {
    console.error('Failed to send custom email:', error);
    throw new Error('Failed to send custom email');
  }
}

/**
 * Sends multiple emails in batch
 *
 * @param emails - Array of email data
 * @returns Array of SendGrid responses
 */
export async function sendBatchEmails(
  emails: Array<MailDataRequired>
): Promise<Array<{ messageId: string }>> {
  try {
    const response = await sgMail.send(emails);
    return response.map((res) => ({
      messageId: res.headers['x-message-id'] || '',
    }));
  } catch (error) {
    console.error('Failed to send batch emails:', error);
    throw new Error('Failed to send batch emails');
  }
}

/**
 * Formats a number as currency (USD)
 *
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default sgMail;
