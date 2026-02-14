'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
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
 * Add to wishlist input schema
 */
const addToWishlistSchema = z.object({
  variantId: z.string().cuid('Invalid variant ID'),
  notes: z.string().max(500).optional(),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;

/**
 * Remove from wishlist input schema
 */
const removeFromWishlistSchema = z.object({
  itemId: z.string().cuid('Invalid item ID'),
});

export type RemoveFromWishlistInput = z.infer<typeof removeFromWishlistSchema>;

/**
 * Move wishlist to cart input schema
 */
const moveWishlistToCartSchema = z.object({
  itemId: z.string().cuid('Invalid item ID'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(99).optional().default(1),
});

export type MoveWishlistToCartInput = z.infer<typeof moveWishlistToCartSchema>;

/**
 * Create wishlist input schema
 */
const createWishlistSchema = z.object({
  name: z.string().min(1, 'Wishlist name is required').max(100),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;

/**
 * Delete wishlist input schema
 */
const deleteWishlistSchema = z.object({
  wishlistId: z.string().cuid('Invalid wishlist ID'),
});

export type DeleteWishlistInput = z.infer<typeof deleteWishlistSchema>;

// ============================================
// WISHLIST ACTIONS
// ============================================

/**
 * Add an item to the wishlist
 *
 * Adds a product variant to the user's wishlist.
 *
 * @param input - Add to wishlist data (variantId, notes)
 * @returns Result object with item details or error
 *
 * @example
 * const result = await addToWishlist({
 *   variantId: 'variant123',
 *   notes: 'For baby shower',
 * });
 */
export async function addToWishlist(input: AddToWishlistInput): Promise<ActionResult<{ itemId: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to add items to your wishlist');
    }

    // Validate input
    const validatedFields = addToWishlistSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { variantId, notes } = validatedFields.data;

    // Verify variant exists
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

    // Get or create user's wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId: user.id,
          name: 'My Wishlist',
          isDefault: true,
        },
      });
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: variant.product.id,
      },
    });

    if (existingItem) {
      return {
        success: false,
        error: 'This item is already in your wishlist',
      };
    }

    // Add item to wishlist
    const item = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: variant.product.id,
        variantId,
        notes,
      },
    });

    revalidatePath('/wishlist');
    revalidatePath('/account/wishlist');
    revalidateTag('wishlist');

    return {
      success: true,
      data: { itemId: item.id },
    };
  } catch (error) {
    console.error('Add to wishlist error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while adding to your wishlist. Please try again.',
    };
  }
}

/**
 * Remove an item from the wishlist
 *
 * Removes an item from the user's wishlist.
 *
 * @param itemId - Wishlist item ID to remove
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await removeFromWishlist('item123');
 */
export async function removeFromWishlist(itemId: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to remove items from your wishlist');
    }

    // Validate input
    const validatedFields = removeFromWishlistSchema.safeParse({ itemId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find wishlist item
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        wishlist: { userId: user.id },
      },
    });

    if (!item) {
      throw new NotFoundError('Wishlist item not found');
    }

    // Delete item
    await prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    revalidatePath('/wishlist');
    revalidatePath('/account/wishlist');
    revalidateTag('wishlist');

    return { success: true };
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while removing from your wishlist. Please try again.',
    };
  }
}

/**
 * Move a wishlist item to cart
 *
 * Moves an item from the wishlist to the cart.
 *
 * @param itemId - Wishlist item ID to move
 * @param quantity - Quantity to add to cart (default: 1)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await moveWishlistToCart('item123', 2);
 */
export async function moveWishlistToCart(itemId: string, quantity: number = 1): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to move items to your cart');
    }

    // Validate input
    const validatedFields = moveWishlistToCartSchema.safeParse({ itemId, quantity });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find wishlist item
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        wishlist: { userId: user.id },
      },
      include: {
        variant: {
          include: {
            product: { select: { isActive: true } },
            inventory: { select: { available: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Wishlist item not found');
    }

    // Check if product is still available
    if (!item.variant.product.isActive) {
      return {
        success: false,
        error: 'This product is no longer available',
      };
    }

    // Check inventory
    const available = item.variant.inventory?.available ?? 0;
    if (available < quantity) {
      return {
        success: false,
        error: `Only ${available} items available in stock`,
      };
    }

    // Add to cart
    // Note: This would typically call the cart action, but to avoid circular dependencies,
    // we'll implement the cart logic here
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
    });

    if (!cart) {
      await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    const cartId = cart?.id || (await prisma.cart.findFirst({ where: { userId: user.id } }))!.id;

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId: item.variantId!,
        },
      },
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      if (newQuantity > available) {
        return {
          success: false,
          error: `Cannot add more items. Only ${available - existingCartItem.quantity} additional items available`,
        };
      }

      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId,
          variantId: item.variantId!,
          quantity,
        },
      });
    }

    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    revalidatePath('/wishlist');
    revalidatePath('/account/wishlist');
    revalidatePath('/cart');
    revalidateTag('wishlist');
    revalidateTag('cart');

    return { success: true };
  } catch (error) {
    console.error('Move wishlist to cart error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while moving the item to your cart. Please try again.',
    };
  }
}

/**
 * Create a new wishlist
 *
 * Creates a new wishlist for the user.
 *
 * @param input - Wishlist data (name)
 * @returns Result object with wishlist details or error
 *
 * @example
 * const result = await createWishlist({ name: 'Baby Shower Gifts' });
 */
export async function createWishlist(input: CreateWishlistInput): Promise<ActionResult<{ wishlistId: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to create a wishlist');
    }

    // Validate input
    const validatedFields = createWishlistSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name } = validatedFields.data;

    // Check if user already has a wishlist
    const existingWishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
    });

    if (existingWishlist) {
      return {
        success: false,
        error: 'You already have a wishlist. You can update your existing wishlist instead.',
      };
    }

    // Create wishlist
    const wishlist = await prisma.wishlist.create({
      data: {
        userId: user.id,
        name,
        isDefault: true,
      },
    });

    revalidatePath('/wishlist');
    revalidatePath('/account/wishlist');
    revalidateTag('wishlist');

    return {
      success: true,
      data: { wishlistId: wishlist.id },
    };
  } catch (error) {
    console.error('Create wishlist error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while creating your wishlist. Please try again.',
    };
  }
}

/**
 * Delete a wishlist
 *
 * Deletes a wishlist and all its items.
 *
 * @param wishlistId - Wishlist ID to delete
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await deleteWishlist('wishlist123');
 */
export async function deleteWishlist(wishlistId: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to delete a wishlist');
    }

    // Validate input
    const validatedFields = deleteWishlistSchema.safeParse({ wishlistId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find wishlist
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        userId: user.id,
      },
    });

    if (!wishlist) {
      throw new NotFoundError('Wishlist not found');
    }

    // Delete wishlist (cascade will delete items)
    await prisma.wishlist.delete({
      where: { id: wishlistId },
    });

    revalidatePath('/wishlist');
    revalidatePath('/account/wishlist');
    revalidateTag('wishlist');

    return { success: true };
  } catch (error) {
    console.error('Delete wishlist error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while deleting your wishlist. Please try again.',
    };
  }
}

/**
 * Get the user's wishlist
 *
 * Retrieves the current user's wishlist with all items.
 *
 * @returns Result object with wishlist data or error
 *
 * @example
 * const result = await getWishlist();
 */
export async function getWishlist(): Promise<ActionResult<{
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    notes: string | null;
    createdAt: Date;
    product: {
      id: string;
      name: string;
      slug: string;
      basePrice: number;
      compareAtPrice: number | null;
      images: Array<{ url: string; altText: string | null }>;
    };
    variant: {
      id: string;
      name: string;
      size: string;
      color: string | null;
      price: number;
      compareAtPrice: number | null;
      sku: string;
      inventory: {
        available: number;
      } | null;
    } | null;
  }>;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view your wishlist');
    }

    // Find wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                compareAtPrice: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true, altText: true },
                },
              },
            },
            variant: {
              include: {
                inventory: {
                  select: { available: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wishlist) {
      return {
        success: true,
        data: {
          id: '',
          name: 'My Wishlist',
          isDefault: true,
          createdAt: new Date(),
          items: [],
        },
      };
    }

    return {
      success: true,
      data: {
        id: wishlist.id,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        createdAt: wishlist.createdAt,
        items: wishlist.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          notes: item.notes,
          createdAt: item.createdAt,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            basePrice: Number(item.product.basePrice),
            compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
            images: item.product.images,
          },
          variant: item.variant ? {
            id: item.variant.id,
            name: item.variant.name,
            size: item.variant.size,
            color: item.variant.color,
            price: Number(item.variant.price),
            compareAtPrice: item.variant.compareAtPrice ? Number(item.variant.compareAtPrice) : null,
            sku: item.variant.sku,
            inventory: item.variant.inventory,
          } : null,
        })),
      },
    };
  } catch (error) {
    console.error('Get wishlist error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching your wishlist. Please try again.',
    };
  }
}

/**
 * Check if a product is in the user's wishlist
 *
 * Checks if a specific product variant is in the user's wishlist.
 *
 * @param variantId - Variant ID to check
 * @returns Result object with boolean indicating if item is in wishlist
 *
 * @example
 * const result = await isInWishlist('variant123');
 */
export async function isInWishlist(variantId: string): Promise<ActionResult<{ inWishlist: boolean; itemId?: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: true,
        data: { inWishlist: false },
      };
    }

    // Find wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
    });

    if (!wishlist) {
      return {
        success: true,
        data: { inWishlist: false },
      };
    }

    // Find item
    const item = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        variantId,
      },
    });

    return {
      success: true,
      data: {
        inWishlist: !!item,
        itemId: item?.id,
      },
    };
  } catch (error) {
    console.error('Check in wishlist error:', error);
    return {
      success: false,
      error: 'An error occurred while checking your wishlist. Please try again.',
    };
  }
}
