import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  NotFoundError,
  InsufficientStockError,
  CartItemNotFoundError,
} from '@/lib/errors';
import { cookies } from 'next/headers';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const updateQuantitySchema = z.object({
  quantity: z.number().int().nonnegative().max(99, 'Maximum quantity is 99'),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('cart_session')?.value || null;
}

async function getCartId(userId: string | null, sessionId: string | null): Promise<string | null> {
  if (userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    return cart?.id || null;
  }
  if (sessionId) {
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      select: { id: true },
    });
    return cart?.id || null;
  }
  return null;
}

async function buildCartResponse(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    select: { url: true, altText: true, isPrimary: true },
                    take: 1,
                  },
                },
              },
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

  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    variant: {
      id: item.variant.id,
      name: item.variant.name,
      size: item.variant.size,
      color: item.variant.color,
      colorCode: item.variant.colorCode,
      price: item.variant.price.toNumber(),
      sku: item.variant.sku,
    },
    product: {
      id: item.variant.product.id,
      name: item.variant.product.name,
      slug: item.variant.product.slug,
      images: item.variant.product.images,
    },
    quantity: item.quantity,
    unitPrice: item.variant.price.toNumber(),
    totalPrice: item.variant.price.toNumber() * item.quantity,
    inStock: (item.variant.inventory?.available || 0) >= item.quantity,
    availableQuantity: item.variant.inventory?.available || 0,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedShipping = subtotal >= 100 ? 0 : 9.99;
  const estimatedTax = subtotal * 0.08;
  const estimatedTotal = subtotal + estimatedShipping + estimatedTax;

  return {
    id: cart.id,
    items,
    summary: {
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      estimatedShipping,
      estimatedTax: Math.round(estimatedTax * 100) / 100,
      estimatedTotal: Math.round(estimatedTotal * 100) / 100,
    },
  };
}

// ============================================================================
// PATCH /api/cart/items/[itemId] - Update cart item quantity
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const user = await getCurrentUser();
    const sessionId = await getSessionId();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateQuantitySchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const { quantity } = validationResult.data;

    // Get cart ID
    const cartId = await getCartId(user?.id || null, sessionId);
    if (!cartId) {
      throw new NotFoundError('Cart not found');
    }

    // Find the cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId,
      },
      include: {
        variant: {
          include: {
            inventory: {
              select: { available: true },
            },
          },
        },
      },
    });

    if (!cartItem) {
      throw new CartItemNotFoundError(itemId);
    }

    // If quantity is 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      // Check stock availability
      const availableStock = cartItem.variant.inventory?.available || 0;
      if (availableStock < quantity) {
        throw new InsufficientStockError(
          cartItem.variant.productId,
          cartItem.variantId,
          quantity,
          availableStock
        );
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    const response = await buildCartResponse(cartId);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/cart/items/[itemId] - Remove cart item
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const user = await getCurrentUser();
    const sessionId = await getSessionId();

    // Get cart ID
    const cartId = await getCartId(user?.id || null, sessionId);
    if (!cartId) {
      throw new NotFoundError('Cart not found');
    }

    // Find and delete the cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId,
      },
    });

    if (!cartItem) {
      throw new CartItemNotFoundError(itemId);
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    const response = await buildCartResponse(cartId);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
