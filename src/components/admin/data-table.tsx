'use client';

import { useState, useMemo, ReactNode } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

/**
 * Sort direction type
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Column definition for the data table
 */
export interface ColumnDef<T> {
  /** Column identifier */
  id: string;
  /** Column header label */
  header: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom render function for the cell */
  cell?: (item: T) => ReactNode;
  /** Property key for default rendering */
  accessorKey?: keyof T;
  /** Column width (CSS value) */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom class for the header */
  headerClassName?: string;
  /** Custom class for cells in this column */
  cellClassName?: string;
}

/**
 * Props for the DataTable component
 */
export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data items */
  data: T[];
  /** Key extractor for rows */
  getRowId: (item: T) => string;
  /** Enable search functionality */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Custom search filter function */
  searchFilter?: (item: T, query: string) => boolean;
  /** Enable pagination */
  paginated?: boolean;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Additional container class */
  className?: string;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Custom row class */
  rowClassName?: string | ((item: T) => string);
}

// ============================================
// COMPONENT
// ============================================

/**
 * DataTable Component
 * 
 * A reusable table component with sorting, filtering, and pagination.
 * Designed for admin interfaces like supplier lists and order tables.
 * 
 * @example
 * ```tsx
 * const columns: ColumnDef<Supplier>[] = [
 *   { id: 'name', header: 'Name', sortable: true, accessorKey: 'name' },
 *   { id: 'status', header: 'Status', cell: (s) => <StatusBadge status={s.status} /> },
 * ];
 * 
 * <DataTable
 *   columns={columns}
 *   data={suppliers}
 *   getRowId={(s) => s.id}
 *   searchable
 *   paginated
 * />
 * ```
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchFilter,
  paginated = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  emptyMessage = 'No data available',
  loading = false,
  className,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  // State
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);

  // Default search filter - searches all string fields
  const defaultSearchFilter = (item: T, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    return Object.values(item as Record<string, unknown>).some(value => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerQuery);
      }
      return false;
    });
  };

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchable && searchQuery) {
      const filter = searchFilter || defaultSearchFilter;
      result = result.filter(item => filter(item, searchQuery));
    }

    // Apply sorting
    if (sortKey) {
      const column = columns.find(c => c.id === sortKey);
      result.sort((a, b) => {
        let aValue: unknown;
        let bValue: unknown;

        if (column?.accessorKey) {
          aValue = a[column.accessorKey];
          bValue = b[column.accessorKey];
        } else {
          aValue = (a as Record<string, unknown>)[sortKey];
          bValue = (b as Record<string, unknown>)[sortKey];
        }

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortKey, sortDirection, columns, searchable, searchFilter]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!paginated) return processedData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage, paginated]);

  // Pagination info
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, processedData.length);

  // Handlers
  const handleSort = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column?.sortable) return;

    if (sortKey === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(columnId);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  // Reset page when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Alignment classes
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    alignClasses[column.align || 'left'],
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                    column.headerClassName
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.id)}
                  aria-sort={
                    sortKey === column.id
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'w-3 h-3 -mb-1',
                            sortKey === column.id && sortDirection === 'asc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'w-3 h-3',
                            sortKey === column.id && sortDirection === 'desc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded motion-safe:animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {searchQuery
                    ? `No results found for "${searchQuery}"`
                    : emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              paginatedData.map((item) => {
                const rowId = getRowId(item);
                const rowClass = typeof rowClassName === 'function' 
                  ? rowClassName(item) 
                  : rowClassName;

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      onRowClick && 'cursor-pointer',
                      rowClass
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          'px-4 py-3 text-sm text-gray-900',
                          alignClasses[column.align || 'left'],
                          column.cellClassName
                        )}
                      >
                        {column.cell
                          ? column.cell(item)
                          : column.accessorKey
                          ? String(item[column.accessorKey] ?? '')
                          : String((item as Record<string, unknown>)[column.id] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && processedData.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {startItem} to {endItem} of {processedData.length} results
            </span>
            <span className="hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>per page</span>
            </div>
          </div>

          <nav
            className="flex items-center gap-1"
            aria-label="Pagination"
          >
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded text-sm font-medium',
                      currentPage === pageNum
                        ? 'bg-yellow text-gray-900'
                        : 'hover:bg-gray-100'
                    )}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
