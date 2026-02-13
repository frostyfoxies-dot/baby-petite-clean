import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility Functions
 *
 * A collection of helper functions used throughout the application.
 * Includes formatting, validation, and transformation utilities.
 */

/**
 * Combines Tailwind CSS classes with proper merging
 * Prevents class conflicts and handles conditional classes
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'opacity-50': isDisabled })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Currency configuration for different locales
 */
const CURRENCY_LOCALES: Record<string, { locale: string; currency: string }> = {
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
  GBP: { locale: 'en-GB', currency: 'GBP' },
  MYR: { locale: 'ms-MY', currency: 'MYR' },
  SGD: { locale: 'en-SG', currency: 'SGD' },
  AUD: { locale: 'en-AU', currency: 'AUD' },
};

/**
 * Formats a number as currency
 *
 * @param amount - Amount to format (in dollars, not cents)
 * @param currencyCode - ISO currency code (default: USD)
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 * @example
 * formatPrice(99.99) // '$99.99'
 * formatPrice(99.99, 'EUR') // '99,99 €'
 */
export function formatPrice(
  amount: number,
  currencyCode: string = 'USD',
  options: Partial<Intl.NumberFormatOptions> = {}
): string {
  const config = CURRENCY_LOCALES[currencyCode] || CURRENCY_LOCALES.USD;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Formats a price from cents to display currency
 *
 * @param cents - Amount in cents
 * @param currencyCode - ISO currency code
 * @returns Formatted currency string
 * @example
 * formatPriceFromCents(9999) // '$99.99'
 */
export function formatPriceFromCents(
  cents: number,
  currencyCode: string = 'USD'
): string {
  return formatPrice(cents / 100, currencyCode);
}

/**
 * Parses a formatted price string to a number
 *
 * @param priceString - Formatted price string
 * @returns Numeric value
 * @example
 * parsePrice('$99.99') // 99.99
 */
export function parsePrice(priceString: string): number {
  return parseFloat(priceString.replace(/[^0-9.-]+/g, ''));
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Formats a date with various options
 *
 * @param date - Date to format
 * @param format - Format style
 * @returns Formatted date string
 * @example
 * formatDate(new Date(), 'short') // '1/15/2024'
 * formatDate(new Date(), 'long') // 'January 15, 2024'
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'full' | 'relative' = 'medium'
): string {
  const dateObj = new Date(date);

  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }

  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'numeric', day: 'numeric', year: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  }[format];

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Formats a date relative to now
 *
 * @param date - Date to format
 * @returns Relative date string
 * @example
 * formatRelativeDate(new Date(Date.now() - 60000)) // '1 minute ago'
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Formats a date for datetime HTML attribute
 *
 * @param date - Date to format
 * @returns ISO date string
 */
export function formatDateTimeISO(date: Date | string): string {
  return new Date(date).toISOString();
}

/**
 * Calculates age from birth date
 *
 * @param birthDate - Birth date
 * @returns Age in months (for babies) or years
 */
export function calculateAge(birthDate: Date | string): {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
} {
  const birth = new Date(birthDate);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    days,
    totalMonths: years * 12 + months,
  };
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Converts a string to a URL-friendly slug
 *
 * @param text - Text to slugify
 * @returns URL slug
 * @example
 * slugify('Baby Onesie - Cute Design!') // 'baby-onesie-cute-design'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Truncates text to a specified length
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 * @example
 * truncate('This is a long product description', 20) // 'This is a long pro...'
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Try to break at a word boundary
  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}

/**
 * Capitalizes the first letter of a string
 *
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalizes each word in a string
 *
 * @param text - Text to title case
 * @returns Title cased text
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Generates initials from a name
 *
 * @param name - Full name
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Initials
 * @example
 * getInitials('John Doe') // 'JD'
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, maxInitials)
    .map((word) => word[0].toUpperCase())
    .join('');
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generates a unique order number
 *
 * @param prefix - Prefix for the order number (default: 'KP')
 * @returns Order number string
 * @example
 * generateOrderNumber() // 'KP-2024-ABC123'
 */
export function generateOrderNumber(prefix: string = 'KP'): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

/**
 * Generates a share code for registries/wishlists
 *
 * @param length - Length of the code (default: 8)
 * @returns Share code
 * @example
 * generateShareCode() // 'A1B2C3D4'
 */
export function generateShareCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a unique ID
 *
 * @param prefix - Optional prefix
 * @returns Unique ID string
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

// ============================================================================
// DISCOUNT CALCULATIONS
// ============================================================================

/**
 * Calculates discount percentage
 *
 * @param originalPrice - Original price
 * @param salePrice - Sale price
 * @returns Discount percentage
 * @example
 * calculateDiscountPercentage(100, 75) // 25
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Calculates the discounted price
 *
 * @param originalPrice - Original price
 * @param discountPercent - Discount percentage
 * @returns Discounted price
 * @example
 * calculateDiscountedPrice(100, 20) // 80
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent: number
): number {
  return originalPrice * (1 - discountPercent / 100);
}

/**
 * Calculates savings amount
 *
 * @param originalPrice - Original price
 * @param salePrice - Sale price
 * @returns Savings amount
 */
export function calculateSavings(originalPrice: number, salePrice: number): number {
  return Math.max(0, originalPrice - salePrice);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates an email address
 *
 * @param email - Email to validate
 * @returns Whether the email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password strength
 *
 * @param password - Password to validate
 * @returns Validation result with strength score
 */
export function validatePassword(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Calculate strength
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 12;

  const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(
    Boolean
  ).length;

  if (criteriaCount >= 4) {
    strength = 'strong';
  } else if (criteriaCount >= 3) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Validates a phone number (US format)
 *
 * @param phone - Phone number to validate
 * @returns Whether the phone number is valid
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Validates a postal code
 *
 * @param postalCode - Postal code to validate
 * @param countryCode - Country code (default: US)
 * @returns Whether the postal code is valid
 */
export function validatePostalCode(
  postalCode: string,
  countryCode: string = 'US'
): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  };

  const pattern = patterns[countryCode] || patterns.US;
  return pattern.test(postalCode);
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Groups an array by a key
 *
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Grouped object
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Removes duplicates from an array
 *
 * @param array - Array with potential duplicates
 * @returns Array with unique values
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Removes duplicates from an array by a key
 *
 * @param array - Array with potential duplicates
 * @param key - Key to check for uniqueness
 * @returns Array with unique items
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Chunks an array into smaller arrays
 *
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Picks specific keys from an object
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with picked keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omits specific keys from an object
 *
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without omitted keys
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * Deep clones an object
 *
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// MISC UTILITIES
// ============================================================================

/**
 * Debounces a function
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttles a function
 *
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Sleeps for a specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if we're running on the server side
 *
 * @returns Whether we're on the server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Checks if we're running on the client side
 *
 * @returns Whether we're on the client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely parses JSON
 *
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Creates a range of numbers
 *
 * @param start - Start of range
 * @param end - End of range
 * @param step - Step size (default: 1)
 * @returns Array of numbers
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}
