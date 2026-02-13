import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { cartItemSchema } from '@/lib/validators';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  OutOfStockError,
  InsufficientStockError,
} from '@/lib/errors';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { trackCartActivity } from '@/lib/cart-abandonment/tracker';

// ============================================================================
// TYPES
// ============================================================================

export interface CartItemResponse {
  id: string;
  variant: {
    id: string;
    name: string;
    size: string;
    color: string | null;
    colorCode: string | null;
    price: number;
    sku: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inStock: boolean;
  availableQuantity: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  summary: {
    itemCount: number;
    subtotal: number;
    estimatedShipping: number;
    estimatedTax: number;
    estimatedTotal: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getOrCreateCart(userId: string | null, sessionId: string | null): Promise<{ id: string; isNew: boolean }> {
  // Try to find existing cart
  if (userId) {
    const existingCart = await prisma.cart.findUnique({
      where: { userId },
    });
    if (existingCart) {
      return { id: existingCart.id, isNew: false };
    }
  } else if (sessionId) {
    const existingCart = await prisma.cart.findUnique({
      where: { sessionId },
    });
    if (existingCart) {
      return { id: existingCart.id, isNew: false };
    }
  }

  // Create new cart
  const cart = await prisma.cart.create({
    data: {
      userId,
      sessionId: userId ? null : sessionId || randomUUID(),
    },
  });
  return { id: cart.id, isNew: true };
}

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('cart_session')?.value;
  
  if (!sessionId) {
    sessionId = randomUUID();
    // Set the cart session cookie with proper options
    cookieStore.set('cart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }
  
  return sessionId;
}

async function buildCartResponse(cartId: string): Promise<CartResponse> {
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

  const items: CartItemResponse[] = cart.items.map((item) => ({
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
  
  // Calculate estimated shipping (free over $100)
  const estimatedShipping = subtotal >= 100 ? 0 : 9.99;
  
  // Calculate estimated tax (simplified - 8% for example)
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
// GET /api/cart - Get current user's cart
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sessionId = await getSessionId();

    // Find existing cart
    let cart = null;
    if (user) {
      cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      });
    }
    if (!cart && sessionId) {
      cart = await prisma.cart.findUnique({
        where: { sessionId },
      });
    }

    if (!cart) {
      // Return empty cart
      return NextResponse.json({
        id: null,
        items: [],
        summary: {
          itemCount: 0,
          subtotal: 0,
          estimatedShipping: 0,
          estimatedTax: 0,
          estimatedTotal: 0,
        },
      });
    }

    // Track cart activity for abandonment emails (async, non-blocking)
    trackCartActivity({
      cartId: cart.id,
      userId: user?.id || null,
    }).catch((error) => {
      console.error('Failed to track cart activity:', error);
    });

    const response = await buildCartResponse(cart.id);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/cart - Create cart item
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sessionId = await getSessionId();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = cartItemSchema.safeParse(body);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid request body', validationResult.error.flatten());
    }

    const { productId, variantId, quantity } = validationResult.data;

    // Verify variant exists and is active
    const variant = await prisma.variant.findFirst({
      where: {
        id: variantId,
        productId,
        isActive: true,
      },
      include: {
        product: {
          select: { id: true, isActive: true },
        },
        inventory: {
          select: { available: true },
        },
      },
    });

    if (!variant || !variant.product.isActive) {
      throw new NotFoundError('Product or variant not found');
    }

    // Check stock availability
    const availableStock = variant.inventory?.available || 0;
    if (availableStock === 0) {
      throw new OutOfStockError(productId, variantId, quantity, 0);
    }
    if (availableStock < quantity) {
      throw new InsufficientStockError(productId, variantId, quantity, availableStock);
    }

    // Get or create cart
    const { id: cartId } = await getOrCreateCart(user?.id || null, sessionId);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > availableStock) {
        throw new InsufficientStockError(productId, variantId, newQuantity, availableStock);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId,
          variantId,
          quantity,
        },
      });
    }

    // Track cart activity for abandonment emails
    await trackCartActivity({
      cartId,
      userId: user?.id || null,
    });

    const response = await buildCartResponse(cartId);
    return NextResponse.json(response, { status: existingItem ? 200 : 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/cart - Clear cart
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sessionId = await getSessionId();

    // Find cart
    let cart = null;
    if (user) {
      cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      });
    }
    if (!cart && sessionId) {
      cart = await prisma.cart.findUnique({
        where: { sessionId },
      });
    }

    if (!cart) {
      return NextResponse.json({ message: 'Cart is already empty' });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      id: cart.id,
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        estimatedShipping: 0,
        estimatedTax: 0,
        estimatedTotal: 0,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
