'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import {
  addGrowthEntry as addGrowthEntryAction,
  updateGrowthEntry as updateGrowthEntryAction,
  deleteGrowthEntry as deleteGrowthEntryAction,
  type AddGrowthEntryInput,
  type UpdateGrowthEntryInput,
  type SizePrediction,
} from '@/actions/growth';

/**
 * Growth entry interface
 */
export interface GrowthEntry {
  id: string;
  registryId: string;
  childName?: string;
  childBirthDate?: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  notes?: string;
  createdAt: string;
}

/**
 * Growth tracking hook return type
 */
interface UseGrowthTrackingReturn {
  /** Array of growth entries */
  entries: GrowthEntry[];
  /** Whether entries are being loaded */
  isLoading: boolean;
  /** Error if entries fetch failed */
  error: Error | null;
  /** Add a new growth entry */
  addEntry: (data: AddGrowthEntryInput) => Promise<{ success: boolean; error?: string; entryId?: string }>;
  /** Update a growth entry */
  updateEntry: (entryId: string, data: Omit<UpdateGrowthEntryInput, 'entryId'>) => Promise<{ success: boolean; error?: string }>;
  /** Delete a growth entry */
  deleteEntry: (entryId: string) => Promise<{ success: boolean; error?: string }>;
  /** Refetch entries */
  refetch: () => Promise<void>;
  /** Size prediction based on growth data */
  sizePrediction: SizePrediction | null;
  /** Whether prediction is being calculated */
  isPredicting: boolean;
}

/**
 * Hook for baby growth tracking
 *
 * Fetches and manages state for baby growth measurements.
 * Provides AI-powered size predictions based on growth data.
 *
 * @param registryId - The registry ID to fetch growth entries for
 * @returns Growth tracking state and actions
 *
 * @example
 * ```tsx
 * function GrowthTracker({ registryId }) {
 *   const {
 *     entries,
 *     isLoading,
 *     addEntry,
 *     updateEntry,
 *     deleteEntry,
 *     sizePrediction,
 *   } = useGrowthTracking(registryId);
 *
 *   const handleAddEntry = async (data) => {
 *     const result = await addEntry(data);
 *     if (result.success) {
 *       // Entry added successfully
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <GrowthChart entries={entries} />
 *       {sizePrediction && (
 *         <SizeRecommendations prediction={sizePrediction} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGrowthTracking(registryId: string | null): UseGrowthTrackingReturn {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sizePrediction, setSizePrediction] = useState<SizePrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const { addToast } = useUIStore();

  /**
   * Fetch growth entries from API
   */
  const fetchEntries = useCallback(async () => {
    if (!registryId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/registry/${registryId}/growth`);

      if (!response.ok) {
        throw new Error('Failed to fetch growth entries');
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch growth entries:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch growth entries'));
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [registryId]);

  /**
   * Fetch size prediction
   */
  const fetchSizePrediction = useCallback(async () => {
    if (!registryId || entries.length === 0) {
      setSizePrediction(null);
      return;
    }

    setIsPredicting(true);

    try {
      const response = await fetch(`/api/registry/${registryId}/growth/prediction`);

      if (response.ok) {
        const data = await response.json();
        setSizePrediction(data.prediction);
      }
    } catch (err) {
      console.error('Failed to fetch size prediction:', err);
    } finally {
      setIsPredicting(false);
    }
  }, [registryId, entries.length]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchSizePrediction();
  }, [fetchSizePrediction]);

  /**
   * Add a new growth entry
   */
  const addEntry = useCallback(
    async (data: AddGrowthEntryInput) => {
      try {
        const result = await addGrowthEntryAction(data);

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Entry added',
            message: 'Growth entry has been recorded successfully.',
          });
          await fetchEntries();
        } else {
          addToast({
            type: 'error',
            title: 'Failed to add entry',
            message: result.error || 'Please try again.',
          });
        }

        return {
          success: result.success,
          error: result.error,
          entryId: result.data?.entryId,
        };
      } catch (err) {
        console.error('Add growth entry error:', err);
        const errorMessage = 'An unexpected error occurred. Please try again.';
        addToast({
          type: 'error',
          title: 'Failed to add entry',
          message: errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [fetchEntries, addToast]
  );

  /**
   * Update a growth entry
   */
  const updateEntry = useCallback(
    async (entryId: string, data: Omit<UpdateGrowthEntryInput, 'entryId'>) => {
      try {
        const result = await updateGrowthEntryAction({ ...data, entryId });

        if (result.success) {
          addToast({
            type: 'success',
            title: 'Entry updated',
            message: 'Growth entry has been updated successfully.',
          });
          await fetchEntries();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Update growth entry error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [fetchEntries, addToast]
  );

  /**
   * Delete a growth entry
   */
  const deleteEntry = useCallback(
    async (entryId: string) => {
      try {
        const result = await deleteGrowthEntryAction({ entryId });

        if (result.success) {
          addToast({
            type: 'info',
            title: 'Entry deleted',
            message: 'Growth entry has been removed.',
          });
          await fetchEntries();
        }

        return {
          success: result.success,
          error: result.error,
        };
      } catch (err) {
        console.error('Delete growth entry error:', err);
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [fetchEntries, addToast]
  );

  return {
    entries,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
    sizePrediction,
    isPredicting,
  };
}

export default useGrowthTracking;
