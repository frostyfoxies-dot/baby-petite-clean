import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { addressSchema } from '@/lib/validators';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors';
import { AddressType } from '@prisma/client';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const updateAddressSchema = addressSchema.partial();

export interface AddressResponse {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  type: AddressType;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PATCH /api/user/addresses/[addressId] - Update address
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Find address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    // Check ownership
    if (address.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to update this address');
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateAddressSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // Build update data
    const updateData: {
      firstName?: string;
      lastName?: string;
      line1?: string;
      line2?: string | null;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      phone?: string | null;
      isDefault?: boolean;
    } = {};

    if (data.name !== undefined) {
      updateData.firstName = data.name.split(' ')[0] || data.name;
      updateData.lastName = data.name.split(' ').slice(1).join(' ') || '';
    }
    if (data.line1 !== undefined) updateData.line1 = data.line1;
    if (data.line2 !== undefined) updateData.line2 = data.line2;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.postalCode !== undefined) updateData.zip = data.postalCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    // If setting as default, unset other defaults of same type
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type: address.type,
          isDefault: true,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    const response: AddressResponse = {
      id: updatedAddress.id,
      firstName: updatedAddress.firstName,
      lastName: updatedAddress.lastName,
      company: updatedAddress.company,
      line1: updatedAddress.line1,
      line2: updatedAddress.line2,
      city: updatedAddress.city,
      state: updatedAddress.state,
      zip: updatedAddress.zip,
      country: updatedAddress.country,
      phone: updatedAddress.phone,
      isDefault: updatedAddress.isDefault,
      type: updatedAddress.type,
      createdAt: updatedAddress.createdAt,
      updatedAt: updatedAddress.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/user/addresses/[addressId] - Delete address
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Find address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    // Check ownership
    if (address.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to delete this address');
    }

    // Delete address
    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
