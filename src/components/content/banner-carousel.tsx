'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Banner slide type
 */
export interface BannerSlide {
  /**
   * Slide ID
   */
  id: string;
  /**
   * Slide title
   */
  title: string;
  /**
   * Slide subtitle
   */
  subtitle?: string;
  /**
   * Slide description
   */
  description?: string;
  /**
   * CTA button text
   */
  cta?: string;
  /**
   * CTA link
   */
  ctaHref?: string;
  /**
   * Background image URL
   */
  image: string;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Text color theme
   */
  theme?: 'light' | 'dark';
}

/**
 * Banner carousel component props
 */
export interface BannerCarouselProps {
  /**
   * Banner slides
   */
  slides: BannerSlide[];
  /**
   * Auto-play interval in milliseconds
   * @default 5000
   */
  autoPlayInterval?: number;
  /**
   * Whether to show navigation arrows
   * @default true
   */
  showArrows?: boolean;
  /**
   * Whether to show pagination dots
   * @default true
   */
  showDots?: boolean;
  /**
   * Carousel height
   * @default "medium"
   */
  height?: 'small' | 'medium' | 'large';
  /**
   * Callback when slide changes
   */
  onSlideChange?: (index: number) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Banner carousel
 * 
 * @example
 * ```tsx
 * <BannerCarousel
 *   slides={[
 *     {
 *       id: '1',
 *       title: 'New Arrivals',
 *       description: 'Shop the latest styles',
 *       cta: 'Shop Now',
 *       ctaHref: '/new-arrivals',
 *       image: '/images/banner1.jpg',
 *     },
 *     {
 *       id: '2',
 *       title: 'Sale',
 *       description: 'Up to 50% off',
 *       cta: 'View Sale',
 *       ctaHref: '/sale',
 *       image: '/images/banner2.jpg',
 *     },
 *   ]}
 *   autoPlayInterval={5000}
 * />
 * ```
 */
export function BannerCarousel({
  slides,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
  height = 'medium',
  onSlideChange,
  className,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  // Auto-play
  React.useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, slides.length]);

  // Notify slide change
  React.useEffect(() => {
    onSlideChange?.(currentIndex);
  }, [currentIndex, onSlideChange]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  const heightClasses = {
    small: 'h-64 md:h-80',
    medium: 'h-80 md:h-96',
    large: 'h-96 md:h-[500px]',
  };

  const currentSlide = slides[currentIndex];

  return (
    <div
      className={cn('relative overflow-hidden group', heightClasses[height], className)}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="flex-shrink-0 w-full h-full relative"
            style={{ backgroundColor: slide.backgroundColor }}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {slide.theme === 'light' && (
                <div className="absolute inset-0 bg-black/40" />
              )}
            </div>

            {/* Content */}
            <div className={cn(
              'relative z-10 h-full flex items-center',
              'container mx-auto px-4'
            )}>
              <div className={cn(
                'max-w-xl',
                slide.align === 'center' && 'mx-auto text-center',
                slide.align === 'right' && 'ml-auto text-right',
                slide.theme === 'light' ? 'text-white' : 'text-gray-900'
              )}>
                {slide.subtitle && (
                  <p className={cn(
                    'text-sm font-semibold uppercase tracking-wider mb-2',
                    slide.theme === 'light' ? 'text-white/80' : 'text-yellow-dark'
                  )}>
                    {slide.subtitle}
                  </p>
                )}
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  {slide.title}
                </h2>
                
                {slide.description && (
                  <p className={cn(
                    'text-lg mb-6',
                    slide.theme === 'light' ? 'text-white/90' : 'text-gray-600'
                  )}>
                    {slide.description}
                  </p>
                )}
                
                {slide.cta && (
                  slide.ctaHref ? (
                    <Link href={slide.ctaHref}>
                      <Button
                        variant={slide.theme === 'light' ? 'secondary' : 'primary'}
                        size="lg"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {slide.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant={slide.theme === 'light' ? 'secondary' : 'primary'}
                      size="lg"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {slide.cta}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 z-20',
              'w-10 h-10 rounded-full bg-white/80 shadow-lg',
              'flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-white'
            )}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 z-20',
              'w-10 h-10 rounded-full bg-white/80 shadow-lg',
              'flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-white'
            )}
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-gray-900" />
          </button>
        </>
      )}

      {/* Pagination dots */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-yellow w-6'
                  : 'bg-white/60 hover:bg-white/80'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
