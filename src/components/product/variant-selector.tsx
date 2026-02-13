'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ProductVariant } from './product-card';

/**
 * Variant option type
 */
export interface VariantOption {
  /**
   * Option value
   */
  value: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Whether the option is available
   */
  available?: boolean;
  /**
   * Color hex code (for color variants)
   */
  color?: string;
}

/**
 * Variant group type
 */
export interface VariantGroup {
  /**
   * Group name (e.g., "Size", "Color")
   */
  name: string;
  /**
   * Group type
   */
  type: 'size' | 'color' | 'select';
  /**
   * Available options
   */
  options: VariantOption[];
  /**
   * Currently selected value
   */
  selectedValue?: string;
}

/**
 * Variant selector component props
 */
export interface VariantSelectorProps {
  /**
   * Variant groups
   */
  groups: VariantGroup[];
  /**
   * Callback when variant changes
   */
  onVariantChange?: (group: string, value: string) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Size and color selection component
 * 
 * @example
 * ```tsx
 * <VariantSelector
 *   groups={[
 *     {
 *       name: 'Size',
 *       type: 'size',
 *       options: [
 *         { value: 's', label: 'S', available: true },
 *         { value: 'm', label: 'M', available: true },
 *         { value: 'l', label: 'L', available: false }
 *       ],
 *       selectedValue: 'm'
 *     },
 *     {
 *       name: 'Color',
 *       type: 'color',
 *       options: [
 *         { value: 'red', label: 'Red', color: '#EF4444', available: true },
 *         { value: 'blue', label: 'Blue', color: '#3B82F6', available: true }
 *       ],
 *       selectedValue: 'red'
 *     }
 *   ]}
 *   onVariantChange={(group, value) => console.log(group, value)}
 * />
 * ```
 */
export function VariantSelector({
  groups,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  const handleOptionClick = (group: VariantGroup, option: VariantOption) => {
    if (option.available !== false) {
      onVariantChange?.(group.name, option.value);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((group) => (
        <div key={group.name}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              {group.name}
            </h3>
            {group.selectedValue && (
              <span className="text-xs text-gray-500">
                {group.options.find((o) => o.value === group.selectedValue)?.label}
              </span>
            )}
          </div>

          {group.type === 'size' && (
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(group, option)}
                  disabled={option.available === false}
                  className={cn(
                    // Base styles
                    'px-4 py-2 text-sm font-medium rounded-md border',
                    'transition-all duration-200',
                    // Focus state
                    'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
                    // Selected state
                    group.selectedValue === option.value
                      ? 'border-yellow bg-yellow text-gray-900'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300',
                    // Disabled state
                    option.available === false &&
                      'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed hover:border-gray-100'
                  )}
                  aria-label={`Select ${group.name}: ${option.label}`}
                  aria-pressed={group.selectedValue === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {group.type === 'color' && (
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(group, option)}
                  disabled={option.available === false}
                  className={cn(
                    // Base styles
                    'relative w-10 h-10 rounded-full border-2',
                    'transition-all duration-200',
                    // Focus state
                    'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
                    // Selected state
                    group.selectedValue === option.value
                      ? 'border-yellow ring-2 ring-yellow ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300',
                    // Disabled state
                    option.available === false &&
                      'border-gray-100 opacity-50 cursor-not-allowed hover:border-gray-100'
                  )}
                  style={{
                    backgroundColor: option.color || '#ccc',
                  }}
                  aria-label={`Select ${group.name}: ${option.label}`}
                  aria-pressed={group.selectedValue === option.value}
                >
                  {group.selectedValue === option.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {group.type === 'select' && (
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <Button
                  key={option.value}
                  variant={group.selectedValue === option.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleOptionClick(group, option)}
                  disabled={option.available === false}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
