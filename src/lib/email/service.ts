/**
 * Email Service Abstraction Layer
 *
 * Provides a unified interface for sending emails through multiple providers:
 * - Resend (default)
 * - SendGrid (alternative)
 * - Mock provider (development)
 */

import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { emailConfig, getEmailProvider, type EmailProvider } from './config';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | EmailAddress | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: ReactElement;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProviderInterface {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  isConfigured(): boolean;
}

// ============================================================================
// RESEND PROVIDER
// ============================================================================

class ResendProvider implements EmailProviderInterface {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Resend API key not configured',
      };
    }

    try {
      // Dynamic import to avoid bundling issues
      const { Resend } = await import('resend');
      const resend = new Resend(this.apiKey);

      // Prepare HTML content
      let html = options.html;
      if (options.react && !html) {
        html = await render(options.react);
      }

      // Format recipients
      const to = Array.isArray(options.to)
        ? options.to
        : typeof options.to === 'string'
        ? options.to
        : options.to.email;

      const response = await resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to,
        subject: options.subject,
        html: html || '',
        text: options.text,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
        headers: options.headers,
        tags: options.tags,
      });

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Resend email send failed', { error: errorMessage, options });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// ============================================================================
// SENDGRID PROVIDER
// ============================================================================

class SendGridProvider implements EmailProviderInterface {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'SendGrid API key not configured',
      };
    }

    try {
      // Dynamic import to avoid bundling issues
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.apiKey);

      // Prepare HTML content
      let html = options.html;
      if (options.react && !html) {
        html = await render(options.react);
      }

      // Format recipients
      const to = Array.isArray(options.to)
        ? options.to
        : typeof options.to === 'string'
        ? options.to
        : { email: options.to.email, name: options.to.name };

      const msg = {
        to,
        from: {
          email: emailConfig.fromEmail,
          name: emailConfig.fromName,
        },
        subject: options.subject,
        html: html || '',
        text: options.text,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.isBuffer(a.content)
            ? a.content.toString('base64')
            : a.content,
          type: a.contentType,
          disposition: 'attachment' as const,
        })),
        headers: options.headers,
      };

      const response = await sgMail.default.send(msg);

      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'] || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('SendGrid email send failed', { error: errorMessage, options });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// ============================================================================
// MOCK PROVIDER (Development)
// ============================================================================

class MockProvider implements EmailProviderInterface {
  isConfigured(): boolean {
    return true;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    // Prepare HTML content
    let html = options.html;
    if (options.react && !html) {
      html = await render(options.react);
    }

    // Log email for development
    logger.info('Mock email sent', {
      to: options.to,
      subject: options.subject,
      htmlLength: html?.length || 0,
      hasText: !!options.text,
    });

    // In development, log the email content
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('📧 MOCK EMAIL');
      console.log('========================================');
      console.log(`To: ${JSON.stringify(options.to)}`);
      console.log(`Subject: ${options.subject}`);
      console.log('----------------------------------------');
      if (options.text) {
        console.log('Text:', options.text);
      }
      if (html) {
        console.log('HTML length:', html.length, 'characters');
      }
      console.log('========================================\n');
    }

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// ============================================================================
// EMAIL SERVICE
// ============================================================================

/**
 * Get the appropriate email provider instance
 */
function getProviderInstance(provider: EmailProvider): EmailProviderInterface {
  switch (provider) {
    case 'resend':
      return new ResendProvider();
    case 'sendgrid':
      return new SendGridProvider();
    case 'mock':
    default:
      return new MockProvider();
  }
}

// Cache the provider instance
let cachedProvider: EmailProviderInterface | null = null;

/**
 * Get the cached email provider
 */
function getEmailProviderInstance(): EmailProviderInterface {
  if (!cachedProvider) {
    cachedProvider = getProviderInstance(getEmailProvider());
  }
  return cachedProvider;
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const provider = getEmailProviderInstance();

  // Log email attempt
  logger.info('Sending email', {
    to: typeof options.to === 'string' ? options.to : JSON.stringify(options.to),
    subject: options.subject,
    provider: emailConfig.provider,
  });

  const result = await provider.send(options);

  // Log result
  if (result.success) {
    logger.info('Email sent successfully', {
      messageId: result.messageId,
      to: typeof options.to === 'string' ? options.to : JSON.stringify(options.to),
    });
  } else {
    logger.error('Email send failed', {
      error: result.error,
      to: typeof options.to === 'string' ? options.to : JSON.stringify(options.to),
    });
  }

  return result;
}

/**
 * Send an email using a React Email template
 */
export async function sendTemplateEmail(
  options: Omit<SendEmailOptions, 'html' | 'text'> & { react: ReactElement }
): Promise<SendEmailResult> {
  return sendEmail(options);
}

/**
 * Check if the email service is properly configured
 */
export function isEmailServiceConfigured(): boolean {
  const provider = getEmailProviderInstance();
  return provider.isConfigured();
}

/**
 * Reset the cached provider (useful for testing)
 */
export function resetEmailProvider(): void {
  cachedProvider = null;
}

// Re-export types and config
export { emailConfig, getEmailProvider };
export type { EmailProvider as EmailProviderType };
