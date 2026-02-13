'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Truck, Package, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/**
 * Shipping method type
 */
export interface ShippingMethod {
  /**
   * Method ID
   */
  id: string;
  /**
   * Method name
   */
  name: string;
  /**
   * Method description
   */
  description?: string;
  /**
   * Shipping cost
   */
  cost: number;
  /**
   * Estimated delivery days
   */
  estimatedDays?: string;
  /**
   * Method type
   */
  type?: 'standard' | 'express' | 'overnight';
}

/**
 * Shipping method component props
 */
export interface ShippingMethodProps {
  /**
   * Available shipping methods
   */
  methods: ShippingMethod[];
  /**
   * Currently selected method ID
   */
  selectedMethodId?: string;
  /**
   * Callback when method is selected
   */
  onSelect: (methodId: string) => void;
  /**
   * Currency code
   */
  currency?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Minimal shipping options selector
 * 
 * @example
 * ```tsx
 * <ShippingMethod
 *   methods={[
 *     { id: 'standard', name: 'Standard Shipping', cost: 0, estimatedDays: '5-7' },
 *     { id: 'express', name: 'Express Shipping', cost: 9.99, estimatedDays: '2-3' }
 *   ]}
 *   selectedMethodId={selectedMethod}
 *   onSelect={setSelectedMethod}
 * />
 * ```
 */
export function ShippingMethod({
  methods,
  selectedMethodId,
  onSelect,
  currency = 'USD',
  className,
}: ShippingMethodProps) {
  const getMethodIcon = (type?: ShippingMethod['type']) => {
    switch (type) {
      case 'express':
        return <Truck className="w-5 h-5" />;
      case 'overnight':
        return <Clock className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {methods.map((method) => {
        const isSelected = method.id === selectedMethodId;
        const isFree = method.cost === 0;

        return (
          <label
            key={method.id}
            className={cn(
              // Base styles
              'flex items-start gap-4 p-4 rounded-md border cursor-pointer',
              'transition-all duration-200',
              // Focus state
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
              // Selected state
              isSelected
                ? 'border-yellow bg-yellow/5'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            {/* Radio input */}
            <input
              type="radio"
              name="shipping-method"
              value={method.id}
              checked={isSelected}
              onChange={() => onSelect(method.id)}
              className="mt-1"
            />

            {/* Icon */}
            <div className={cn(
              'flex-shrink-0 p-2 rounded-md',
              isSelected ? 'bg-yellow text-gray-900' : 'bg-gray-100 text-gray-600'
            )}>
              {getMethodIcon(method.type)}
            </div>

            {/* Method details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {method.name}
                  </h4>
                  {method.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {method.description}
                    </p>
                  )}
                  {method.estimatedDays && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated delivery: {method.estimatedDays} business days
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {isFree ? 'Free' : formatPrice(method.cost, currency)}
                  </span>
                </div>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
