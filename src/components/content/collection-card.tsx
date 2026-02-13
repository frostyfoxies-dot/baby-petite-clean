'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Collection card component props
 */
export interface CollectionCardProps {
  /**
   * Collection ID
   */
  id: string;
  /**
   * Collection name
   */
  name: string;
  /**
   * Collection description
   */
  description?: string;
  /**
   * Collection image URL
   */
  image: string;
  /**
   * Collection link
   */
  href: string;
  /**
   * Product count
   */
  productCount?: number;
  /**
   * Card size
   * @default "medium"
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Card layout
   * @default "vertical"
   */
  layout?: 'vertical' | 'horizontal' | 'overlay';
  /**
   * Text color theme
   * @default "dark"
   */
  theme?: 'light' | 'dark';
  /**
   * Callback when card is clicked
   */
  onClick?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Collection card
 * 
 * @example
 * ```tsx
 * <CollectionCard
 *   id="new-arrivals"
 *   name="New Arrivals"
 *   description="Shop the latest styles"
 *   image="/images/collection.jpg"
 *   href="/collections/new-arrivals"
 *   productCount={24}
 *   layout="overlay"
 *   theme="light"
 * />
 * ```
 */
export function CollectionCard({
  id,
  name,
  description,
  image,
  href,
  productCount,
  size = 'medium',
  layout = 'vertical',
  theme = 'dark',
  onClick,
  className,
}: CollectionCardProps) {
  const sizeClasses = {
    small: layout === 'horizontal' ? 'h-32' : 'h-48',
    medium: layout === 'horizontal' ? 'h-40' : 'h-64',
    large: layout === 'horizontal' ? 'h-48' : 'h-80',
  };

  const content = (
    <>
      {/* Background image */}
      <div
        className={cn(
          'absolute inset-0 bg-cover bg-center transition-transform duration-300',
          'group-hover:scale-105'
        )}
        style={{ backgroundImage: `url(${image})` }}
      >
        {theme === 'light' && layout === 'overlay' && (
          <div className="absolute inset-0 bg-black/40" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'relative z-10 h-full flex flex-col justify-end p-4',
        layout === 'overlay' && 'text-white',
        layout === 'vertical' && 'bg-gradient-to-t from-black/60 to-transparent',
        layout === 'horizontal' && 'bg-gradient-to-r from-black/60 to-transparent'
      )}>
        <h3 className={cn(
          'font-semibold mb-1',
          size === 'large' && 'text-xl',
          size === 'medium' && 'text-lg',
          size === 'small' && 'text-base',
          layout !== 'overlay' && 'text-white'
        )}>
          {name}
        </h3>
        
        {description && (
          <p className={cn(
            'text-sm mb-2 line-clamp-2',
            layout !== 'overlay' ? 'text-white/80' : 'text-white/90'
          )}>
            {description}
          </p>
        )}
        
        {productCount !== undefined && (
          <p className={cn(
            'text-xs',
            layout !== 'overlay' ? 'text-white/60' : 'text-white/70'
          )}>
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>
    </>
  );

  const cardClasses = cn(
    'relative overflow-hidden rounded-lg group cursor-pointer',
    sizeClasses[size],
    layout === 'horizontal' && 'flex',
    className
  );

  if (onClick) {
    return (
      <div onClick={onClick} className={cardClasses}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={cardClasses}>
      {content}
    </Link>
  );
}
