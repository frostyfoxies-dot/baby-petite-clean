import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/session';
import { addressSchema } from '@/lib/validators';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
} from '@/lib/errors';
import { AddressType } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

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

export interface AddressesListResponse {
  addresses: AddressResponse[];
}

const createAddressSchema = addressSchema.extend({
  type: z.nativeEnum(AddressType).optional().default(AddressType.SHIPPING),
});

// ============================================================================
// GET /api/user/addresses - List user addresses
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get user's addresses
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    const response: AddressesListResponse = {
      addresses: addresses.map((addr) => ({
        id: addr.id,
        firstName: addr.firstName,
        lastName: addr.lastName,
        company: addr.company,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
        phone: addr.phone,
        isDefault: addr.isDefault,
        type: addr.type,
        createdAt: addr.createdAt,
        updatedAt: addr.updatedAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/user/addresses - Create address
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAddressSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const data = validationResult.data;

    // If setting as default, unset other defaults of same type
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type: data.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        firstName: data.name.split(' ')[0] || data.name,
        lastName: data.name.split(' ').slice(1).join(' ') || '',
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        zip: data.postalCode,
        country: data.country,
        phone: data.phone,
        isDefault: data.isDefault,
        type: data.type,
      },
    });

    const response: AddressResponse = {
      id: address.id,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault,
      type: address.type,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
