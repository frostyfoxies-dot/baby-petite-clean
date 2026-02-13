/**
 * Crisp Chat Provider Implementation
 * https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/integration/
 */

import type { ChatProvider, ChatProviderFactory } from './index';
import type { ChatConfig, ChatUser, ChatProviderType } from '../config';

// Crisp window interface
declare global {
  interface Window {
    $crisp: CrispFunction[];
    CRISP_WEBSITE_ID?: string;
    CRISP_READY_TRIGGER?: () => void;
  }
}

type CrispFunction = 
  | ['do' | 'set' | 'get' | 'on' | 'off', string, ...unknown[]]
  | [string, ...unknown[]];

interface CrispSessionData {
  nickname?: string;
  email?: string;
  avatar?: string;
  user_id?: string;
  [key: string]: unknown;
}

/**
 * Crisp provider implementation
 */
class CrispProvider implements ChatProvider {
  readonly name: ChatProviderType = 'crisp';
  readonly displayName = 'Crisp';
  
  private _config: ChatConfig | null = null;
  private _isReady = false;
  private _isOpen = false;
  private _unreadCount = 0;
  private _unreadListeners: Set<(count: number) => void> = new Set();
  private _scriptLoaded = false;
  
  async init(config: ChatConfig): Promise<void> {
    if (!config.crispWebsiteId) {
      console.error('[Crisp] Missing website_id in configuration');
      return;
    }
    
    this._config = config;
    
    // Load Crisp script
    await this.loadScript(config.crispWebsiteId);
    
    // Configure Crisp
    this.configure(config);
    
    // Set up event listeners
    this.setupEventListeners();
    
    this._isReady = true;
  }
  
  private async loadScript(websiteId: string): Promise<void> {
    if (this._scriptLoaded || typeof window === 'undefined') {
      return;
    }
    
    return new Promise((resolve, reject) => {
      // Initialize Crisp queue
      window.$crisp = window.$crisp || [];
      window.CRISP_WEBSITE_ID = websiteId;
      
      // Load script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://client.crisp.chat/l.js';
      script.id = 'crisp-script';
      
      script.onload = () => {
        this._scriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('[Crisp] Failed to load script'));
      };
      
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    });
  }
  
  private configure(config: ChatConfig): void {
    if (!window.$crisp) return;
    
    // Hide default launcher (we use our own)
    window.$crisp.push(['do', 'chat:hide']);
    
    // Set position
    if (config.appearance.position === 'bottom-left') {
      window.$crisp.push(['set', 'position:reverse', [true]]);
    }
    
    // Set locale if needed
    // window.$crisp.push(['set', 'locale', 'en']);
    
    // Set user info if available
    if (config.user) {
      this.setUser(config.user);
    }
  }
  
  private setupEventListeners(): void {
    if (!window.$crisp) return;
    
    // Listen for chat open/close
    window.$crisp.push(['on', 'chat:opened', () => {
      this._isOpen = true;
    }]);
    
    window.$crisp.push(['on', 'chat:closed', () => {
      this._isOpen = false;
    }]);
    
    // Listen for unread messages
    window.$crisp.push(['on', 'message:received', () => {
      this._unreadCount++;
      this._unreadListeners.forEach(cb => cb(this._unreadCount));
    }]);
    
    // Reset unread count when chat is opened
    window.$crisp.push(['on', 'chat:opened', () => {
      this._unreadCount = 0;
      this._unreadListeners.forEach(cb => cb(0));
    }]);
  }
  
  open(): void {
    if (!window.$crisp) return;
    window.$crisp.push(['do', 'chat:open']);
    window.$crisp.push(['do', 'chat:show']);
  }
  
  close(): void {
    if (!window.$crisp) return;
    window.$crisp.push(['do', 'chat:close']);
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
    if (!window.$crisp) return;
    
    if (user.email) {
      window.$crisp.push(['set', 'user:email', [user.email]]);
    }
    
    if (user.name) {
      window.$crisp.push(['set', 'user:nickname', [user.name]]);
    }
    
    if (user.avatar) {
      window.$crisp.push(['set', 'user:avatar', [user.avatar]]);
    }
    
    if (user.id) {
      window.$crisp.push(['set', 'session:data', [[['user_id', user.id]]]]);
    }
    
    // Set additional user attributes
    const additionalAttrs = Object.entries(user)
      .filter(([key]) => !['id', 'email', 'name', 'avatar', 'createdAt'].includes(key));
    
    if (additionalAttrs.length > 0) {
      window.$crisp.push([
        'set', 
        'session:data', 
        [additionalAttrs.map(([key, value]) => [key, String(value)])]
      ]);
    }
  }
  
  clearUser(): void {
    if (!window.$crisp) return;
    
    // Reset session
    window.$crisp.push(['do', 'session:reset']);
  }
  
  trackEvent(name: string, data?: Record<string, unknown>): void {
    if (!window.$crisp) return;
    
    // Crisp uses events tracking
    window.$crisp.push(['set', 'session:event', [[
      [name, data || {}, new Date().toISOString()]
    ]]]);
  }
  
  show(): void {
    if (!window.$crisp) return;
    window.$crisp.push(['do', 'chat:show']);
  }
  
  hide(): void {
    if (!window.$crisp) return;
    window.$crisp.push(['do', 'chat:hide']);
  }
  
  isReady(): boolean {
    return this._isReady;
  }
  
  destroy(): void {
    if (!window.$crisp) return;
    
    window.$crisp.push(['do', 'chat:hide']);
    window.$crisp.push(['do', 'session:reset']);
    
    this._isReady = false;
    this._isOpen = false;
    this._unreadCount = 0;
    this._unreadListeners.clear();
    
    // Remove script
    const script = document.getElementById('crisp-script');
    script?.remove();
    
    // Remove Crisp elements
    const crispElements = document.querySelectorAll('[class*="crisp"]');
    crispElements.forEach(el => el.remove());
    
    // Clean up global
    delete window.$crisp;
    delete window.CRISP_WEBSITE_ID;
    
    this._scriptLoaded = false;
  }
  
  setAttributes(attributes: Record<string, string | number | boolean>): void {
    if (!window.$crisp) return;
    
    const data = Object.entries(attributes).map(([key, value]) => [key, String(value)]);
    window.$crisp.push(['set', 'session:data', [data]]);
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
    if (!window.$crisp) return;
    
    // Open chat and send message
    window.$crisp.push(['do', 'chat:open']);
    window.$crisp.push(['do', 'message:send', ['text', message]]);
  }
}

/**
 * Factory function to create Crisp provider
 */
export const createCrispProvider: ChatProviderFactory = () => new CrispProvider();
