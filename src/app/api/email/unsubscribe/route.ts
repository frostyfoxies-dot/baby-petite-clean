/**
 * Email Unsubscribe Endpoint
 *
 * Handles unsubscribe requests from cart abandonment emails.
 * Users can unsubscribe from marketing emails while still receiving
 * essential transactional emails (order confirmations, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unsubscribeEmail, isEmailUnsubscribed } from '@/lib/cart-abandonment/tracker';
import { logger } from '@/lib/logger';
import { emailConfig } from '@/lib/email/config';

// ============================================================================
// TYPES
// ============================================================================

interface UnsubscribeResponse {
  success: boolean;
  message: string;
  email?: string;
  type?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a simple HTML response page
 */
function generateHtmlResponse(
  title: string,
  message: string,
  isSuccess: boolean
): string {
  const brandColor = '#E91E63';
  const textColor = '#1A202C';
  const bgColor = '#FAFAFA';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Kids Petite</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: ${brandColor};
      margin-bottom: 24px;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .icon.success {
      background-color: #E8F5E9;
      color: #4CAF50;
    }
    .icon.error {
      background-color: #FFEBEE;
      color: #F44336;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #718096;
      margin-bottom: 24px;
    }
    a {
      color: ${brandColor};
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .button {
      display: inline-block;
      background-color: ${brandColor};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #C2185B;
      text-decoration: none;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E2E8F0;
      font-size: 14px;
      color: #A0AEC0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Kids Petite</div>
    <div class="icon ${isSuccess ? 'success' : 'error'}">
      ${isSuccess ? '✓' : '✕'}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${emailConfig.baseUrl}" class="button">Continue Shopping</a>
    <div class="footer">
      <p>Kids Petite — Quality clothing for your little ones</p>
      <p style="margin-top: 8px;">
        <a href="${emailConfig.baseUrl}/privacy">Privacy Policy</a> · 
        <a href="${emailConfig.baseUrl}/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// GET - Unsubscribe from email
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'cart-abandonment';
  const token = searchParams.get('token');

  try {
    // Validate email
    if (!email) {
      logger.warn('Unsubscribe attempt without email');
      
      return new NextResponse(
        generateHtmlResponse(
          'Invalid Request',
          'We couldn\'t process your unsubscribe request. Please check the link in your email.',
          false
        ),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Unsubscribe attempt with invalid email', { email });
      
      return new NextResponse(
        generateHtmlResponse(
          'Invalid Email',
          'The email address provided is not valid.',
          false
        ),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // Check if already unsubscribed
    const alreadyUnsubscribed = await isEmailUnsubscribed(email);

    if (alreadyUnsubscribed) {
      return new NextResponse(
        generateHtmlResponse(
          'Already Unsubscribed',
          `You're already unsubscribed from cart abandonment emails. You won't receive any more reminders about items left in your cart.`,
          true
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // Process unsubscribe
    await unsubscribeEmail(email);

    logger.info('Email unsubscribed', { email, type });

    return new NextResponse(
      generateHtmlResponse(
        'Unsubscribed Successfully',
        `You've been unsubscribed from cart abandonment emails. You won't receive any more reminders about items left in your cart.<br><br>Note: You'll still receive essential emails like order confirmations and shipping updates.`,
        true
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to process unsubscribe', {
      email: email || 'unknown',
      error: errorMessage,
    });

    return new NextResponse(
      generateHtmlResponse(
        'Something Went Wrong',
        'We encountered an error processing your request. Please try again later or contact our support team.',
        false
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}

// ============================================================================
// POST - API endpoint for programmatic unsubscribe
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<UnsubscribeResponse>> {
  try {
    const body = await request.json();
    const { email, type = 'cart-abandonment' } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Process unsubscribe
    await unsubscribeEmail(email);

    logger.info('Email unsubscribed via API', { email, type });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
      email,
      type,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to process unsubscribe via API', {
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process unsubscribe request',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// RUNTIME CONFIGURATION
// ============================================================================

export const runtime = 'nodejs';
