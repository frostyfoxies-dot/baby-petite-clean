'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';

/**
 * Search suggestion type
 */
export interface SearchSuggestion {
  /**
   * Suggestion ID
   */
  id: string;
  /**
   * Suggestion text
   */
  text: string;
  /**
   * Suggestion type
   */
  type?: 'product' | 'category' | 'brand' | 'suggestion';
  /**
   * Suggestion URL
   */
  url?: string;
  /**
   * Image URL (for product suggestions)
   */
  image?: string;
  /**
   * Price (for product suggestions)
   */
  price?: number;
  /**
   * Currency code
   */
  currency?: string;
}

/**
 * Search bar component props
 */
export interface SearchBarProps {
  /**
   * Search query value
   */
  value?: string;
  /**
   * Callback when search query changes
   */
  onChange?: (value: string) => void;
  /**
   * Callback when search is submitted
   */
  onSearch?: (query: string) => void;
  /**
   * Callback when suggestion is selected
   */
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  /**
   * Search suggestions
   */
  suggestions?: SearchSuggestion[];
  /**
   * Whether suggestions are loading
   * @default false
   */
  loading?: boolean;
  /**
   * Placeholder text
   * @default "Search products..."
   */
  placeholder?: string;
  /**
   * Whether to show clear button
   * @default true
   */
  showClear?: boolean;
  /**
   * Whether to show recent searches
   * @default true
   */
  showRecent?: boolean;
  /**
   * Recent searches
   */
  recentSearches?: string[];
  /**
   * Callback when recent search is clicked
   */
  onRecentSearchClick?: (query: string) => void;
  /**
   * Callback when clear recent searches is clicked
   */
  onClearRecent?: () => void;
  /**
   * Input size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Search input with autocomplete
 * 
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onSearch={handleSearch}
 *   suggestions={suggestions}
 *   loading={loading}
 *   recentSearches={recentSearches}
 *   onRecentSearchClick={handleRecentSearch}
 *   onClearRecent={handleClearRecent}
 * />
 * ```
 */
export function SearchBar({
  value = '',
  onChange,
  onSearch,
  onSelectSuggestion,
  suggestions = [],
  loading = false,
  placeholder = 'Search products...',
  showClear = true,
  showRecent = true,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecent,
  size = 'md',
  className,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const hasValue = value.trim().length > 0;
  const hasSuggestions = suggestions.length > 0;
  const hasRecent = showRecent && recentSearches.length > 0 && !hasValue;

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValue) {
      onSearch?.(value);
      setIsOpen(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    onChange?.('');
    inputRef.current?.focus();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSelectSuggestion?.(suggestion);
    setIsOpen(false);
  };

  // Handle recent search click
  const handleRecentClick = (query: string) => {
    onChange?.(query);
    onSearch?.(query);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = hasSuggestions ? suggestions : recentSearches;
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          if (hasSuggestions) {
            handleSuggestionClick(suggestions[focusedIndex]);
          } else if (hasRecent) {
            handleRecentClick(recentSearches[focusedIndex]);
          }
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus management
  React.useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const items = containerRef.current?.querySelectorAll('[role="option"]');
      items?.[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex, isOpen]);

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11',
    lg: 'h-13 text-lg',
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className={cn(
          'absolute left-3 text-gray-400 pointer-events-none',
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
        )} aria-hidden="true" />
        
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            sizeClasses[size],
            isOpen && (hasSuggestions || hasRecent) && 'rounded-b-none'
          )}
          aria-label="Search"
          aria-expanded={isOpen && (hasSuggestions || hasRecent)}
          aria-controls="search-dropdown"
          aria-autocomplete="list"
          role="combobox"
        />

        {loading && (
          <Loader2 className={cn(
            'absolute right-3 text-gray-400 animate-spin',
            size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
          )} />
        )}

        {showClear && hasValue && !loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className={cn(
              'absolute right-1 p-1 h-auto hover:bg-transparent',
              size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-7 h-7'
            )}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && (hasSuggestions || hasRecent) && (
        <div
          id="search-dropdown"
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : hasSuggestions ? (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  role="option"
                  aria-selected={index === focusedIndex}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-3',
                    index === focusedIndex && 'bg-gray-50'
                  )}
                >
                  {suggestion.image && (
                    <img
                      src={suggestion.image}
                      alt={suggestion.text}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </p>
                    {suggestion.type && (
                      <p className="text-xs text-gray-500 capitalize">
                        {suggestion.type}
                      </p>
                    )}
                  </div>
                  {suggestion.price !== undefined && (
                    <p className="text-sm font-medium text-gray-900">
                      {suggestion.price === 0 ? 'Free' : `$${suggestion.price.toFixed(2)}`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : hasRecent ? (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase">Recent Searches</p>
                {onClearRecent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearRecent}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <ul>
                {recentSearches.map((query, index) => (
                  <li
                    key={index}
                    role="option"
                    aria-selected={index === focusedIndex}
                    onClick={() => handleRecentClick(query)}
                    className={cn(
                      'px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2',
                      index === focusedIndex && 'bg-gray-50'
                    )}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{query}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
