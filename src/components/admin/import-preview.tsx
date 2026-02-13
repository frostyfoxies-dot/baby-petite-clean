'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Package, 
  DollarSign, 
  Truck, 
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import type { ImportPreview } from '@/services/import';

/**
 * Category for selection
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  markup?: number;
}

/**
 * Props for the ImportPreview component
 */
export interface ImportPreviewProps {
  /** Preview data from the import service */
  preview: ImportPreview;
  /** Available categories for selection */
  categories: Category[];
  /** Callback when category is selected */
  onCategorySelect: (categoryId: string) => void;
  /** Callback when import is triggered */
  onImport: () => void;
  /** Whether import is in progress */
  isImporting: boolean;
  /** Currently selected category ID */
  selectedCategoryId?: string;
}

/**
 * ImportPreview Component
 * 
 * Displays a preview of a product to be imported from AliExpress.
 * Shows product images, details, pricing breakdown, and category selector.
 * 
 * @example
 * ```tsx
 * <ImportPreview
 *   preview={previewData}
 *   categories={categories}
 *   onCategorySelect={(id) => setSelectedCategory(id)}
 *   onImport={handleImport}
 *   isImporting={false}
 * />
 * ```
 */
export function ImportPreview({
  preview,
  categories,
  onCategorySelect,
  onImport,
  isImporting,
  selectedCategoryId,
}: ImportPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { aliExpressData, transformedProduct, stockStatus, priceBreakdown, warnings } = preview;

  const images = aliExpressData.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Stock status indicator
  const getStockStatus = () => {
    if (!stockStatus.isAvailable) {
      return { status: 'out_of_stock' as const, label: 'Out of Stock' };
    }
    if (stockStatus.outOfStockVariants > 0) {
      return { status: 'low_stock' as const, label: `${stockStatus.outOfStockVariants} variants out of stock` };
    }
    return { status: 'available' as const, label: `${stockStatus.totalStock} in stock` };
  };

  const stockInfo = getStockStatus();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Product Preview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review the product details before importing
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Images */}
          <div>
            {/* Main image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[currentImageIndex]}
                    alt={transformedProduct.name}
                    className="w-full h-full object-contain"
                  />
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Package className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Thumbnail grid */}
            {hasMultipleImages && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'aspect-square rounded-md overflow-hidden border-2 transition-colors',
                      currentImageIndex === index
                        ? 'border-yellow'
                        : 'border-transparent hover:border-gray-300'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${transformedProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column - Details */}
          <div className="space-y-6">
            {/* Product name */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {transformedProduct.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3">
                {transformedProduct.shortDescription}
              </p>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-3">
              <StatusBadge 
                status={stockInfo.status} 
                label={stockInfo.label}
              />
              {stockStatus.hasVariants && (
                <span className="text-sm text-gray-500">
                  {transformedProduct.variants.length} variants
                </span>
              )}
            </div>

            {/* Supplier info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Supplier</p>
              <p className="font-medium text-gray-900">{aliExpressData.supplierName}</p>
              {aliExpressData.supplierRating && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm text-gray-600">
                    {aliExpressData.supplierRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Category selector */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <select
                id="category"
                value={selectedCategoryId || ''}
                onChange={(e) => onCategorySelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
              >
                <option value="">Choose a category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} {category.markup ? `(${category.markup}% markup)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing breakdown */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pricing Breakdown
                </h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost Price</span>
                  <span className="font-medium">{formatPrice(priceBreakdown.costPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Retail Price</span>
                  <span className="font-medium">{formatPrice(priceBreakdown.retailPrice)}</span>
                </div>
                {priceBreakdown.compareAtPrice > priceBreakdown.retailPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Compare at</span>
                    <span className="font-medium text-gray-400 line-through">
                      {formatPrice(priceBreakdown.compareAtPrice)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Margin</span>
                  <span className="font-medium text-green-600">
                    {formatPrice(priceBreakdown.margin)} ({priceBreakdown.marginPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Import button */}
            <Button
              onClick={onImport}
              loading={isImporting}
              disabled={!selectedCategoryId}
              fullWidth
              size="lg"
            >
              {isImporting ? 'Importing...' : 'Import Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
