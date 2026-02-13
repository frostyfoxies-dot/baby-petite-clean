'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';
import { AddressType } from '@prisma/client';

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
 * Address input schema
 */
const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  company: z.string().max(200).optional().nullable(),
  line1: z.string().min(1, 'Address line 1 is required').max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  zip: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(1, 'Country is required').max(2, 'Use ISO country code'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number').optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  type: z.enum(['SHIPPING', 'BILLING', 'BOTH']).optional().default('SHIPPING'),
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * Set default address input schema
 */
const setDefaultAddressSchema = z.object({
  addressId: z.string().cuid('Invalid address ID'),
  type: z.enum(['SHIPPING', 'BILLING', 'BOTH']),
});

export type SetDefaultAddressInput = z.infer<typeof setDefaultAddressSchema>;

// ============================================
// ADDRESS ACTIONS
// ============================================

/**
 * Create a new address
 *
 * Creates a new address for the current user.
 *
 * @param input - Address data
 * @returns Result object with the created address or error
 *
 * @example
 * const result = await createAddress({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   line1: '123 Main St',
 *   city: 'New York',
 *   state: 'NY',
 *   zip: '10001',
 *   country: 'US',
 *   type: 'SHIPPING',
 * });
 */
export async function createAddress(input: AddressInput): Promise<ActionResult<{ addressId: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to add an address');
    }

    // Validate input
    const validatedFields = addressSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validatedFields.data;

    // If this is set as default, unset any existing default of the same type
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          OR: [
            { type: data.type },
            { type: 'BOTH' },
            ...(data.type === 'BOTH' ? [{ type: 'SHIPPING' }, { type: 'BILLING' }] : []),
          ],
        },
        data: { isDefault: false },
      });
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        phone: data.phone,
        isDefault: data.isDefault,
        type: data.type as AddressType,
      },
    });

    revalidatePath('/account', 'layout');
    revalidatePath('/account/addresses');
    revalidatePath('/checkout');

    return {
      success: true,
      data: { addressId: address.id },
    };
  } catch (error) {
    console.error('Create address error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while creating the address. Please try again.',
    };
  }
}

/**
 * Update an existing address
 *
 * Updates an address belonging to the current user.
 *
 * @param addressId - ID of the address to update
 * @param input - Updated address data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateAddress('address123', {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   line1: '456 Oak Ave',
 *   city: 'Los Angeles',
 *   state: 'CA',
 *   zip: '90001',
 *   country: 'US',
 * });
 */
export async function updateAddress(
  addressId: string,
  input: Partial<AddressInput>
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to update an address');
    }

    // Validate address ID
    if (!addressId) {
      return {
        success: false,
        error: 'Address ID is required',
      };
    }

    // Validate input
    const validatedFields = addressSchema.partial().safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validatedFields.data;

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      throw new NotFoundError('Address not found');
    }

    // If setting as default, unset any existing default of the same type
    if (data.isDefault) {
      const addressType = data.type || existingAddress.type;
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: addressId },
          OR: [
            { type: addressType },
            { type: 'BOTH' },
            ...(addressType === 'BOTH' ? [{ type: 'SHIPPING' }, { type: 'BILLING' }] : []),
          ],
        },
        data: { isDefault: false },
      });
    }

    // Update address
    await prisma.address.update({
      where: { id: addressId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.line1 !== undefined && { line1: data.line1 }),
        ...(data.line2 !== undefined && { line2: data.line2 }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.type !== undefined && { type: data.type as AddressType }),
      },
    });

    revalidatePath('/account', 'layout');
    revalidatePath('/account/addresses');
    revalidatePath('/checkout');

    return { success: true };
  } catch (error) {
    console.error('Update address error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating the address. Please try again.',
    };
  }
}

/**
 * Delete an address
 *
 * Deletes an address belonging to the current user.
 *
 * @param addressId - ID of the address to delete
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await deleteAddress('address123');
 */
export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to delete an address');
    }

    // Validate address ID
    if (!addressId) {
      return {
        success: false,
        error: 'Address ID is required',
      };
    }

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      throw new NotFoundError('Address not found');
    }

    // Delete address
    await prisma.address.delete({
      where: { id: addressId },
    });

    // If deleted address was default, set another as default
    if (existingAddress.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: {
          userId: user.id,
          OR: [
            { type: existingAddress.type },
            { type: 'BOTH' },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    revalidatePath('/account', 'layout');
    revalidatePath('/account/addresses');
    revalidatePath('/checkout');

    return { success: true };
  } catch (error) {
    console.error('Delete address error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while deleting the address. Please try again.',
    };
  }
}

/**
 * Set an address as default
 *
 * Sets the specified address as the default for the given type.
 *
 * @param addressId - ID of the address to set as default
 * @param type - Type of default to set (SHIPPING, BILLING, or BOTH)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await setDefaultAddress('address123', 'SHIPPING');
 */
export async function setDefaultAddress(
  addressId: string,
  type: 'SHIPPING' | 'BILLING' | 'BOTH'
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to set a default address');
    }

    // Validate input
    const validatedFields = setDefaultAddressSchema.safeParse({ addressId, type });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      throw new NotFoundError('Address not found');
    }

    // Unset any existing defaults of the same type
    await prisma.address.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
        OR: [
          { type: type },
          { type: 'BOTH' },
          ...(type === 'BOTH' ? [{ type: 'SHIPPING' }, { type: 'BILLING' }] : []),
        ],
      },
      data: { isDefault: false },
    });

    // Set the new default
    await prisma.address.update({
      where: { id: addressId },
      data: {
        isDefault: true,
        type: type as AddressType,
      },
    });

    revalidatePath('/account', 'layout');
    revalidatePath('/account/addresses');
    revalidatePath('/checkout');

    return { success: true };
  } catch (error) {
    console.error('Set default address error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while setting the default address. Please try again.',
    };
  }
}

/**
 * Get user addresses
 *
 * Retrieves all addresses for the current user.
 *
 * @returns Result object with addresses or error
 *
 * @example
 * const result = await getUserAddresses();
 */
export async function getUserAddresses(): Promise<ActionResult<{
  addresses: Array<{
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
  }>;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view addresses');
    }

    // Get addresses
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      data: { addresses },
    };
  } catch (error) {
    console.error('Get user addresses error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching addresses. Please try again.',
    };
  }
}

/**
 * Get a single address
 *
 * Retrieves a specific address by ID for the current user.
 *
 * @param addressId - ID of the address to retrieve
 * @returns Result object with address or error
 *
 * @example
 * const result = await getAddress('address123');
 */
export async function getAddress(addressId: string): Promise<ActionResult<{
  address: {
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
  };
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view an address');
    }

    // Get address
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    return {
      success: true,
      data: { address },
    };
  } catch (error) {
    console.error('Get address error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching the address. Please try again.',
    };
  }
}
