/**
 * Chat Service — shit-chat
 *
 * SWR hooks for chat REST API:
 *   GET  /me
 *   GET  /users?q=
 *   GET  /chats
 *   POST /chats
 *   GET  /chats/:id/messages
 *   POST /chats/:id/read
 */

import { useFetch, useMutation } from "@/lib/swr";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: number;
  fullname: string;
  email: string;
}

export interface UserBrief {
  id: number;
  fullname: string;
  email: string;
}

export interface MessageData {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface ChatSummary {
  id: number;
  name: string | null;
  is_group: boolean;
  other_user?: UserBrief;
  last_message?: MessageData;
  unread_count: number;
  last_read_at: string | null;
  created_at: string;
}

export interface MessagesResponse {
  messages: MessageData[];
  next_before_id: number | null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Current authenticated user profile. */
export function useMe() {
  return useFetch<UserProfile>("/me");
}

/** Search users by name or email prefix (min 2 chars). Pass null to skip. */
export function useSearchUsers(q: string | null) {
  return useFetch<{ users: UserBrief[] }>(q && q.length >= 2 ? `/users?q=${encodeURIComponent(q)}` : null);
}

/** List all chats for the current user. */
export function useChats() {
  return useFetch<{ chats: ChatSummary[] }>("/chats", {
    refreshInterval: 15000, // fallback polling in case WS drops
  });
}

/** Create a 1:1 chat. */
export function useCreateChat() {
  return useMutation<{ chat: { id: number } }, { user_id: number }>("/chats");
}

/** Paginated message history for a chat. Pass null to skip. */
export function useChatMessages(chatId: number | null, beforeId?: number | null) {
  const key = chatId != null
    ? `/chats/${chatId}/messages?limit=50${beforeId ? `&before_id=${beforeId}` : ""}`
    : null;
  return useFetch<MessagesResponse>(key);
}

/** Mark a chat as read (HTTP fallback). */
export function useMarkRead(chatId: number) {
  return useMutation<{ message: string }, { last_read_message_id: number }>(
    `/chats/${chatId}/read`,
  );
}
