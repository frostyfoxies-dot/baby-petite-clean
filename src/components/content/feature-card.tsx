'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Feature card component props
 */
export interface FeatureCardProps {
  /**
   * Feature title
   */
  title: string;
  /**
   * Feature description
   */
  description?: string;
  /**
   * Feature icon
   */
  icon?: React.ReactNode;
  /**
   * Feature image URL
   */
  image?: string;
  /**
   * CTA button text
   */
  cta?: string;
  /**
   * CTA link
   */
  ctaHref?: string;
  /**
   * Card variant
   * @default "default"
   */
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  /**
   * Card size
   * @default "medium"
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Icon position
   * @default "top"
   */
  iconPosition?: 'top' | 'left';
  /**
   * Text alignment
   * @default "left"
   */
  align?: 'left' | 'center';
  /**
   * Callback when CTA is clicked
   */
  onCtaClick?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Feature highlight card
 * 
 * @example
 * ```tsx
 * <FeatureCard
 *   title="Free Shipping"
 *   description="On orders over $50"
 *   icon={<Truck className="w-8 h-8" />}
 *   variant="outlined"
 *   align="center"
 * />
 * ```
 */
export function FeatureCard({
  title,
  description,
  icon,
  image,
  cta,
  ctaHref,
  variant = 'default',
  size = 'medium',
  iconPosition = 'top',
  align = 'left',
  onCtaClick,
  className,
}: FeatureCardProps) {
  const variantClasses = {
    default: 'bg-white',
    outlined: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    filled: 'bg-yellow/10',
  };

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const iconSizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  const titleSizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
  };

  const content = (
    <div
      className={cn(
        'rounded-lg transition-all',
        variantClasses[variant],
        sizeClasses[size],
        iconPosition === 'left' && 'flex items-start gap-4',
        className
      )}
    >
      {/* Image */}
      {image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full aspect-video object-cover"
          />
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-yellow/20 text-yellow-dark mb-4',
            iconSizeClasses[size],
            iconPosition === 'left' && 'mb-0 flex-shrink-0'
          )}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className={cn('flex-1', align === 'center' && 'text-center')}>
        <h3 className={cn('font-semibold text-gray-900 mb-2', titleSizeClasses[size])}>
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>
        )}
        
        {cta && (
          <div className={cn(align === 'center' && 'flex justify-center')}>
            {ctaHref ? (
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-1 text-sm font-medium text-yellow-dark hover:text-yellow-darker transition-colors"
              >
                {cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Button
                variant="link"
                size="sm"
                onClick={onCtaClick}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="p-0"
              >
                {cta}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return content;
}
