/**
 * Notification types for the Kids Petite e-commerce platform
 */

/** Notification type enumeration */
export type NotificationType = 'EMAIL' | 'PUSH' | 'SMS';

/**
 * Represents a user notification
 */
export interface Notification {
  /** Unique identifier */
  id: string;
  /** ID of the user to notify */
  userId: string;
  /** Type of notification */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Additional data payload (optional) */
  data?: Record<string, unknown>;
  /** Whether the notification has been read */
  isRead: boolean;
  /** When the notification was sent */
  sentAt: Date;
  /** When the notification was read (optional) */
  readAt?: Date;
  /** Notification creation timestamp */
  createdAt: Date;
}

/**
 * Toast notification for UI display
 */
export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast type for styling */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Toast title */
  title: string;
  /** Toast message */
  message: string;
  /** Display duration in milliseconds (optional) */
  duration?: number;
  /** Optional action button */
  action?: {
    /** Action button label */
    label: string;
    /** Action button click handler */
    onClick: () => void;
  };
}
