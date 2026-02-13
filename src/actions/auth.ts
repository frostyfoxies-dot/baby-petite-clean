'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/lib/auth';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@/lib/auth-helpers';
import { sendVerificationEmail, verifyEmail as verifyEmailAddress, resendVerificationEmail } from '@/lib/email-verification';
import { initiatePasswordReset, resetPassword as resetUserPassword } from '@/lib/password-reset';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Result type for server actions
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Sign up input schema
 */
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Sign in input schema
 */
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Reset password input schema
 */
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Update password input schema
 */
const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

/**
 * Verify email input schema
 */
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Resend verification input schema
 */
const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// ============================================
// AUTHENTICATION ACTIONS
// ============================================

/**
 * Sign up a new user
 *
 * Creates a new user account with email and password.
 * Sends a verification email to the user.
 *
 * @param input - Sign up data (email, password, firstName, lastName)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await signUp({
 *   email: 'user@example.com',
 *   password: 'SecurePassword123!',
 *   firstName: 'John',
 *   lastName: 'Doe',
 * });
 */
export async function signUp(input: SignUpInput): Promise<ActionResult<{ userId: string }>> {
  try {
    // Validate input
    const validatedFields = signUpSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { email, password, firstName, lastName } = validatedFields.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.error || 'Password does not meet requirements',
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'CUSTOMER',
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    await sendVerificationEmail(user.id, baseUrl);

    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { userId: user.id },
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: 'An error occurred during sign up. Please try again.',
    };
  }
}

/**
 * Sign in a user
 *
 * Authenticates a user with email and password.
 *
 * @param input - Sign in data (email, password)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await signIn({
 *   email: 'user@example.com',
 *   password: 'SecurePassword123!',
 * });
 */
export async function signIn(input: SignInInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = signInSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { email, password } = validatedFields.data;

    // Attempt to sign in with NextAuth
    const result = await nextAuthSignIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'An error occurred during sign in. Please try again.',
    };
  }
}

/**
 * Sign out the current user
 *
 * Ends the user's session and redirects to the home page.
 *
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await signOut();
 */
export async function signOut(): Promise<ActionResult> {
  try {
    await nextAuthSignOut({ redirect: false });

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: 'An error occurred during sign out. Please try again.',
    };
  }
}

/**
 * Request a password reset
 *
 * Sends a password reset email to the user.
 *
 * @param input - Reset password data (email)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await resetPassword({ email: 'user@example.com' });
 */
export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = resetPasswordSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { email } = validatedFields.data;

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Initiate password reset
    const result = await initiatePasswordReset(email, baseUrl);

    return {
      success: result.success,
      error: result.success ? undefined : result.message,
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: 'An error occurred while requesting a password reset. Please try again.',
    };
  }
}

/**
 * Update password with reset token
 *
 * Updates the user's password using a valid reset token.
 *
 * @param input - Update password data (token, newPassword)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updatePassword({
 *   token: 'reset-token-from-email',
 *   newPassword: 'NewSecurePassword123!',
 * });
 */
export async function updatePassword(input: UpdatePasswordInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = updatePasswordSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { token, newPassword } = validatedFields.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.error || 'Password does not meet requirements',
      };
    }

    // Reset password
    const result = await resetUserPassword(token, newPassword);

    return {
      success: result.success,
      error: result.success ? undefined : result.message,
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: 'An error occurred while updating your password. Please try again.',
    };
  }
}

/**
 * Verify email address
 *
 * Verifies a user's email address using a verification token.
 *
 * @param input - Verify email data (token)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await verifyEmail({ token: 'verification-token-from-email' });
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = verifyEmailSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { token } = validatedFields.data;

    // Verify email
    const result = await verifyEmailAddress(token);

    if (result.success) {
      revalidatePath('/', 'layout');
    }

    return {
      success: result.success,
      error: result.success ? undefined : result.message,
    };
  } catch (error) {
    console.error('Verify email error:', error);
    return {
      success: false,
      error: 'An error occurred while verifying your email. Please try again.',
    };
  }
}

/**
 * Resend verification email
 *
 * Sends a new verification email to the user.
 *
 * @param input - Resend verification data (email)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await resendVerification({ email: 'user@example.com' });
 */
export async function resendVerification(input: ResendVerificationInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = resendVerificationSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { email } = validatedFields.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { success: true };
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: 'Email is already verified',
      };
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Resend verification email
    const result = await resendVerificationEmail(user.id, baseUrl);

    return {
      success: result.success,
      error: result.success ? undefined : result.message,
    };
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      error: 'An error occurred while resending the verification email. Please try again.',
    };
  }
}
