/**
 * Database Seeding Script
 * 
 * This script populates the database with sample data for development.
 * Run with: pnpm db:seed
 * 
 * @example
 * pnpm db:seed
 * pnpm db:seed --clean  # Clear existing data first
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { generateShareCode, generateOrderNumber } from '../src/lib/utils';

const prisma = new PrismaClient();

// Configuration
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password123';

// Sample data
const categories = [
  {
    name: 'Onesies & Rompers',
    slug: 'onesies-rompers',
    description: 'Comfortable one-piece outfits for babies',
    image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800',
  },
  {
    name: 'Sleepwear',
    slug: 'sleepwear',
    description: 'Cozy sleepwear for peaceful nights',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800',
  },
  {
    name: 'Dresses & Sets',
    slug: 'dresses-sets',
    description: 'Adorable dresses and matching sets',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800',
  },
  {
    name: 'Outerwear',
    slug: 'outerwear',
    description: 'Jackets, sweaters, and outer layers',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Hats, socks, and other accessories',
    image: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=800',
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    description: 'Soft-soled shoes and booties',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800',
  },
];

const sizes = ['Newborn', '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M', '2T', '3T', '4T'];
const colors = ['White', 'Pink', 'Blue', 'Gray', 'Yellow', 'Green', 'Navy', 'Red', 'Black', 'Cream'];
const materials = ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend', 'Fleece'];

const sampleProducts = [
  {
    name: 'Classic Cotton Onesie',
    description: 'A soft and comfortable everyday onesie made from 100% organic cotton. Features snap closures for easy diaper changes.',
    price: 12.99,
    compareAtPrice: 16.99,
    brand: 'Kids Petite',
    materials: ['100% Organic Cotton'],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 0,
    maxAgeMonths: 24,
    gender: 'unisex',
  },
  {
    name: 'Cozy Fleece Sleep Sack',
    description: 'Keep your little one warm and cozy with this fleece sleep sack. Safe alternative to blankets.',
    price: 29.99,
    brand: 'Kids Petite',
    materials: ['Fleece', 'Cotton Blend'],
    careInstructions: ['Machine wash cold', 'Tumble dry low'],
    minAgeMonths: 0,
    maxAgeMonths: 12,
    gender: 'unisex',
  },
  {
    name: 'Floral Summer Dress',
    description: 'Adorable floral print dress perfect for summer days. Lightweight and breathable.',
    price: 24.99,
    compareAtPrice: 34.99,
    brand: 'Kids Petite',
    materials: ['100% Cotton'],
    careInstructions: ['Machine wash cold', 'Hang to dry', 'Iron on low'],
    minAgeMonths: 6,
    maxAgeMonths: 36,
    gender: 'female',
  },
  {
    name: 'Dinosaur Print Romper',
    description: 'Fun dinosaur print romper with footies. Perfect for your little explorer.',
    price: 18.99,
    brand: 'Kids Petite',
    materials: ['Cotton Blend'],
    careInstructions: ['Machine wash cold', 'Tumble dry low'],
    minAgeMonths: 0,
    maxAgeMonths: 18,
    gender: 'male',
  },
  {
    name: 'Knit Cardigan Sweater',
    description: 'Soft knit cardigan perfect for layering. Features button closure and ribbed cuffs.',
    price: 32.99,
    brand: 'Kids Petite',
    materials: ['Cotton Blend'],
    careInstructions: ['Hand wash cold', 'Lay flat to dry'],
    minAgeMonths: 3,
    maxAgeMonths: 36,
    gender: 'unisex',
  },
  {
    name: 'Soft-Sole Moccasins',
    description: 'Adorable soft-sole moccasins for early walkers. Non-slip suede sole.',
    price: 19.99,
    brand: 'Kids Petite',
    materials: ['Leather', 'Suede'],
    careInstructions: ['Wipe clean with damp cloth'],
    minAgeMonths: 6,
    maxAgeMonths: 24,
    gender: 'unisex',
  },
  {
    name: 'Bamboo Pajama Set',
    description: 'Ultra-soft bamboo pajama set. Naturally temperature regulating and hypoallergenic.',
    price: 34.99,
    brand: 'Kids Petite',
    materials: ['Bamboo'],
    careInstructions: ['Machine wash cold', 'Tumble dry low'],
    minAgeMonths: 0,
    maxAgeMonths: 24,
    gender: 'unisex',
  },
  {
    name: 'Cable Knit Beanie',
    description: 'Classic cable knit beanie to keep little heads warm. Stretchy fit.',
    price: 14.99,
    brand: 'Kids Petite',
    materials: ['100% Cotton'],
    careInstructions: ['Hand wash', 'Lay flat to dry'],
    minAgeMonths: 0,
    maxAgeMonths: 24,
    gender: 'unisex',
  },
];

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.registryItem.deleteMany();
  await prisma.registry.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleaned');
}

async function seedUsers() {
  console.log('👤 Seeding users...');
  
  const hashedPassword = await hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  
  const users: Array<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'CUSTOMER' | 'STAFF';
    emailVerified: Date;
  }> = [
    {
      email: 'admin@babypetite.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
    {
      email: 'customer@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      emailVerified: new Date(),
    },
    {
      email: 'jane@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'CUSTOMER',
      emailVerified: new Date(),
    },
  ];
  
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  
  console.log(`✅ Created ${users.length} users`);
}

async function seedCategories() {
  console.log('📁 Seeding categories...');
  
  for (let i = 0; i < categories.length; i++) {
    await prisma.category.create({
      data: {
        ...categories[i],
        sortOrder: i,
      },
    });
  }
  
  console.log(`✅ Created ${categories.length} categories`);
}

async function seedProducts() {
  console.log('📦 Seeding products...');
  
  const allCategories = await prisma.category.findMany();
  
  for (let i = 0; i < sampleProducts.length; i++) {
    const productData = sampleProducts[i];
    const category = allCategories[i % allCategories.length];
    
    // Create product
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.name.toLowerCase().replace(/\s+/g, '-'),
        description: productData.description,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice || null,
        brand: productData.brand,
        materials: productData.materials,
        careInstructions: productData.careInstructions,
        minAgeMonths: productData.minAgeMonths,
        maxAgeMonths: productData.maxAgeMonths,
        gender: productData.gender,
        categoryId: category.id,
        images: [
          { url: `https://picsum.photos/seed/${i}/800/800`, alt: productData.name },
          { url: `https://picsum.photos/seed/${i + 100}/800/800`, alt: `${productData.name} - Back` },
        ],
        isFeatured: i < 4,
        isActive: true,
      },
    });
    
    // Create variants for each size/color combination
    const variantsToCreate = [];
    for (const size of sizes.slice(0, 5)) { // First 5 sizes
      for (const color of colors.slice(0, 3)) { // First 3 colors
        variantsToCreate.push({
          productId: product.id,
          sku: `KP-${product.id.slice(-4)}-${size.replace('-', '')}-${color.slice(0, 3)}`.toUpperCase(),
          name: `${size} - ${color}`,
          price: productData.price,
          compareAtPrice: productData.compareAtPrice || null,
          stockQuantity: Math.floor(Math.random() * 50) + 10,
          size,
          color,
          weight: 0.2,
          weightUnit: 'kg',
        });
      }
    }
    
    await prisma.variant.createMany({
      data: variantsToCreate,
    });
  }
  
  console.log(`✅ Created ${sampleProducts.length} products with variants`);
}

async function seedAddresses() {
  console.log('📍 Seeding addresses...');
  
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
  });
  
  for (const user of users) {
    await prisma.address.create({
      data: {
        userId: user.id,
        name: 'Home',
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        phone: '555-123-4567',
        isDefault: true,
      },
    });
  }
  
  console.log(`✅ Created addresses for ${users.length} users`);
}

async function seedOrders() {
  console.log('🛒 Seeding orders...');
  
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
  });
  const variants = await prisma.variant.findMany({
    take: 10,
    include: { product: true },
  });
  
  for (const user of users) {
    // Create 2-3 orders per user
    const orderCount = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < orderCount; i++) {
      const orderNumber = generateOrderNumber();
      const orderItems = variants.slice(0, Math.floor(Math.random() * 3) + 1);
      
      const subtotal = orderItems.reduce(
        (sum: number, item: { price: number }) => sum + item.price * 2,
        0
      );
      
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: ['DELIVERED', 'SHIPPED', 'PROCESSING'][i % 3],
          subtotal,
          tax: subtotal * 0.08,
          shipping: 5.99,
          total: subtotal * 1.08 + 5.99,
          shippingAddress: {
            name: 'Home',
            line1: '123 Main Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
          items: {
            create: orderItems.map((item: { productId: string; id: string; product: { name: string; images: { url: string }[] }; name: string; sku: string; price: number }) => ({
              productId: item.productId,
              variantId: item.id,
              productName: item.product.name,
              variantName: item.name,
              sku: item.sku,
              price: item.price,
              quantity: 2,
              image: item.product.images[0]?.url || '',
            })),
          },
        },
      });
    }
  }
  
  console.log(`✅ Created orders for ${users.length} users`);
}

async function seedRegistries() {
  console.log('🎁 Seeding registries...');
  
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
  });
  const variants = await prisma.variant.findMany({
    take: 5,
    include: { product: true },
  });
  
  for (const user of users) {
    const shareCode = generateShareCode();
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 3);
    
    await prisma.registry.create({
      data: {
        shareCode,
        userId: user.id,
        name: `Baby ${user.lastName}'s Registry`,
        parentName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        dueDate,
        isPublic: true,
        items: {
          create: variants.map((variant: { productId: string; id: string }, index: number) => ({
            productId: variant.productId,
            variantId: variant.id,
            quantity: 2,
            priority: ['essential', 'nice_to_have', 'dream'][index % 3] as any,
          })),
        },
      },
    });
  }
  
  console.log(`✅ Created registries for ${users.length} users`);
}

async function seedReviews() {
  console.log('⭐ Seeding reviews...');
  
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
  });
  const products = await prisma.product.findMany();
  
  const reviewTexts = [
    'Great quality! My baby loves it.',
    'Soft material and fits perfectly.',
    'Adorable design, exactly as pictured.',
    'Good value for the price.',
    'Would definitely recommend to other parents.',
  ];
  
  for (const product of products.slice(0, 5)) {
    for (const user of users) {
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: user.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          title: 'Great product!',
          content: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
          recommend: true,
        },
      });
    }
  }
  
  console.log(`✅ Created reviews for products`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean');
  
  console.log('🌱 Starting database seed...');
  console.log('');
  
  try {
    if (shouldClean) {
      await cleanDatabase();
    }
    
    await seedUsers();
    await seedCategories();
    await seedProducts();
    await seedAddresses();
    await seedOrders();
    await seedRegistries();
    await seedReviews();
    
    console.log('');
    console.log('🎉 Database seed completed successfully!');
    console.log('');
    console.log('Test accounts:');
    console.log('  Admin: admin@babypetite.com / Password123');
    console.log('  Customer: customer@example.com / Password123');
    console.log('  Customer: jane@example.com / Password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
