/**
 * Intercom Chat Provider Implementation
 * https://developers.intercom.com/installing-intercom/docs/intercom-messenger
 */

import type { ChatProvider, ChatProviderFactory } from './index';
import type { ChatConfig, ChatUser, ChatProviderType } from '../config';

// Intercom window interface
declare global {
  interface Window {
    Intercom: IntercomFunction & {
      (command: 'boot', options: IntercomBootOptions): void;
      (command: 'shutdown'): void;
      (command: 'update', options?: Partial<IntercomBootOptions>): void;
      (command: 'hide'): void;
      (command: 'show'): void;
      (command: 'showMessages'): void;
      (command: 'showNewMessage', message?: string): void;
      (command: 'trackEvent', name: string, data?: Record<string, unknown>): void;
      (command: 'getUnreadCount'): number;
      (command: 'onUnreadCountChange', callback: (count: number) => void): void;
      (command: 'setAttributes', attributes: Record<string, unknown>): void;
    };
    intercomSettings?: IntercomBootOptions;
  }
}

type IntercomFunction = {
  (command: string, ...args: unknown[]): void;
  q?: unknown[][];
  c?: (args: unknown[]) => void;
};

interface IntercomBootOptions {
  app_id: string;
  name?: string;
  email?: string;
  user_id?: string;
  created_at?: number;
  avatar?: string;
  hide_default_launcher?: boolean;
  custom_launcher_selector?: string;
  alignment?: 'left' | 'right';
  vertical_padding?: number;
  horizontal_padding?: number;
  [key: string]: unknown;
}

/**
 * Intercom provider implementation
 */
class IntercomProvider implements ChatProvider {
  readonly name: ChatProviderType = 'intercom';
  readonly displayName = 'Intercom';
  
  private _config: ChatConfig | null = null;
  private _isReady = false;
  private _unreadListeners: Set<(count: number) => void> = new Set();
  private _scriptLoaded = false;
  
  async init(config: ChatConfig): Promise<void> {
    if (!config.intercomAppId) {
      console.error('[Intercom] Missing app_id in configuration');
      return;
    }
    
    this._config = config;
    
    // Load Intercom script
    await this.loadScript();
    
    // Boot Intercom with configuration
    this.boot(config);
    
    // Set up unread count listener
    this.setupUnreadListener();
    
    this._isReady = true;
  }
  
  private async loadScript(): Promise<void> {
    if (this._scriptLoaded || typeof window === 'undefined') {
      return;
    }
    
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Intercom && typeof window.Intercom === 'function') {
        this._scriptLoaded = true;
        resolve();
        return;
      }
      
      // Create Intercom queue
      const intercom = function (...args: unknown[]) {
        intercom.q?.push(args);
      } as IntercomFunction;
      intercom.q = [];
      
      window.Intercom = intercom;
      
      // Load script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://widget.intercom.io/widget/${this._config?.intercomAppId}`;
      script.id = 'intercom-script';
      
      script.onload = () => {
        this._scriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('[Intercom] Failed to load script'));
      };
      
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    });
  }
  
  private boot(config: ChatConfig): void {
    if (!window.Intercom) return;
    
    const bootOptions: IntercomBootOptions = {
      app_id: config.intercomAppId!,
      hide_default_launcher: true, // We use our own launcher
      alignment: config.appearance.position === 'bottom-left' ? 'left' : 'right',
      vertical_padding: config.appearance.offsetY,
      horizontal_padding: config.appearance.offsetX,
    };
    
    // Add user info if available
    if (config.user) {
      bootOptions.user_id = config.user.id;
      bootOptions.email = config.user.email;
      bootOptions.name = config.user.name;
      if (config.user.createdAt) {
        bootOptions.created_at = Math.floor(config.user.createdAt.getTime() / 1000);
      }
    }
    
    window.Intercom('boot', bootOptions);
  }
  
  private setupUnreadListener(): void {
    if (!window.Intercom) return;
    
    window.Intercom('onUnreadCountChange', (count: number) => {
      this._unreadListeners.forEach(callback => callback(count));
    });
  }
  
  open(): void {
    if (!window.Intercom) return;
    window.Intercom('show');
  }
  
  close(): void {
    if (!window.Intercom) return;
    window.Intercom('hide');
  }
  
  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
  
  isOpen(): boolean {
    // Intercom doesn't provide a direct way to check if open
    // We track this via our own state
    const launcher = document.querySelector('.intercom-launcher');
    return launcher?.classList.contains('intercom-launcher-active') ?? false;
  }
  
  setUser(user: ChatUser): void {
    if (!window.Intercom || !this._config) return;
    
    const updateOptions: Partial<IntercomBootOptions> = {
      user_id: user.id,
      email: user.email,
      name: user.name,
    };
    
    if (user.createdAt) {
      updateOptions.created_at = Math.floor(user.createdAt.getTime() / 1000);
    }
    
    window.Intercom('update', updateOptions);
  }
  
  clearUser(): void {
    if (!window.Intercom) return;
    
    // Shutdown and reboot without user
    window.Intercom('shutdown');
    if (this._config) {
      this.boot(this._config);
    }
  }
  
  trackEvent(name: string, data?: Record<string, unknown>): void {
    if (!window.Intercom) return;
    window.Intercom('trackEvent', name, data);
  }
  
  show(): void {
    if (!window.Intercom) return;
    window.Intercom('show');
  }
  
  hide(): void {
    if (!window.Intercom) return;
    window.Intercom('hide');
  }
  
  isReady(): boolean {
    return this._isReady;
  }
  
  destroy(): void {
    if (!window.Intercom) return;
    
    window.Intercom('shutdown');
    this._isReady = false;
    this._unreadListeners.clear();
    
    // Remove script
    const script = document.getElementById('intercom-script');
    script?.remove();
    
    // Remove Intercom elements
    const intercomElements = document.querySelectorAll('[class*="intercom"]');
    intercomElements.forEach(el => el.remove());
    
    this._scriptLoaded = false;
  }
  
  setAttributes(attributes: Record<string, string | number | boolean>): void {
    if (!window.Intercom) return;
    window.Intercom('setAttributes', attributes);
  }
  
  getUnreadCount(): number {
    if (!window.Intercom) return 0;
    return window.Intercom('getUnreadCount');
  }
  
  onUnreadChange(callback: (count: number) => void): () => void {
    this._unreadListeners.add(callback);
    return () => {
      this._unreadListeners.delete(callback);
    };
  }
  
  sendMessage(message: string): void {
    if (!window.Intercom) return;
    window.Intercom('showNewMessage', message);
  }
}

/**
 * Factory function to create Intercom provider
 */
export const createIntercomProvider: ChatProviderFactory = () => new IntercomProvider();
