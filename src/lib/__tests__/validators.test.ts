import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  loginPasswordSchema,
  nameSchema,
  phoneSchema,
  slugSchema,
  idSchema,
  addressSchema,
  userRegistrationSchema,
  userLoginSchema,
  userProfileSchema,
  passwordChangeSchema,
  productSchema,
  variantSchema,
  cartItemSchema,
  checkoutSchema,
  registrySchema,
  registryItemSchema,
  reviewSchema,
  discountCodeSchema,
  orderStatusSchema,
} from '../validators';

describe('emailSchema', () => {
  it('should validate correct email', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
  });

  it('should normalize email to lowercase', () => {
    const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('should trim whitespace', () => {
    const result = emailSchema.safeParse('  test@example.com  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('should reject invalid email', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('should validate strong password', () => {
    const result = passwordSchema.safeParse('Password123');
    expect(result.success).toBe(true);
  });

  it('should reject short password', () => {
    const result = passwordSchema.safeParse('Pass1');
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = passwordSchema.safeParse('PASSWORD123');
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = passwordSchema.safeParse('password123');
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = passwordSchema.safeParse('PasswordOnly');
    expect(result.success).toBe(false);
  });
});

describe('loginPasswordSchema', () => {
  it('should accept any non-empty password', () => {
    const result = loginPasswordSchema.safeParse('anypassword');
    expect(result.success).toBe(true);
  });

  it('should reject empty password', () => {
    const result = loginPasswordSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('nameSchema', () => {
  it('should validate correct name', () => {
    const result = nameSchema.safeParse('John Doe');
    expect(result.success).toBe(true);
  });

  it('should trim whitespace', () => {
    const result = nameSchema.safeParse('  John  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('John');
    }
  });

  it('should reject empty name', () => {
    const result = nameSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should reject name over 100 characters', () => {
    const result = nameSchema.safeParse('a'.repeat(101));
    expect(result.success).toBe(false);
  });
});

describe('phoneSchema', () => {
  it('should validate US phone number', () => {
    const result = phoneSchema.safeParse('+1 (555) 123-4567');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('15551234567');
    }
  });

  it('should strip non-digit characters', () => {
    const result = phoneSchema.safeParse('555-123-4567');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('5551234567');
    }
  });

  it('should reject invalid phone format', () => {
    const result = phoneSchema.safeParse('abc');
    expect(result.success).toBe(false);
  });

  it('should reject phone with less than 10 digits', () => {
    const result = phoneSchema.safeParse('123-456-789');
    expect(result.success).toBe(false);
  });
});

describe('slugSchema', () => {
  it('should validate correct slug', () => {
    const result = slugSchema.safeParse('baby-onesie-123');
    expect(result.success).toBe(true);
  });

  it('should reject uppercase letters', () => {
    const result = slugSchema.safeParse('Baby-Onesie');
    expect(result.success).toBe(false);
  });

  it('should reject special characters', () => {
    const result = slugSchema.safeParse('baby_onesie');
    expect(result.success).toBe(false);
  });

  it('should reject empty slug', () => {
    const result = slugSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('idSchema', () => {
  it('should validate CUID format', () => {
    const result = idSchema.safeParse('clx1234567890abcdef');
    expect(result.success).toBe(true);
  });

  it('should reject invalid ID format', () => {
    const result = idSchema.safeParse('invalid-id');
    expect(result.success).toBe(false);
  });
});

describe('addressSchema', () => {
  const validAddress = {
    name: 'Home',
    line1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  };

  it('should validate complete address', () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it('should reject missing line1', () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      line1: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing city', () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      city: '',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional line2', () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      line2: 'Apt 4B',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional phone', () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      phone: '555-123-4567',
    });
    expect(result.success).toBe(true);
  });

  it('should default isDefault to false', () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(false);
    }
  });
});

describe('userRegistrationSchema', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'Password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('should validate complete user registration', () => {
    const result = userRegistrationSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = userRegistrationSchema.safeParse({
      ...validUser,
      email: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak password', () => {
    const result = userRegistrationSchema.safeParse({
      ...validUser,
      password: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional phone', () => {
    const result = userRegistrationSchema.safeParse({
      ...validUser,
      phone: '555-123-4567',
    });
    expect(result.success).toBe(true);
  });

  it('should default acceptMarketing to false', () => {
    const result = userRegistrationSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.acceptMarketing).toBe(false);
    }
  });
});

describe('userLoginSchema', () => {
  it('should validate login credentials', () => {
    const result = userLoginSchema.safeParse({
      email: 'test@example.com',
      password: 'anypassword',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = userLoginSchema.safeParse({
      email: 'invalid',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = userLoginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('should default rememberMe to false', () => {
    const result = userLoginSchema.safeParse({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });
});

describe('userProfileSchema', () => {
  it('should validate profile update', () => {
    const result = userProfileSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(result.success).toBe(true);
  });

  it('should accept all optional fields', () => {
    const result = userProfileSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-123-4567',
      dateOfBirth: '1990-01-15T00:00:00.000Z',
      avatar: 'https://example.com/avatar.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid avatar URL', () => {
    const result = userProfileSchema.safeParse({
      avatar: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('passwordChangeSchema', () => {
  const validChange = {
    currentPassword: 'currentPass',
    newPassword: 'NewPassword123',
    confirmPassword: 'NewPassword123',
  };

  it('should validate matching passwords', () => {
    const result = passwordChangeSchema.safeParse(validChange);
    expect(result.success).toBe(true);
  });

  it('should reject non-matching passwords', () => {
    const result = passwordChangeSchema.safeParse({
      ...validChange,
      confirmPassword: 'DifferentPassword',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak new password', () => {
    const result = passwordChangeSchema.safeParse({
      ...validChange,
      newPassword: 'weak',
      confirmPassword: 'weak',
    });
    expect(result.success).toBe(false);
  });
});

describe('variantSchema', () => {
  const validVariant = {
    sku: 'SKU-123',
    name: 'Small - Blue',
    price: 29.99,
  };

  it('should validate complete variant', () => {
    const result = variantSchema.safeParse(validVariant);
    expect(result.success).toBe(true);
  });

  it('should reject missing SKU', () => {
    const result = variantSchema.safeParse({
      ...validVariant,
      sku: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const result = variantSchema.safeParse({
      ...validVariant,
      price: -10,
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional fields', () => {
    const result = variantSchema.safeParse({
      ...validVariant,
      compareAtPrice: 39.99,
      color: 'Blue',
      size: 'S',
      stockQuantity: 100,
    });
    expect(result.success).toBe(true);
  });

  it('should default stockQuantity to 0', () => {
    const result = variantSchema.safeParse(validVariant);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stockQuantity).toBe(0);
    }
  });
});

describe('productSchema', () => {
  const validProduct = {
    name: 'Baby Onesie',
    slug: 'baby-onesie',
    description: 'A comfortable baby onesie made from 100% cotton.',
    categoryId: 'clx1234567890abcdef',
    images: ['https://example.com/image.jpg'],
    variants: [
      {
        sku: 'SKU-123',
        name: 'Small - Blue',
        price: 29.99,
      },
    ],
  };

  it('should validate complete product', () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject product without images', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      images: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject product without variants', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      variants: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid image URL', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      images: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional fields', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      brand: 'Kids Petite',
      tags: ['baby', 'cotton'],
      isFeatured: true,
      gender: 'unisex',
    });
    expect(result.success).toBe(true);
  });
});

describe('cartItemSchema', () => {
  it('should validate cart item', () => {
    const result = cartItemSchema.safeParse({
      productId: 'clx1234567890abcdef',
      variantId: 'clx0987654321fedcba',
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it('should reject quantity of 0', () => {
    const result = cartItemSchema.safeParse({
      productId: 'clx1234567890abcdef',
      variantId: 'clx0987654321fedcba',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject quantity over 99', () => {
    const result = cartItemSchema.safeParse({
      productId: 'clx1234567890abcdef',
      variantId: 'clx0987654321fedcba',
      quantity: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe('checkoutSchema', () => {
  const validCheckout = {
    email: 'test@example.com',
    shippingAddress: {
      name: 'Home',
      line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    shippingMethodId: 'standard',
  };

  it('should validate checkout data', () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      email: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should default useSameBillingAddress to true', () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.useSameBillingAddress).toBe(true);
    }
  });

  it('should accept optional fields', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      discountCode: 'SAVE10',
      giftMessage: 'Happy Birthday!',
      isGift: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('registryItemSchema', () => {
  it('should validate registry item', () => {
    const result = registryItemSchema.safeParse({
      productId: 'clx1234567890abcdef',
      variantId: 'clx0987654321fedcba',
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it('should default priority to nice_to_have', () => {
    const result = registryItemSchema.safeParse({
      productId: 'clx1234567890abcdef',
      variantId: 'clx0987654321fedcba',
      quantity: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('nice_to_have');
    }
  });

  it('should accept valid priorities', () => {
    const priorities = ['essential', 'nice_to_have', 'dream'] as const;
    priorities.forEach((priority) => {
      const result = registryItemSchema.safeParse({
        productId: 'clx1234567890abcdef',
        variantId: 'clx0987654321fedcba',
        quantity: 1,
        priority,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('registrySchema', () => {
  const validRegistry = {
    name: 'Baby Smith Registry',
    parentName: 'John Smith',
    email: 'john@example.com',
    items: [
      {
        productId: 'clx1234567890abcdef',
        variantId: 'clx0987654321fedcba',
        quantity: 1,
      },
    ],
  };

  it('should validate registry', () => {
    const result = registrySchema.safeParse(validRegistry);
    expect(result.success).toBe(true);
  });

  it('should reject registry without items', () => {
    const result = registrySchema.safeParse({
      ...validRegistry,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional fields', () => {
    const result = registrySchema.safeParse({
      ...validRegistry,
      parent2Name: 'Jane Smith',
      babyName: 'Baby Smith',
      dueDate: '2024-06-15T00:00:00.000Z',
      message: 'Welcome to our registry!',
    });
    expect(result.success).toBe(true);
  });

  it('should default isPublic to true', () => {
    const result = registrySchema.safeParse(validRegistry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(true);
    }
  });
});

describe('reviewSchema', () => {
  it('should validate review', () => {
    const result = reviewSchema.safeParse({
      productId: 'clx1234567890abcdef',
      rating: 5,
      title: 'Great product!',
      content: 'This is an excellent product. My baby loves it!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject rating below 1', () => {
    const result = reviewSchema.safeParse({
      productId: 'clx1234567890abcdef',
      rating: 0,
      title: 'Review',
      content: 'Content here',
    });
    expect(result.success).toBe(false);
  });

  it('should reject rating above 5', () => {
    const result = reviewSchema.safeParse({
      productId: 'clx1234567890abcdef',
      rating: 6,
      title: 'Review',
      content: 'Content here',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short content', () => {
    const result = reviewSchema.safeParse({
      productId: 'clx1234567890abcdef',
      rating: 5,
      title: 'Review',
      content: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('should limit images to 5', () => {
    const images = Array(6).fill('https://example.com/image.jpg');
    const result = reviewSchema.safeParse({
      productId: 'clx1234567890abcdef',
      rating: 5,
      title: 'Review',
      content: 'Great product!',
      images,
    });
    expect(result.success).toBe(false);
  });
});

describe('discountCodeSchema', () => {
  it('should validate percentage discount', () => {
    const result = discountCodeSchema.safeParse({
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should validate fixed discount', () => {
    const result = discountCodeSchema.safeParse({
      code: 'SAVE5',
      type: 'fixed',
      value: 5,
    });
    expect(result.success).toBe(true);
  });

  it('should uppercase and trim code', () => {
    const result = discountCodeSchema.safeParse({
      code: '  save10  ',
      type: 'percentage',
      value: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('SAVE10');
    }
  });

  it('should reject negative value', () => {
    const result = discountCodeSchema.safeParse({
      code: 'SAVE10',
      type: 'percentage',
      value: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe('orderStatusSchema', () => {
  it('should validate valid statuses', () => {
    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'failed',
    ];

    validStatuses.forEach((status) => {
      const result = orderStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status', () => {
    const result = orderStatusSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});
