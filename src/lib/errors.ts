/**
 * Custom Error Classes
 *
 * A hierarchy of custom error classes for better error handling
 * and more specific error responses throughout the application.
 */

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  /**
   * HTTP status code for the error
   */
  public readonly statusCode: number;

  /**
   * Error code for programmatic handling
   */
  public readonly code: string;

  /**
   * Whether this error is operational (expected) or a programming error
   */
  public readonly isOperational: boolean;

  /**
   * Additional context/data about the error
   */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the error to a JSON-serializable object
   */
  toJSON(): {
    name: string;
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================================================
// HTTP ERROR CLASSES (4xx)
// ============================================================================

/**
 * 400 Bad Request
 * Used when the request is malformed or contains invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

/**
 * 401 Unauthorized
 * Used when authentication is required but not provided
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', true, details);
  }
}

/**
 * 403 Forbidden
 * Used when the user is authenticated but lacks permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', true, details);
  }
}

/**
 * 404 Not Found
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 404, 'NOT_FOUND', true, details);
  }
}

/**
 * 409 Conflict
 * Used when the request conflicts with the current state
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

/**
 * 422 Unprocessable Entity
 * Used when the request is well-formed but contains semantic errors
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

/**
 * 429 Too Many Requests
 * Used when rate limiting is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: Record<string, unknown>) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, details);
  }
}

// ============================================================================
// HTTP ERROR CLASSES (5xx)
// ============================================================================

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, details);
  }
}

/**
 * 502 Bad Gateway
 * Used when an upstream service is unavailable
 */
export class BadGatewayError extends AppError {
  constructor(message: string = 'Bad gateway', details?: Record<string, unknown>) {
    super(message, 502, 'BAD_GATEWAY', true, details);
  }
}

/**
 * 503 Service Unavailable
 * Used when the service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: Record<string, unknown>) {
    super(message, 503, 'SERVICE_UNAVAILABLE', true, details);
  }
}

// ============================================================================
// DOMAIN-SPECIFIC ERROR CLASSES
// ============================================================================

/**
 * Payment-related errors
 */
export class PaymentError extends AppError {
  constructor(message: string = 'Payment failed', details?: Record<string, unknown>) {
    super(message, 400, 'PAYMENT_ERROR', true, details);
  }
}

/**
 * Payment declined error
 */
export class PaymentDeclinedError extends PaymentError {
  constructor(message: string = 'Payment declined', details?: Record<string, unknown>) {
    super(message, { ...details, reason: 'declined' });
  }
}

/**
 * Insufficient funds error
 */
export class InsufficientFundsError extends PaymentError {
  constructor(message: string = 'Insufficient funds', details?: Record<string, unknown>) {
    super(message, { ...details, reason: 'insufficient_funds' });
  }
}

/**
 * Inventory-related errors
 */
export class InventoryError extends AppError {
  constructor(message: string = 'Inventory error', details?: Record<string, unknown>) {
    super(message, 400, 'INVENTORY_ERROR', true, details);
  }
}

/**
 * Out of stock error
 */
export class OutOfStockError extends InventoryError {
  constructor(
    productId: string,
    variantId?: string,
    requestedQuantity?: number,
    availableQuantity?: number
  ) {
    const message = variantId
      ? `Product variant is out of stock`
      : `Product is out of stock`;
    super(message, {
      productId,
      variantId,
      requestedQuantity,
      availableQuantity,
      reason: 'out_of_stock',
    });
  }
}

/**
 * Insufficient stock error
 */
export class InsufficientStockError extends InventoryError {
  constructor(
    productId: string,
    variantId?: string,
    requestedQuantity?: number,
    availableQuantity?: number
  ) {
    const message = variantId
      ? `Insufficient stock for product variant`
      : `Insufficient stock for product`;
    super(message, {
      productId,
      variantId,
      requestedQuantity,
      availableQuantity,
      reason: 'insufficient_stock',
    });
  }
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: Record<string, unknown>) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, details);
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(message: string = 'Invalid email or password') {
    super(message, { reason: 'invalid_credentials' });
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends AuthenticationError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, { reason: 'invalid_token' });
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Token has expired') {
    super(message, { reason: 'token_expired' });
  }
}

/**
 * User-related errors
 */
export class UserError extends AppError {
  constructor(message: string = 'User error', details?: Record<string, unknown>) {
    super(message, 400, 'USER_ERROR', true, details);
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends UserError {
  constructor(message: string = 'User not found') {
    super(message, { reason: 'user_not_found' });
  }
}

/**
 * User already exists error
 */
export class UserAlreadyExistsError extends UserError {
  constructor(message: string = 'User already exists', email?: string) {
    super(message, { email, reason: 'user_already_exists' });
  }
}

/**
 * Email not verified error
 */
export class EmailNotVerifiedError extends UserError {
  constructor(message: string = 'Email not verified') {
    super(message, { reason: 'email_not_verified' });
  }
}

/**
 * Product-related errors
 */
export class ProductError extends AppError {
  constructor(message: string = 'Product error', details?: Record<string, unknown>) {
    super(message, 400, 'PRODUCT_ERROR', true, details);
  }
}

/**
 * Product not found error
 */
export class ProductNotFoundError extends ProductError {
  constructor(productId: string) {
    super('Product not found', { productId, reason: 'product_not_found' });
  }
}

/**
 * Product inactive error
 */
export class ProductInactiveError extends ProductError {
  constructor(productId: string) {
    super('Product is not available', { productId, reason: 'product_inactive' });
  }
}

/**
 * Order-related errors
 */
export class OrderError extends AppError {
  constructor(message: string = 'Order error', details?: Record<string, unknown>) {
    super(message, 400, 'ORDER_ERROR', true, details);
  }
}

/**
 * Order not found error
 */
export class OrderNotFoundError extends OrderError {
  constructor(orderId: string) {
    super('Order not found', { orderId, reason: 'order_not_found' });
  }
}

/**
 * Invalid order status error
 */
export class InvalidOrderStatusError extends OrderError {
  constructor(currentStatus: string, expectedStatus: string | string[]) {
    const expected = Array.isArray(expectedStatus)
      ? expectedStatus.join(', ')
      : expectedStatus;
    super(
      `Invalid order status. Expected: ${expected}, Got: ${currentStatus}`,
      { currentStatus, expectedStatus, reason: 'invalid_order_status' }
    );
  }
}

/**
 * Order already processed error
 */
export class OrderAlreadyProcessedError extends OrderError {
  constructor(orderId: string) {
    super('Order has already been processed', { orderId, reason: 'order_already_processed' });
  }
}

/**
 * Cart-related errors
 */
export class CartError extends AppError {
  constructor(message: string = 'Cart error', details?: Record<string, unknown>) {
    super(message, 400, 'CART_ERROR', true, details);
  }
}

/**
 * Cart item not found error
 */
export class CartItemNotFoundError extends CartError {
  constructor(itemId: string) {
    super('Cart item not found', { itemId, reason: 'cart_item_not_found' });
  }
}

/**
 * Invalid cart quantity error
 */
export class InvalidCartQuantityError extends CartError {
  constructor(quantity: number, max: number) {
    super(`Invalid quantity. Maximum allowed: ${max}`, { quantity, max, reason: 'invalid_quantity' });
  }
}

/**
 * Registry-related errors
 */
export class RegistryError extends AppError {
  constructor(message: string = 'Registry error', details?: Record<string, unknown>) {
    super(message, 400, 'REGISTRY_ERROR', true, details);
  }
}

/**
 * Registry not found error
 */
export class RegistryNotFoundError extends RegistryError {
  constructor(registryId: string) {
    super('Registry not found', { registryId, reason: 'registry_not_found' });
  }
}

/**
 * Registry access denied error
 */
export class RegistryAccessDeniedError extends RegistryError {
  constructor(registryId: string) {
    super('Access to registry denied', { registryId, reason: 'registry_access_denied' });
  }
}

/**
 * Registry expired error
 */
export class RegistryExpiredError extends RegistryError {
  constructor(registryId: string) {
    super('Registry has expired', { registryId, reason: 'registry_expired' });
  }
}

/**
 * Discount-related errors
 */
export class DiscountError extends AppError {
  constructor(message: string = 'Discount error', details?: Record<string, unknown>) {
    super(message, 400, 'DISCOUNT_ERROR', true, details);
  }
}

/**
 * Invalid discount code error
 */
export class InvalidDiscountCodeError extends DiscountError {
  constructor(code: string) {
    super('Invalid discount code', { code, reason: 'invalid_discount_code' });
  }
}

/**
 * Expired discount code error
 */
export class ExpiredDiscountCodeError extends DiscountError {
  constructor(code: string) {
    super('Discount code has expired', { code, reason: 'expired_discount_code' });
  }
}

/**
 * Discount usage limit exceeded error
 */
export class DiscountUsageLimitError extends DiscountError {
  constructor(code: string) {
    super('Discount code usage limit exceeded', { code, reason: 'discount_usage_limit_exceeded' });
  }
}

/**
 * File upload-related errors
 */
export class FileUploadError extends AppError {
  constructor(message: string = 'File upload error', details?: Record<string, unknown>) {
    super(message, 400, 'FILE_UPLOAD_ERROR', true, details);
  }
}

/**
 * Invalid file type error
 */
export class InvalidFileTypeError extends FileUploadError {
  constructor(allowedTypes: string[], providedType: string) {
    super('Invalid file type', { allowedTypes, providedType, reason: 'invalid_file_type' });
  }
}

/**
 * File size exceeded error
 */
export class FileSizeExceededError extends FileUploadError {
  constructor(maxSize: number, actualSize: number) {
    super('File size exceeds limit', { maxSize, actualSize, reason: 'file_size_exceeded' });
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    details?: Record<string, unknown>
  ) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, { service, ...details });
  }
}

/**
 * Stripe error
 */
export class StripeError extends ExternalServiceError {
  constructor(message: string = 'Stripe error', details?: Record<string, unknown>) {
    super('Stripe', message, details);
  }
}

/**
 * Algolia error
 */
export class AlgoliaError extends ExternalServiceError {
  constructor(message: string = 'Algolia error', details?: Record<string, unknown>) {
    super('Algolia', message, details);
  }
}

/**
 * SendGrid error
 */
export class SendGridError extends ExternalServiceError {
  constructor(message: string = 'SendGrid error', details?: Record<string, unknown>) {
    super('SendGrid', message, details);
  }
}

/**
 * OpenAI error
 */
export class OpenAIError extends ExternalServiceError {
  constructor(message: string = 'OpenAI error', details?: Record<string, unknown>) {
    super('OpenAI', message, details);
  }
}

// ============================================================================
// ERROR UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if an error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Checks if an error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

/**
 * Converts an unknown error to an AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message);
  }

  if (typeof error === 'string') {
    return new InternalServerError(error);
  }

  return new InternalServerError('An unknown error occurred');
}

/**
 * Gets the appropriate HTTP status code for an error
 */
export function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Gets a user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Error codes for programmatic handling
 */
export const ERROR_CODES = {
  // General
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Domain-specific
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  INVENTORY_ERROR: 'INVENTORY_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  USER_ERROR: 'USER_ERROR',
  PRODUCT_ERROR: 'PRODUCT_ERROR',
  ORDER_ERROR: 'ORDER_ERROR',
  CART_ERROR: 'CART_ERROR',
  REGISTRY_ERROR: 'REGISTRY_ERROR',
  DISCOUNT_ERROR: 'DISCOUNT_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;
