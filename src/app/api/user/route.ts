import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/session';
import { userProfileSchema } from '@/lib/validators';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

// ============================================================================
// GET /api/user - Get current user profile
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get full user details
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!userDetails) {
      throw new NotFoundError('User not found');
    }

    const response: UserProfileResponse = {
      id: userDetails.id,
      email: userDetails.email,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      phone: userDetails.phone,
      avatar: userDetails.avatar,
      role: userDetails.role,
      emailVerified: userDetails.emailVerified,
      createdAt: userDetails.createdAt,
      updatedAt: userDetails.updatedAt,
      lastLoginAt: userDetails.lastLoginAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/user - Update user profile
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = userProfileSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Build update data
    const updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
    } = {};

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    const response: UserProfileResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      emailVerified: updatedUser.emailVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      lastLoginAt: updatedUser.lastLoginAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
