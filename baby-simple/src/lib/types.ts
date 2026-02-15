export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  shortDesc?: string;
  price: number;
  salePrice?: number;
  cost?: number;
  inventory: number;
  images: Array<{ url: string; alt?: string; order?: number; isPrimary?: boolean }>;
  categoryId: string;
  collectionId?: string;
  isActive: boolean;
  isFeatured: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  featured: boolean;
  position: number;
  metaTitle?: string;
  metaDesc?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  product: Product;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  variantName?: string;
  sku?: string;
  createdAt?: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  shippingStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  email: string;
  phone?: string;
  shippingName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostal?: string;
  shippingCountry?: string;
  billingName?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostal?: string;
  billingCountry?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  notes?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  emailVerified?: Date;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  isActive: boolean;
  isAdmin: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin';
}

export interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalCollections: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: Order[];
  orderStatusCounts: Record<string, number>;
}
