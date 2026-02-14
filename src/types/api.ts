/**
 * API response types for the Baby Petite e-commerce platform
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Error details (present on failure) */
  error?: {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details (e.g., validation errors) */
    details?: Record<string, string[]>;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    perPage: number;
    /** Total number of items */
    total: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there are more pages */
    hasMore: boolean;
  };
}

/**
 * API error details
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
  /** Additional error details (e.g., validation errors) */
  details?: Record<string, string[]>;
}
