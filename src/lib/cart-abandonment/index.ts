/**
 * Cart Abandonment Module Index
 *
 * Exports all cart abandonment tracking and scheduling functionality.
 */

// Tracker
export {
  trackCartActivity,
  captureEmailForCart,
  markCartRecovered,
  markEmailSent,
  unsubscribeEmail,
  isEmailUnsubscribed,
  getAbandonmentRecord,
  getRecoveryStatus,
  getCartsForEmail,
  cleanupOldRecords,
  cartAbandonmentTracker,
  type CartAbandonmentRecord,
  type TrackActivityOptions,
  type CaptureEmailOptions,
  type RecoveryStatus,
} from './tracker';

// Scheduler
export {
  runEmailScheduler,
  getSchedulerStats,
  sendTestEmail,
  cartAbandonmentScheduler,
  type SendResult,
  type BatchResult,
  type SchedulerStats,
} from './scheduler';
