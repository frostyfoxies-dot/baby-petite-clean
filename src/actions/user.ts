'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth-helpers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';

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
 * Update profile input schema
 */
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number').optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Update email input schema
 */
const updateEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;

/**
 * Delete account input schema
 */
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// ============================================
// USER ACTIONS
// ============================================

/**
 * Update user profile
 *
 * Updates the current user's profile information (firstName, lastName, phone).
 *
 * @param input - Profile update data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateProfile({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   phone: '+1234567890',
 * });
 */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to update your profile');
    }

    // Validate input
    const validatedFields = updateProfileSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { firstName, lastName, phone } = validatedFields.data;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    revalidatePath('/account', 'layout');
    revalidatePath('/account/profile');

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating your profile. Please try again.',
    };
  }
}

/**
 * Update user email
 *
 * Updates the current user's email address after verifying their password.
 * Sends a verification email to the new email address.
 *
 * @param input - Email update data (newEmail, password)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateEmail({
 *   newEmail: 'newemail@example.com',
 *   password: 'currentPassword',
 * });
 */
export async function updateEmail(input: UpdateEmailInput): Promise<ActionResult<{ message: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to update your email');
    }

    // Validate input
    const validatedFields = updateEmailSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { newEmail, password } = validatedFields.data;

    // Check if new email is different from current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return {
        success: false,
        error: 'New email must be different from your current email',
      };
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, userWithPassword.password);
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Incorrect password',
      };
    }

    // Update email and reset verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail.toLowerCase(),
        emailVerified: null,
      },
    });

    // TODO: Send verification email to new email address

    revalidatePath('/account', 'layout');
    revalidatePath('/account/profile');

    return {
      success: true,
      data: { message: 'Email updated. Please verify your new email address.' },
    };
  } catch (error) {
    console.error('Update email error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating your email. Please try again.',
    };
  }
}

/**
 * Delete user account
 *
 * Permanently deletes the current user's account after verifying their password.
 * This action is irreversible.
 *
 * @param input - Delete account data (password)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await deleteAccount({ password: 'currentPassword' });
 */
export async function deleteAccount(input: DeleteAccountInput): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to delete your account');
    }

    // Validate input
    const validatedFields = deleteAccountSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { password } = validatedFields.data;

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, userWithPassword.password);
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Incorrect password',
      };
    }

    // Check for active orders (pending, processing, or shipped)
    const activeOrders = await prisma.order.count({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING', 'PROCESSING', 'SHIPPED'],
        },
      },
    });

    if (activeOrders > 0) {
      return {
        success: false,
        error: 'Cannot delete account with active orders. Please complete or cancel your pending orders first.',
      };
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id },
    });

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while deleting your account. Please try again.',
    };
  }
}

/**
 * Upload user avatar
 *
 * Uploads and updates the current user's avatar image.
 *
 * @param formData - FormData containing the avatar file
 * @returns Result object with the new avatar URL or error
 *
 * @example
 * const formData = new FormData();
 * formData.append('avatar', file);
 * const result = await uploadAvatar(formData);
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ avatarUrl: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to upload an avatar');
    }

    // Get file from form data
    const file = formData.get('avatar') as File | null;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File is too large. Maximum size is 5MB.',
      };
    }

    // TODO: Implement actual file upload to storage service (S3, Cloudinary, etc.)
    // For now, we'll create a data URL for demonstration
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update user avatar
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: dataUrl },
    });

    revalidatePath('/account', 'layout');
    revalidatePath('/account/profile');

    return {
      success: true,
      data: { avatarUrl: dataUrl },
    };
  } catch (error) {
    console.error('Upload avatar error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while uploading your avatar. Please try again.',
    };
  }
}

/**
 * Get user profile
 *
 * Retrieves the current user's profile information.
 *
 * @returns Result object with user profile data or error
 *
 * @example
 * const result = await getUserProfile();
 */
export async function getUserProfile(): Promise<ActionResult<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  emailVerified: Date | null;
  createdAt: Date;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view your profile');
    }

    // Get full user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!userData) {
      throw new NotFoundError('User not found');
    }

    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching your profile. Please try again.',
    };
  }
}

/**
 * Change password input schema
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Change user password
 *
 * Changes the current user's password after verifying the current password.
 *
 * @param input - Password change data (currentPassword, newPassword, confirmPassword)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await changePassword({
 *   currentPassword: 'currentPassword123',
 *   newPassword: 'newPassword456',
 *   confirmPassword: 'newPassword456',
 * });
 */
export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to change your password');
    }

    // Validate input
    const validatedFields = changePasswordSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const passwordMatch = await verifyPassword(currentPassword, userWithPassword.password);
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Validate new password strength
    const { validatePasswordStrength } = await import('@/lib/auth-helpers');
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.error || 'Password does not meet requirements',
      };
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while changing your password. Please try again.',
    };
  }
}
