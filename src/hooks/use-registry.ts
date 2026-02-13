'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import {
  createRegistry as createRegistryAction,
  deleteRegistry as deleteRegistryAction,
  type CreateRegistryInput,
} from '@/actions/registry';

/**
 * Registry item interface
 */
export interface RegistryItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
  quantityPurchased: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

/**
 * Registry interface
 */
export interface Registry {
  id: string;
  shareCode: string;
  name: string;
  description?: string;
  eventDate?: string;
  isPublic: boolean;
  items: RegistryItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Registry hook return type
 */
interface UseRegistryReturn {
  /** Array of user's registries */
  registries: Registry[];
  /** Whether registries are being loaded */
  isLoading: boolean;
  /** Error if registries fetch failed */
  error: Error | null;
  /** Create a new registry */
  createRegistry: (data: CreateRegistryInput) => Promise<{ success: boolean; error?: string; shareCode?: string }>;
  /** Delete a registry */
  deleteRegistry: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** Refetch registries */
  refetch: () => Promise<void>;
}

/**
 * Hook for user's registries
 *
 * Fetches and manages state for the current user's registries.
 * Provides actions for creating and deleting registries.
 *
 * @returns Registries state and actions
 *
 * @example
 * ```tsx
 * function RegistryList() {
 *   const { registries, isLoading, createRegistry, deleteRegistry } = useRegistry();
 *
 *   const handleCreate = async () => {
 *     const result = await createRegistry({
 *       name: 'Baby Registry',
 *       description: 'Welcome our little one!',
 *     });
 *     if (result.success) {
 *       router.push(`/registry/${result.shareCode}`);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {registries.map(registry => (
 *         <RegistryCard
 *           key={registry.id}
 *           registry={registry}
 *           onDelete={() => deleteRegistry(registry.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegistry(): UseRegistryReturn {
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useUIStore();

  /**
   * Fetch registries from API
   */
  const fetchRegistries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registry');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your registries');
        }
        throw new Error('Failed to fetch registries');
      }

      const data = await response.json();
      setRegistries(data.registries || []);
    } catch (err) {
      console.error('Failed to fetch registries:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch registries'));
      setRegistries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistries();
  }, [fetchRegistries]);

  /**
   * Create a new registry
   */
  const createRegistry = useCallback(
    async (data: CreateRegistryInput) => {
      try {
        const result = await createRegistryAction(data);

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Registry created!',
            message: 'Your baby registry has been created successfully.',
          });
          await fetchRegistries();
        } else {
          addToast({
            type: 'error',
            title: 'Failed to create registry',
            message: result.error || 'Please try again.',
          });
        }

        return {
          success: result.success,
          error: result.error,
          shareCode: result.data?.shareCode,
        };
      } catch (err) {
        console.error('Create registry error:', err);
        const errorMessage = 'An unexpected error occurred. Please try again.';
        addToast({
          type: 'error',
          title: 'Failed to create registry',
          message: errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [fetchRegistries, addToast]
  );

  /**
   * Delete a registry
   */
  const deleteRegistry = useCallback(
    async (shareCode: string) => {
      try {
        const result = await deleteRegistryAction(shareCode);

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Registry deleted',
            message: 'Your registry has been deleted successfully.',
          });
          await fetchRegistries();
        } else {
          addToast({
            type: 'error',
            title: 'Failed to delete registry',
            message: result.error || 'Please try again.',
          });
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Delete registry error:', err);
        const errorMessage = 'An unexpected error occurred. Please try again.';
        addToast({
          type: 'error',
          title: 'Failed to delete registry',
          message: errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [fetchRegistries, addToast]
  );

  return {
    registries,
    isLoading,
    error,
    createRegistry,
    deleteRegistry,
    refetch: fetchRegistries,
  };
}

export default useRegistry;
