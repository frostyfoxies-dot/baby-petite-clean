'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, ValidationError } from '@/lib/errors';

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
 * Submit contact form input schema
 */
const submitContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number').optional(),
  orderNumber: z.string().optional(),
});

export type SubmitContactFormInput = z.infer<typeof submitContactFormSchema>;

// ============================================
// CONTACT ACTIONS
// ============================================

/**
 * Submit a contact form
 *
 * Submits a contact form message to the support team.
 *
 * @param input - Contact form data (name, email, subject, message, etc.)
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await submitContactForm({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   subject: 'Question about my order',
 *   message: 'I have a question about my recent order...',
 * });
 */
export async function submitContactForm(input: SubmitContactFormInput): Promise<ActionResult<void>> {
  try {
    // Validate input
    const validatedFields = submitContactFormSchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, email, subject, message, phone, orderNumber } = validatedFields.data;

    // Get current user if logged in
    const user = await getCurrentUser();

    // In a real implementation, you would:
    // 1. Create a contact message record in the database
    // 2. Send an email notification to the support team
    // 3. Send a confirmation email to the user

    // Placeholder implementation
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message,
      phone,
      orderNumber,
      userId: user?.id,
    });

    // TODO: Implement actual contact form submission
    // const contactMessage = await prisma.contactMessage.create({
    //   data: {
    //     name,
    //     email: email.toLowerCase(),
    //     subject,
    //     message,
    //     phone,
    //     orderNumber,
    //     userId: user?.id,
    //     status: 'PENDING',
    //   },
    // });

    // TODO: Send email notification to support team
    // await sendContactNotification({
    //   to: 'support@babypetite.com',
    //   subject: `New Contact Form: ${subject}`,
    //   name,
    //   email,
    //   message,
    //   phone,
    //   orderNumber,
    // });

    // TODO: Send confirmation email to user
    // await sendContactConfirmation({
    //   to: email,
    //   name,
    //   subject,
    // });

    revalidateTag('contact');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Submit contact form error:', error);
    return {
      success: false,
      error: 'An error occurred while sending your message. Please try again.',
    };
  }
}

/**
 * Submit a support request
 *
 * Submits a support request for a specific order or product.
 *
 * @param input - Support request data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await submitSupportRequest({
 *   type: 'ORDER',
 *   orderId: 'order123',
 *   subject: 'Missing item',
 *   message: 'I received my order but item X is missing',
 * });
 */
export async function submitSupportRequest(input: {
  type: 'ORDER' | 'PRODUCT' | 'ACCOUNT' | 'OTHER';
  orderId?: string;
  productId?: string;
  subject: string;
  message: string;
}): Promise<ActionResult<void>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to submit a support request');
    }

    // Validate input
    const schema = z.object({
      type: z.enum(['ORDER', 'PRODUCT', 'ACCOUNT', 'OTHER']),
      orderId: z.string().optional(),
      productId: z.string().optional(),
      subject: z.string().min(1, 'Subject is required').max(200),
      message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
    });

    const validatedFields = schema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { type, orderId, productId, subject, message } = validatedFields.data;

    // Validate that the order/product belongs to the user
    if (type === 'ORDER' && orderId) {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber: orderId,
          userId: user.id,
        },
      });

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }
    }

    if (type === 'PRODUCT' && productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return {
          success: false,
          error: 'Product not found',
        };
      }
    }

    // In a real implementation, you would:
    // 1. Create a support ticket record
    // 2. Send email notification to support team
    // 3. Send confirmation email to user

    // Placeholder implementation
    console.log('Support request submission:', {
      type,
      orderId,
      productId,
      subject,
      message,
      userId: user.id,
      userEmail: user.email,
    });

    // TODO: Implement actual support request submission
    // const supportTicket = await prisma.supportTicket.create({
    //   data: {
    //     type,
    //     orderId,
    //     productId,
    //     subject,
    //     message,
    //     userId: user.id,
    //     status: 'OPEN',
    //     priority: 'NORMAL',
    //   },
    // });

    revalidateTag('support');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Submit support request error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while submitting your support request. Please try again.',
    };
  }
}

/**
 * Report a product issue
 *
 * Reports an issue with a product (e.g., damaged, wrong item, etc.).
 *
 * @param input - Product issue report data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await reportProductIssue({
 *   orderNumber: 'KP-ABC123-XYZ',
 *   variantId: 'variant123',
 *   issueType: 'DAMAGED',
 *   description: 'The item arrived damaged',
 *   images: ['image1.jpg', 'image2.jpg'],
 * });
 */
export async function reportProductIssue(input: {
  orderNumber: string;
  variantId: string;
  issueType: 'DAMAGED' | 'WRONG_ITEM' | 'MISSING' | 'DEFECTIVE' | 'OTHER';
  description: string;
  images?: string[];
}): Promise<ActionResult<{ message: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to report a product issue');
    }

    // Validate input
    const schema = z.object({
      orderNumber: z.string().min(1, 'Order number is required'),
      variantId: z.string().cuid('Invalid variant ID'),
      issueType: z.enum(['DAMAGED', 'WRONG_ITEM', 'MISSING', 'DEFECTIVE', 'OTHER']),
      description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
      images: z.array(z.string().url()).max(5).optional(),
    });

    const validatedFields = schema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { orderNumber, variantId, issueType, description, images } = validatedFields.data;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: user.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Verify variant is in the order
    const orderItem = order.items.find((item) => item.variantId === variantId);
    if (!orderItem) {
      return {
        success: false,
        error: 'Item not found in this order',
      };
    }

    // In a real implementation, you would:
    // 1. Create a product issue report record
    // 2. Send email notification to support team
    // 3. Send confirmation email to user

    // Placeholder implementation
    console.log('Product issue report:', {
      orderNumber,
      variantId,
      issueType,
      description,
      images,
      userId: user.id,
      userEmail: user.email,
    });

    // TODO: Implement actual product issue report
    // const issueReport = await prisma.productIssueReport.create({
    //   data: {
    //     orderNumber,
    //     variantId,
    //     issueType,
    //     description,
    //     images: images || [],
    //     userId: user.id,
    //     status: 'PENDING',
    //   },
    // });

    revalidateTag('support');
    revalidatePath(`/account/orders/${orderNumber}`);

    return {
      success: true,
      data: { message: 'Your issue report has been submitted. Our team will review it and get back to you soon!' },
    };
  } catch (error) {
    console.error('Report product issue error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while reporting the issue. Please try again.',
    };
  }
}

/**
 * Request a return
 *
 * Initiates a return request for an order.
 *
 * @param input - Return request data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await requestReturn({
 *   orderNumber: 'KP-ABC123-XYZ',
 *   variantId: 'variant123',
 *   reason: 'Not as described',
 *   description: 'The product is different from what was shown',
 * });
 */
export async function requestReturn(input: {
  orderNumber: string;
  variantId: string;
  reason: string;
  description: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to request a return');
    }

    // Validate input
    const schema = z.object({
      orderNumber: z.string().min(1, 'Order number is required'),
      variantId: z.string().cuid('Invalid variant ID'),
      reason: z.string().min(1, 'Reason is required').max(200),
      description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
    });

    const validatedFields = schema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { orderNumber, variantId, reason, description } = validatedFields.data;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: user.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Check if order is eligible for return (e.g., within 30 days of delivery)
    if (!order.deliveredAt) {
      return {
        success: false,
        error: 'Order must be delivered before requesting a return',
      };
    }

    const daysSinceDelivery = Math.floor((Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 30) {
      return {
        success: false,
        error: 'Return requests must be made within 30 days of delivery',
      };
    }

    // Verify variant is in the order
    const orderItem = order.items.find((item) => item.variantId === variantId);
    if (!orderItem) {
      return {
        success: false,
        error: 'Item not found in this order',
      };
    }

    // In a real implementation, you would:
    // 1. Create a return request record
    // 2. Send email notification to support team
    // 3. Send confirmation email to user with return instructions

    // Placeholder implementation
    console.log('Return request:', {
      orderNumber,
      variantId,
      reason,
      description,
      userId: user.id,
      userEmail: user.email,
    });

    // TODO: Implement actual return request
    // const returnRequest = await prisma.returnRequest.create({
    //   data: {
    //     orderNumber,
    //     variantId,
    //     reason,
    //     description,
    //     userId: user.id,
    //     status: 'PENDING',
    //   },
    // });

    revalidateTag('support');
    revalidatePath(`/account/orders/${orderNumber}`);

    return {
      success: true,
      data: { message: 'Your return request has been submitted. We will send you return instructions via email.' },
    };
  } catch (error) {
    console.error('Request return error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while requesting a return. Please try again.',
    };
  }
}
