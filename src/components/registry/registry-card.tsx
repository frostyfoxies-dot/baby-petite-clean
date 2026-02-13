'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Baby, Calendar, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

/**
 * Registry data type
 */
export interface RegistryData {
  /**
   * Registry ID
   */
  id: string;
  /**
   * Registry title
   */
  title: string;
  /**
   * Parent names
   */
  parents: string;
  /**
   * Baby name (optional)
   */
  babyName?: string;
  /**
   * Due date
   */
  dueDate: Date | string;
  /**
   * Registry image (optional)
   */
  image?: string;
  /**
   * Total items
   */
  totalItems: number;
  /**
   * Purchased items
   */
  purchasedItems: number;
  /**
   * Total value
   */
  totalValue: number;
  /**
   * Purchased value
   */
  purchasedValue: number;
  /**
   * Share code
   */
  shareCode: string;
  /**
   * Whether the registry is owned by current user
   */
  isOwner?: boolean;
}

/**
 * Registry card component props
 */
export interface RegistryCardProps {
  /**
   * Registry data
   */
  registry: RegistryData;
  /**
   * Callback when view is clicked
   */
  onView?: () => void;
  /**
   * Callback when share is clicked
   */
  onShare?: () => void;
  /**
   * Callback when edit is clicked (owner only)
   */
  onEdit?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Minimal registry card with progress
 * 
 * @example
 * ```tsx
 * <RegistryCard
 *   registry={registry}
 *   onView={() => router.push(`/registry/${registry.shareCode}`)}
 *   onShare={() => setShowShareModal(true)}
 *   onEdit={() => router.push(`/registry/${registry.id}/edit`)}
 * />
 * ```
 */
export function RegistryCard({
  registry,
  onView,
  onShare,
  onEdit,
  className,
}: RegistryCardProps) {
  const progress = registry.totalItems > 0
    ? (registry.purchasedItems / registry.totalItems) * 100
    : 0;

  const valueProgress = registry.totalValue > 0
    ? (registry.purchasedValue / registry.totalValue) * 100
    : 0;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{registry.title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {registry.parents}
            </p>
            {registry.babyName && (
              <p className="text-sm text-gray-600 mt-0.5">
                <Baby className="w-3 h-3 inline mr-1" />
                {registry.babyName}
              </p>
            )}
          </div>
          {registry.isOwner && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-xs"
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Due date */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Due: {formatDate(registry.dueDate)}</span>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {registry.purchasedItems} of {registry.totalItems} items
            </span>
            <span className="font-medium text-gray-900">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {formatPrice(registry.purchasedValue)} of {formatPrice(registry.totalValue)} gifted
            </span>
            <span>{formatPrice(registry.totalValue - registry.purchasedValue)} remaining</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onView}
            leftIcon={<Gift className="w-4 h-4" />}
          >
            View Registry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
          >
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
