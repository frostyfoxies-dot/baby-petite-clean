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
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 44.98,
    compareAtPrice: 27.60,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 8,
    maxAgeMonths: 23,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Cozy Fleece Sleep Sack',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 30.34,
    compareAtPrice: 38.51,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 25,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Floral Summer Dress',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 38.32,
    compareAtPrice: 35.32,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 0,
    maxAgeMonths: 22,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Knit Cardigan',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 34.34,
    compareAtPrice: 37.37,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 24,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Romper Set',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 32.77,
    compareAtPrice: 20.63,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 9,
    maxAgeMonths: 30,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Quilted Jacket',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 31.89,
    compareAtPrice: 27.39,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 9,
    maxAgeMonths: 14,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Pajama Set',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 36.37,
    compareAtPrice: 25.16,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 5,
    maxAgeMonths: 30,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Legging Set',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 40.36,
    compareAtPrice: 22.86,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 8,
    maxAgeMonths: 22,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Long Sleeve Tee',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 41.37,
    compareAtPrice: 21.23,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 4,
    maxAgeMonths: 22,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Short Sleeve Tee',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 31.27,
    compareAtPrice: 20.40,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 2,
    maxAgeMonths: 14,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Sweatshirt',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 22.35,
    compareAtPrice: 24.32,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 5,
    maxAgeMonths: 25,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Hoodie',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 42.12,
    compareAtPrice: 21.27,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 0,
    maxAgeMonths: 30,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Jumpsuit',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 15.60,
    compareAtPrice: 31.00,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 11,
    maxAgeMonths: 12,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Dress with Ruffles',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 30.62,
    compareAtPrice: 33.00,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 7,
    maxAgeMonths: 23,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Button-Up Shirt',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 19.97,
    compareAtPrice: 31.26,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 10,
    maxAgeMonths: 26,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Polo Shirt',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 21.94,
    compareAtPrice: 39.84,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 9,
    maxAgeMonths: 19,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Sweater Dress',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 31.80,
    compareAtPrice: 24.60,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 11,
    maxAgeMonths: 12,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Knitted Sweater',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 38.45,
    compareAtPrice: 31.65,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 27,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Bubble Jacket',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 29.55,
    compareAtPrice: 31.96,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 2,
    maxAgeMonths: 13,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Snowsuit',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 31.16,
    compareAtPrice: 25.44,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 2,
    maxAgeMonths: 14,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Raincoat',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 34.29,
    compareAtPrice: 29.19,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 10,
    maxAgeMonths: 13,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Overalls',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 28.49,
    compareAtPrice: 30.22,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 10,
    maxAgeMonths: 16,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Shorts Set',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 32.95,
    compareAtPrice: 30.37,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 0,
    maxAgeMonths: 17,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Capri Set',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 17.11,
    compareAtPrice: 29.80,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 11,
    maxAgeMonths: 24,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Swim Diaper',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 44.83,
    compareAtPrice: 31.46,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 11,
    maxAgeMonths: 31,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Bathing Suit',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 40.43,
    compareAtPrice: 32.95,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 4,
    maxAgeMonths: 32,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Sun Hat',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 18.32,
    compareAtPrice: 29.52,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 1,
    maxAgeMonths: 32,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Beanie',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 21.61,
    compareAtPrice: 32.98,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 10,
    maxAgeMonths: 17,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Mittens',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 24.66,
    compareAtPrice: 24.21,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 8,
    maxAgeMonths: 31,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Socks',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 15.79,
    compareAtPrice: 30.98,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 4,
    maxAgeMonths: 21,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Shoes',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 33.22,
    compareAtPrice: 24.26,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 5,
    maxAgeMonths: 27,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Booties',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 26.97,
    compareAtPrice: 34.15,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 12,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Sandals',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 37.41,
    compareAtPrice: 20.64,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 11,
    maxAgeMonths: 29,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Slip-ons',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 20.27,
    compareAtPrice: 29.48,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 2,
    maxAgeMonths: 26,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Dress Shirt',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 25.85,
    compareAtPrice: 21.74,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 5,
    maxAgeMonths: 33,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Tie',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 33.25,
    compareAtPrice: 24.86,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 1,
    maxAgeMonths: 21,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Vest',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 40.09,
    compareAtPrice: 20.04,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 1,
    maxAgeMonths: 17,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Pants',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 38.50,
    compareAtPrice: 37.59,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 0,
    maxAgeMonths: 21,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Jeans',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 17.90,
    compareAtPrice: 29.60,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 11,
    maxAgeMonths: 20,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Skirt',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 26.49,
    compareAtPrice: 39.27,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 31,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Overall Dress',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 40.18,
    compareAtPrice: 26.85,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 9,
    maxAgeMonths: 13,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Tunic',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 33.19,
    compareAtPrice: 36.23,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 2,
    maxAgeMonths: 20,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Layer Set',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 21.69,
    compareAtPrice: 31.38,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 34,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Zip-Up Hoodie',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 27.81,
    compareAtPrice: 34.11,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 10,
    maxAgeMonths: 21,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Pullover',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 18.99,
    compareAtPrice: 27.56,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 7,
    maxAgeMonths: 23,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Cardigan',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 44.43,
    compareAtPrice: 33.68,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 1,
    maxAgeMonths: 26,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Blazer',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 40.55,
    compareAtPrice: 26.52,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 28,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Peplum Top',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 35.02,
    compareAtPrice: 30.26,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 4,
    maxAgeMonths: 14,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Tiered Dress',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 32.82,
    compareAtPrice: 25.38,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 5,
    maxAgeMonths: 22,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Smocked Bodysuit',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 19.49,
    compareAtPrice: 23.41,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 2,
    maxAgeMonths: 17,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Ruffled Leggings',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 26.66,
    compareAtPrice: 36.50,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 8,
    maxAgeMonths: 20,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Embroidered Dress',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 42.51,
    compareAtPrice: 38.45,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 6,
    maxAgeMonths: 13,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Knitted Romper',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 15.85,
    compareAtPrice: 37.53,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 1,
    maxAgeMonths: 20,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Quilted Vest',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 27.31,
    compareAtPrice: 22.48,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 0,
    maxAgeMonths: 29,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Fleece Jacket',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 27.58,
    compareAtPrice: 38.21,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 28,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Baby Item 56',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 20.57,
    compareAtPrice: 26.44,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 3,
    maxAgeMonths: 34,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Baby Item 57',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 18.38,
    compareAtPrice: 29.87,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 11,
    maxAgeMonths: 27,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Baby Item 58',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 36.90,
    compareAtPrice: 35.16,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 10,
    maxAgeMonths: 35,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Baby Item 59',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 37.03,
    compareAtPrice: 25.25,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 7,
    maxAgeMonths: 33,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
  },
  {
    name: 'Baby Item 60',
    description: 'A soft and comfortable product made from high-quality materials. Perfect for everyday wear.',
    price: 22.05,
    compareAtPrice: 38.62,
    brand: 'Baby Petite',
    materials: ['100% Cotton', 'Organic Cotton', 'Bamboo', 'Cotton Blend'][Math.floor(Math.random()*4)],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    minAgeMonths: 6,
    maxAgeMonths: 33,
    gender: ['unisex', 'female', 'male'][Math.floor(Math.random()*3)];,
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
