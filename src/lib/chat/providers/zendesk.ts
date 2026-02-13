/**
 * Zendesk Chat Provider Implementation
 * https://developer.zendesk.com/api-reference/widget-messaging/web/core/
 */

import type { ChatProvider, ChatProviderFactory } from './index';
import type { ChatConfig, ChatUser, ChatProviderType } from '../config';

// Zendesk window interface
declare global {
  interface Window {
    zESettings?: ZendeskSettings;
    zE?: ZendeskFunction;
  }
}

type ZendeskFunction = {
  (command: 'messenger:set', key: 'zIndex', value: number): void;
  (command: 'messenger:set', key: 'locale', value: string): void;
  (command: 'messenger:on', event: 'open', callback: () => void): void;
  (command: 'messenger:on', event: 'close', callback: () => void): void;
  (command: 'messenger:open'): void;
  (command: 'messenger:close'): void;
  (command: 'messenger:show'): void;
  (command: 'messenger:hide'): void;
  (command: 'messenger:showHelpCenter'): void;
  (command: 'messenger:showChat'): void;
  (command: 'messenger:loginUser', token: string): void;
  (command: 'messenger:logoutUser'): void;
  (command: 'identify', user: ZendeskUser): void;
  (command: 'prefill', data: ZendeskPrefill): void;
  (command: 'hide'): void;
  (command: 'show'): void;
  (command: 'activate', options?: { hideOnClose?: boolean }): void;
  (command: 'setHelpCenterSuggestions', options: { labels: string[] }): void;
  (command: string, ...args: unknown[]): void;
};

interface ZendeskSettings {
  webWidget?: {
    chat?: {
      connectOnPageLoad?: boolean;
      suppress?: boolean;
      departments?: {
        enabled?: string[];
        select?: string;
      };
      prechatForm?: {
        greeting?: {
          '*': string;
        };
        departmentLabel?: {
          '*': string;
        };
      };
      title?: {
        '*': string;
      };
      concierge?: {
        avatarPath?: string;
        name?: string;
        title?: {
          '*': string;
        };
      };
    };
    color?: {
      theme?: string;
      launcher?: string;
      launcherText?: string;
      button?: string;
      resultLists?: string;
      header?: string;
      articleLinks?: string;
    };
    position?: {
      horizontal?: 'left' | 'right';
      vertical?: 'top' | 'bottom';
    };
    offset?: {
      horizontal?: string;
      vertical?: string;
      mobile?: {
        horizontal?: string;
        vertical?: string;
      };
    };
    zIndex?: number;
  };
}

interface ZendeskUser {
  name?: string;
  email?: string;
  externalId?: string;
  organization?: string;
}

interface ZendeskPrefill {
  name?: { value: string; readOnly?: boolean };
  email?: { value: string; readOnly?: boolean };
  phone?: { value: string; readOnly?: boolean };
}

/**
 * Zendesk provider implementation
 */
class ZendeskProvider implements ChatProvider {
  readonly name: ChatProviderType = 'zendesk';
  readonly displayName = 'Zendesk';
  
  private _config: ChatConfig | null = null;
  private _isReady = false;
  private _isOpen = false;
  private _unreadCount = 0;
  private _unreadListeners: Set<(count: number) => void> = new Set();
  private _scriptLoaded = false;
  
  async init(config: ChatConfig): Promise<void> {
    if (!config.zendeskKey) {
      console.error('[Zendesk] Missing key in configuration');
      return;
    }
    
    this._config = config;
    
    // Load Zendesk script
    await this.loadScript(config.zendeskKey);
    
    // Configure Zendesk
    this.configure(config);
    
    // Set up event listeners
    this.setupEventListeners();
    
    this._isReady = true;
  }
  
  private async loadScript(key: string): Promise<void> {
    if (this._scriptLoaded || typeof window === 'undefined') {
      return;
    }
    
    return new Promise((resolve, reject) => {
      // Set up Zendesk settings before loading script
      window.zESettings = {
        webWidget: {
          zIndex: this._config?.appearance.zIndex || 9999,
        },
      };
      
      // Load script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://static.zdassets.com/ekr/snippet.js?key=${key}`;
      script.id = 'ze-snippet';
      
      script.onload = () => {
        this._scriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('[Zendesk] Failed to load script'));
      };
      
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    });
  }
  
  private configure(config: ChatConfig): void {
    if (!window.zE) return;
    
    // Set position
    window.zESettings = {
      webWidget: {
        position: {
          horizontal: config.appearance.position === 'bottom-left' ? 'left' : 'right',
          vertical: 'bottom',
        },
        offset: {
          horizontal: `${config.appearance.offsetX}px`,
          vertical: `${config.appearance.offsetY}px`,
        },
        color: {
          theme: config.appearance.primaryColor,
          launcher: config.appearance.primaryColor,
          launcherText: config.appearance.textColor,
        },
        zIndex: config.appearance.zIndex,
        chat: {
          suppress: false,
          connectOnPageLoad: true,
          title: { '*': 'Chat with us' },
          concierge: {
            name: 'Kids Petite Support',
            title: { '*': 'Support Team' },
          },
        },
      },
    };
    
    // Set user info if available
    if (config.user) {
      this.setUser(config.user);
    }
  }
  
  private setupEventListeners(): void {
    if (!window.zE) return;
    
    // Listen for chat open/close
    window.zE('messenger:on', 'open', () => {
      this._isOpen = true;
      this._unreadCount = 0;
      this._unreadListeners.forEach(cb => cb(0));
    });
    
    window.zE('messenger:on', 'close', () => {
      this._isOpen = false;
    });
  }
  
  open(): void {
    if (!window.zE) return;
    window.zE('messenger:open');
  }
  
  close(): void {
    if (!window.zE) return;
    window.zE('messenger:close');
  }
  
  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
  
  isOpen(): boolean {
    return this._isOpen;
  }
  
  setUser(user: ChatUser): void {
    if (!window.zE) return;
    
    // Identify user
    window.zE('identify', {
      name: user.name,
      email: user.email,
      externalId: user.id,
    });
    
    // Prefill form
    if (user.name || user.email) {
      window.zE('prefill', {
        name: user.name ? { value: user.name, readOnly: true } : undefined,
        email: user.email ? { value: user.email, readOnly: true } : undefined,
      });
    }
  }
  
  clearUser(): void {
    if (!window.zE) return;
    window.zE('messenger:logoutUser');
  }
  
  trackEvent(name: string, data?: Record<string, unknown>): void {
    // Zendesk doesn't have built-in event tracking
    // We can log to console or send to analytics
    console.log('[Zendesk] Event tracked:', name, data);
  }
  
  show(): void {
    if (!window.zE) return;
    window.zE('messenger:show');
  }
  
  hide(): void {
    if (!window.zE) return;
    window.zE('messenger:hide');
  }
  
  isReady(): boolean {
    return this._isReady;
  }
  
  destroy(): void {
    if (!window.zE) return;
    
    window.zE('messenger:hide');
    
    this._isReady = false;
    this._isOpen = false;
    this._unreadCount = 0;
    this._unreadListeners.clear();
    
    // Remove script
    const script = document.getElementById('ze-snippet');
    script?.remove();
    
    // Remove Zendesk elements
    const zendeskElements = document.querySelectorAll('[class*="zendesk"], [id*="zendesk"], [data-testid*="zendesk"]');
    zendeskElements.forEach(el => el.remove());
    
    // Clean up global
    delete window.zE;
    delete window.zESettings;
    
    this._scriptLoaded = false;
  }
  
  setAttributes(attributes: Record<string, string | number | boolean>): void {
    // Zendesk doesn't have a direct setAttributes method
    // Custom attributes would need to be set via identify or custom fields
    console.log('[Zendesk] Attributes:', attributes);
  }
  
  getUnreadCount(): number {
    return this._unreadCount;
  }
  
  onUnreadChange(callback: (count: number) => void): () => void {
    this._unreadListeners.add(callback);
    return () => {
      this._unreadListeners.delete(callback);
    };
  }
  
  sendMessage(message: string): void {
    if (!window.zE) return;
    
    // Open chat - Zendesk doesn't support programmatic message sending
    window.zE('messenger:open');
    window.zE('messenger:showChat');
    console.log('[Zendesk] Message to send:', message);
  }
}

/**
 * Factory function to create Zendesk provider
 */
export const createZendeskProvider: ChatProviderFactory = () => new ZendeskProvider();
