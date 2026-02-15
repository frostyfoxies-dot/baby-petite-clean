'use server';

import { prisma } from './prisma';
import { Product, Category, Collection, Order, OrderItem, User, DashboardStats } from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// CATEGORY CRUD
// ============================================

export async function getCategories(): Promise<Category[]> {
  return await prisma.category.findMany({
    orderBy: { position: 'asc' },
  });
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return await prisma.category.findUnique({
    where: { id },
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return await prisma.category.findUnique({
    where: { slug },
  });
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  return await prisma.category.create({
    data,
  });
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  return await prisma.category.update({
    where: { id },
    data: updates,
  });
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    await prisma.category.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// COLLECTION CRUD
// ============================================

export async function getCollections(): Promise<Collection[]> {
  return await prisma.collection.findMany({
    orderBy: { position: 'asc' },
  });
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  return await prisma.collection.findUnique({
    where: { id },
  });
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  return await prisma.collection.findUnique({
    where: { slug },
  });
}

export async function createCollection(data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
  return await prisma.collection.create({
    data,
  });
}

export async function updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | null> {
  return await prisma.collection.update({
    where: { id },
    data: updates,
  });
}

export async function deleteCollection(id: string): Promise<boolean> {
  try {
    await prisma.collection.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// PRODUCT CRUD
// ============================================

export async function getProducts(): Promise<Product[]> {
  return await prisma.product.findMany({
    orderBy: { position: 'asc' },
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  return await prisma.product.findUnique({
    where: { id },
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return await prisma.product.findUnique({
    where: { slug },
  });
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'slug'>): Promise<Product> {
  // Generate slug from name
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return await prisma.product.create({
    data: {
      ...data,
      slug,
    },
  });
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  return await prisma.product.update({
    where: { id },
    data: updates,
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await prisma.product.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// ORDER CRUD
// ============================================

export async function getOrders(): Promise<Order[]> {
  return await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });
}

export async function getOrderById(id: string): Promise<Order | null> {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  return await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });
}

export async function createOrder(data: {
  userId: string;
  status?: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  shippingStatus?: Order['shippingStatus'];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency?: string;
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
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName: string;
    variantName?: string;
    sku?: string;
  }>;
}): Promise<Order> {
  // Generate order number
  const count = await prisma.order.count();
  const orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;

  return await prisma.order.create({
    data: {
      orderNumber,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
        })),
      },
      ...data,
    },
    include: {
      user: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  return await prisma.order.update({
    where: { id },
    data: updates,
    include: {
      user: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });
}

export async function deleteOrder(id: string): Promise<boolean> {
  try {
    await prisma.order.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// DASHBOARD STATS & TOP PRODUCTS
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalOrders, totalProducts, totalCategories, totalCollections] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.collection.count(),
  ]);

  const orders = await prisma.order.findMany({
    select: {
      total: true,
      status: true,
    },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;

  const products = await prisma.product.findMany({
    select: {
      inventory: true,
    },
  });
  const lowStockProducts = products.filter(p => p.inventory < 30).length;

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const orderStatusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalOrders,
    totalProducts,
    totalCategories,
    totalCollections,
    totalRevenue,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    orderStatusCounts,
  };
}

export async function getTopProducts(limit: number = 5) {
  // Join orders and orderItems to compute sales per product
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] },
      },
    },
    include: {
      product: true,
    },
  });

  const productStats = new Map<string, { count: number; revenue: number }>();

  orderItems.forEach(item => {
    const existing = productStats.get(item.productId) || { count: 0, revenue: 0 };
    productStats.set(item.productId, {
      count: existing.count + item.quantity,
      revenue: existing.revenue + item.totalPrice,
    });
  });

  const topProductIds = Array.from(productStats.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)
    .map(entry => entry[0]);

  // Fetch products in order
  const products = await prisma.product.findMany({
    where: {
      id: { in: topProductIds },
    },
  });

  const result = products.map(product => {
    const stats = productStats.get(product.id)!;
    return {
      product,
      totalSales: stats.count,
      totalRevenue: stats.revenue,
    };
  });

  return result;
}

// ============================================
// RESET DATA (for seeding/testing)
// ============================================

export async function resetData(): Promise<void> {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}
