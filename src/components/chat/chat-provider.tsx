'use client';

/**
 * Chat Provider Component
 * React context provider for chat functionality
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { ChatConfig, ChatUser } from '@/lib/chat/config';
import { getChatConfig, isWithinBusinessHours } from '@/lib/chat/config';
import type { ChatProvider } from '@/lib/chat/providers/index';
import {
  getProvider,
  registerProvider,
  MockChatProvider,
} from '@/lib/chat/providers/index';
import { createIntercomProvider } from '@/lib/chat/providers/intercom';
import { createCrispProvider } from '@/lib/chat/providers/crisp';
import { createZendeskProvider } from '@/lib/chat/providers/zendesk';

// Register all providers
registerProvider('intercom', createIntercomProvider);
registerProvider('crisp', createCrispProvider);
registerProvider('zendesk', createZendeskProvider);

/**
 * Chat context value interface
 */
interface ChatContextValue {
  /** Whether chat is enabled and ready */
  isReady: boolean;
  
  /** Whether chat is currently open */
  isOpen: boolean;
  
  /** Whether currently within business hours */
  isOnline: boolean;
  
  /** Number of unread messages */
  unreadCount: number;
  
  /** Current chat configuration */
  config: ChatConfig;
  
  /** Open the chat widget */
  open: () => void;
  
  /** Close the chat widget */
  close: () => void;
  
  /** Toggle the chat widget */
  toggle: () => void;
  
  /** Set the current user */
  setUser: (user: ChatUser) => void;
  
  /** Clear the current user */
  clearUser: () => void;
  
  /** Track an event */
  trackEvent: (name: string, data?: Record<string, unknown>) => void;
  
  /** Send a message */
  sendMessage: (message: string) => void;
  
  /** The underlying provider instance */
  provider: ChatProvider | null;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Hook to access chat context
 */
export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

/**
 * Props for ChatProvider component
 */
interface ChatProviderProps {
  children: ReactNode;
  
  /** Override configuration */
  config?: Partial<ChatConfig>;
  
  /** User to identify */
  user?: ChatUser;
}

/**
 * Chat Provider Component
 * Manages chat provider lifecycle and state
 */
export function ChatProvider({ children, config: configOverride, user }: ChatProviderProps) {
  const [provider, setProvider] = useState<ChatProvider | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get configuration
  const config = useMemo(() => {
    const baseConfig = getChatConfig();
    if (configOverride) {
      return {
        ...baseConfig,
        ...configOverride,
        appearance: {
          ...baseConfig.appearance,
          ...configOverride.appearance,
        },
        preChatForm: {
          ...baseConfig.preChatForm,
          ...configOverride.preChatForm,
          fields: {
            ...baseConfig.preChatForm.fields,
            ...configOverride.preChatForm?.fields,
          },
        },
        businessHours: {
          ...baseConfig.businessHours,
          ...configOverride.businessHours,
        },
        user: user || baseConfig.user,
      };
    }
    return {
      ...baseConfig,
      user: user || baseConfig.user,
    };
  }, [configOverride, user]);
  
  // Check if within business hours
  const isOnline = useMemo(() => isWithinBusinessHours(config), [config]);
  
  // Initialize provider
  useEffect(() => {
    if (!config.enabled) {
      return;
    }
    
    let mounted = true;
    let chatProvider: ChatProvider | null = null;
    
    const initProvider = async () => {
      try {
        // Use mock provider in development mode
        if (config.developmentMode) {
          chatProvider = new MockChatProvider();
        } else {
          chatProvider = getProvider(config.provider);
        }
        
        if (!chatProvider) {
          console.error(`[ChatProvider] Failed to get provider: ${config.provider}`);
          return;
        }
        
        // Initialize provider
        await chatProvider.init(config);
        
        if (!mounted) {
          chatProvider.destroy();
          return;
        }
        
        // Set up unread count listener
        const unsubscribe = chatProvider.onUnreadChange((count) => {
          setUnreadCount(count);
        });
        
        setProvider(chatProvider);
        setIsReady(chatProvider.isReady());
        
        // Cleanup function
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('[ChatProvider] Failed to initialize:', error);
      }
    };
    
    initProvider();
    
    return () => {
      mounted = false;
      if (chatProvider) {
        chatProvider.destroy();
      }
      setProvider(null);
      setIsReady(false);
      setIsOpen(false);
      setUnreadCount(0);
    };
  }, [config]);
  
  // Update user when it changes
  useEffect(() => {
    if (provider && config.user) {
      provider.setUser(config.user);
    }
  }, [provider, config.user]);
  
  // Open chat
  const open = useCallback(() => {
    if (provider) {
      provider.open();
      setIsOpen(true);
    }
  }, [provider]);
  
  // Close chat
  const close = useCallback(() => {
    if (provider) {
      provider.close();
      setIsOpen(false);
    }
  }, [provider]);
  
  // Toggle chat
  const toggle = useCallback(() => {
    if (provider) {
      provider.toggle();
      setIsOpen(provider.isOpen());
    }
  }, [provider]);
  
  // Set user
  const setUser = useCallback((newUser: ChatUser) => {
    if (provider) {
      provider.setUser(newUser);
    }
  }, [provider]);
  
  // Clear user
  const clearUser = useCallback(() => {
    if (provider) {
      provider.clearUser();
    }
  }, [provider]);
  
  // Track event
  const trackEvent = useCallback((name: string, data?: Record<string, unknown>) => {
    if (provider) {
      provider.trackEvent(name, data);
    }
  }, [provider]);
  
  // Send message
  const sendMessage = useCallback((message: string) => {
    if (provider) {
      provider.sendMessage(message);
      setIsOpen(true);
    }
  }, [provider]);
  
  // Context value
  const value = useMemo<ChatContextValue>(() => ({
    isReady,
    isOpen,
    isOnline,
    unreadCount,
    config,
    open,
    close,
    toggle,
    setUser,
    clearUser,
    trackEvent,
    sendMessage,
    provider,
  }), [
    isReady,
    isOpen,
    isOnline,
    unreadCount,
    config,
    open,
    close,
    toggle,
    setUser,
    clearUser,
    trackEvent,
    sendMessage,
    provider,
  ]);
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Higher-order component to inject chat props
 */
export function withChat<P extends object>(
  Component: React.ComponentType<P & { chat: ChatContextValue }>
): React.ComponentType<P> {
  return function WithChatComponent(props: P) {
    const chat = useChat();
    return <Component {...props} chat={chat} />;
  };
}
