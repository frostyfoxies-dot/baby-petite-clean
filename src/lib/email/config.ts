/**
 * Email Configuration
 *
 * Centralized configuration for email services supporting multiple providers:
 * - Resend (default)
 * - SendGrid (alternative)
 * - Mock provider (development)
 */

// ============================================================================
// TYPES
// ============================================================================

export type EmailProvider = 'resend' | 'sendgrid' | 'mock';

export interface EmailConfig {
  provider: EmailProvider;
  fromEmail: string;
  fromName: string;
  supportEmail: string;
  baseUrl: string;
}

export interface CartAbandonmentEmailConfig {
  email1DelayHours: number;
  email2DelayHours: number;
  email3DelayHours: number;
  discountCode: string | null;
  discountPercent: number | null;
  enabled: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get the current email provider from environment
 */
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase() as EmailProvider;
  
  if (provider === 'resend' || provider === 'sendgrid' || provider === 'mock') {
    return provider;
  }
  
  // Default to resend if API key is present, otherwise mock for development
  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }
  
  if (process.env.SENDGRID_API_KEY) {
    return 'sendgrid';
  }
  
  return 'mock';
}

/**
 * Email configuration
 */
export const emailConfig: EmailConfig = {
  provider: getEmailProvider(),
  fromEmail: process.env.EMAIL_FROM || 'noreply@babypetite.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Baby Petite',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@babypetite.com',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://babypetite.com',
};

/**
 * Cart abandonment email sequence configuration
 */
export const cartAbandonmentConfig: CartAbandonmentEmailConfig = {
  // Email 1: 1 hour after abandonment
  email1DelayHours: parseInt(process.env.CART_ABANDONMENT_EMAIL1_DELAY || '1', 10),
  // Email 2: 24 hours after abandonment
  email2DelayHours: parseInt(process.env.CART_ABANDONMENT_EMAIL2_DELAY || '24', 10),
  // Email 3: 72 hours after abandonment
  email3DelayHours: parseInt(process.env.CART_ABANDONMENT_EMAIL3_DELAY || '72', 10),
  // Optional discount code for final email
  discountCode: process.env.CART_ABANDONMENT_DISCOUNT_CODE || null,
  discountPercent: process.env.CART_ABANDONMENT_DISCOUNT_PERCENT 
    ? parseInt(process.env.CART_ABANDONMENT_DISCOUNT_PERCENT, 10) 
    : null,
  // Enable/disable cart abandonment emails
  enabled: process.env.CART_ABANDONMENT_ENABLED !== 'false',
};

/**
 * Email subjects for cart abandonment sequence
 */
export const cartAbandonmentSubjects = {
  email1: 'You left something behind...',
  email2: 'Still thinking about it?',
  email3: 'Last chance: Your cart is waiting',
} as const;

/**
 * Cron job configuration
 */
export const cronConfig = {
  // Secret to verify cron job requests
  secret: process.env.CRON_SECRET || '',
  // Rate limit: max emails per batch
  maxEmailsPerBatch: parseInt(process.env.CART_ABANDONMENT_BATCH_SIZE || '50', 10),
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate email configuration
 */
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (emailConfig.provider === 'resend' && !process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required when using Resend provider');
  }
  
  if (emailConfig.provider === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY is required when using SendGrid provider');
  }
  
  if (!emailConfig.fromEmail) {
    errors.push('EMAIL_FROM is required');
  }
  
  if (!emailConfig.baseUrl) {
    errors.push('NEXT_PUBLIC_BASE_URL is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  const { valid } = validateEmailConfig();
  return valid && emailConfig.provider !== 'mock';
}
