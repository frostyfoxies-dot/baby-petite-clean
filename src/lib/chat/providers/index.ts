/**
 * Chat Provider Interface and Factory
 * Abstraction layer for multiple chat providers
 */

import type { ChatConfig, ChatUser, ChatProviderType } from '../config';

/**
 * Chat provider interface
 * All providers must implement this interface
 */
export interface ChatProvider {
  /** Provider name identifier */
  readonly name: ChatProviderType;
  
  /** Display name for UI purposes */
  readonly displayName: string;
  
  /**
   * Initialize the chat provider
   * Called once when the provider is loaded
   */
  init: (config: ChatConfig) => Promise<void> | void;
  
  /**
   * Open the chat widget
   */
  open: () => void;
  
  /**
   * Close the chat widget
   */
  close: () => void;
  
  /**
   * Toggle the chat widget open/close
   */
  toggle: () => void;
  
  /**
   * Check if the chat widget is currently open
   */
  isOpen: () => boolean;
  
  /**
   * Set the current user for chat identification
   */
  setUser: (user: ChatUser) => void;
  
  /**
   * Clear the current user (logout)
   */
  clearUser: () => void;
  
  /**
   * Track an analytics event
   */
  trackEvent: (name: string, data?: Record<string, unknown>) => void;
  
  /**
   * Show the chat widget (if hidden)
   */
  show: () => void;
  
  /**
   * Hide the chat widget completely
   */
  hide: () => void;
  
  /**
   * Check if the provider is loaded and ready
   */
  isReady: () => boolean;
  
  /**
   * Destroy the provider instance
   * Called when switching providers or unmounting
   */
  destroy: () => void;
  
  /**
   * Set custom attributes for the conversation
   */
  setAttributes: (attributes: Record<string, string | number | boolean>) => void;
  
  /**
   * Get unread message count
   */
  getUnreadCount: () => number;
  
  /**
   * Subscribe to unread message count changes
   */
  onUnreadChange: (callback: (count: number) => void) => () => void;
  
  /**
   * Send a message programmatically
   */
  sendMessage: (message: string) => void;
}

/**
 * Mock chat provider for development
 */
export class MockChatProvider implements ChatProvider {
  readonly name = 'intercom' as ChatProviderType;
  readonly displayName = 'Mock Chat (Dev)';
  
  private _isOpen = false;
  private _isReady = false;
  private _unreadCount = 0;
  private _listeners: Set<(count: number) => void> = new Set();
  private _user: ChatUser | null = null;
  
  async init(config: ChatConfig): Promise<void> {
    console.log('[MockChat] Initializing with config:', {
      provider: config.provider,
      enabled: config.enabled,
      welcomeMessage: config.welcomeMessage,
    });
    
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 500));
    this._isReady = true;
    console.log('[MockChat] Ready');
  }
  
  open(): void {
    this._isOpen = true;
    console.log('[MockChat] Chat opened');
  }
  
  close(): void {
    this._isOpen = false;
    console.log('[MockChat] Chat closed');
  }
  
  toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  isOpen(): boolean {
    return this._isOpen;
  }
  
  setUser(user: ChatUser): void {
    this._user = user;
    console.log('[MockChat] User set:', user);
  }
  
  clearUser(): void {
    this._user = null;
    console.log('[MockChat] User cleared');
  }
  
  trackEvent(name: string, data?: Record<string, unknown>): void {
    console.log('[MockChat] Event tracked:', name, data);
  }
  
  show(): void {
    console.log('[MockChat] Widget shown');
  }
  
  hide(): void {
    console.log('[MockChat] Widget hidden');
  }
  
  isReady(): boolean {
    return this._isReady;
  }
  
  destroy(): void {
    this._isReady = false;
    this._isOpen = false;
    this._listeners.clear();
    console.log('[MockChat] Destroyed');
  }
  
  setAttributes(attributes: Record<string, string | number | boolean>): void {
    console.log('[MockChat] Attributes set:', attributes);
  }
  
  getUnreadCount(): number {
    return this._unreadCount;
  }
  
  onUnreadChange(callback: (count: number) => void): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }
  
  sendMessage(message: string): void {
    console.log('[MockChat] Message sent:', message);
    // Simulate receiving a response
    setTimeout(() => {
      this._unreadCount = 1;
      this._listeners.forEach(cb => cb(this._unreadCount));
    }, 1000);
  }
  
  // Test helper to simulate incoming message
  simulateIncomingMessage(): void {
    this._unreadCount++;
    this._listeners.forEach(cb => cb(this._unreadCount));
  }
}

/**
 * Chat provider factory function type
 */
export type ChatProviderFactory = () => ChatProvider;

/**
 * Registry of available chat providers
 */
const providerRegistry: Map<ChatProviderType, ChatProviderFactory> = new Map();

/**
 * Register a chat provider factory
 */
export function registerProvider(
  type: ChatProviderType,
  factory: ChatProviderFactory
): void {
  providerRegistry.set(type, factory);
}

/**
 * Get a chat provider instance
 */
export function getProvider(type: ChatProviderType): ChatProvider | null {
  const factory = providerRegistry.get(type);
  if (!factory) {
    console.warn(`Chat provider "${type}" is not registered. Available providers:`, 
      Array.from(providerRegistry.keys()));
    return null;
  }
  return factory();
}

/**
 * Check if a provider is registered
 */
export function hasProvider(type: ChatProviderType): boolean {
  return providerRegistry.has(type);
}

/**
 * Get list of registered provider types
 */
export function getRegisteredProviders(): ChatProviderType[] {
  return Array.from(providerRegistry.keys());
}

// Re-export provider implementations
export { createIntercomProvider } from './intercom';
export { createCrispProvider } from './crisp';
export { createZendeskProvider } from './zendesk';
