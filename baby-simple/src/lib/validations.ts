import { z } from 'zod';

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  sku: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  shortDesc: z.string().max(500).optional(),
  price: z.number().positive('Price must be positive').refine(val => val > 0, 'Price must be greater than 0'),
  salePrice: z.number().positive().optional(),
  cost: z.number().nonnegative().optional(),
  inventory: z.number().int().nonnegative('Inventory cannot be negative'),
  images: z.array(
    z.object({
      url: z.string().url('Must be a valid URL'),
      alt: z.string().optional(),
      order: z.number().int().optional(),
      isPrimary: z.boolean().optional(),
    })
  ).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  categoryId: z.string().min(1, 'Category is required'),
  collectionId: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  position: z.number().int().nonnegative().default(0),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
  image: z.string().url('Must be a valid URL').optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  position: z.number().int().nonnegative().default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// Collection validation schema
export const collectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(255),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(1000).optional(),
  image: z.string().url('Must be a valid URL').optional(),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  position: z.number().int().nonnegative().default(0),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;

// Order validation schema (for creating/updating orders)
export const orderSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  shippingName: z.string().max(255).optional(),
  shippingAddress1: z.string().max(255).optional(),
  shippingAddress2: z.string().max(255).optional(),
  shippingCity: z.string().max(100).optional(),
  shippingState: z.string().max(100).optional(),
  shippingPostal: z.string().max(20).optional(),
  shippingCountry: z.string().max(100).optional(),
  billingName: z.string().max(255).optional(),
  billingAddress1: z.string().max(255).optional(),
  billingAddress2: z.string().max(255).optional(),
  billingCity: z.string().max(100).optional(),
  billingState: z.string().max(100).optional(),
  billingPostal: z.string().max(20).optional(),
  billingCountry: z.string().max(100).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
  shippingStatus: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED']),
  shippingMethod: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  subtotal: z.number().positive('Subtotal must be positive'),
  tax: z.number().nonnegative().default(0),
  shipping: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().positive('Total must be positive'),
  currency: z.string().length(3, 'Currency must be 3-letter code').default('USD'),
  notes: z.string().max(2000).optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export type OrderItemFormData = z.infer<typeof orderItemSchema>;
