'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRegistryStore } from '@/store/registry-store';
import { useUIStore } from '@/store/ui-store';
import {
  addRegistryItem as addRegistryItemAction,
  updateRegistryItem as updateRegistryItemAction,
  removeRegistryItem as removeRegistryItemAction,
  type AddRegistryItemInput,
  type UpdateRegistryItemInput,
} from '@/actions/registry';
import type { Registry, RegistryItem } from './use-registry';

/**
 * Registry detail hook return type
 */
interface UseRegistryDetailReturn {
  /** The registry data or null if not found */
  registry: Registry | null;
  /** Whether the current user owns this registry */
  isOwner: boolean;
  /** Whether the registry is being loaded */
  isLoading: boolean;
  /** Error if registry fetch failed */
  error: Error | null;
  /** Add an item to the registry */
  addItem: (data: Omit<AddRegistryItemInput, 'shareCode'>) => Promise<{ success: boolean; error?: string }>;
  /** Update a registry item */
  updateItem: (itemId: string, data: Omit<UpdateRegistryItemInput, 'shareCode' | 'itemId'>) => Promise<{ success: boolean; error?: string }>;
  /** Remove an item from the registry */
  removeItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  /** Refetch the registry data */
  refetch: () => Promise<void>;
  /** Progress percentage of purchased items */
  progress: number;
  /** Total remaining items to purchase */
  remainingItems: number;
  /** Estimated total value of remaining items */
  estimatedTotal: number;
}

/**
 * Hook for single registry
 *
 * Fetches and manages state for a single registry by share code.
 * Provides actions for managing registry items.
 *
 * @param shareCode - The registry share code
 * @returns Registry detail state and actions
 *
 * @example
 * ```tsx
 * function RegistryPage({ shareCode }) {
 *   const {
 *     registry,
 *     isOwner,
 *     isLoading,
 *     addItem,
 *     updateItem,
 *     removeItem,
 *     progress,
 *   } = useRegistryDetail(shareCode);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!registry) return <NotFound />;
 *
 *   return (
 *     <div>
 *       <h1>{registry.name}</h1>
 *       <ProgressBar value={progress} />
 *       <RegistryItems
 *         items={registry.items}
 *         isOwner={isOwner}
 *         onUpdate={updateItem}
 *         onRemove={removeItem}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegistryDetail(shareCode: string | null): UseRegistryDetailReturn {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useUIStore();
  const { setCurrentRegistry, addItem: addStoreItem, updateItem: updateStoreItem, removeItem: removeStoreItem, clearRegistry, getProgress, getRemainingItems, getEstimatedTotal } = useRegistryStore();

  /**
   * Fetch registry from API
   */
  const fetchRegistry = useCallback(async () => {
    if (!shareCode) {
      setRegistry(null);
      setIsOwner(false);
      clearRegistry();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registry/${shareCode}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError(new Error('Registry not found'));
          setRegistry(null);
        } else {
          throw new Error('Failed to fetch registry');
        }
        return;
      }

      const data = await response.json();
      setRegistry(data.registry);
      setIsOwner(data.isOwner);

      // Update store
      setCurrentRegistry(
        {
          id: data.registry.id,
          shareCode: data.registry.shareCode,
          name: data.registry.name,
          description: data.registry.description,
          eventDate: data.registry.eventDate,
          items: data.registry.items,
        },
        data.isOwner
      );
    } catch (err) {
      console.error('Failed to fetch registry:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch registry'));
      setRegistry(null);
      clearRegistry();
    } finally {
      setIsLoading(false);
    }
  }, [shareCode, setCurrentRegistry, clearRegistry]);

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  /**
   * Add an item to the registry
   */
  const addItem = useCallback(
    async (data: Omit<AddRegistryItemInput, 'shareCode'>) => {
      if (!shareCode) {
        return { success: false, error: 'No share code provided' };
      }

      try {
        const result = await addRegistryItemAction({ ...data, shareCode });

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Item added',
            message: 'Item has been added to your registry.',
          });
          await fetchRegistry();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Add registry item error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [shareCode, fetchRegistry, addToast]
  );

  /**
   * Update a registry item
   */
  const updateItem = useCallback(
    async (itemId: string, data: Omit<UpdateRegistryItemInput, 'shareCode' | 'itemId'>) => {
      if (!shareCode) {
        return { success: false, error: 'No share code provided' };
      }

      try {
        const result = await updateRegistryItemAction({ ...data, shareCode, itemId });

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Item updated',
            message: 'Item has been updated successfully.',
          });
          await fetchRegistry();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Update registry item error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [shareCode, fetchRegistry, addToast]
  );

  /**
   * Remove an item from the registry
   */
  const removeItem = useCallback(
    async (itemId: string) => {
      if (!shareCode) {
        return { success: false, error: 'No share code provided' };
      }

      try {
        const result = await removeRegistryItemAction({ shareCode, itemId });

        if (result.success) {
          addToast({
            type: 'info',
            title: 'Item removed',
            message: 'Item has been removed from your registry.',
          });
          await fetchRegistry();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Remove registry item error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [shareCode, fetchRegistry, addToast]
  );

  return {
    registry,
    isOwner,
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    refetch: fetchRegistry,
    progress: getProgress(),
    remainingItems: getRemainingItems(),
    estimatedTotal: getEstimatedTotal(),
  };
}

export default useRegistryDetail;
