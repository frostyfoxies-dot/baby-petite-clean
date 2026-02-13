'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Product image type
 */
export interface ProductImage {
  /**
   * Image URL
   */
  url: string;
  /**
   * Alt text
   */
  alt?: string;
}

/**
 * Product image gallery component props
 */
export interface ProductImageProps {
  /**
   * Product images
   */
  images: ProductImage[];
  /**
   * Currently selected image index
   */
  selectedIndex?: number;
  /**
   * Callback when image is selected
   */
  onImageSelect?: (index: number) => void;
  /**
   * Whether to enable zoom on hover
   * @default true
   */
  enableZoom?: boolean;
  /**
   * Whether to show thumbnails
   * @default true
   */
  showThumbnails?: boolean;
  /**
   * Whether to show navigation arrows
   * @default true
   */
  showNavigation?: boolean;
  /**
   * Aspect ratio of the main image
   * @default 'square'
   */
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Product image gallery with thumbnails and zoom on hover
 * 
 * @example
 * ```tsx
 * <ProductImage
 *   images={product.images}
 *   selectedIndex={selectedImageIndex}
 *   onImageSelect={setSelectedImageIndex}
 * />
 * ```
 */
export function ProductImage({
  images,
  selectedIndex = 0,
  onImageSelect,
  enableZoom = true,
  showThumbnails = true,
  showNavigation = true,
  aspectRatio = 'square',
  className,
}: ProductImageProps) {
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [zoomPosition, setZoomPosition] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const aspectRatioStyles = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  const handlePrevious = () => {
    const newIndex = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;
    onImageSelect?.(newIndex);
  };

  const handleNext = () => {
    const newIndex = selectedIndex === images.length - 1 ? 0 : selectedIndex + 1;
    onImageSelect?.(newIndex);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (enableZoom) {
      setIsZoomed(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const currentImage = images[selectedIndex];

  if (!currentImage) {
    return (
      <div
        className={cn(
          'bg-gray-100 rounded-md flex items-center justify-center',
          aspectRatioStyles[aspectRatio],
          className
        )}
      >
        <span className="text-gray-400 text-sm">No images available</span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Main image */}
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden bg-gray-50 rounded-md',
          aspectRatioStyles[aspectRatio]
        )}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image */}
        <div
          className={cn(
            'w-full h-full transition-transform duration-200 ease-out',
            isZoomed && 'scale-150'
          )}
          style={
            isZoomed
              ? {
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }
              : undefined
          }
        >
          <Image
            src={currentImage.url}
            alt={currentImage.alt || 'Product image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            priority={selectedIndex === 0}
          />
        </div>

        {/* Zoom indicator */}
        {enableZoom && (
          <div className="absolute top-3 right-3 p-2 bg-white/90 rounded-sm">
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </div>
        )}

        {/* Navigation arrows */}
        {showNavigation && images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/50 text-white text-xs rounded-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onImageSelect?.(index)}
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
                index === selectedIndex
                  ? 'border-yellow'
                  : 'border-transparent hover:border-gray-300'
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
