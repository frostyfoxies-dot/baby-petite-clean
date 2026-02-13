'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import {
  createAddress as createAddressAction,
  updateAddress as updateAddressAction,
  deleteAddress as deleteAddressAction,
  setDefaultAddress as setDefaultAddressAction,
  type AddressInput,
} from '@/actions/addresses';

/**
 * Address type
 */
export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';

/**
 * Address interface
 */
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  type: AddressType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Addresses hook return type
 */
interface UseAddressesReturn {
  /** Array of user addresses */
  addresses: Address[];
  /** Whether addresses are being loaded */
  isLoading: boolean;
  /** Error if addresses fetch failed */
  error: Error | null;
  /** Add a new address */
  addAddress: (data: AddressInput) => Promise<{ success: boolean; error?: string; addressId?: string }>;
  /** Update an existing address */
  updateAddress: (id: string, data: Partial<AddressInput>) => Promise<{ success: boolean; error?: string }>;
  /** Delete an address */
  deleteAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** Set an address as default */
  setDefault: (id: string, type: AddressType) => Promise<{ success: boolean; error?: string }>;
  /** Refetch addresses */
  refetch: () => Promise<void>;
  /** Get default shipping address */
  getDefaultShipping: () => Address | undefined;
  /** Get default billing address */
  getDefaultBilling: () => Address | undefined;
}

/**
 * Hook for user addresses
 *
 * Fetches and manages state for the current user's addresses.
 * Provides actions for CRUD operations and setting defaults.
 *
 * @returns Addresses state and actions
 *
 * @example
 * ```tsx
 * function AddressManager() {
 *   const {
 *     addresses,
 *     isLoading,
 *     addAddress,
 *     updateAddress,
 *     deleteAddress,
 *     setDefault,
 *   } = useAddresses();
 *
 *   const handleAddAddress = async (data) => {
 *     const result = await addAddress(data);
 *     if (result.success) {
 *       // Address added successfully
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {addresses.map(address => (
 *         <AddressCard
 *           key={address.id}
 *           address={address}
 *           onSetDefault={() => setDefault(address.id, 'SHIPPING')}
 *           onDelete={() => deleteAddress(address.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAddresses(): UseAddressesReturn {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useUIStore();

  /**
   * Fetch addresses from API
   */
  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/addresses');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your addresses');
        }
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch addresses'));
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  /**
   * Add a new address
   */
  const addAddress = useCallback(
    async (data: AddressInput) => {
      try {
        const result = await createAddressAction(data);

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Address added',
            message: 'Your address has been saved successfully.',
          });
          await fetchAddresses();
        } else {
          addToast({
            type: 'error',
            title: 'Failed to add address',
            message: result.error || 'Please check your input and try again.',
          });
        }

        return {
          success: result.success,
          error: result.error,
          addressId: result.data?.addressId,
        };
      } catch (err) {
        console.error('Add address error:', err);
        const errorMessage = 'An unexpected error occurred. Please try again.';
        addToast({
          type: 'error',
          title: 'Failed to add address',
          message: errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [fetchAddresses, addToast]
  );

  /**
   * Update an existing address
   */
  const updateAddress = useCallback(
    async (id: string, data: Partial<AddressInput>) => {
      try {
        const result = await updateAddressAction(id, data);

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Address updated',
            message: 'Your address has been updated successfully.',
          });
          await fetchAddresses();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Update address error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [fetchAddresses, addToast]
  );

  /**
   * Delete an address
   */
  const deleteAddress = useCallback(
    async (id: string) => {
      try {
        const result = await deleteAddressAction(id);

        if (result.success) {
          addToast({
            type: 'info',
            title: 'Address deleted',
            message: 'Your address has been removed.',
          });
          await fetchAddresses();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Delete address error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [fetchAddresses, addToast]
  );

  /**
   * Set an address as default
   */
  const setDefault = useCallback(
    async (id: string, type: AddressType) => {
      try {
        const result = await setDefaultAddressAction({ addressId: id, type });

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Default address updated',
            message: 'Your default address has been changed.',
          });
          await fetchAddresses();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Set default address error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [fetchAddresses, addToast]
  );

  /**
   * Get default shipping address
   */
  const getDefaultShipping = useCallback(() => {
    return addresses.find(
      (addr) => addr.isDefault && (addr.type === 'SHIPPING' || addr.type === 'BOTH')
    );
  }, [addresses]);

  /**
   * Get default billing address
   */
  const getDefaultBilling = useCallback(() => {
    return addresses.find(
      (addr) => addr.isDefault && (addr.type === 'BILLING' || addr.type === 'BOTH')
    );
  }, [addresses]);

  return {
    addresses,
    isLoading,
    error,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    refetch: fetchAddresses,
    getDefaultShipping,
    getDefaultBilling,
  };
}

export default useAddresses;
