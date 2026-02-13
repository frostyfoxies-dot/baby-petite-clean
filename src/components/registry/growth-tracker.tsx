'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Plus, TrendingUp, Calendar, Ruler } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateAge } from '@/lib/utils';

/**
 * Growth entry type
 */
export interface GrowthEntry {
  /**
   * Entry ID
   */
  id: string;
  /**
   * Date of measurement
   */
  date: Date | string;
  /**
   * Weight in pounds
   */
  weight?: number;
  /**
   * Height in inches
   */
  height?: number;
  /**
   * Head circumference in inches
   */
  headCircumference?: number;
  /**
   * Notes
   */
  notes?: string;
}

/**
 * Growth tracker component props
 */
export interface GrowthTrackerProps {
  /**
   * Baby's birth date
   */
  birthDate: Date | string;
  /**
   * Growth entries
   */
  entries: GrowthEntry[];
  /**
   * Callback when entry is added
   */
  onAddEntry?: (entry: Omit<GrowthEntry, 'id'>) => void | Promise<void>;
  /**
   * Callback when entry is deleted
   */
  onDeleteEntry?: (entryId: string) => void;
  /**
   * Whether to show add button
   * @default true
   */
  showAddButton?: boolean;
  /**
   * Whether to show chart
   * @default true
   */
  showChart?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Growth entry form and chart
 * 
 * @example
 * ```tsx
 * <GrowthTracker
 *   birthDate={babyBirthDate}
 *   entries={growthEntries}
 *   onAddEntry={async (entry) => {
 *     await addGrowthEntry(entry);
 *   }}
 *   onDeleteEntry={(entryId) => deleteGrowthEntry(entryId)}
 * />
 * ```
 */
export function GrowthTracker({
  birthDate,
  entries,
  onAddEntry,
  onDeleteEntry,
  showAddButton = true,
  showChart = true,
  className,
}: GrowthTrackerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [weight, setWeight] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [headCircumference, setHeadCircumference] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries]);

  const latestEntry = sortedEntries[sortedEntries.length - 1];

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onAddEntry?.({
        date,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        headCircumference: headCircumference ? parseFloat(headCircumference) : undefined,
        notes: notes || undefined,
      });

      // Reset form
      setWeight('');
      setHeight('');
      setHeadCircumference('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAgeAtEntry = (entryDate: Date | string) => {
    const age = calculateAge(entryDate);
    return `${age.years}y ${age.months}m`;
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="w-5 h-5 text-yellow" />
            Growth Tracker
          </CardTitle>
          {showAddButton && onAddEntry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Entry
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latest measurements */}
        {latestEntry && (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900 mb-3">
              Latest: {new Date(latestEntry.date).toLocaleDateString()}
              <span className="text-gray-500 ml-2">
                ({getAgeAtEntry(latestEntry.date)})
              </span>
            </p>
            <div className="grid grid-cols-3 gap-4">
              {latestEntry.weight && (
                <div>
                  <p className="text-xs text-gray-500">Weight</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {latestEntry.weight} lbs
                  </p>
                </div>
              )}
              {latestEntry.height && (
                <div>
                  <p className="text-xs text-gray-500">Height</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {latestEntry.height} in
                  </p>
                </div>
              )}
              {latestEntry.headCircumference && (
                <div>
                  <p className="text-xs text-gray-500">Head</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {latestEntry.headCircumference} in
                  </p>
                </div>
              )}
            </div>
            {latestEntry.notes && (
              <p className="text-xs text-gray-500 mt-2 italic">
                "{latestEntry.notes}"
              </p>
            )}
          </div>
        )}

        {/* Chart placeholder */}
        {showChart && sortedEntries.length > 1 && (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Growth Chart
            </p>
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              <TrendingUp className="w-5 h-5 mr-2" />
              Chart visualization would go here
            </div>
          </div>
        )}

        {/* Entry history */}
        {sortedEntries.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">
              History ({sortedEntries.length} entries)
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedEntries.slice().reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getAgeAtEntry(entry.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    {entry.weight && (
                      <span className="text-gray-600 mr-2">
                        {entry.weight} lbs
                      </span>
                    )}
                    {entry.height && (
                      <span className="text-gray-600">
                        {entry.height} in
                      </span>
                    )}
                  </div>
                  {onDeleteEntry && (
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Delete entry"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Ruler className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No growth entries yet</p>
            {showAddButton && onAddEntry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setIsAddModalOpen(true)}
              >
                Add First Entry
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Add Entry Modal */}
      <Dialog isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <DialogContent maxWidth="sm">
          <DialogHeader>
            <DialogTitle>Add Growth Entry</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddEntry} className="space-y-4">
            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                type="number"
                step="0.1"
                label="Weight (lbs)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
              />
              <Input
                type="number"
                step="0.1"
                label="Height (in)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="0.0"
              />
              <Input
                type="number"
                step="0.1"
                label="Head (in)"
                value={headCircumference}
                onChange={(e) => setHeadCircumference(e.target.value)}
                placeholder="0.0"
              />
            </div>

            <Input
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this measurement..."
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                loading={isSubmitting}
              >
                Save Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
