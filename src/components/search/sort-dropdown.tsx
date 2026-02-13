'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/dropdown';

/**
 * Sort option type
 */
export interface SortOption {
  /**
   * Sort value
   */
  value: string;
  /**
   * Sort label
   */
  label: string;
  /**
   * Sort direction
   */
  direction?: 'asc' | 'desc';
}

/**
 * Sort dropdown component props
 */
export interface SortDropdownProps {
  /**
   * Available sort options
   */
  options: SortOption[];
  /**
   * Currently selected sort value
   */
  value?: string;
  /**
   * Callback when sort option is selected
   */
  onChange?: (value: string) => void;
  /**
   * Button label
   * @default "Sort by"
   */
  label?: string;
  /**
   * Button size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Button variant
   * @default "outline"
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /**
   * Whether to show direction icon
   * @default true
   */
  showDirection?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Sort options dropdown
 * 
 * @example
 * ```tsx
 * <SortDropdown
 *   options={[
 *     { value: 'featured', label: 'Featured' },
 *     { value: 'price-asc', label: 'Price: Low to High', direction: 'asc' },
 *     { value: 'price-desc', label: 'Price: High to Low', direction: 'desc' },
 *     { value: 'newest', label: 'Newest' },
 *   ]}
 *   value={sortBy}
 *   onChange={setSortBy}
 * />
 * ```
 */
export function SortDropdown({
  options,
  value,
  onChange,
  label = 'Sort by',
  size = 'md',
  variant = 'outline',
  showDirection = true,
  className,
}: SortDropdownProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  return (
    <Dropdown open={open} onOpenChange={setOpen}>
      <DropdownTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          leftIcon={<ArrowUpDown className="w-4 h-4" />}
        >
          {label}
          {selectedOption && (
            <>
              <span className="text-gray-400">:</span>
              <span className="font-medium">{selectedOption.label}</span>
            </>
          )}
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-56">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <DropdownItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="flex items-center justify-between"
            >
              <span className="flex-1">{option.label}</span>
              {isSelected && (
                <Check className="w-4 h-4 text-yellow" aria-hidden="true" />
              )}
              {showDirection && option.direction && (
                <span className="text-xs text-gray-400 ml-2">
                  {option.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </DropdownItem>
          );
        })}
      </DropdownContent>
    </Dropdown>
  );
}
