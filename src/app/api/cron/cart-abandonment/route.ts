/**
 * Cart Abandonment Cron Job Endpoint
 *
 * Vercel Cron Job endpoint that triggers cart abandonment email processing.
 * Runs every 15-30 minutes to send scheduled emails.
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cart-abandonment",
 *     "schedule": "*/15 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEmailScheduler, getSchedulerStats, sendTestEmail } from '@/lib/cart-abandonment/scheduler';
import { cronConfig, cartAbandonmentConfig } from '@/lib/email/config';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface CronResponse {
  success: boolean;
  message: string;
  data?: {
    totalSent: number;
    totalFailed: number;
    email1Sent: number;
    email2Sent: number;
    email3Sent: number;
    duration: number;
  };
  stats?: {
    email1Queue: number;
    email2Queue: number;
    email3Queue: number;
    totalPending: number;
  };
  error?: string;
}

// ============================================================================
// AUTHORIZATION
// ============================================================================

/**
 * Verify the cron job request is authorized
 */
function isAuthorized(request: NextRequest): boolean {
  // Check for Vercel Cron Jobs header
  const authHeader = request.headers.get('authorization');
  const cronSecret = cronConfig.secret;

  // If no secret is configured, only allow in development
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    logger.warn('Cron job called without secret configuration');
    return false;
  }

  // Verify the secret
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also check for Vercel's cron header
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  if (vercelCronHeader === 'true' && process.env.VERCEL === '1') {
    return true;
  }

  return false;
}

// ============================================================================
// GET - Status Check
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<CronResponse>> {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Invalid or missing authorization',
        },
        { status: 401 }
      );
    }

    // Get current stats
    const stats = await getSchedulerStats();

    return NextResponse.json({
      success: true,
      message: 'Cart abandonment scheduler status',
      stats,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to get cart abandonment status', {
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get status',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Run Scheduler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<CronResponse>> {
  const startTime = Date.now();

  try {
    // Check authorization
    if (!isAuthorized(request)) {
      logger.warn('Unauthorized cron job attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Invalid or missing authorization',
        },
        { status: 401 }
      );
    }

    // Check if cart abandonment is enabled
    if (!cartAbandonmentConfig.enabled) {
      return NextResponse.json({
        success: true,
        message: 'Cart abandonment emails are disabled',
        data: {
          totalSent: 0,
          totalFailed: 0,
          email1Sent: 0,
          email2Sent: 0,
          email3Sent: 0,
          duration: 0,
        },
      });
    }

    logger.info('Starting cart abandonment cron job');

    // Parse request body for optional test mode
    let testEmail: string | null = null;
    let testEmailNumber: 1 | 2 | 3 = 1;

    try {
      const body = await request.json();
      if (body.test === true && body.email) {
        testEmail = body.email;
        testEmailNumber = body.emailNumber || 1;
      }
    } catch {
      // No body or invalid JSON, proceed with normal operation
    }

    // Handle test email
    if (testEmail) {
      const result = await sendTestEmail(testEmail, testEmailNumber);
      
      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Test email sent' : 'Test email failed',
        data: {
          totalSent: result.success ? 1 : 0,
          totalFailed: result.success ? 0 : 1,
          email1Sent: testEmailNumber === 1 && result.success ? 1 : 0,
          email2Sent: testEmailNumber === 2 && result.success ? 1 : 0,
          email3Sent: testEmailNumber === 3 && result.success ? 1 : 0,
          duration: Date.now() - startTime,
        },
        error: result.error,
      });
    }

    // Run the email scheduler
    const results = await runEmailScheduler();

    const duration = Date.now() - startTime;

    logger.info('Cart abandonment cron job completed', {
      totalSent: results.totalSent,
      totalFailed: results.totalFailed,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      message: 'Cart abandonment emails processed',
      data: {
        totalSent: results.totalSent,
        totalFailed: results.totalFailed,
        email1Sent: results.email1.filter((r) => r.success).length,
        email2Sent: results.email2.filter((r) => r.success).length,
        email3Sent: results.email3.filter((r) => r.success).length,
        duration,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;

    logger.error('Cart abandonment cron job failed', {
      error: errorMessage,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Cron job failed',
        error: errorMessage,
        data: {
          totalSent: 0,
          totalFailed: 0,
          email1Sent: 0,
          email2Sent: 0,
          email3Sent: 0,
          duration,
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EDGE RUNTIME CONFIGURATION
// ============================================================================

// Use Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

// Maximum duration for the cron job (Vercel Pro/Enterprise)
export const maxDuration = 60; // 60 seconds
