import { create } from 'zustand';

/**
 * Notification type
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Notification store interface with state and actions
 */
interface NotificationStore {
  // State
  notifications: Notification[];

  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

/**
 * Generate a unique notification ID
 */
const generateId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Notification store using Zustand
 * Manages application-wide notifications
 */
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],

  /**
   * Add a notification
   * Auto-removes after duration (default 5000ms, set to 0 to disable)
   */
  addNotification: (notification) => {
    const id = generateId();
    const duration = notification.duration ?? 5000;

    const newNotification: Notification = {
      ...notification,
      id,
    };

    set({
      notifications: [...get().notifications, newNotification],
    });

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  /**
   * Remove a notification by ID
   */
  removeNotification: (id) => {
    set({
      notifications: get().notifications.filter((n) => n.id !== id),
    });
  },

  /**
   * Clear all notifications
   */
  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

/**
 * Helper functions for creating notifications
 */
export const notificationHelpers = {
  /**
   * Show a success notification
   */
  success: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  },

  /**
   * Show an error notification
   */
  error: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration: duration ?? 7000, // Longer duration for errors
    });
  },

  /**
   * Show a warning notification
   */
  warning: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  },

  /**
   * Show an info notification
   */
  info: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  },

  /**
   * Show a notification with an action button
   */
  withAction: (
    type: NotificationType,
    title: string,
    message: string,
    action: { label: string; onClick: () => void },
    duration?: number
  ) => {
    useNotificationStore.getState().addNotification({
      type,
      title,
      message,
      action,
      duration: duration ?? 7000, // Longer duration for actionable notifications
    });
  },
};
