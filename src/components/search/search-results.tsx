'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, Filter, SlidersHorizontal, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

/**
 * Product type for search results
 */
export interface SearchResultProduct {
  /**
   * Product ID
   */
  id: string;
  /**
   * Product name
   */
  name: string;
  /**
   * Product slug
   */
  slug: string;
  /**
   * Product image URL
   */
  image: string;
  /**
   * Product price
   */
  price: number;
  /**
   * Compare at price (for sale items)
   */
  compareAtPrice?: number;
  /**
   * Currency code
   */
  currency?: string;
  /**
   * Whether product is in stock
   */
  inStock?: boolean;
  /**
   * Product category
   */
  category?: string;
  /**
   * Product tags
   */
  tags?: string[];
}

/**
 * Search results component props
 */
export interface SearchResultsProps {
  /**
   * Search query
   */
  query: string;
  /**
   * Search results
   */
  results: SearchResultProduct[];
  /**
   * Total number of results
   */
  total: number;
  /**
   * Current page
   */
  page?: number;
  /**
   * Number of results per page
   */
  pageSize?: number;
  /**
   * Whether results are loading
   * @default false
   */
  loading?: boolean;
  /**
   * View mode
   * @default "grid"
   */
  viewMode?: 'grid' | 'list';
  /**
   * Callback when view mode changes
   */
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;
  /**
   * Callback when filter button is clicked
   */
  onFilterClick?: () => void;
  /**
   * Whether to show filters button
   * @default true
   */
  showFilters?: boolean;
  /**
   * Active filters count
   */
  activeFiltersCount?: number;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Empty state CTA text
   */
  emptyCta?: string;
  /**
   * Callback when empty state CTA is clicked
   */
  onEmptyCtaClick?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Search results display
 * 
 * @example
 * ```tsx
 * <SearchResults
 *   query={searchQuery}
 *   results={products}
 *   total={totalCount}
 *   page={currentPage}
 *   pageSize={12}
 *   loading={loading}
 *   viewMode={viewMode}
 *   onViewModeChange={setViewMode}
 *   onPageChange={handlePageChange}
 *   onFilterClick={openFilters}
 *   activeFiltersCount={activeFilters.length}
 * />
 * ```
 */
export function SearchResults({
  query,
  results,
  total,
  page = 1,
  pageSize = 12,
  loading = false,
  viewMode = 'grid',
  onViewModeChange,
  onPageChange,
  onFilterClick,
  showFilters = true,
  activeFiltersCount = 0,
  emptyMessage = 'No products found',
  emptyCta = 'Clear filters',
  onEmptyCtaClick,
  className,
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endResult = Math.min(page * pageSize, total);

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        {/* Results grid skeleton */}
        <div className={cn(
          'grid gap-4',
          viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Search className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500 mb-6">
          {query ? (
            <>
              No results for "<span className="font-medium">{query}</span>"
            </>
          ) : (
            'Try adjusting your search or filters'
          )}
        </p>
        {onEmptyCtaClick && (
          <Button variant="outline" onClick={onEmptyCtaClick}>
            {emptyCta}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {total === 1 ? '1 result' : `${total} results`}
            {query && (
              <>
                {' '}for "<span className="font-medium text-gray-900">{query}</span>"
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Showing {startResult}-{endResult} of {total}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters button */}
          {showFilters && onFilterClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="primary" size="sm" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          )}

          {/* View mode toggle */}
          {onViewModeChange && (
            <div className="flex border border-gray-200 rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="rounded-none border-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="rounded-none border-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className={cn(
        'grid gap-4',
        viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
      )}>
        {results.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            image={product.image}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            currency={product.currency}
            inStock={product.inStock}
            category={product.category}
            tags={product.tags}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-9"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
