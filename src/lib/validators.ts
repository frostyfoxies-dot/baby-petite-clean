import { z } from 'zod';

/**
 * Zod Validation Schemas
 *
 * Comprehensive validation schemas for all data types used in the application.
 * These schemas ensure type safety and data integrity throughout the system.
 *
 * @see https://zod.dev/
 */

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

/**
 * Email validation with normalization
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .transform((val) => val.toLowerCase().trim());

/**
 * Password validation with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

/**
 * Password schema for login (less strict, just check it exists)
 */
export const loginPasswordSchema = z.string().min(1, 'Password is required');

/**
 * Name validation
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .transform((val) => val.trim());

/**
 * Phone number validation (US format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length >= 10, 'Phone number must have at least 10 digits');

/**
 * URL slug validation
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug is too long')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

/**
 * ID validation (CUID format)
 */
export const idSchema = z.string().cuid('Invalid ID format');

/**
 * Optional string that transforms empty strings to undefined
 */
export const optionalString = z
  .string()
  .optional()
  .transform((val) => (val === '' ? undefined : val));

/**
 * Non-empty string
 */
export const nonEmptyString = z.string().min(1, 'This field is required');

/**
 * Positive number (for prices, quantities, etc.)
 */
export const positiveNumber = z.number().positive('Must be a positive number');

/**
 * Non-negative number
 */
export const nonNegativeNumber = z.number().nonnegative('Must be zero or positive');

/**
 * Percentage (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage cannot exceed 100');

// ============================================================================
// ADDRESS SCHEMA
// ============================================================================

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  name: nameSchema,
  line1: z.string().min(1, 'Address line 1 is required').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code is too long'),
  country: z.string().min(1, 'Country is required').max(2, 'Use ISO country code'),
  phone: phoneSchema.optional(),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ============================================================================
// USER SCHEMAS
// ============================================================================

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  acceptMarketing: z.boolean().optional().default(false),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean().optional().default(false),
});

export type UserLoginInput = z.infer<typeof userLoginSchema>;

/**
 * User profile update schema
 */
export const userProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

/**
 * Password change schema
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: loginPasswordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

/**
 * Product variant schema
 */
export const variantSchema = z.object({
  id: idSchema.optional(),
  sku: z.string().min(1, 'SKU is required').max(100),
  name: z.string().min(1, 'Variant name is required').max(200),
  price: nonNegativeNumber,
  compareAtPrice: nonNegativeNumber.optional().nullable(),
  costPrice: nonNegativeNumber.optional().nullable(),
  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(10),
  weight: nonNegativeNumber.optional().nullable(),
  weightUnit: z.enum(['kg', 'lb', 'oz', 'g']).optional().default('kg'),
  color: z.string().max(50).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  images: z.array(z.string().url()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export type VariantInput = z.infer<typeof variantSchema>;

/**
 * Product schema
 */
export const productSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(1, 'Product name is required').max(200),
  slug: slugSchema,
  description: z.string().min(1, 'Description is required').max(5000),
  shortDescription: z.string().max(500).optional(),
  categoryId: idSchema,
  brand: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().default([]),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  minAgeMonths: z.number().int().nonnegative().optional().nullable(),
  maxAgeMonths: z.number().int().nonnegative().optional().nullable(),
  gender: z.enum(['male', 'female', 'unisex']).optional().default('unisex'),
  materials: z.array(z.string()).optional().default([]),
  careInstructions: z.array(z.string()).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Product update schema (partial)
 */
export const productUpdateSchema = productSchema.partial();

// ============================================================================
// CART SCHEMAS
// ============================================================================

/**
 * Cart item schema
 */
export const cartItemSchema = z.object({
  productId: idSchema,
  variantId: idSchema,
  quantity: z.number().int().positive('Quantity must be at least 1').max(99, 'Maximum quantity is 99'),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

/**
 * Cart update schema
 */
export const cartUpdateSchema = z.object({
  variantId: idSchema,
  quantity: z.number().int().nonnegative('Quantity must be 0 or greater').max(99),
});

// ============================================================================
// CHECKOUT SCHEMAS
// ============================================================================

/**
 * Shipping method schema
 */
export const shippingMethodSchema = z.object({
  id: z.string().min(1, 'Shipping method is required'),
  name: z.string(),
  price: nonNegativeNumber,
  estimatedDays: z.string().optional(),
});

/**
 * Checkout schema
 */
export const checkoutSchema = z.object({
  email: emailSchema,
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  useSameBillingAddress: z.boolean().default(true),
  shippingMethodId: z.string().min(1, 'Shipping method is required'),
  discountCode: z.string().optional(),
  giftMessage: z.string().max(500).optional(),
  isGift: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Payment method schema
 */
export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'paypal', 'applepay', 'googlepay']),
  paymentMethodId: z.string().optional(), // Stripe payment method ID
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
});

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

/**
 * Order status enum
 */
export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'failed',
]);

/**
 * Order update schema (admin)
 */
export const orderUpdateSchema = z.object({
  status: orderStatusSchema.optional(),
  trackingNumber: z.string().optional().nullable(),
  trackingUrl: z.string().url().optional().nullable(),
  carrier: z.string().optional().nullable(),
  notes: z.string().max(1000).optional(),
});

export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;

// ============================================================================
// REGISTRY SCHEMAS
// ============================================================================

/**
 * Registry item schema
 */
export const registryItemSchema = z.object({
  productId: idSchema,
  variantId: idSchema,
  quantity: z.number().int().positive().max(99),
  priority: z.enum(['essential', 'nice_to_have', 'dream']).optional().default('nice_to_have'),
  notes: z.string().max(500).optional(),
});

export type RegistryItemInput = z.infer<typeof registryItemSchema>;

/**
 * Registry schema
 */
export const registrySchema = z.object({
  name: z.string().min(1, 'Registry name is required').max(200),
  parentName: nameSchema,
  parent2Name: nameSchema.optional().nullable(),
  babyName: z.string().max(100).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  shippingAddress: addressSchema.optional(),
  message: z.string().max(1000).optional(),
  isPublic: z.boolean().optional().default(true),
  items: z.array(registryItemSchema).min(1, 'At least one item is required'),
});

export type RegistryInput = z.infer<typeof registrySchema>;

/**
 * Registry update schema
 */
export const registryUpdateSchema = registrySchema.partial();

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

/**
 * Review schema
 */
export const reviewSchema = z.object({
  productId: idSchema,
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().min(1, 'Review title is required').max(200),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  pros: z.array(z.string().max(100)).optional().default([]),
  cons: z.array(z.string().max(100)).optional().default([]),
  images: z.array(z.string().url()).max(5, 'Maximum 5 images allowed').optional(),
  recommend: z.boolean().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ============================================================================
// DISCOUNT/COUPON SCHEMAS
// ============================================================================

/**
 * Discount type enum
 */
export const discountTypeSchema = z.enum(['percentage', 'fixed', 'shipping']);

/**
 * Discount code schema
 */
export const discountCodeSchema = z.object({
  code: z.string().min(1).max(50).transform((val) => val.toUpperCase().trim()),
  type: discountTypeSchema,
  value: positiveNumber,
  minOrderValue: nonNegativeNumber.optional().default(0),
  maxDiscount: nonNegativeNumber.optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  usagePerCustomer: z.number().int().positive().optional().default(1),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  appliesTo: z.enum(['all', 'products', 'categories']).optional().default('all'),
  productIds: z.array(idSchema).optional().default([]),
  categoryIds: z.array(idSchema).optional().default([]),
  firstTimeOnly: z.boolean().optional().default(false),
});

export type DiscountCodeInput = z.infer<typeof discountCodeSchema>;

/**
 * Discount code application schema
 */
export const applyDiscountSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
});

// ============================================================================
// INVENTORY SCHEMAS
// ============================================================================

/**
 * Inventory adjustment schema
 */
export const inventoryAdjustmentSchema = z.object({
  variantId: idSchema,
  adjustment: z.number().int(), // Can be negative for reductions
  reason: z.enum([
    'restock',
    'sale',
    'return',
    'damage',
    'loss',
    'inventory_count',
    'other',
  ]),
  notes: z.string().max(500).optional(),
});

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;

// ============================================================================
// SEARCH/FILTER SCHEMAS
// ============================================================================

/**
 * Product search/filter schema
 */
export const productFilterSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  categorySlug: z.string().optional(),
  minPrice: nonNegativeNumber.optional(),
  maxPrice: nonNegativeNumber.optional(),
  minAge: z.number().int().nonnegative().optional(),
  maxAge: z.number().int().nonnegative().optional(),
  brand: z.string().optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  inStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

// ============================================================================
// CONTACT/FORM SCHEMAS
// ============================================================================

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  orderId: z.string().optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

/**
 * Newsletter subscription schema
 */
export const newsletterSchema = z.object({
  email: emailSchema,
  preferences: z.array(z.string()).optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

/**
 * Image upload schema
 */
export const imageUploadSchema = z.object({
  file: z.any(), // File object (handled separately in upload)
  alt: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
});

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Max image size in bytes (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates data against a schema and returns typed result or error
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Formats Zod validation errors into a user-friendly object
 */
export function formatValidationErrors(
  error: z.ZodError
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'general';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Gets the first error message for a field
 */
export function getFirstError(
  errors: Record<string, string[]>,
  field: string
): string | undefined {
  return errors[field]?.[0];
}
