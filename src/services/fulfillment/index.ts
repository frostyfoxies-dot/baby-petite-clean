/**
 * Fulfillment Services
 *
 * This module exports all fulfillment-related services for the
 * AliExpress-to-Kids Petite dropshipping integration.
 */

// Core fulfillment service
export { FulfillmentService } from './fulfillment-service';
export type {
  FilterOptions,
  AliExpressOrderData,
  OrderCost,
  ValidationResult,
  FulfillmentDetails,
} from './fulfillment-service';

// Order handler for creating dropship orders
export {
  createDropshipOrderForOrder,
  orderContainsDropshippedItems,
  getAliExpressUrlsForOrderItems,
  getPendingOrdersForSupplier,
} from './order-handler';

// Notification service
export { FulfillmentNotificationService } from './notifications';
