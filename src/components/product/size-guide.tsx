'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/**
 * Size chart row type
 */
export interface SizeChartRow {
  /**
   * Size label
   */
  size: string;
  /**
   * Measurements (in inches)
   */
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    length?: number;
    weight?: number;
  };
}

/**
 * Size guide component props
 */
export interface SizeGuideProps {
  /**
   * Whether the size guide is open
   */
  isOpen: boolean;
  /**
   * Callback when size guide is closed
   */
  onClose: () => void;
  /**
   * Size chart data
   */
  sizeChart?: SizeChartRow[];
  /**
   * Product category
   */
  category?: string;
}

/**
 * Size chart modal
 * 
 * @example
 * ```tsx
 * <SizeGuide
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   category="Tops"
 *   sizeChart={[
 *     { size: 'S', measurements: { chest: 34, waist: 28, length: 26 } },
 *     { size: 'M', measurements: { chest: 36, waist: 30, length: 27 } }
 *   ]}
 * />
 * ```
 */
export function SizeGuide({
  isOpen,
  onClose,
  sizeChart,
  category,
}: SizeGuideProps) {
  const defaultSizeChart: SizeChartRow[] = [
    { size: 'XS', measurements: { chest: 32, waist: 26, hips: 34, length: 24 } },
    { size: 'S', measurements: { chest: 34, waist: 28, hips: 36, length: 25 } },
    { size: 'M', measurements: { chest: 36, waist: 30, hips: 38, length: 26 } },
    { size: 'L', measurements: { chest: 38, waist: 32, hips: 40, length: 27 } },
    { size: 'XL', measurements: { chest: 40, waist: 34, hips: 42, length: 28 } },
  ];

  const chart = sizeChart || defaultSizeChart;

  const hasChest = chart.some((row) => row.measurements.chest !== undefined);
  const hasWaist = chart.some((row) => row.measurements.waist !== undefined);
  const hasHips = chart.some((row) => row.measurements.hips !== undefined);
  const hasLength = chart.some((row) => row.measurements.length !== undefined);
  const hasWeight = chart.some((row) => row.measurements.weight !== undefined);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent maxWidth="lg">
        <DialogHeader>
          <DialogTitle>Size Guide</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="inches">
          <TabsList>
            <TabsTrigger value="inches">Inches</TabsTrigger>
            <TabsTrigger value="cm">Centimeters</TabsTrigger>
          </TabsList>

          <TabsContent value="inches" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Size
                    </th>
                    {hasChest && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Chest
                      </th>
                    )}
                    {hasWaist && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Waist
                      </th>
                    )}
                    {hasHips && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Hips
                      </th>
                    )}
                    {hasLength && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Length
                      </th>
                    )}
                    {hasWeight && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Weight
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chart.map((row, index) => (
                    <tr
                      key={row.size}
                      className={cn(
                        'border-b border-gray-100',
                        index % 2 === 0 && 'bg-gray-50'
                      )}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {row.size}
                      </td>
                      {hasChest && (
                        <td className="py-3 px-4 text-gray-600">
                          {row.measurements.chest}"
                        </td>
                      )}
                      {hasWaist && (
                        <td className="py-3 px-4 text-gray-600">
                          {row.measurements.waist}"
                        </td>
                      )}
                      {hasHips && (
                        <td className="py-3 px-4 text-gray-600">
                          {row.measurements.hips}"
                        </td>
                      )}
                      {hasLength && (
                        <td className="py-3 px-4 text-gray-600">
                          {row.measurements.length}"
                        </td>
                      )}
                      {hasWeight && (
                        <td className="py-3 px-4 text-gray-600">
                          {row.measurements.weight} lbs
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="cm" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Size
                    </th>
                    {hasChest && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Chest
                      </th>
                    )}
                    {hasWaist && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Waist
                      </th>
                    )}
                    {hasHips && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Hips
                      </th>
                    )}
                    {hasLength && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Length
                      </th>
                    )}
                    {hasWeight && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Weight
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chart.map((row, index) => (
                    <tr
                      key={row.size}
                      className={cn(
                        'border-b border-gray-100',
                        index % 2 === 0 && 'bg-gray-50'
                      )}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {row.size}
                      </td>
                      {hasChest && (
                        <td className="py-3 px-4 text-gray-600">
                          {Math.round((row.measurements.chest || 0) * 2.54)}
                        </td>
                      )}
                      {hasWaist && (
                        <td className="py-3 px-4 text-gray-600">
                          {Math.round((row.measurements.waist || 0) * 2.54)}
                        </td>
                      )}
                      {hasHips && (
                        <td className="py-3 px-4 text-gray-600">
                          {Math.round((row.measurements.hips || 0) * 2.54)}
                        </td>
                      )}
                      {hasLength && (
                        <td className="py-3 px-4 text-gray-600">
                          {Math.round((row.measurements.length || 0) * 2.54)}
                        </td>
                      )}
                      {hasWeight && (
                        <td className="py-3 px-4 text-gray-600">
                          {Math.round((row.measurements.weight || 0) * 0.453592)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tips */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            How to Measure
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <strong>Chest:</strong> Measure around the fullest part of your chest</li>
            <li>• <strong>Waist:</strong> Measure around your natural waistline</li>
            <li>• <strong>Hips:</strong> Measure around the fullest part of your hips</li>
            <li>• <strong>Length:</strong> Measure from shoulder to hem</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Size guide trigger button
 */
export interface SizeGuideTriggerProps {
  /**
   * Callback when clicked
   */
  onClick: () => void;
  /**
   * Button variant
   */
  variant?: 'link' | 'ghost';
}

/**
 * Button to open the size guide
 */
export function SizeGuideTrigger({
  onClick,
  variant = 'link',
}: SizeGuideTriggerProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className="text-xs"
    >
      Size Guide
    </Button>
  );
}
