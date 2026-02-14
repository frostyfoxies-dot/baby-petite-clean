/**
 * Address types for the Baby Petite e-commerce platform
 */

/** Address type enumeration */
export type AddressType = 'SHIPPING' | 'BILLING';

/**
 * Represents a user's address
 */
export interface Address {
  /** Unique identifier */
  id: string;
  /** ID of the user who owns this address */
  userId: string;
  /** Type of address (shipping or billing) */
  type: AddressType;
  /** Recipient's first name */
  firstName: string;
  /** Recipient's last name */
  lastName: string;
  /** Street address line 1 */
  address1: string;
  /** Street address line 2 (optional) */
  address2?: string;
  /** City name */
  city: string;
  /** State or province */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** Country name */
  country: string;
  /** Phone number for delivery contact */
  phone: string;
  /** Whether this is the default address for this type */
  isDefault: boolean;
  /** Address creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Input type for creating or updating an address
 */
export interface AddressInput {
  /** Type of address (shipping or billing) */
  type: AddressType;
  /** Recipient's first name */
  firstName: string;
  /** Recipient's last name */
  lastName: string;
  /** Street address line 1 */
  address1: string;
  /** Street address line 2 (optional) */
  address2?: string;
  /** City name */
  city: string;
  /** State or province */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** Country name */
  country: string;
  /** Phone number for delivery contact */
  phone: string;
  /** Whether this is the default address for this type */
  isDefault?: boolean;
}
