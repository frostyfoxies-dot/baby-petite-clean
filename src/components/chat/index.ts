/**
 * Chat Components
 * Export all chat-related components and utilities
 */

// Components
export { ChatProvider, useChat, withChat } from './chat-provider';
export { LiveChat, LazyLiveChat } from './live-chat';

// Types
export type { ChatConfig, ChatUser, ChatProviderType } from '@/lib/chat/config';
export type { ChatProvider as ChatProviderInterface } from '@/lib/chat/providers/index';
