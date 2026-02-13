'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/use-search-suggestions';
import { useClickOutsideRef } from '@/hooks/use-click-outside';
import {
  ProductSuggestionItem,
  CategorySuggestionItem,
  RecentSearchItem,
  QuerySuggestionItem,
  ViewAllResults,
  SearchSuggestionsLoading,
  NoResults,
} from './search-suggestion';

/**
 * Search autocomplete component props
 */
export interface SearchAutocompleteProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Additional class name for the container */
  className?: string;
  /** Additional class name for the input */
  inputClassName?: string;
  /** Minimum characters before searching (default: 2) */
  minChars?: number;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Maximum suggestions to show (default: 8) */
  maxSuggestions?: number;
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
  /** Callback when a suggestion is selected */
  onSelect?: (type: 'product' | 'category' | 'query', value: string) => void;
  /** Whether to show recent searches (default: true) */
  showRecentSearches?: boolean;
  /** Whether the input is focused initially */
  autoFocus?: boolean;
  /** Whether the search is in a mobile menu */
  isMobile?: boolean;
}

/**
 * Dropdown position state
 */
interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * Search autocomplete with predictive suggestions
 *
 * Features:
 * - Debounced API calls
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Recent searches from localStorage
 * - Product and category suggestions
 * - Text highlighting
 * - Loading and error states
 * - Accessible with ARIA attributes
 * - Mobile responsive
 *
 * @example
 * ```tsx
 * <SearchAutocomplete
 *   placeholder="Search products..."
 *   onSearch={(query) => router.push(`/search?q=${query}`)}
 *   minChars={2}
 * />
 * ```
 */
export function SearchAutocomplete({
  placeholder = 'Search products...',
  className,
  inputClassName,
  minChars = 2,
  debounceMs = 300,
  maxSuggestions = 8,
  onSearch,
  onSelect,
  showRecentSearches = true,
  autoFocus = false,
  isMobile = false,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [dropdownPosition, setDropdownPosition] = React.useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  });

  const {
    query,
    setQuery,
    products,
    categories,
    suggestions,
    recentSearches,
    totalResults,
    isLoading,
    isDebouncing,
    showSuggestions,
    clearSearch,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  } = useSearchSuggestions({
    minChars,
    debounceMs,
    maxSuggestions,
    enableRecentSearches: showRecentSearches,
  });

  // Calculate total items for keyboard navigation
  const totalItems = React.useMemo(() => {
    let count = 0;
    if (query.trim().length >= minChars) {
      count += products.length;
      count += categories.length;
      count += suggestions.length;
      if (totalResults > 0) count += 1; // "View all results" link
    } else if (showRecentSearches && recentSearches.length > 0) {
      count += recentSearches.length;
    }
    return count;
  }, [query, minChars, products, categories, suggestions, totalResults, showRecentSearches, recentSearches]);

  // Update dropdown position
  const updateDropdownPosition = React.useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + (isMobile ? 0 : 4),
        left: isMobile ? 0 : rect.left,
        width: isMobile ? window.innerWidth : rect.width,
      });
    }
  }, [isMobile]);

  // Close dropdown when clicking outside
  useClickOutsideRef(containerRef, () => {
    setIsOpen(false);
  });

  // Handle input focus
  const handleFocus = React.useCallback(() => {
    setIsOpen(true);
    updateDropdownPosition();
  }, [updateDropdownPosition]);

  // Handle input change
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setHighlightedIndex(-1);
      if (!isOpen) {
        setIsOpen(true);
      }
      updateDropdownPosition();
    },
    [setQuery, isOpen, updateDropdownPosition]
  );

  // Handle clear button
  const handleClear = React.useCallback(() => {
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);

  // Handle form submit
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        addRecentSearch(query.trim());
        setIsOpen(false);
        if (onSearch) {
          onSearch(query.trim());
        } else {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
      }
    },
    [query, addRecentSearch, onSearch, router]
  );

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleSelectItem(highlightedIndex);
          } else if (query.trim()) {
            handleSubmit(e);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [totalItems, highlightedIndex, query, handleSubmit]
  );

  // Handle item selection
  const handleSelectItem = React.useCallback(
    (index: number) => {
      let currentIndex = 0;

      // Products
      if (query.trim().length >= minChars) {
        if (index < products.length) {
          const product = products[index];
          addRecentSearch(query.trim());
          setIsOpen(false);
          onSelect?.('product', product.slug);
          router.push(`/products/${product.slug}`);
          return;
        }
        currentIndex += products.length;

        // Categories
        if (index < currentIndex + categories.length) {
          const category = categories[index - currentIndex];
          addRecentSearch(query.trim());
          setIsOpen(false);
          onSelect?.('category', category.slug);
          router.push(`/category/${category.slug}`);
          return;
        }
        currentIndex += categories.length;

        // Query suggestions
        if (index < currentIndex + suggestions.length) {
          const suggestion = suggestions[index - currentIndex];
          setQuery(suggestion);
          addRecentSearch(suggestion);
          setIsOpen(false);
          onSelect?.('query', suggestion);
          router.push(`/search?q=${encodeURIComponent(suggestion)}`);
          return;
        }
        currentIndex += suggestions.length;

        // View all results
        if (index === currentIndex && totalResults > 0) {
          addRecentSearch(query.trim());
          setIsOpen(false);
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          return;
        }
      } else if (showRecentSearches && recentSearches.length > 0) {
        // Recent searches
        if (index < recentSearches.length) {
          const recent = recentSearches[index];
          setQuery(recent.query);
          setIsOpen(false);
          router.push(`/search?q=${encodeURIComponent(recent.query)}`);
          return;
        }
      }
    },
    [
      query,
      minChars,
      products,
      categories,
      suggestions,
      totalResults,
      recentSearches,
      showRecentSearches,
      setQuery,
      addRecentSearch,
      onSelect,
      router,
    ]
  );

  // Handle recent search click
  const handleRecentSearchClick = React.useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    },
    [setQuery, router]
  );

  // Update position on scroll/resize
  React.useEffect(() => {
    const handleUpdate = () => updateDropdownPosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [updateDropdownPosition]);

  // Reset highlighted index when results change
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [products, categories, suggestions, recentSearches]);

  // Determine if we should show the dropdown
  const shouldShowDropdown = isOpen && showSuggestions;

  // Check if we have results
  const hasResults = products.length > 0 || categories.length > 0 || suggestions.length > 0;
  const showNoResults = query.trim().length >= minChars && !isLoading && !isDebouncing && !hasResults;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
              'text-gray-400 pointer-events-none'
            )}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={cn(
              'w-full h-10 pl-10 pr-10',
              'bg-white border border-gray-200 rounded-md',
              'text-sm text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
              'transition-colors duration-200',
              inputClassName
            )}
            aria-label="Search products"
            aria-expanded={shouldShowDropdown}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="search-suggestions-listbox"
            aria-activedescendant={
              highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined
            }
          />
          {/* Loading indicator or clear button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {(isLoading || isDebouncing) && query.trim().length >= minChars ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : query.trim() ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {/* Dropdown - Portal for proper z-index handling */}
      {shouldShowDropdown &&
        typeof window !== 'undefined' &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            id="search-suggestions-listbox"
            role="listbox"
            style={{
              position: isMobile ? 'fixed' : 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 50,
            }}
            className={cn(
              'bg-white rounded-lg shadow-lg border border-gray-200',
              'max-h-[80vh] overflow-y-auto',
              'animate-in fade-in-0 zoom-in-95',
              'duration-150',
              isMobile && 'rounded-none border-x-0'
            )}
          >
            {/* Loading state */}
            {(isLoading || isDebouncing) && query.trim().length >= minChars && (
              <SearchSuggestionsLoading />
            )}

            {/* No results */}
            {showNoResults && <NoResults query={query} />}

            {/* Results */}
            {!isLoading && !isDebouncing && query.trim().length >= minChars && hasResults && (
              <>
                {/* Products */}
                {products.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                      Products
                    </div>
                    {products.map((product, index) => (
                      <ProductSuggestionItem
                        key={product.id}
                        product={product}
                        query={query}
                        isHighlighted={highlightedIndex === index}
                        onClick={() => {
                          addRecentSearch(query.trim());
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                      Categories
                    </div>
                    {categories.map((category, index) => (
                      <CategorySuggestionItem
                        key={category.id}
                        category={category}
                        query={query}
                        isHighlighted={highlightedIndex === products.length + index}
                        onClick={() => {
                          addRecentSearch(query.trim());
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Query suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                      Suggestions
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <QuerySuggestionItem
                        key={suggestion}
                        suggestion={suggestion}
                        query={query}
                        isHighlighted={
                          highlightedIndex === products.length + categories.length + index
                        }
                        onClick={() => {
                          setQuery(suggestion);
                          addRecentSearch(suggestion);
                          setIsOpen(false);
                          router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* View all results */}
                {totalResults > 0 && (
                  <ViewAllResults
                    query={query}
                    totalResults={totalResults}
                    isHighlighted={
                      highlightedIndex ===
                      products.length + categories.length + suggestions.length
                    }
                    onClick={() => {
                      addRecentSearch(query.trim());
                      setIsOpen(false);
                    }}
                  />
                )}
              </>
            )}

            {/* Recent searches */}
            {query.trim().length < minChars && showRecentSearches && recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((recent, index) => (
                  <RecentSearchItem
                    key={recent.query}
                    recentSearch={recent}
                    isHighlighted={highlightedIndex === index}
                    onClick={() => handleRecentSearchClick(recent.query)}
                    onRemove={() => removeRecentSearch(recent.query)}
                  />
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default SearchAutocomplete;
