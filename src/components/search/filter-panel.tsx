'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

/**
 * Filter option type
 */
export interface FilterOption {
  /**
   * Option value
   */
  value: string;
  /**
   * Option label
   */
  label: string;
  /**
   * Option count
   */
  count?: number;
  /**
   * Option image (for color filters)
   */
  image?: string;
  /**
   * Option color hex (for color filters)
   */
  color?: string;
}

/**
 * Filter group type
 */
export interface FilterGroup {
  /**
   * Group ID
   */
  id: string;
  /**
   * Group label
   */
  label: string;
  /**
   * Group type
   */
  type: 'checkbox' | 'radio' | 'range' | 'color';
  /**
   * Filter options
   */
  options?: FilterOption[];
  /**
   * Min value (for range filters)
   */
  min?: number;
  /**
   * Max value (for range filters)
   */
  max?: number;
  /**
   * Step value (for range filters)
   */
  step?: number;
  /**
   * Unit label (for range filters)
   */
  unit?: string;
}

/**
 * Active filter type
 */
export interface ActiveFilter {
  /**
   * Filter group ID
   */
  groupId: string;
  /**
   * Filter group label
   */
  groupLabel: string;
  /**
   * Filter value
   */
  value: string;
  /**
   * Filter label
   */
  label: string;
}

/**
 * Filter panel component props
 */
export interface FilterPanelProps {
  /**
   * Filter groups
   */
  groups: FilterGroup[];
  /**
   * Active filters
   */
  activeFilters: ActiveFilter[];
  /**
   * Callback when filter changes
   */
  onFilterChange: (groupId: string, value: string, checked: boolean) => void;
  /**
   * Callback when range filter changes
   */
  onRangeChange?: (groupId: string, value: [number, number]) => void;
  /**
   * Callback when filter is removed
   */
  onRemoveFilter?: (groupId: string, value: string) => void;
  /**
   * Callback when all filters are cleared
   */
  onClearAll?: () => void;
  /**
   * Whether to show active filters
   * @default true
   */
  showActiveFilters?: boolean;
  /**
   * Whether to show clear all button
   * @default true
   */
  showClearAll?: boolean;
  /**
   * Default open accordion items
   */
  defaultOpen?: string[];
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Filter sidebar
 * 
 * @example
 * ```tsx
 * <FilterPanel
 *   groups={filterGroups}
 *   activeFilters={activeFilters}
 *   onFilterChange={handleFilterChange}
 *   onRangeChange={handleRangeChange}
 *   onRemoveFilter={handleRemoveFilter}
 *   onClearAll={handleClearAll}
 * />
 * ```
 */
export function FilterPanel({
  groups,
  activeFilters,
  onFilterChange,
  onRangeChange,
  onRemoveFilter,
  onClearAll,
  showActiveFilters = true,
  showClearAll = true,
  defaultOpen = ['category', 'price'],
  className,
}: FilterPanelProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(defaultOpen);

  const handleToggle = (value: string) => {
    setOpenItems((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const isOptionChecked = (groupId: string, value: string) => {
    return activeFilters.some((f) => f.groupId === groupId && f.value === value);
  };

  const getRangeValue = (groupId: string): [number, number] => {
    const filter = activeFilters.find((f) => f.groupId === groupId);
    if (filter) {
      const [min, max] = filter.value.split('-').map(Number);
      return [min, max];
    }
    const group = groups.find((g) => g.id === groupId);
    return [group?.min ?? 0, group?.max ?? 100];
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Active filters */}
      {showActiveFilters && activeFilters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Active Filters ({activeFilters.length})
            </h3>
            {showClearAll && onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.groupId}-${filter.value}`}
                variant="secondary"
                size="sm"
                rightIcon={
                  onRemoveFilter && (
                    <button
                      onClick={() => onRemoveFilter(filter.groupId, filter.value)}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )
                }
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filter groups */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="border-b border-gray-200 pb-4 last:border-0">
            <button
              onClick={() => handleToggle(group.id)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
              {openItems.includes(group.id) ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {openItems.includes(group.id) && (
              <div className="mt-3 space-y-2">
                {group.type === 'checkbox' && group.options && (
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          id={`${group.id}-${option.value}`}
                          checked={isOptionChecked(group.id, option.value)}
                          onChange={(checked) =>
                            onFilterChange(group.id, option.value, checked)
                          }
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-gray-400">
                            ({option.count})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {group.type === 'radio' && group.options && (
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={group.id}
                          id={`${group.id}-${option.value}`}
                          checked={isOptionChecked(group.id, option.value)}
                          onChange={(e) =>
                            onFilterChange(group.id, option.value, e.target.checked)
                          }
                          className="w-4 h-4 text-yellow border-gray-300 focus:ring-yellow"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-gray-400">
                            ({option.count})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {group.type === 'color' && group.options && (
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          onFilterChange(
                            group.id,
                            option.value,
                            !isOptionChecked(group.id, option.value)
                          )
                        }
                        className={cn(
                          'relative w-8 h-8 rounded-full border-2 transition-all',
                          isOptionChecked(group.id, option.value)
                            ? 'border-yellow ring-2 ring-yellow ring-offset-2'
                            : 'border-gray-200'
                        )}
                        style={{ backgroundColor: option.color }}
                        title={option.label}
                      >
                        {option.image && (
                          <img
                            src={option.image}
                            alt={option.label}
                            className="w-full h-full rounded-full object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {group.type === 'range' && onRangeChange && (
                  <div className="space-y-3">
                    <Slider
                      min={group.min ?? 0}
                      max={group.max ?? 100}
                      step={group.step ?? 1}
                      value={getRangeValue(group.id)}
                      onChange={(value) => onRangeChange(group.id, value as [number, number])}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {group.unit ? `${group.min}${group.unit}` : group.min}
                      </span>
                      <span>
                        {group.unit ? `${group.max}${group.unit}` : group.max}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
