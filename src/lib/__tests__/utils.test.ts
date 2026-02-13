import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  formatPrice,
  formatPriceFromCents,
  parsePrice,
  slugify,
  truncate,
  generateOrderNumber,
  generateShareCode,
  generateId,
  validateEmail,
  validatePassword,
  calculateDiscountPercentage,
  calculateDiscountedPrice,
  calculateSavings,
  capitalize,
  titleCase,
  getInitials,
  formatDate,
  formatRelativeDate,
  calculateAge,
} from '../utils';

describe('cn (className merger)', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('should handle object notation', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('should handle array notation', () => {
    expect(cn(['flex', 'items-center'], 'justify-center')).toBe('flex items-center justify-center');
  });
});

describe('formatPrice', () => {
  it('should format USD by default', () => {
    const result = formatPrice(99.99);
    expect(result).toContain('99.99');
    expect(result).toContain('$');
  });

  it('should format EUR correctly', () => {
    const result = formatPrice(99.99, 'EUR');
    expect(result).toContain('99,99');
    expect(result).toContain('€');
  });

  it('should format GBP correctly', () => {
    const result = formatPrice(99.99, 'GBP');
    expect(result).toContain('99.99');
    expect(result).toContain('£');
  });

  it('should handle zero amount', () => {
    const result = formatPrice(0);
    expect(result).toBe('$0.00');
  });

  it('should handle large amounts', () => {
    const result = formatPrice(1234567.89);
    expect(result).toContain('1,234,567.89');
  });

  it('should accept custom options', () => {
    const result = formatPrice(99, 'USD', { minimumFractionDigits: 0 });
    expect(result).toContain('99');
  });
});

describe('formatPriceFromCents', () => {
  it('should convert cents to dollars', () => {
    const result = formatPriceFromCents(9999);
    expect(result).toContain('99.99');
  });

  it('should handle zero cents', () => {
    const result = formatPriceFromCents(0);
    expect(result).toBe('$0.00');
  });

  it('should handle small amounts', () => {
    const result = formatPriceFromCents(99);
    expect(result).toContain('0.99');
  });
});

describe('parsePrice', () => {
  it('should parse formatted price string', () => {
    expect(parsePrice('$99.99')).toBe(99.99);
  });

  it('should handle prices without symbol', () => {
    expect(parsePrice('99.99')).toBe(99.99);
  });

  it('should handle prices with commas', () => {
    expect(parsePrice('$1,234.56')).toBe(1234.56);
  });

  it('should handle negative prices', () => {
    expect(parsePrice('-$50.00')).toBe(-50);
  });
});

describe('slugify', () => {
  it('should convert text to lowercase', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('baby onesie cute')).toBe('baby-onesie-cute');
  });

  it('should remove special characters', () => {
    expect(slugify('Baby Onesie - Cute Design!')).toBe('baby-onesie-cute-design');
  });

  it('should trim whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('hello    world')).toBe('hello-world');
  });

  it('should handle underscores', () => {
    expect(slugify('hello_world')).toBe('hello-world');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(slugify('---hello world---')).toBe('hello-world');
  });
});

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('short text', 20)).toBe('short text');
  });

  it('should truncate long text', () => {
    const result = truncate('This is a long product description', 20);
    expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(result).toContain('...');
  });

  it('should use custom suffix', () => {
    const result = truncate('This is a long text', 10, '…');
    expect(result).toContain('…');
  });

  it('should try to break at word boundary', () => {
    const result = truncate('This is a long product description', 15);
    expect(result).toBe('This is a...');
  });

  it('should handle exact length', () => {
    expect(truncate('exactly ten', 11)).toBe('exactly ten');
  });
});

describe('generateOrderNumber', () => {
  it('should generate order number with default prefix', () => {
    const result = generateOrderNumber();
    expect(result).toMatch(/^KP-\d{4}-[A-Z0-9]{6}$/);
  });

  it('should generate order number with custom prefix', () => {
    const result = generateOrderNumber('ABC');
    expect(result).toMatch(/^ABC-\d{4}-[A-Z0-9]{6}$/);
  });

  it('should generate unique order numbers', () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(generateOrderNumber());
    }
    expect(results.size).toBe(100);
  });

  it('should include current year', () => {
    const currentYear = new Date().getFullYear();
    const result = generateOrderNumber();
    expect(result).toContain(String(currentYear));
  });
});

describe('generateShareCode', () => {
  it('should generate code of default length', () => {
    const result = generateShareCode();
    expect(result.length).toBe(8);
  });

  it('should generate code of custom length', () => {
    const result = generateShareCode(12);
    expect(result.length).toBe(12);
  });

  it('should only contain valid characters', () => {
    const result = generateShareCode();
    expect(result).toMatch(/^[A-HJ-NP-Z2-9]+$/); // No I, O, 0, 1
  });

  it('should generate unique codes', () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(generateShareCode());
    }
    expect(results.size).toBe(100);
  });
});

describe('generateId', () => {
  it('should generate ID without prefix', () => {
    const result = generateId();
    expect(result).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate ID with prefix', () => {
    const result = generateId('user');
    expect(result).toMatch(/^user_[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(generateId());
    }
    expect(results.size).toBe(100);
  });
});

describe('validateEmail', () => {
  it('should validate correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should validate email with subdomain', () => {
    expect(validateEmail('test@mail.example.com')).toBe(true);
  });

  it('should reject email without @', () => {
    expect(validateEmail('testexample.com')).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(validateEmail('test@')).toBe(false);
  });

  it('should reject email without TLD', () => {
    expect(validateEmail('test@example')).toBe(false);
  });

  it('should reject email with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should validate strong password', () => {
    const result = validatePassword('StrongP@ss123');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short password', () => {
    const result = validatePassword('Short1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('should reject password without lowercase', () => {
    const result = validatePassword('PASSWORD123');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without uppercase', () => {
    const result = validatePassword('password123');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('PasswordOnly');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should rate medium strength password', () => {
    const result = validatePassword('Password123');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('medium');
  });

  it('should rate weak password that meets minimum requirements', () => {
    const result = validatePassword('Pass123');
    expect(result.isValid).toBe(false);
    expect(result.strength).toBe('weak');
  });
});

describe('calculateDiscountPercentage', () => {
  it('should calculate discount percentage', () => {
    expect(calculateDiscountPercentage(100, 75)).toBe(25);
  });

  it('should handle 50% discount', () => {
    expect(calculateDiscountPercentage(100, 50)).toBe(50);
  });

  it('should handle no discount', () => {
    expect(calculateDiscountPercentage(100, 100)).toBe(0);
  });

  it('should handle free item', () => {
    expect(calculateDiscountPercentage(100, 0)).toBe(100);
  });

  it('should return 0 for zero original price', () => {
    expect(calculateDiscountPercentage(0, 0)).toBe(0);
  });

  it('should round to nearest integer', () => {
    expect(calculateDiscountPercentage(100, 33)).toBe(67);
  });
});

describe('calculateDiscountedPrice', () => {
  it('should calculate discounted price', () => {
    expect(calculateDiscountedPrice(100, 20)).toBe(80);
  });

  it('should handle 50% discount', () => {
    expect(calculateDiscountedPrice(100, 50)).toBe(50);
  });

  it('should handle no discount', () => {
    expect(calculateDiscountedPrice(100, 0)).toBe(100);
  });

  it('should handle 100% discount', () => {
    expect(calculateDiscountedPrice(100, 100)).toBe(0);
  });
});

describe('calculateSavings', () => {
  it('should calculate savings amount', () => {
    expect(calculateSavings(100, 75)).toBe(25);
  });

  it('should return 0 when no savings', () => {
    expect(calculateSavings(100, 100)).toBe(0);
  });

  it('should return 0 when price increased', () => {
    expect(calculateSavings(100, 150)).toBe(0);
  });
});

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should lowercase rest of string', () => {
    expect(capitalize('HELLO')).toBe('Hello');
  });

  it('should handle single character', () => {
    expect(capitalize('h')).toBe('H');
  });

  it('should handle empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('titleCase', () => {
  it('should capitalize each word', () => {
    expect(titleCase('hello world')).toBe('Hello World');
  });

  it('should handle mixed case', () => {
    expect(titleCase('HELLO WORLD')).toBe('Hello World');
  });

  it('should handle single word', () => {
    expect(titleCase('hello')).toBe('Hello');
  });
});

describe('getInitials', () => {
  it('should get initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('should handle single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('should limit to max initials', () => {
    expect(getInitials('John Michael Smith', 2)).toBe('JM');
  });

  it('should handle extra spaces', () => {
    expect(getInitials('John  Doe')).toBe('JD');
  });

  it('should use default max of 2', () => {
    expect(getInitials('John Michael Smith')).toBe('JM');
  });
});

describe('formatDate', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('should format date in short format', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date, 'short');
    expect(result).toBe('1/15/2024');
  });

  it('should format date in medium format', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date, 'medium');
    expect(result).toBe('Jan 15, 2024');
  });

  it('should format date in long format', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date, 'long');
    expect(result).toBe('January 15, 2024');
  });

  it('should format date in full format', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date, 'full');
    expect(result).toContain('Monday');
    expect(result).toContain('January 15, 2024');
  });

  it('should handle string date', () => {
    const result = formatDate('2024-01-15', 'short');
    expect(result).toBe('1/15/2024');
  });

  it('should handle timestamp', () => {
    const timestamp = new Date('2024-01-15').getTime();
    const result = formatDate(timestamp, 'short');
    expect(result).toBe('1/15/2024');
  });
});

describe('formatRelativeDate', () => {
  it('should return "just now" for recent dates', () => {
    const date = new Date(Date.now() - 30000); // 30 seconds ago
    expect(formatRelativeDate(date)).toBe('just now');
  });

  it('should return minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    expect(formatRelativeDate(date)).toBe('5 minutes ago');
  });

  it('should return singular minute', () => {
    const date = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
    expect(formatRelativeDate(date)).toBe('1 minute ago');
  });

  it('should return hours ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    expect(formatRelativeDate(date)).toBe('3 hours ago');
  });

  it('should return days ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    expect(formatRelativeDate(date)).toBe('2 days ago');
  });

  it('should return weeks ago', () => {
    const date = new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000); // 2 weeks ago
    expect(formatRelativeDate(date)).toBe('2 weeks ago');
  });

  it('should return months ago', () => {
    const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // ~2 months ago
    expect(formatRelativeDate(date)).toBe('2 months ago');
  });

  it('should return years ago', () => {
    const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // ~1 year ago
    expect(formatRelativeDate(date)).toBe('1 year ago');
  });
});

describe('calculateAge', () => {
  it('should calculate age in months for babies', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 6);
    
    const result = calculateAge(birthDate);
    expect(result.totalMonths).toBe(6);
    expect(result.years).toBe(0);
    expect(result.months).toBe(6);
  });

  it('should calculate age in years for older children', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 2);
    birthDate.setMonth(birthDate.getMonth() - 3);
    
    const result = calculateAge(birthDate);
    expect(result.years).toBe(2);
    expect(result.months).toBe(3);
    expect(result.totalMonths).toBe(27);
  });

  it('should handle string date input', () => {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 6);
    
    const result = calculateAge(birthDate.toISOString());
    expect(result.totalMonths).toBe(6);
  });
});
