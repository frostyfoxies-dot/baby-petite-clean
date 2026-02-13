'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Brain, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';

/**
 * Size prediction data type
 */
export interface SizePredictionData {
  /**
   * Predicted size
   */
  predictedSize: string;
  /**
   * Confidence level (0-100)
   */
  confidence: number;
  /**
   * Alternative sizes
   */
  alternatives?: Array<{
    size: string;
    probability: number;
  }>;
  /**
   * Prediction date
   */
  predictionDate: Date | string;
  /**
   * Factors considered
   */
  factors?: string[];
}

/**
 * Size predictor component props
 */
export interface SizePredictorProps {
  /**
   * Size prediction data
   */
  prediction: SizePredictionData;
  /**
   * Baby's birth date
   */
  birthDate: Date | string;
  /**
   * Baby's gender (optional)
   */
  gender?: 'male' | 'female' | 'unknown';
  /**
   * Whether to show detailed info
   * @default true
   */
  showDetails?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * AI size prediction display
 * 
 * @example
 * ```tsx
 * <SizePredictor
 *   prediction={{
 *     predictedSize: '6-9 months',
 *     confidence: 85,
 *     alternatives: [
 *       { size: '3-6 months', probability: 10 },
 *       { size: '9-12 months', probability: 5 }
 *     ],
 *     predictionDate: new Date(),
 *     factors: ['Growth rate', 'Average percentiles']
 *   }}
 *   birthDate={babyBirthDate}
 *   gender="male"
 * />
 * ```
 */
export function SizePredictor({
  prediction,
  birthDate,
  gender,
  showDetails = true,
  className,
}: SizePredictorProps) {
  const { predictedSize, confidence, alternatives, predictionDate, factors } = prediction;

  const getConfidenceColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceLabel = (level: number) => {
    if (level >= 80) return 'High';
    if (level >= 60) return 'Medium';
    return 'Low';
  };

  const calculateAge = () => {
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return months;
  };

  const ageInMonths = calculateAge();

  return (
    <Card className={cn('border-yellow/30', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-yellow" />
            AI Size Prediction
          </CardTitle>
          <Tooltip content="Based on growth patterns and average percentiles">
            <Info className="w-4 h-4 text-gray-400" />
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Predicted size */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Recommended Size</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {predictedSize}
            </p>
          </div>
          <div className="text-right">
            <Badge
              variant="default"
              className={cn(
                'text-white',
                getConfidenceColor(confidence)
              )}
            >
              {confidence}% {getConfidenceLabel(confidence)}
            </Badge>
          </div>
        </div>

        {/* Age info */}
        <div className="text-sm text-gray-600">
          <p>
            Based on baby's age: <span className="font-medium text-gray-900">{ageInMonths} months</span>
          </p>
          {gender && gender !== 'unknown' && (
            <p className="mt-1">
              Gender: <span className="font-medium text-gray-900 capitalize">{gender}</span>
            </p>
          )}
        </div>

        {showDetails && (
          <>
            {/* Alternatives */}
            {alternatives && alternatives.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Alternative Sizes
                </p>
                <div className="space-y-2">
                  {alternatives.map((alt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{alt.size}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-400"
                            style={{ width: `${alt.probability}%` }}
                          />
                        </div>
                        <span className="text-gray-500 w-10 text-right">
                          {alt.probability}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Factors */}
            {factors && factors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Factors Considered
                </p>
                <div className="flex flex-wrap gap-1">
                  {factors.map((factor, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Last updated */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Last updated: {new Date(predictionDate).toLocaleDateString()}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
