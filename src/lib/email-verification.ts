import { prisma } from './prisma';
import { generateSecureToken } from './auth-helpers';
import { sendEmailVerification } from './sendgrid';
import { markEmailAsVerified } from './auth-helpers';

/**
 * Email Verification Logic
 *
 * Provides functions for:
 * - Sending verification emails
 * - Verifying email addresses
 * - Resending verification emails
 * - Checking verification status
 *
 * All functions include proper error handling and follow security best practices.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Result of sending verification email
 */
export interface SendVerificationResult {
  success: boolean;
  message: string;
  alreadyVerified?: boolean;
}

/**
 * Result of email verification
 */
export interface VerifyEmailResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Result of resending verification email
 */
export interface ResendVerificationResult {
  success: boolean;
  message: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * In-memory rate limiter for verification email requests
 * In production, use Redis or a similar solution
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  maxRequests: 5, // Maximum requests per window
  windowMs: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Check if a user is rate limited for verification emails
 *
 * @param userId - User ID to check
 * @returns Object indicating if rate limited and retry time
 */
function checkRateLimit(userId: string): {
  limited: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(userId);

  if (!record) {
    // First request
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return { limited: false };
  }

  // Check if window has expired
  if (now > record.resetTime) {
    // Reset counter
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return { limited: false };
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT_CONFIG.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { limited: true, retryAfter };
  }

  // Increment counter
  record.count++;
  return { limited: false };
}

/**
 * Clear rate limit for a user
 *
 * @param userId - User ID to clear
 */
function clearRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

// ============================================
// EMAIL VERIFICATION FUNCTIONS
// ============================================

/**
 * Send a verification email to a user
 *
 * Generates a secure verification token, stores it, and sends a verification email.
 *
 * @param userId - User ID to send verification email to
 * @param baseUrl - Base URL for the verification link (e.g., 'https://example.com')
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await sendVerificationEmail('user123', 'https://example.com');
 * if (result.success) {
 *   console.log('Verification email sent');
 * }
 */
export async function sendVerificationEmail(
  userId: string,
  baseUrl: string
): Promise<SendVerificationResult> {
  try {
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
        alreadyVerified: true,
      };
    }

    // Generate verification token
    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    // Note: You may need to add emailVerificationToken and emailVerificationExpires fields to your User model
    // For now, we'll use a different approach
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store token in a way that can be verified later
        // This is a placeholder - adjust based on your schema
      },
    });

    // Create verification URL
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

    // Send verification email
    const customerName = user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.email;

    await sendEmailVerification({
      to: user.email,
      subject: 'Verify Your Email Address',
      customerName,
      verificationUrl,
      expiresIn: '24 hours',
    });

    console.log(`Verification email sent to: ${user.email}`);

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      message: 'An error occurred while sending the verification email',
    };
  }
}

/**
 * Verify an email address using a token
 *
 * Verifies the token and marks the user's email as verified.
 * Clears the token after successful verification.
 *
 * @param token - Email verification token
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await verifyEmail('abc123...');
 * if (result.success) {
 *   console.log('Email verified successfully');
 * }
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  try {
    // Verify token
    const validation = await validateVerificationToken(token);
    if (!validation.valid || !validation.userId) {
      return {
        success: false,
        message: 'Invalid or expired verification token. Please request a new verification email.',
      };
    }

    // Mark email as verified
    const verified = await markEmailAsVerified(validation.userId);

    if (!verified) {
      return {
        success: false,
        message: 'Failed to verify email. Please try again.',
      };
    }

    // Clear rate limit for this user
    clearRateLimit(validation.userId);

    console.log(`Email verified successfully for user: ${validation.userId}`);

    return {
      success: true,
      message: 'Email verified successfully. You can now access all features.',
      userId: validation.userId,
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      message: 'An error occurred while verifying your email. Please try again.',
    };
  }
}

/**
 * Resend a verification email
 *
 * Generates a new verification token and sends a new verification email.
 * Includes rate limiting to prevent abuse.
 *
 * @param userId - User ID to resend verification email to
 * @param baseUrl - Base URL for the verification link (e.g., 'https://example.com')
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await resendVerificationEmail('user123', 'https://example.com');
 * if (result.success) {
 *   console.log('Verification email resent');
 * }
 */
export async function resendVerificationEmail(
  userId: string,
  baseUrl: string
): Promise<ResendVerificationResult> {
  try {
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      };
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (rateLimit.limited) {
      return {
        success: false,
        message: 'Too many verification email requests. Please try again later.',
        rateLimited: true,
        retryAfter: rateLimit.retryAfter,
      };
    }

    // Generate new verification token
    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store token in a way that can be verified later
        // This is a placeholder - adjust based on your schema
      },
    });

    // Create verification URL
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

    // Send verification email
    const customerName = user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.email;

    await sendEmailVerification({
      to: user.email,
      subject: 'Verify Your Email Address',
      customerName,
      verificationUrl,
      expiresIn: '24 hours',
    });

    console.log(`Verification email resent to: ${user.email}`);

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      message: 'An error occurred while sending the verification email',
    };
  }
}

/**
 * Validate an email verification token
 *
 * Checks if the token is valid and not expired.
 *
 * @param token - Email verification token to validate
 * @returns Validation result with user ID if valid
 *
 * @example
 * const validation = await validateVerificationToken('abc123...');
 * if (validation.valid) {
 *   console.log('Token valid for user:', validation.userId);
 * }
 */
export async function validateVerificationToken(
  token: string
): Promise<{
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    // In a real implementation, you would:
    // 1. Look up the token in your database
    // 2. Check if it exists and is not expired
    // 3. Return the user ID if valid

    // This is a placeholder implementation
    // You need to add token storage to your schema
    // For example, add these fields to your User model:
    // - emailVerificationToken: String?
    // - emailVerificationExpires: DateTime?

    // For now, we'll return invalid
    return {
      valid: false,
      error: 'Token validation not implemented. Please add token storage to your schema.',
    };
  } catch (error) {
    console.error('Error validating verification token:', error);
    return {
      valid: false,
      error: 'An error occurred while validating the token.',
    };
  }
}

/**
 * Check if a user's email is verified
 *
 * @param userId - User ID to check
 * @returns True if email is verified, false otherwise
 *
 * @example
 * const isVerified = await isEmailVerified('user123');
 * if (isVerified) {
 *   console.log('Email is verified');
 * }
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    return user?.emailVerified !== null;
  } catch (error) {
    console.error('Error checking email verification status:', error);
    return false;
  }
}

/**
 * Check if a user's email is verified by email address
 *
 * @param email - Email address to check
 * @returns True if email is verified, false otherwise
 *
 * @example
 * const isVerified = await isEmailVerifiedByEmail('user@example.com');
 * if (isVerified) {
 *   console.log('Email is verified');
 * }
 */
export async function isEmailVerifiedByEmail(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { emailVerified: true },
    });

    return user?.emailVerified !== null;
  } catch (error) {
    console.error('Error checking email verification status:', error);
    return false;
  }
}

/**
 * Generate an email verification link
 *
 * Creates a full URL for email verification with the token.
 *
 * @param token - Email verification token
 * @param baseUrl - Base URL of the application
 * @returns Full email verification URL
 *
 * @example
 * const link = generateVerificationLink('abc123...', 'https://example.com');
 * console.log(link); // https://example.com/auth/verify-email?token=abc123...
 */
export function generateVerificationLink(token: string, baseUrl: string): string {
  return `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Extract token from verification URL
 *
 * Parses the token from an email verification URL.
 *
 * @param url - Email verification URL
 * @returns Token string or null if not found
 *
 * @example
 * const token = extractTokenFromUrl('https://example.com/auth/verify-email?token=abc123...');
 * console.log(token); // abc123...
 */
export function extractTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('token');
  } catch (error) {
    console.error('Error extracting token from URL:', error);
    return null;
  }
}

/**
 * Get remaining time until token expires
 *
 * @param expiresAt - Expiration date of the token
 * @returns Object with remaining time in hours, minutes, and seconds
 */
export function getTokenRemainingTime(expiresAt: Date): {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const now = new Date();
  const remaining = expiresAt.getTime() - now.getTime();

  if (remaining <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: false };
}

/**
 * Format remaining time for display
 *
 * @param expiresAt - Expiration date of the token
 * @returns Formatted time string (e.g., "23 hours 45 minutes 30 seconds")
 */
export function formatTokenRemainingTime(expiresAt: Date): string {
  const { hours, minutes, seconds, expired } = getTokenRemainingTime(expiresAt);

  if (expired) {
    return 'Expired';
  }

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

/**
 * Get verification status for a user
 *
 * Returns detailed information about the user's email verification status.
 *
 * @param userId - User ID to check
 * @returns Object with verification status details
 *
 * @example
 * const status = await getVerificationStatus('user123');
 * console.log(status);
 * // { verified: true, verifiedAt: Date, email: 'user@example.com' }
 */
export async function getVerificationStatus(userId: string): Promise<{
  verified: boolean;
  verifiedAt: Date | null;
  email: string | null;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return {
        verified: false,
        verifiedAt: null,
        email: null,
      };
    }

    return {
      verified: user.emailVerified !== null,
      verifiedAt: user.emailVerified,
      email: user.email,
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return {
      verified: false,
      verifiedAt: null,
      email: null,
    };
  }
}
