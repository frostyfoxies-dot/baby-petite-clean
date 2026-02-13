'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GrowthTracker } from '@/components/registry/growth-tracker';
import { SizePredictor } from '@/components/registry/size-predictor';
import { ArrowLeft, TrendingUp, Ruler } from 'lucide-react';
import { addGrowthEntry, deleteGrowthEntry, getSizePrediction } from '@/actions/growth';
import type { SizePrediction } from '@/actions/growth';

interface GrowthEntry {
  id: string;
  childName: string | null;
  childBirthDate: Date | null;
  height: number | null;
  weight: number | null;
  headCircumference: number | null;
  recordedAt: Date;
  notes: string | null;
}

interface RegistryData {
  id: string;
  name: string;
  shareCode: string;
  eventDate: Date | null;
}

/**
 * Client component for growth tracking
 */
export function GrowthTrackerView({
  registry,
  growthEntries: initialEntries,
}: {
  registry: RegistryData;
  growthEntries: GrowthEntry[];
}) {
  const [entries, setEntries] = React.useState(initialEntries);
  const [sizePrediction, setSizePrediction] = React.useState<SizePrediction | null>(null);
  const [isPredicting, setIsPredicting] = React.useState(false);

  // Get the latest entry for current stats
  const latestEntry = entries[0];
  const childBirthDate = latestEntry?.childBirthDate || registry.eventDate;

  // Transform entries for the GrowthTracker component
  const growthTrackerEntries = entries.map((entry) => ({
    id: entry.id,
    date: entry.recordedAt,
    weight: entry.weight || undefined,
    height: entry.height || undefined,
    headCircumference: entry.headCircumference || undefined,
    notes: entry.notes || undefined,
  }));

  const handleAddEntry = async (entry: { date: Date | string; weight?: number; height?: number; headCircumference?: number; notes?: string }) => {
    const result = await addGrowthEntry({
      height: entry.height || null,
      weight: entry.weight || null,
      headCircumference: entry.headCircumference || null,
      notes: entry.notes,
    });

    if (result.success && result.data) {
      // Add the new entry to local state
      const newEntry: GrowthEntry = {
        id: result.data.entryId,
        childName: null,
        childBirthDate: childBirthDate ? new Date(childBirthDate) : null,
        height: entry.height || null,
        weight: entry.weight || null,
        headCircumference: entry.headCircumference || null,
        recordedAt: new Date(entry.date),
        notes: entry.notes || null,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }

    return result;
  };

  const handleDeleteEntry = async (entryId: string) => {
    const result = await deleteGrowthEntry(entryId);
    if (result.success) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    }
  };

  const handlePredictSize = async () => {
    setIsPredicting(true);
    const result = await getSizePrediction(registry.id);
    setIsPredicting(false);

    if (result.success && result.data) {
      setSizePrediction(result.data);
    }
  };

  // Transform SizePrediction from action to SizePredictionData for component
  const predictionData = sizePrediction ? {
    predictedSize: sizePrediction.currentSize.clothing,
    confidence: Math.round((sizePrediction.growthPercentile.height + sizePrediction.growthPercentile.weight) / 2),
    alternatives: sizePrediction.predictedSizes.slice(0, 3).map((pred, index) => ({
      size: pred.clothing,
      probability: Math.max(5, 30 - index * 10),
    })),
    predictionDate: new Date(),
    factors: sizePrediction.recommendations.slice(0, 3),
  } : null;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <Link href={`/registry/${registry.shareCode}/manage`}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Registry
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-4">
            Growth Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            {registry.name}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Growth tracker */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Growth Tracker
              </h2>
            </div>

            <GrowthTracker
              birthDate={childBirthDate || new Date()}
              entries={growthTrackerEntries}
              onAddEntry={handleAddEntry}
              onDeleteEntry={handleDeleteEntry}
              showAddButton={true}
              showChart={true}
            />
          </div>

          {/* Size predictor */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Size Predictor
                </h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePredictSize}
                loading={isPredicting}
                disabled={entries.length === 0}
              >
                Get Prediction
              </Button>
            </div>

            {predictionData ? (
              <SizePredictor
                prediction={predictionData}
                birthDate={childBirthDate || new Date()}
                showDetails={true}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Ruler className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Add growth entries and click "Get Prediction" to see size recommendations</p>
              </div>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 bg-yellow/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            About Growth Tracking
          </h3>
          <p className="text-gray-600">
            Track your baby's growth over time and get personalized size recommendations based on their measurements. This helps ensure you always select the right size when adding items to your registry.
          </p>
        </div>
      </div>
    </div>
  );
}
