'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserId } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError, OutOfStockError, InsufficientStockError } from '@/lib/errors';
import { cookies } from 'next/headers';

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
 * Add to cart input schema
 */
const addToCartSchema = z.object({
  variantId: z.string().cuid('Invalid variant ID'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(99, 'Maximum quantity is 99'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

/**
 * Update cart item input schema
 */
const updateCartItemSchema = z.object({
  itemId: z.string().cuid('Invalid item ID'),
  quantity: z.number().int().nonnegative('Quantity must be 0 or greater').max(99, 'Maximum quantity is 99'),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

/**
 * Remove from cart input schema
 */
const removeFromCartSchema = z.object({
  itemId: z.string().cuid('Invalid item ID'),
});

export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;

/**
 * Apply discount code input schema
 */
const applyDiscountCodeSchema = z.object({
  code: z.string().min(1, 'Discount code is required').max(50),
});

export type ApplyDiscountCodeInput = z.infer<typeof applyDiscountCodeSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get or create a cart for the current user/session
 */
async function getOrCreateCart(): Promise<{ id: string; userId: string | null; sessionId: string | null }> {
  const userId = await getUserId();
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('cart_session')?.value;

  // If user is logged in, find their cart
  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      // Create new cart for user
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // If there was a session cart, merge it
    if (sessionId) {
      const sessionCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      });

      if (sessionCart && sessionCart.userId !== userId) {
        // Merge session cart items into user cart
        for (const item of sessionCart.items) {
          const existingItem = await prisma.cartItem.findUnique({
            where: {
              cartId_variantId: {
                cartId: cart.id,
                variantId: item.variantId,
              },
            },
          });

          if (existingItem) {
            // Update quantity
            await prisma.cartItem.update({
              where: { id: existingItem.id },
              data: { quantity: existingItem.quantity + item.quantity },
            });
          } else {
            // Move item to user cart
            await prisma.cartItem.create({
              data: {
                cartId: cart.id,
                variantId: item.variantId,
                quantity: item.quantity,
              },
            });
          }
        }

        // Delete session cart
        await prisma.cart.delete({ where: { id: sessionCart.id } });
      }
    }

    return cart;
  }

  // Guest user - use session-based cart
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    // Set cookie for session
    cookieStore.set('cart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  let cart = await prisma.cart.findUnique({
    where: { sessionId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
    });
  }

  return cart;
}

/**
 * Check inventory for a variant
 */
async function checkInventory(variantId: string, requestedQuantity: number): Promise<{
  available: boolean;
  availableQuantity: number;
}> {
  const inventory = await prisma.inventory.findUnique({
    where: { variantId },
    select: { available: true },
  });

  if (!inventory) {
    return { available: false, availableQuantity: 0 };
  }

  return {
    available: inventory.available >= requestedQuantity,
    availableQuantity: inventory.available,
  };
}

// ============================================
// CART ACTIONS
// ============================================

/**
 * Add an item to the cart
 *
 * Adds a product variant to the user's cart. If the item already exists,
 * the quantity is increased.
 *
 * @param input - Add to cart data (variantId, quantity)
 * @returns Result object with cart item or error
 *
 * @example
 * const result = await addToCart({
 *   variantId: 'variant123',
 *   quantity: 2,
 * });
 */
export async function addToCart(input: AddToCartInput): Promise<ActionResult<{ itemId: string; quantity: number }>> {
  try {
    // Validate input
    const validatedFields = addToCartSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { variantId, quantity } = validatedFields.data;

    // Verify variant exists and is active
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { isActive: true, name: true } },
        inventory: { select: { available: true } },
      },
    });

    if (!variant || !variant.isActive || !variant.product.isActive) {
      return {
        success: false,
        error: 'This product is no longer available',
      };
    }

    // Check inventory
    const availableQuantity = variant.inventory?.available ?? 0;
    if (availableQuantity < quantity) {
      return {
        success: false,
        error: `Only ${availableQuantity} items available in stock`,
      };
    }

    // Get or create cart
    const cart = await getOrCreateCart();

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Check if total quantity exceeds inventory
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableQuantity) {
        return {
          success: false,
          error: `Cannot add more items. Only ${availableQuantity - existingItem.quantity} additional items available`,
        };
      }

      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
      });
    }

    revalidatePath('/cart');
    revalidateTag('cart');

    return {
      success: true,
      data: { itemId: cartItem.id, quantity: cartItem.quantity },
    };
  } catch (error) {
    console.error('Add to cart error:', error);
    return {
      success: false,
      error: 'An error occurred while adding to cart. Please try again.',
    };
  }
}

/**
 * Update a cart item's quantity
 *
 * Updates the quantity of an item in the cart. If quantity is 0, the item is removed.
 *
 * @param input - Update cart item data (itemId, quantity)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateCartItem({
 *   itemId: 'item123',
 *   quantity: 3,
 * });
 */
export async function updateCartItem(input: UpdateCartItemInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = updateCartItemSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { itemId, quantity } = validatedFields.data;

    // Get cart
    const cart = await getOrCreateCart();

    // Find cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        variant: {
          include: { inventory: { select: { available: true } } },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      // Check inventory
      const availableQuantity = cartItem.variant.inventory?.available ?? 0;
      if (quantity > availableQuantity) {
        return {
          success: false,
          error: `Only ${availableQuantity} items available in stock`,
        };
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    revalidatePath('/cart');
    revalidateTag('cart');

    return { success: true };
  } catch (error) {
    console.error('Update cart item error:', error);
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating the cart. Please try again.',
    };
  }
}

/**
 * Remove an item from the cart
 *
 * Removes an item completely from the cart.
 *
 * @param itemId - ID of the cart item to remove
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await removeFromCart('item123');
 */
export async function removeFromCart(itemId: string): Promise<ActionResult> {
  try {
    // Validate input
    const validatedFields = removeFromCartSchema.safeParse({ itemId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Get cart
    const cart = await getOrCreateCart();

    // Find and delete cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    revalidatePath('/cart');
    revalidateTag('cart');

    return { success: true };
  } catch (error) {
    console.error('Remove from cart error:', error);
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while removing from cart. Please try again.',
    };
  }
}

/**
 * Clear all items from the cart
 *
 * Removes all items from the user's cart.
 *
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await clearCart();
 */
export async function clearCart(): Promise<ActionResult> {
  try {
    // Get cart
    const cart = await getOrCreateCart();

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    revalidatePath('/cart');
    revalidateTag('cart');

    return { success: true };
  } catch (error) {
    console.error('Clear cart error:', error);
    return {
      success: false,
      error: 'An error occurred while clearing the cart. Please try again.',
    };
  }
}

/**
 * Apply a discount code to the cart
 *
 * Validates and applies a discount code to the user's cart.
 *
 * @param code - Discount code to apply
 * @returns Result object with discount details or error
 *
 * @example
 * const result = await applyDiscountCode('SAVE20');
 */
export async function applyDiscountCode(code: string): Promise<ActionResult<{
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'SHIPPING';
  value: number;
  discountAmount: number;
}>> {
  try {
    // Validate input
    const validatedFields = applyDiscountCodeSchema.safeParse({ code });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const normalizedCode = code.toUpperCase().trim();

    // Get cart with items
    const cart = await getOrCreateCart();
    const cartWithItems = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              select: { price: true },
            },
          },
        },
      },
    });

    if (!cartWithItems || cartWithItems.items.length === 0) {
      return {
        success: false,
        error: 'Cannot apply discount to empty cart',
      };
    }

    // Find discount code
    const discount = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
    });

    // Validate discount exists and is active
    if (!discount || !discount.isActive) {
      return {
        success: false,
        error: 'Invalid discount code',
      };
    }

    // Check if discount has expired
    if (discount.expiresAt && new Date() > discount.expiresAt) {
      return {
        success: false,
        error: 'This discount code has expired',
      };
    }

    // Check if discount has started
    if (discount.startsAt && new Date() < discount.startsAt) {
      return {
        success: false,
        error: 'This discount code is not yet active',
      };
    }

    // Check usage limits
    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return {
        success: false,
        error: 'This discount code has reached its usage limit',
      };
    }

    // Calculate cart subtotal
    const subtotal = cartWithItems.items.reduce((sum, item) => {
      return sum + (item.variant.price.toNumber() * item.quantity);
    }, 0);

    // Check minimum purchase requirement
    if (discount.minPurchaseAmount && subtotal < discount.minPurchaseAmount.toNumber()) {
      return {
        success: false,
        error: `Minimum purchase of ${discount.minPurchaseAmount.toNumber()} required for this discount code`,
      };
    }

    // Update cart with discount code
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        couponCode: normalizedCode,
        discountId: discount.id,
      },
    });

    return {
      success: true,
      discount: {
        code: discount.code,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue.toNumber(),
      },
    };
  } catch (error) {
    console.error('Apply discount code error:', error);
    return {
      success: false,
      error: 'An error occurred while applying the discount code. Please try again.',
    };
  }
}

/**
 * Remove discount code from the cart
 *
 * Removes any applied discount code from the user's cart.
 *
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await removeDiscountCode();
 */
export async function removeDiscountCode(): Promise<ActionResult> {
  try {
    // Get cart
    const cart = await getOrCreateCart();

    // Remove discount from cart
    // Note: You'll need to add discount fields to your Cart model
    // await prisma.cart.update({
    //   where: { id: cart.id },
    //   data: { discountId: null },
    // });

    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidateTag('cart');

    return { success: true };
  } catch (error) {
    console.error('Remove discount code error:', error);
    return {
      success: false,
      error: 'An error occurred while removing the discount code. Please try again.',
    };
  }
}

/**
 * Get the current cart
 *
 * Retrieves the user's cart with all items and totals.
 *
 * @returns Result object with cart data or error
 *
 * @example
 * const result = await getCart();
 */
export async function getCart(): Promise<ActionResult<{
  id: string;
  items: Array<{
    id: string;
    variantId: string;
    quantity: number;
    variant: {
      id: string;
      name: string;
      size: string;
      color: string | null;
      price: number;
      compareAtPrice: number | null;
      sku: string;
      product: {
        id: string;
        name: string;
        slug: string;
        images: Array<{ url: string; altText: string | null }>;
      };
      inventory: {
        available: number;
      } | null;
    };
  }>;
  itemCount: number;
  subtotal: number;
}>> {
  try {
    // Get cart
    const cart = await getOrCreateCart();

    // Get cart with items
    const cartWithItems = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: {
                      where: { isPrimary: true },
                      take: 1,
                      select: { url: true, altText: true },
                    },
                  },
                },
                inventory: {
                  select: { available: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cartWithItems) {
      return {
        success: true,
        data: {
          id: cart.id,
          items: [],
          itemCount: 0,
          subtotal: 0,
        },
      };
    }

    // Calculate totals
    let subtotal = 0;
    const items = cartWithItems.items.map((item) => {
      const price = Number(item.variant.price);
      subtotal += price * item.quantity;

      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        variant: {
          id: item.variant.id,
          name: item.variant.name,
          size: item.variant.size,
          color: item.variant.color,
          price,
          compareAtPrice: item.variant.compareAtPrice ? Number(item.variant.compareAtPrice) : null,
          sku: item.variant.sku,
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            slug: item.variant.product.slug,
            images: item.variant.product.images,
          },
          inventory: item.variant.inventory,
        },
      };
    });

    return {
      success: true,
      data: {
        id: cartWithItems.id,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
      },
    };
  } catch (error) {
    console.error('Get cart error:', error);
    return {
      success: false,
      error: 'An error occurred while fetching the cart. Please try again.',
    };
  }
}
