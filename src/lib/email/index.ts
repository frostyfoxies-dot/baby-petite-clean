/**
 * Email Module Index
 *
 * Exports all email-related functionality for the Kids Petite e-commerce platform.
 */

// Configuration
export {
  emailConfig,
  cartAbandonmentConfig,
  cartAbandonmentSubjects,
  cronConfig,
  getEmailProvider,
  validateEmailConfig,
  isEmailConfigured,
  type EmailProvider,
  type EmailConfig,
  type CartAbandonmentEmailConfig,
} from './config';

// Email Service
export {
  sendEmail,
  sendTemplateEmail,
  isEmailServiceConfigured,
  resetEmailProvider,
  type SendEmailOptions,
  type SendEmailResult,
  type EmailAddress,
  type EmailAttachment,
} from './service';

// Email Templates
export * from './templates/components';
export {
  CartAbandonmentEmail,
  CartAbandonmentEmail1,
  CartAbandonmentEmail2,
  CartAbandonmentEmail3,
  generateCartAbandonmentText,
  type CartItem,
  type CartAbandonmentEmailProps,
} from './templates/cart-abandonment';
