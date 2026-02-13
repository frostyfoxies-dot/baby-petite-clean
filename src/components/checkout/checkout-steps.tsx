'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/**
 * Checkout step type
 */
export interface CheckoutStep {
  /**
   * Step identifier
   */
  id: string;
  /**
   * Step title
   */
  title: string;
  /**
   * Step description
   */
  description?: string;
}

/**
 * Checkout steps component props
 */
export interface CheckoutStepsProps {
  /**
   * Available steps
   */
  steps: CheckoutStep[];
  /**
   * Current step index (0-based)
   */
  currentStep: number;
  /**
   * Completed step indices
   */
  completedSteps?: number[];
  /**
   * Callback when step is clicked
   */
  onStepClick?: (stepIndex: number) => void;
  /**
   * Whether to allow clicking on completed steps
   * @default true
   */
  allowNavigation?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Step indicator (shipping, payment, review)
 * 
 * @example
 * ```tsx
 * <CheckoutSteps
 *   steps={[
 *     { id: 'shipping', title: 'Shipping' },
 *     { id: 'payment', title: 'Payment' },
 *     { id: 'review', title: 'Review' }
 *   ]}
 *   currentStep={1}
 *   completedSteps={[0]}
 * />
 * ```
 */
export function CheckoutSteps({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  allowNavigation = true,
  className,
}: CheckoutStepsProps) {
  const isCompleted = (index: number) => completedSteps.includes(index);
  const isCurrent = (index: number) => index === currentStep;
  const isPending = (index: number) => index > currentStep;
  const isClickable = (index: number) =>
    allowNavigation && (isCompleted(index) || isCurrent(index));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepStatus = isCompleted(index)
            ? 'completed'
            : isCurrent(index)
            ? 'current'
            : 'pending';

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => isClickable(index) && onStepClick?.(index)}
                  disabled={!isClickable(index)}
                  className={cn(
                    // Base styles
                    'relative flex items-center justify-center',
                    'w-10 h-10 rounded-full border-2',
                    'font-medium text-sm transition-all duration-200',
                    // Focus state
                    'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
                    // Completed state
                    stepStatus === 'completed' &&
                      'bg-yellow border-yellow text-gray-900',
                    // Current state
                    stepStatus === 'current' &&
                      'bg-white border-yellow text-gray-900',
                    // Pending state
                    stepStatus === 'pending' &&
                      'bg-white border-gray-200 text-gray-400',
                    // Disabled state
                    !isClickable(index) && 'cursor-not-allowed'
                  )}
                  aria-label={step.title}
                  aria-current={isCurrent(index) ? 'step' : undefined}
                >
                  {stepStatus === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      stepStatus === 'completed' && 'text-gray-900',
                      stepStatus === 'current' && 'text-gray-900',
                      stepStatus === 'pending' && 'text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p
                      className={cn(
                        'text-xs mt-0.5',
                        stepStatus === 'completed' && 'text-gray-500',
                        stepStatus === 'current' && 'text-gray-500',
                        stepStatus === 'pending' && 'text-gray-400'
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    'transition-colors duration-200',
                    isCompleted(index) ? 'bg-yellow' : 'bg-gray-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
