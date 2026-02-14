'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';
import { RegistryStatus, Priority } from '@prisma/client';

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
 * Create registry input schema
 */
const createRegistrySchema = z.object({
  name: z.string().min(1, 'Registry name is required').max(200),
  description: z.string().max(1000).optional(),
  eventDate: z.string().datetime().optional().nullable(),
});

export type CreateRegistryInput = z.infer<typeof createRegistrySchema>;

/**
 * Update registry input schema
 */
const updateRegistrySchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
  name: z.string().min(1, 'Registry name is required').max(200).optional(),
  description: z.string().max(1000).optional(),
  eventDate: z.string().datetime().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export type UpdateRegistryInput = z.infer<typeof updateRegistrySchema>;

/**
 * Delete registry input schema
 */
const deleteRegistrySchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
});

export type DeleteRegistryInput = z.infer<typeof deleteRegistrySchema>;

/**
 * Add registry item input schema
 */
const addRegistryItemSchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
  variantId: z.string().cuid('Invalid variant ID'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(99),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  notes: z.string().max(500).optional(),
});

export type AddRegistryItemInput = z.infer<typeof addRegistryItemSchema>;

/**
 * Update registry item input schema
 */
const updateRegistryItemSchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
  itemId: z.string().cuid('Invalid item ID'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(99).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateRegistryItemInput = z.infer<typeof updateRegistryItemSchema>;

/**
 * Remove registry item input schema
 */
const removeRegistryItemSchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
  itemId: z.string().cuid('Invalid item ID'),
});

export type RemoveRegistryItemInput = z.infer<typeof removeRegistryItemSchema>;

/**
 * Purchase registry item input schema
 */
const purchaseRegistryItemSchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
  itemId: z.string().cuid('Invalid item ID'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(99),
});

export type PurchaseRegistryItemInput = z.infer<typeof purchaseRegistryItemSchema>;

/**
 * Share registry input schema
 */
const shareRegistrySchema = z.object({
  shareCode: z.string().min(1, 'Share code is required'),
  emails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required').max(20, 'Maximum 20 emails'),
  message: z.string().max(1000).optional(),
});

export type ShareRegistryInput = z.infer<typeof shareRegistrySchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique share code for a registry
 */
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// REGISTRY ACTIONS
// ============================================

/**
 * Create a new registry
 *
 * Creates a new baby registry for the current user.
 *
 * @param input - Registry data (name, description, eventDate)
 * @returns Result object with registry details or error
 *
 * @example
 * const result = await createRegistry({
 *   name: 'Baby Smith Registry',
 *   description: 'Welcome gifts for our little one',
 *   eventDate: '2024-06-15T00:00:00Z',
 * });
 */
export async function createRegistry(input: CreateRegistryInput): Promise<ActionResult<{
  shareCode: string;
  registryId: string;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to create a registry');
    }

    // Validate input
    const validatedFields = createRegistrySchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, description, eventDate } = validatedFields.data;

    // Check if user already has a registry
    const existingRegistry = await prisma.registry.findUnique({
      where: { userId: user.id },
    });

    if (existingRegistry) {
      return {
        success: false,
        error: 'You already have a registry. You can update your existing registry instead.',
      };
    }

    // Generate unique share code
    let shareCode = generateShareCode();
    let codeExists = await prisma.registry.findUnique({ where: { shareCode } });
    while (codeExists) {
      shareCode = generateShareCode();
      codeExists = await prisma.registry.findUnique({ where: { shareCode } });
    }

    // Create registry
    const registry = await prisma.registry.create({
      data: {
        userId: user.id,
        name,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        shareCode,
        isPublic: true,
        status: RegistryStatus.ACTIVE,
      },
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidateTag('registry');

    return {
      success: true,
      data: {
        shareCode: registry.shareCode,
        registryId: registry.id,
      },
    };
  } catch (error) {
    console.error('Create registry error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while creating your registry. Please try again.',
    };
  }
}

/**
 * Update a registry
 *
 * Updates an existing registry by share code.
 *
 * @param shareCode - Registry share code
 * @param data - Updated registry data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateRegistry('ABC12345', {
 *   name: 'Updated Registry Name',
 *   eventDate: '2024-07-01T00:00:00Z',
 * });
 */
export async function updateRegistry(
  shareCode: string,
  data: Partial<UpdateRegistryInput>
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to update a registry');
    }

    // Validate input
    const validatedFields = updateRegistrySchema.partial().safeParse({ shareCode, ...data });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        shareCode,
        userId: user.id,
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    // Update registry
    await prisma.registry.update({
      where: { id: registry.id },
      data: updateData,
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidatePath(`/registry/${shareCode}`);
    revalidateTag('registry');

    return { success: true };
  } catch (error) {
    console.error('Update registry error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating your registry. Please try again.',
    };
  }
}

/**
 * Delete a registry
 *
 * Deletes a registry by share code.
 *
 * @param shareCode - Registry share code
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await deleteRegistry('ABC12345');
 */
export async function deleteRegistry(shareCode: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to delete a registry');
    }

    // Validate input
    const validatedFields = deleteRegistrySchema.safeParse({ shareCode });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        shareCode,
        userId: user.id,
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Delete registry (cascade will delete items)
    await prisma.registry.delete({
      where: { id: registry.id },
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidateTag('registry');

    return { success: true };
  } catch (error) {
    console.error('Delete registry error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while deleting your registry. Please try again.',
    };
  }
}

/**
 * Add an item to a registry
 *
 * Adds a product variant to a registry.
 *
 * @param input - Add registry item data
 * @returns Result object with item details or error
 *
 * @example
 * const result = await addRegistryItem({
 *   shareCode: 'ABC12345',
 *   variantId: 'variant123',
 *   quantity: 2,
 *   priority: 'HIGH',
 * });
 */
export async function addRegistryItem(input: AddRegistryItemInput): Promise<ActionResult<{ itemId: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to add items to a registry');
    }

    // Validate input
    const validatedFields = addRegistryItemSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { shareCode, variantId, quantity, priority, notes } = validatedFields.data;

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        shareCode,
        userId: user.id,
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Get variant and product info
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { id: true, name: true, slug: true, isActive: true } },
      },
    });

    if (!variant || !variant.product.isActive) {
      return {
        success: false,
        error: 'Product not available',
      };
    }

    // Check if item already exists in registry
    const existingItem = await prisma.registryItem.findFirst({
      where: {
        registryId: registry.id,
        variantId,
      },
    });

    if (existingItem) {
      return {
        success: false,
        error: 'This item is already in your registry',
      };
    }

    // Add item to registry
    const item = await prisma.registryItem.create({
      data: {
        registryId: registry.id,
        productId: variant.product.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantId,
        variantName: variant.name,
        quantity,
        priority: priority as Priority,
        notes,
      },
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidatePath(`/registry/${shareCode}`);
    revalidateTag('registry');

    return {
      success: true,
      data: { itemId: item.id },
    };
  } catch (error) {
    console.error('Add registry item error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while adding the item to your registry. Please try again.',
    };
  }
}

/**
 * Update a registry item
 *
 * Updates an existing item in a registry.
 *
 * @param shareCode - Registry share code
 * @param itemId - Item ID to update
 * @param data - Updated item data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateRegistryItem('ABC12345', 'item123', {
 *   quantity: 3,
 *   priority: 'HIGH',
 * });
 */
export async function updateRegistryItem(
  shareCode: string,
  itemId: string,
  data: Partial<Omit<UpdateRegistryItemInput, 'shareCode' | 'itemId'>>
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to update registry items');
    }

    // Validate input
    const validatedFields = updateRegistryItemSchema.partial().safeParse({ shareCode, itemId, ...data });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        shareCode,
        userId: user.id,
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Find item
    const item = await prisma.registryItem.findFirst({
      where: {
        id: itemId,
        registryId: registry.id,
      },
    });

    if (!item) {
      throw new NotFoundError('Registry item not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.priority !== undefined) updateData.priority = data.priority as Priority;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update item
    await prisma.registryItem.update({
      where: { id: itemId },
      data: updateData,
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidatePath(`/registry/${shareCode}`);
    revalidateTag('registry');

    return { success: true };
  } catch (error) {
    console.error('Update registry item error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating the registry item. Please try again.',
    };
  }
}

/**
 * Remove an item from a registry
 *
 * Removes an item from a registry.
 *
 * @param shareCode - Registry share code
 * @param itemId - Item ID to remove
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await removeRegistryItem('ABC12345', 'item123');
 */
export async function removeRegistryItem(shareCode: string, itemId: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to remove items from a registry');
    }

    // Validate input
    const validatedFields = removeRegistryItemSchema.safeParse({ shareCode, itemId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        shareCode,
        userId: user.id,
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Find and delete item
    const item = await prisma.registryItem.findFirst({
      where: {
        id: itemId,
        registryId: registry.id,
      },
    });

    if (!item) {
      throw new NotFoundError('Registry item not found');
    }

    await prisma.registryItem.delete({
      where: { id: itemId },
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidatePath(`/registry/${shareCode}`);
    revalidateTag('registry');

    return { success: true };
  } catch (error) {
    console.error('Remove registry item error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while removing the item from your registry. Please try again.',
    };
  }
}

/**
 * Purchase a registry item (for gift givers)
 *
 * Marks an item as purchased and updates the quantity purchased.
 *
 * @param input - Purchase registry item data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await purchaseRegistryItem({
 *   shareCode: 'ABC12345',
 *   itemId: 'item123',
 *   quantity: 1,
 * });
 */
export async function purchaseRegistryItem(input: PurchaseRegistryItemInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = purchaseRegistryItemSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { shareCode, itemId, quantity } = validatedFields.data;

    // Find registry
    const registry = await prisma.registry.findUnique({
      where: { shareCode },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    if (!registry.isPublic) {
      return {
        success: false,
        error: 'This registry is private',
      };
    }

    // Find item
    const item = await prisma.registryItem.findFirst({
      where: {
        id: itemId,
        registryId: registry.id,
      },
    });

    if (!item) {
      throw new NotFoundError('Registry item not found');
    }

    // Check if enough items are available
    const remaining = item.quantity - item.quantityPurchased;
    if (quantity > remaining) {
      return {
        success: false,
        error: `Only ${remaining} items remaining`,
      };
    }

    // Update quantity purchased
    await prisma.registryItem.update({
      where: { id: itemId },
      data: {
        quantityPurchased: item.quantityPurchased + quantity,
      },
    });

    revalidatePath(`/registry/${shareCode}`);
    revalidateTag('registry');

    return { success: true };
  } catch (error) {
    console.error('Purchase registry item error:', error);
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while purchasing the registry item. Please try again.',
    };
  }
}

/**
 * Share a registry via email
 *
 * Sends an email invitation to view a registry.
 *
 * @param input - Share registry data (shareCode, emails, message)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await shareRegistry({
 *   shareCode: 'ABC12345',
 *   emails: ['friend1@example.com', 'friend2@example.com'],
 *   message: 'Check out our baby registry!',
 * });
 */
export async function shareRegistry(input: ShareRegistryInput): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to share a registry');
    }

    // Validate input
    const validatedFields = shareRegistrySchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { shareCode, emails, message } = validatedFields.data;

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        shareCode,
        userId: user.id,
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Get user info for the email
    const userName = [(user as any).firstName, (user as any).lastName].filter(Boolean).join(' ') || 'Someone';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const shareUrl = `${siteUrl}/registry/${registry.shareCode}`;

    // Send emails to each recipient
    const emailPromises = emails.map(async (email) => {
      const emailContent = message
        ? `${userName} has shared their baby registry with you!\n\nPersonal message: ${message}\n\nView their registry: ${shareUrl}`
        : `${userName} has shared their baby registry with you!\n\nView their registry: ${shareUrl}`;

      const { sendEmail } = await import('@/lib/email/service');
      return sendEmail({
        to: email,
        subject: `${userName} shared their baby registry with you`,
        text: emailContent,
      });
    });

    const results = await Promise.all(emailPromises);
    const hasErrors = results.some((result) => !result.success);

    if (hasErrors) {
      console.error('Failed to send some registry share emails:', results);
      return {
        success: false,
        error: 'Failed to send some emails. Please try again.',
      };
    }

    console.log('Sharing registry', shareCode, 'with emails:', emails);

    revalidateTag('registry');

    return { success: true };
  } catch (error) {
    console.error('Share registry error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while sharing your registry. Please try again.',
    };
  }
}

/**
 * Get a registry by share code
 *
 * Retrieves a registry and its items by share code.
 *
 * @param shareCode - Registry share code
 * @returns Result object with registry data or error
 *
 * @example
 * const result = await getRegistry('ABC12345');
 */
export async function getRegistry(shareCode: string): Promise<ActionResult<{
  id: string;
  name: string;
  description: string | null;
  eventDate: Date | null;
  shareCode: string;
  isPublic: boolean;
  status: RegistryStatus;
  createdAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    variantId: string | null;
    variantName: string | null;
    quantity: number;
    quantityPurchased: number;
    priority: Priority;
    notes: string | null;
  }>;
  isOwner: boolean;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();

    // Find registry
    const registry = await prisma.registry.findUnique({
      where: { shareCode },
      include: {
        items: {
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Check if user can view this registry
    const isOwner = user?.id === registry.userId;
    if (!registry.isPublic && !isOwner) {
      return {
        success: false,
        error: 'This registry is private',
      };
    }

    return {
      success: true,
      data: {
        id: registry.id,
        name: registry.name,
        description: registry.description,
        eventDate: registry.eventDate,
        shareCode: registry.shareCode,
        isPublic: registry.isPublic,
        status: registry.status,
        createdAt: registry.createdAt,
        items: registry.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          quantityPurchased: item.quantityPurchased,
          priority: item.priority,
          notes: item.notes,
        })),
        isOwner,
      },
    };
  } catch (error) {
    console.error('Get registry error:', error);
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching the registry. Please try again.',
    };
  }
}

/**
 * Get the current user's registry
 *
 * Retrieves the current user's registry if it exists.
 *
 * @returns Result object with registry data or error
 *
 * @example
 * const result = await getUserRegistry();
 */
export async function getUserRegistry(): Promise<ActionResult<{
  id: string;
  name: string;
  description: string | null;
  eventDate: Date | null;
  shareCode: string;
  isPublic: boolean;
  status: RegistryStatus;
  createdAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    variantId: string | null;
    variantName: string | null;
    quantity: number;
    quantityPurchased: number;
    priority: Priority;
    notes: string | null;
  }>;
} | null>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view your registry');
    }

    // Find registry
    const registry = await prisma.registry.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!registry) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        id: registry.id,
        name: registry.name,
        description: registry.description,
        eventDate: registry.eventDate,
        shareCode: registry.shareCode,
        isPublic: registry.isPublic,
        status: registry.status,
        createdAt: registry.createdAt,
        items: registry.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          quantityPurchased: item.quantityPurchased,
          priority: item.priority,
          notes: item.notes,
        })),
      },
    };
  } catch (error) {
    console.error('Get user registry error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching your registry. Please try again.',
    };
  }
}
