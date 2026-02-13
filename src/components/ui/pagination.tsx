'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Pagination component props
 */
export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Number of page buttons to show (excluding first, last, and ellipsis)
   * @default 5
   */
  siblingCount?: number;
  /**
   * Whether to show first and last page buttons
   * @default true
   */
  showFirstLast?: boolean;
  /**
   * Whether to show previous and next buttons
   * @default true
   */
  showPrevNext?: boolean;
  /**
   * Whether to disable the pagination
   * @default false
   */
  disabled?: boolean;
}

/**
 * Pagination controls component
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 * />
 * ```
 */
export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      className,
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 5,
      showFirstLast = true,
      showPrevNext = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Generate page numbers to display
    const getPageNumbers = (): (number | 'ellipsis')[] => {
      const pages: (number | 'ellipsis')[] = [];
      
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const leftSibling = Math.max(currentPage - siblingCount, 2);
      const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

      // Add left ellipsis if needed
      if (leftSibling > 2) {
        pages.push('ellipsis');
      }

      // Add pages in range
      for (let i = leftSibling; i <= rightSibling; i++) {
        pages.push(i);
      }

      // Add right ellipsis if needed
      if (rightSibling < totalPages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pages.push(totalPages);
      }

      return pages;
    };

    const pageNumbers = getPageNumbers();

    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages && !disabled) {
        onPageChange(page);
      }
    };

    const PageButton = ({
      page,
      isActive,
      isDisabled,
    }: {
      page: number;
      isActive: boolean;
      isDisabled: boolean;
    }) => (
      <button
        type="button"
        onClick={() => handlePageChange(page)}
        disabled={isDisabled}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          // Base styles
          'min-w-[32px] h-8 px-2',
          'flex items-center justify-center',
          'text-sm font-medium rounded',
          'transition-colors duration-200',
          // Active state
          isActive && 'bg-yellow text-gray-900',
          // Inactive state
          !isActive && 'text-gray-600 hover:bg-gray-100',
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
          // Focus state
          'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2'
        )}
      >
        {page}
      </button>
    );

    const NavButton = ({
      direction,
      isDisabled,
    }: {
      direction: 'prev' | 'next';
      isDisabled: boolean;
    }) => (
      <button
        type="button"
        onClick={() => handlePageChange(direction === 'prev' ? currentPage - 1 : currentPage + 1)}
        disabled={isDisabled}
        aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
        className={cn(
          // Base styles
          'min-w-[32px] h-8 px-2',
          'flex items-center justify-center',
          'text-gray-600 rounded',
          'transition-colors duration-200',
          // Hover state
          'hover:bg-gray-100',
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
          // Focus state
          'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2'
        )}
      >
        {direction === 'prev' ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    );

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn('flex items-center gap-1', className)}
        {...props}
      >
        {showPrevNext && (
          <NavButton direction="prev" isDisabled={currentPage === 1 || disabled} />
        )}
        
        {showFirstLast && totalPages > 1 && (
          <PageButton page={1} isActive={currentPage === 1} isDisabled={disabled} />
        )}
        
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="min-w-[32px] h-8 flex items-center justify-center text-gray-400"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }
          
          // Skip first and last page if already shown
          if ((showFirstLast && page === 1) || (showFirstLast && page === totalPages)) {
            return null;
          }
          
          return (
            <PageButton
              key={page}
              page={page}
              isActive={currentPage === page}
              isDisabled={disabled}
            />
          );
        })}
        
        {showFirstLast && totalPages > 1 && (
          <PageButton page={totalPages} isActive={currentPage === totalPages} isDisabled={disabled} />
        )}
        
        {showPrevNext && (
          <NavButton direction="next" isDisabled={currentPage === totalPages || disabled} />
        )}
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';
