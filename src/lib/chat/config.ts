/**
 * Chat Configuration
 * Centralized configuration for live chat providers
 */

/**
 * Supported chat providers
 */
export type ChatProviderType = 'intercom' | 'crisp' | 'zendesk';

/**
 * User information for chat identification
 */
export interface ChatUser {
  id?: string;
  email?: string;
  name?: string;
  avatar?: string;
  createdAt?: Date;
  // Custom attributes
  [key: string]: string | number | boolean | Date | undefined;
}

/**
 * Pre-chat form configuration
 */
export interface PreChatFormConfig {
  enabled: boolean;
  fields: {
    name: boolean;
    email: boolean;
    message: boolean;
  };
  requireAuth: boolean; // Require user to be logged in
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  enabled: boolean;
  timezone: string;
  schedule: {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    open: string; // HH:mm format
    close: string; // HH:mm format
  }[];
  offlineMessage: string;
}

/**
 * Chat widget position
 */
export type ChatPosition = 'bottom-right' | 'bottom-left';

/**
 * Chat widget appearance customization
 */
export interface ChatAppearance {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonIcon?: string; // URL to custom icon
  position: ChatPosition;
  offsetX: number; // pixels
  offsetY: number; // pixels
  zIndex: number;
}

/**
 * Main chat configuration interface
 */
export interface ChatConfig {
  // Provider settings
  provider: ChatProviderType;
  enabled: boolean;
  
  // Provider-specific credentials
  intercomAppId?: string;
  crispWebsiteId?: string;
  zendeskKey?: string;
  
  // Widget settings
  appearance: ChatAppearance;
  
  // Feature settings
  preChatForm: PreChatFormConfig;
  businessHours: BusinessHours;
  
  // Content
  welcomeMessage: string;
  offlineMessage: string;
  
  // Development settings
  developmentMode: boolean;
  
  // User identification (set at runtime)
  user?: ChatUser;
}

/**
 * Default chat configuration
 */
export const defaultChatConfig: ChatConfig = {
  provider: 'intercom',
  enabled: false,
  
  appearance: {
    primaryColor: '#E11D48', // Brand rose color
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    position: 'bottom-right',
    offsetX: 20,
    offsetY: 80, // Above mobile bottom nav
    zIndex: 50,
  },
  
  preChatForm: {
    enabled: true,
    fields: {
      name: true,
      email: true,
      message: true,
    },
    requireAuth: false,
  },
  
  businessHours: {
    enabled: true,
    timezone: 'America/New_York',
    schedule: [
      { day: 'monday', open: '09:00', close: '18:00' },
      { day: 'tuesday', open: '09:00', close: '18:00' },
      { day: 'wednesday', open: '09:00', close: '18:00' },
      { day: 'thursday', open: '09:00', close: '18:00' },
      { day: 'friday', open: '09:00', close: '18:00' },
      { day: 'saturday', open: '10:00', close: '16:00' },
      { day: 'sunday', open: '00:00', close: '00:00' }, // Closed
    ],
    offlineMessage: 'We\'re currently offline. Leave us a message and we\'ll get back to you soon!',
  },
  
  welcomeMessage: 'Hi! 👋 How can we help you today?',
  offlineMessage: 'We\'re currently offline. Leave us a message and we\'ll get back to you soon!',
  
  developmentMode: false,
};

/**
 * Get chat configuration from environment variables
 */
export function getChatConfig(): ChatConfig {
  const provider = (process.env.NEXT_PUBLIC_CHAT_PROVIDER as ChatProviderType) || 'intercom';
  const enabled = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true';
  
  return {
    ...defaultChatConfig,
    provider,
    enabled,
    intercomAppId: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
    crispWebsiteId: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
    zendeskKey: process.env.NEXT_PUBLIC_ZENDESK_KEY,
    developmentMode: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_CHAT_MOCK === 'true',
  };
}

/**
 * Check if currently within business hours
 */
export function isWithinBusinessHours(config: ChatConfig): boolean {
  if (!config.businessHours.enabled) {
    return true;
  }
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: config.businessHours.timezone,
      weekday: 'lowercase',
      hour: 'numeric',
      hour12: false,
      minute: 'numeric',
    });
    
    const parts = formatter.formatToParts(now);
    const day = parts.find(p => p.type === 'weekday')?.value as ChatConfig['businessHours']['schedule'][0]['day'];
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    
    const schedule = config.businessHours.schedule.find(s => s.day === day);
    if (!schedule) return false;
    
    const [openHour, openMinute] = schedule.open.split(':').map(Number);
    const [closeHour, closeMinute] = schedule.close.split(':').map(Number);
    
    const currentTime = hour * 60 + minute;
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openTime && currentTime <= closeTime;
  } catch {
    // If timezone calculation fails, assume online
    return true;
  }
}
