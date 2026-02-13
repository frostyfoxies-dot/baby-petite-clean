/**
 * User types for the Kids Petite e-commerce platform
 */

/** User role enumeration */
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'STAFF';

/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's phone number (optional) */
  phone?: string;
  /** User's role in the system */
  role: UserRole;
  /** URL to user's avatar image (optional) */
  avatar?: string;
  /** Date when email was verified (null if not verified) */
  emailVerified: Date | null;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * User with password field (internal use only)
 */
export interface UserWithPassword extends User {
  /** Hashed password */
  password: string;
}

/**
 * Public user information (safe to expose)
 */
export interface UserPublic {
  /** Unique identifier */
  id: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** URL to user's avatar image (optional) */
  avatar?: string;
}
