import { Product, Category, Collection, Order, OrderItem, User } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store (replace with real DB in production)
let products: Product[] = [];
let categories: Category[] = [];
let collections: Collection[] = [];
let orders: Order[] = [];
let orderItems: OrderItem[] = [];

// Initialize with some sample data
const initializeData = () => {
  if (products.length === 0) {
    // Sample categories
    const cat1: Category = {
      id: 'cat-1',
      name: 'Clothing',
      slug: 'clothing',
      description: 'Soft baby clothing',
      isActive: true,
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const cat2: Category = {
      id: 'cat-2',
      name: 'Toys',
      slug: 'toys',
      description: 'Safe baby toys',
      isActive: true,
      position: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    categories = [cat1, cat2];

    // Sample collections
    const col1: Collection = {
      id: 'col-1',
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Latest products',
      featured: true,
      isActive: true,
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const col2: Collection = {
      id: 'col-2',
      name: 'Best Sellers',
      slug: 'best-sellers',
      description: 'Most popular items',
      featured: true,
      isActive: true,
      position: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    collections = [col1, col2];

    // Sample products
    products = [
      {
        id: 'prod-1',
        name: 'Baby Organic Cotton Onesie',
        slug: 'baby-organic-cotton-onesie',
        sku: 'BOC-001',
        description: 'Soft organic cotton onesie for babies. Hypoallergenic and gentle on sensitive skin.',
        price: 24.99,
        inventory: 50,
        images: [{ url: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=400&h=400&fit=crop', alt: 'Baby Onesie', isPrimary: true }],
        categoryId: cat1.id,
        collectionId: col1.id,
        isActive: true,
        isFeatured: true,
        position: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'prod-2',
        name: 'Wooden Baby Rattle',
        slug: 'wooden-baby-rattle',
        sku: 'WBR-001',
        description: 'Natural wood rattle with smooth finish. Perfect for teething babies.',
        price: 12.50,
        inventory: 100,
        images: [{ url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop', alt: 'Wooden Rattle', isPrimary: true }],
        categoryId: cat2.id,
        collectionId: col2.id,
        isActive: true,
        isFeatured: false,
        position: 2,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 'prod-3',
        name: 'Plush Teddy Bear',
        slug: 'plush-teddy-bear',
        sku: 'PTB-001',
        description: 'Ultra-soft plush teddy bear. Safe for all ages, no small parts.',
        price: 29.99,
        inventory: 35,
        images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', alt: 'Teddy Bear', isPrimary: true }],
        categoryId: cat2.id,
        isActive: true,
        isFeatured: true,
        position: 3,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
    ];

    // Sample orders
    const adminUser: User = {
      id: 'user-1',
      email: 'admin@babysimple.com',
      role: 'ADMIN',
      isActive: true,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-001',
        userId: 'user-2',
        user: adminUser,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        shippingStatus: 'DELIVERED',
        subtotal: 49.98,
        tax: 4.00,
        shipping: 5.99,
        discount: 0,
        total: 59.97,
        currency: 'USD',
        email: 'sarah.j@email.com',
        phone: '555-0101',
        shippingName: 'Sarah Johnson',
        shippingAddress1: '123 Main St',
        shippingCity: 'New York',
        shippingState: 'NY',
        shippingPostal: '10001',
        shippingCountry: 'USA',
        billingName: 'Sarah Johnson',
        billingAddress1: '123 Main St',
        billingCity: 'New York',
        billingState: 'NY',
        billingPostal: '10001',
        billingCountry: 'USA',
        shippingMethod: 'Standard Shipping',
        deliveredAt: new Date('2024-02-12'),
        createdAt: new Date('2024-02-12'),
        updatedAt: new Date('2024-02-12'),
        items: [],
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-002',
        userId: 'user-3',
        user: adminUser,
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        shippingStatus: 'SHIPPED',
        subtotal: 47.49,
        tax: 3.80,
        shipping: 5.99,
        discount: 0,
        total: 57.28,
        currency: 'USD',
        email: 'mike.chen@email.com',
        shippingMethod: 'Express Shipping',
        trackingNumber: 'TRK123456',
        shippedAt: new Date('2024-02-13'),
        createdAt: new Date('2024-02-13'),
        updatedAt: new Date('2024-02-13'),
        items: [],
      },
      {
        id: 'ord-3',
        orderNumber: 'ORD-003',
        userId: 'user-4',
        user: adminUser,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        shippingStatus: 'PENDING',
        subtotal: 34.99,
        tax: 2.80,
        shipping: 5.99,
        discount: 0,
        total: 43.78,
        currency: 'USD',
        email: 'emily.d@email.com',
        shippingMethod: 'Standard Shipping',
        createdAt: new Date('2024-02-13'),
        updatedAt: new Date('2024-02-13'),
        items: [],
      },
    ];

    // Create order items
    orderItems = [
      {
        id: 'oi-1',
        orderId: 'ord-1',
        productId: 'prod-1',
        product: products[0],
        quantity: 2,
        unitPrice: 24.99,
        totalPrice: 49.98,
        productName: 'Baby Organic Cotton Onesie',
        createdAt: new Date('2024-02-12'),
      },
      {
        id: 'oi-2',
        orderId: 'ord-2',
        productId: 'prod-2',
        product: products[1],
        quantity: 2,
        unitPrice: 12.50,
        totalPrice: 25.00,
        productName: 'Wooden Baby Rattle',
        createdAt: new Date('2024-02-13'),
      },
      {
        id: 'oi-3',
        orderId: 'ord-2',
        productId: 'prod-3',
        product: products[2],
        quantity: 1,
        unitPrice: 29.99,
        totalPrice: 29.99,
        productName: 'Plush Teddy Bear',
        createdAt: new Date('2024-02-13'),
      },
      {
        id: 'oi-4',
        orderId: 'ord-3',
        productId: 'prod-1',
        product: products[0],
        quantity: 1,
        unitPrice: 24.99,
        totalPrice: 24.99,
        productName: 'Baby Organic Cotton Onesie',
        createdAt: new Date('2024-02-13'),
      },
      {
        id: 'oi-5',
        orderId: 'ord-3',
        productId: 'prod-2',
        product: products[1],
        quantity: 1,
        unitPrice: 12.50,
        totalPrice: 12.50,
        productName: 'Wooden Baby Rattle',
        createdAt: new Date('2024-02-13'),
      },
    ];

    // Attach order items to orders
    orders.forEach(order => {
      order.items = orderItems.filter(oi => oi.orderId === order.id);
    });
  }
};

// Initialize on module load
initializeData();

// ============================================
// CATEGORY CRUD
// ============================================

export const getCategories = (): Category[] => {
  return [...categories].sort((a, b) => a.position - b.position);
};

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find(c => c.id === id);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find(c => c.slug === slug);
};

export const createCategory = (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category => {
  const newCategory: Category = {
    ...data,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  categories.push(newCategory);
  return newCategory;
};

export const updateCategory = (id: string, updates: Partial<Category>): Category | undefined => {
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return undefined;

  categories[index] = {
    ...categories[index],
    ...updates,
    updatedAt: new Date(),
  };
  return categories[index];
};

export const deleteCategory = (id: string): boolean => {
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return false;
  categories.splice(index, 1);
  return true;
};

// ============================================
// COLLECTION CRUD
// ============================================

export const getCollections = (): Collection[] => {
  return [...collections].sort((a, b) => a.position - b.position);
};

export const getCollectionById = (id: string): Collection | undefined => {
  return collections.find(c => c.id === id);
};

export const getCollectionBySlug = (slug: string): Collection | undefined => {
  return collections.find(c => c.slug === slug);
};

export const createCollection = (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Collection => {
  const newCollection: Collection = {
    ...data,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  collections.push(newCollection);
  return newCollection;
};

export const updateCollection = (id: string, updates: Partial<Collection>): Collection | undefined => {
  const index = collections.findIndex(c => c.id === id);
  if (index === -1) return undefined;

  collections[index] = {
    ...collections[index],
    ...updates,
    updatedAt: new Date(),
  };
  return collections[index];
};

export const deleteCollection = (id: string): boolean => {
  const index = collections.findIndex(c => c.id === id);
  if (index === -1) return false;
  collections.splice(index, 1);
  return true;
};

// ============================================
// PRODUCT CRUD
// ============================================

export const getProducts = (): Product[] => {
  return [...products].sort((a, b) => a.position - b.position);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find(p => p.slug === slug);
};

export const createProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'slug'>): Product => {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const newProduct: Product = {
    ...data,
    slug,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  products.push(newProduct);
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Product>): Product | undefined => {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return undefined;

  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date(),
  };
  return products[index];
};

export const deleteProduct = (id: string): boolean => {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return false;
  products.splice(index, 1);
  return true;
};

// ============================================
// ORDER CRUD
// ============================================

export const getOrders = (): Order[] => {
  return [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getOrderById = (id: string): Order | undefined => {
  return orders.find(o => o.id === id);
};

export const getOrderByNumber = (orderNumber: string): Order | undefined => {
  return orders.find(o => o.orderNumber === orderNumber);
};

export const createOrder = (data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'items'> & { items: Omit<OrderItem, 'id' | 'orderId' | 'createdAt'>[] }): Order => {
  const now = new Date();
  const orderNumber = `ORD-${String(orders.length + 1).padStart(6, '0')}`;

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const total = subtotal + data.tax + data.shipping - data.discount;

  const newOrder: Order = {
    ...data,
    id: uuidv4(),
    orderNumber,
    subtotal,
    total,
    createdAt: now,
    updatedAt: now,
  };

  // Create order items
  const newOrderItems = data.items.map(item => ({
    ...item,
    id: uuidv4(),
    orderId: newOrder.id,
    createdAt: now,
  }));

  orders.push(newOrder);
  orderItems.push(...newOrderItems);

  return newOrder;
};

export const updateOrder = (id: string, updates: Partial<Order>): Order | undefined => {
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return undefined;

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date(),
  };
  return orders[index];
};

export const updateOrderStatus = (id: string, status: Order['status']): Order | undefined => {
  return updateOrder(id, { status });
};

export const deleteOrder = (id: string): boolean => {
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return false;
  orders.splice(index, 1);
  // Also delete associated order items
  orderItems = orderItems.filter(oi => oi.orderId !== id);
  return true;
};

// ============================================
// DASHBOARD HELPERS
// ============================================

export const getDashboardStats = () => {
  const allOrders = getOrders();
  const allProducts = getProducts();
  const allCategories = getCategories();
  const allCollections = getCollections();

  const totalOrders = allOrders.length;
  const totalProducts = allProducts.length;
  const totalCategories = allCategories.length;
  const totalCollections = allCollections.length;
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = allOrders.filter(o => o.status === 'PENDING').length;
  const lowStockProducts = allProducts.filter(p => p.inventory < 30).length;

  const recentOrders = allOrders.slice(0, 5);

  const orderStatusCounts = allOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
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
};

export const getTopProducts = (limit: number = 5): Array<{ product: Product; totalSales: number; totalRevenue: number }> => {
  const allOrders = getOrders();
  const allProducts = getProducts();

  // Calculate sales by product from order items
  const productSales = new Map<string, { count: number; revenue: number }>();

  allOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = productSales.get(item.productId) || { count: 0, revenue: 0 };
      productSales.set(item.productId, {
        count: existing.count + item.quantity,
        revenue: existing.revenue + item.totalPrice,
      });
    });
  });

  // Create array with product details and sort by revenue
  const topProducts = allProducts
    .map(product => {
      const sales = productSales.get(product.id) || { count: 0, revenue: 0 };
      return {
        product,
        totalSales: sales.count,
        totalRevenue: sales.revenue,
      };
    })
    .filter(item => item.totalSales > 0) // Only include products with sales
    .sort((a, b) => b.totalRevenue - a.totalRevenue) // Sort by revenue (highest first)
    .slice(0, limit);

  return topProducts;
};

// ============================================
// RESET DATA (for testing)
// ============================================

export const resetData = () => {
  products = [];
  categories = [];
  collections = [];
  orders = [];
  orderItems = [];
  initializeData();
};
