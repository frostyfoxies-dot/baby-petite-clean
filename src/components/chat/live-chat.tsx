'use client';

/**
 * Live Chat Widget Component
 * Floating chat button with status indicator and pre-chat form
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useChat } from './chat-provider';
import type { ChatUser } from '@/lib/chat/config';

/**
 * Chat icon component
 */
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

/**
 * Close icon component
 */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Pre-chat form data
 */
interface PreChatFormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Pre-chat form component
 */
function PreChatForm({
  onSubmit,
  onCancel,
  fields,
}: {
  onSubmit: (data: PreChatFormData) => void;
  onCancel: () => void;
  fields: { name: boolean; email: boolean; message: boolean };
}) {
  const [formData, setFormData] = useState<PreChatFormData>({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<PreChatFormData>>({});
  
  const validate = (): boolean => {
    const newErrors: Partial<PreChatFormData> = {};
    
    if (fields.name && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (fields.email) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }
    
    if (fields.message && !formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Start a conversation</h3>
      
      {fields.name && (
        <div>
          <label htmlFor="chat-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="chat-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-rose-500'
            )}
            placeholder="Your name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'chat-name-error' : undefined}
          />
          {errors.name && (
            <p id="chat-name-error" className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>
      )}
      
      {fields.email && (
        <div>
          <label htmlFor="chat-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="chat-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-rose-500'
            )}
            placeholder="your@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'chat-email-error' : undefined}
          />
          {errors.email && (
            <p id="chat-email-error" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>
      )}
      
      {fields.message && (
        <div>
          <label htmlFor="chat-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="chat-message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={3}
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-rose-500'
            )}
            placeholder="How can we help you?"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'chat-message-error' : undefined}
          />
          {errors.message && (
            <p id="chat-message-error" className="mt-1 text-sm text-red-600">
              {errors.message}
            </p>
          )}
        </div>
      )}
      
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          Start Chat
        </button>
      </div>
    </form>
  );
}

/**
 * Offline message component
 */
function OfflineMessage({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <ChatIcon className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Baby Petite Support</h3>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Close
      </button>
    </div>
  );
}

/**
 * Props for LiveChat component
 */
interface LiveChatProps {
  /** Custom class name for the button */
  className?: string;
  
  /** Override position */
  position?: 'bottom-right' | 'bottom-left';
  
  /** Show pre-chat form before opening chat */
  showPreChatForm?: boolean;
  
  /** Custom welcome message */
  welcomeMessage?: string;
  
  /** Custom offline message */
  offlineMessage?: string;
}

/**
 * Live Chat Widget Component
 */
export function LiveChat({
  className,
  position,
  showPreChatForm = true,
  welcomeMessage,
  offlineMessage,
}: LiveChatProps) {
  const {
    isReady,
    isOpen,
    isOnline,
    unreadCount,
    config,
    open,
    close,
    toggle,
    setUser,
    sendMessage,
  } = useChat();
  
  const [showForm, setShowForm] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) {
          setShowForm(false);
        } else if (showOffline) {
          setShowOffline(false);
        } else if (isOpen) {
          close();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showForm, showOffline, isOpen, close]);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        if (showForm) {
          setShowForm(false);
        } else if (showOffline) {
          setShowOffline(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm, showOffline]);
  
  // Handle button click
  const handleButtonClick = useCallback(() => {
    if (!isOnline && !config.developmentMode) {
      setShowOffline(true);
      return;
    }
    
    if (showPreChatForm && !config.user?.email && !isOpen) {
      setShowForm(true);
    } else if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOnline, config, showPreChatForm, isOpen, open, close]);
  
  // Handle form submit
  const handleFormSubmit = useCallback((data: PreChatFormData) => {
    // Set user info
    setUser({
      name: data.name,
      email: data.email,
    });
    
    // Send initial message
    if (data.message) {
      sendMessage(data.message);
    } else {
      open();
    }
    
    setShowForm(false);
  }, [setUser, sendMessage, open]);
  
  // Don't render if chat is disabled
  if (!config.enabled) {
    return null;
  }
  
  // Don't render until mounted (prevents hydration issues)
  if (!mounted) {
    return null;
  }
  
  const widgetPosition = position || config.appearance.position;
  const isLeft = widgetPosition === 'bottom-left';
  
  // Button styles
  const buttonStyles = cn(
    'fixed flex items-center justify-center',
    'w-14 h-14 rounded-full shadow-lg',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'hover:scale-105 active:scale-95',
    isLeft ? 'left-5' : 'right-5',
    isOpen || showForm || showOffline ? 'bottom-[100px]' : 'bottom-20 md:bottom-5',
    className
  );
  
  // Panel styles
  const panelStyles = cn(
    'fixed bottom-20 md:bottom-5',
    'w-80 max-w-[calc(100vw-40px)]',
    'bg-white rounded-2xl shadow-2xl',
    'border border-gray-200',
    'overflow-hidden',
    'animate-in fade-in slide-in-from-bottom-4 duration-200',
    isLeft ? 'left-5' : 'right-5',
    'z-[60]'
  );
  
  const chatButton = (
    <button
      ref={buttonRef}
      onClick={handleButtonClick}
      className={buttonStyles}
      style={{
        backgroundColor: config.appearance.primaryColor,
        color: config.appearance.textColor,
        zIndex: config.appearance.zIndex,
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen || showForm || showOffline}
      aria-haspopup="dialog"
    >
      {isOpen ? (
        <CloseIcon className="w-6 h-6" />
      ) : (
        <div className="relative">
          <ChatIcon className="w-6 h-6" />
          {/* Online indicator */}
          {isOnline && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
              aria-label="Online"
            />
          )}
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
  
  // Panel content
  const panelContent = (showForm || showOffline) && (
    <div
      ref={panelRef}
      className={panelStyles}
      role="dialog"
      aria-modal="true"
      aria-label="Chat form"
    >
      {showForm && (
        <PreChatForm
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
          fields={config.preChatForm.fields}
        />
      )}
      {showOffline && (
        <OfflineMessage
          message={offlineMessage || config.offlineMessage}
          onDismiss={() => setShowOffline(false)}
        />
      )}
    </div>
  );
  
  return (
    <>
      {chatButton}
      {panelContent && createPortal(panelContent, document.body)}
    </>
  );
}

/**
 * Lazy-loaded live chat component
 * Use this for better initial page load performance
 */
export function LazyLiveChat(props: LiveChatProps) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Delay showing chat widget for better initial load
    const timer = setTimeout(() => {
      setShow(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!show) {
    return null;
  }
  
  return <LiveChat {...props} />;
}

export default LiveChat;
