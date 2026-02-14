/**
 * Server action types for the Baby Petite e-commerce platform
 */

/**
 * Result type for server actions
 */
export interface ActionResult<T = void> {
  /** Whether the action was successful */
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
 * Generic input type for server actions
 */
export interface ActionInput {
  /** Dynamic key-value pairs for action input */
  [key: string]: unknown;
}
