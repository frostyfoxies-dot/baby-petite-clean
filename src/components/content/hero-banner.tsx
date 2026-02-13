'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Hero banner component props
 */
export interface HeroBannerProps {
  /**
   * Banner title
   */
  title: string;
  /**
   * Banner subtitle
   */
  subtitle?: string;
  /**
   * Banner description
   */
  description?: string;
  /**
   * Primary CTA button text
   */
  primaryCta?: string;
  /**
   * Primary CTA link
   */
  primaryCtaHref?: string;
  /**
   * Secondary CTA button text
   */
  secondaryCta?: string;
  /**
   * Secondary CTA link
   */
  secondaryCtaHref?: string;
  /**
   * Background image URL
   */
  backgroundImage?: string;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Text alignment
   * @default "left"
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Text color theme
   * @default "dark"
   */
  theme?: 'light' | 'dark';
  /**
   * Banner size
   * @default "large"
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Callback when primary CTA is clicked
   */
  onPrimaryCtaClick?: () => void;
  /**
   * Callback when secondary CTA is clicked
   */
  onSecondaryCtaClick?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Hero banner with CTA
 * 
 * @example
 * ```tsx
 * <HeroBanner
 *   title="New Arrivals"
 *   subtitle="Spring Collection 2024"
 *   description="Discover the latest styles for your little ones"
 *   primaryCta="Shop Now"
 *   primaryCtaHref="/new-arrivals"
 *   backgroundImage="/images/hero-spring.jpg"
 *   align="center"
 *   theme="light"
 * />
 * ```
 */
export function HeroBanner({
  title,
  subtitle,
  description,
  primaryCta,
  primaryCtaHref,
  secondaryCta,
  secondaryCtaHref,
  backgroundImage,
  backgroundColor,
  align = 'left',
  theme = 'dark',
  size = 'large',
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className,
}: HeroBannerProps) {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  const sizeClasses = {
    small: 'py-12 md:py-16',
    medium: 'py-16 md:py-24',
    large: 'py-24 md:py-32',
  };

  const themeClasses = {
    light: 'text-white',
    dark: 'text-gray-900',
  };

  const content = (
    <div className={cn('flex flex-col gap-4', alignmentClasses[align])}>
      {subtitle && (
        <p className={cn(
          'text-sm font-semibold uppercase tracking-wider',
          theme === 'light' ? 'text-white/80' : 'text-yellow-dark'
        )}>
          {subtitle}
        </p>
      )}
      
      <h1 className={cn(
        'font-bold',
        size === 'large' && 'text-4xl md:text-5xl lg:text-6xl',
        size === 'medium' && 'text-3xl md:text-4xl lg:text-5xl',
        size === 'small' && 'text-2xl md:text-3xl lg:text-4xl'
      )}>
        {title}
      </h1>
      
      {description && (
        <p className={cn(
          'max-w-xl',
          size === 'large' && 'text-lg md:text-xl',
          size === 'medium' && 'text-base md:text-lg',
          size === 'small' && 'text-sm md:text-base',
          theme === 'light' ? 'text-white/90' : 'text-gray-600'
        )}>
          {description}
        </p>
      )}
      
      {(primaryCta || secondaryCta) && (
        <div className={cn(
          'flex flex-wrap gap-3 mt-2',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end'
        )}>
          {primaryCta && (
            primaryCtaHref ? (
              <Link href={primaryCtaHref}>
                <Button
                  variant={theme === 'light' ? 'secondary' : 'primary'}
                  size={size === 'large' ? 'lg' : 'md'}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={onPrimaryCtaClick}
                >
                  {primaryCta}
                </Button>
              </Link>
            ) : (
              <Button
                variant={theme === 'light' ? 'secondary' : 'primary'}
                size={size === 'large' ? 'lg' : 'md'}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={onPrimaryCtaClick}
              >
                {primaryCta}
              </Button>
            )
          )}
          
          {secondaryCta && (
            secondaryCtaHref ? (
              <Link href={secondaryCtaHref}>
                <Button
                  variant={theme === 'light' ? 'outline' : 'outline'}
                  size={size === 'large' ? 'lg' : 'md'}
                  className={cn(
                    theme === 'light' && 'border-white text-white hover:bg-white hover:text-gray-900'
                  )}
                  onClick={onSecondaryCtaClick}
                >
                  {secondaryCta}
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size={size === 'large' ? 'lg' : 'md'}
                className={cn(
                  theme === 'light' && 'border-white text-white hover:bg-white hover:text-gray-900'
                )}
                onClick={onSecondaryCtaClick}
              >
                {secondaryCta}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor }}
    >
      {/* Background image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          {/* Overlay for light theme */}
          {theme === 'light' && (
            <div className="absolute inset-0 bg-black/40" />
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'relative z-10 container mx-auto px-4',
        themeClasses[theme]
      )}>
        {content}
      </div>
    </section>
  );
}
