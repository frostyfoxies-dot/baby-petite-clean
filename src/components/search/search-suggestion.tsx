'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { X, Search, Package, ArrowRight } from 'lucide-react';
import type {
  SearchSuggestionProduct,
  SearchSuggestionCategory,
  RecentSearch,
} from '@/hooks/use-search-suggestions';

/**
 * Highlights matching text in a string
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-yellow-100 text-inherit rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Product suggestion item props
 */
export interface ProductSuggestionItemProps {
  /** Product data */
  product: SearchSuggestionProduct;
  /** Search query for highlighting */
  query: string;
  /** Whether this item is highlighted via keyboard navigation */
  isHighlighted: boolean;
  /** Callback when item is clicked */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Individual product suggestion item with image, name, price, and category
 *
 * @example
 * ```tsx
 * <ProductSuggestionItem
 *   product={product}
 *   query="baby"
 *   isHighlighted={false}
 *   onClick={() => handleSelect(product)}
 * />
 * ```
 */
export const ProductSuggestionItem = React.memo(function ProductSuggestionItem({
  product,
  query,
  isHighlighted,
  onClick,
  className,
}: ProductSuggestionItemProps) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'transition-colors duration-150',
        'min-h-[44px] md:min-h-0', // 44px touch target on mobile
        isHighlighted
          ? 'bg-gray-100'
          : 'hover:bg-gray-50',
        className
      )}
      aria-selected={isHighlighted}
      role="option"
    >
      {/* Product Image */}
      <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText || product.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {highlightMatch(product.name, query)}
          </span>
          {!product.inStock && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              (Out of stock)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-gray-900 font-medium">
            {formatPrice(product.basePrice)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="text-xs text-gray-500 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500 truncate">
            {product.category.name}
          </span>
        </div>
      </div>

      {/* Arrow indicator */}
      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
});

/**
 * Category suggestion item props
 */
export interface CategorySuggestionItemProps {
  /** Category data */
  category: SearchSuggestionCategory;
  /** Search query for highlighting */
  query: string;
  /** Whether this item is highlighted via keyboard navigation */
  isHighlighted: boolean;
  /** Callback when item is clicked */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Individual category suggestion item
 */
export const CategorySuggestionItem = React.memo(function CategorySuggestionItem({
  category,
  query,
  isHighlighted,
  onClick,
  className,
}: CategorySuggestionItemProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'transition-colors duration-150',
        'min-h-[44px] md:min-h-0',
        isHighlighted
          ? 'bg-gray-100'
          : 'hover:bg-gray-50',
        className
      )}
      aria-selected={isHighlighted}
      role="option"
    >
      {/* Category Image */}
      <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Category Info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900">
          {highlightMatch(category.name, query)}
        </span>
        <span className="text-xs text-gray-500 ml-2">
          ({category.productCount} products)
        </span>
      </div>

      <span className="text-xs text-gray-500 uppercase tracking-wide">
        Category
      </span>
    </Link>
  );
});

/**
 * Recent search item props
 */
export interface RecentSearchItemProps {
  /** Recent search data */
  recentSearch: RecentSearch;
  /** Whether this item is highlighted via keyboard navigation */
  isHighlighted: boolean;
  /** Callback when item is clicked */
  onClick: () => void;
  /** Callback to remove this search */
  onRemove: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Individual recent search item
 */
export const RecentSearchItem = React.memo(function RecentSearchItem({
  recentSearch,
  isHighlighted,
  onClick,
  onRemove,
  className,
}: RecentSearchItemProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5',
        'text-left transition-colors duration-150',
        'min-h-[44px]',
        isHighlighted
          ? 'bg-gray-100'
          : 'hover:bg-gray-50',
        className
      )}
      aria-selected={isHighlighted}
      role="option"
    >
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 text-sm text-gray-700 truncate">
        {recentSearch.query}
      </span>
      <button
        onClick={handleRemove}
        className="p-1 rounded hover:bg-gray-200 transition-colors"
        aria-label={`Remove "${recentSearch.query}" from recent searches`}
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>
    </button>
  );
});

/**
 * Query suggestion item props
 */
export interface QuerySuggestionItemProps {
  /** Suggestion text */
  suggestion: string;
  /** Search query for highlighting */
  query: string;
  /** Whether this item is highlighted via keyboard navigation */
  isHighlighted: boolean;
  /** Callback when item is clicked */
  onClick: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Individual query suggestion item
 */
export const QuerySuggestionItem = React.memo(function QuerySuggestionItem({
  suggestion,
  query,
  isHighlighted,
  onClick,
  className,
}: QuerySuggestionItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5',
        'text-left transition-colors duration-150',
        'min-h-[44px]',
        isHighlighted
          ? 'bg-gray-100'
          : 'hover:bg-gray-50',
        className
      )}
      aria-selected={isHighlighted}
      role="option"
    >
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-700">
        {highlightMatch(suggestion, query)}
      </span>
    </button>
  );
});

/**
 * View all results link props
 */
export interface ViewAllResultsProps {
  /** Search query */
  query: string;
  /** Total number of results */
  totalResults: number;
  /** Whether this item is highlighted */
  isHighlighted: boolean;
  /** Callback when clicked */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * "View all results" link shown at bottom of suggestions
 */
export const ViewAllResults = React.memo(function ViewAllResults({
  query,
  totalResults,
  isHighlighted,
  onClick,
  className,
}: ViewAllResultsProps) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(query)}`}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-3',
        'border-t border-gray-100',
        'text-sm font-medium text-gray-900',
        'transition-colors duration-150',
        'min-h-[44px]',
        isHighlighted
          ? 'bg-gray-100'
          : 'hover:bg-gray-50',
        className
      )}
      aria-selected={isHighlighted}
      role="option"
    >
      <span>View all {totalResults} results</span>
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
});

/**
 * Loading skeleton for suggestions
 */
export const SearchSuggestionsLoading = React.memo(function SearchSuggestionsLoading() {
  return (
    <div className="p-2" role="status" aria-label="Loading suggestions">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 motion-safe:animate-pulse"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading search suggestions...</span>
    </div>
  );
});

/**
 * No results message
 */
export interface NoResultsProps {
  /** Search query */
  query: string;
  /** Additional class name */
  className?: string;
}

export const NoResults = React.memo(function NoResults({
  query,
  className,
}: NoResultsProps) {
  return (
    <div
      className={cn('px-4 py-8 text-center', className)}
      role="status"
    >
      <p className="text-sm text-gray-600">
        No results found for{' '}
        <span className="font-medium text-gray-900">"{query}"</span>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Try checking your spelling or using different keywords
      </p>
    </div>
  );
});
