"use client";

import {
  MagnifyingGlass,
  DotsThreeVertical,
  List,
} from "@phosphor-icons/react";
import { useChatSocket } from "@/lib/ws";
import {
  useChats,
  useChatMessages,
  type ChatSummary,
} from "@/service/chat.service";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";
import { EmptyState } from "./empty-state";
import { ConnectionBanner } from "./connection-banner";
import type { MessageData } from "@/service/chat.service";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatPaneProps {
  selectedChatId: number | null;
  onToggleSidebar?: () => void;
}

export function ChatPane({ selectedChatId, onToggleSidebar }: ChatPaneProps) {
  const { data: chatsData } = useChats();
  const { data: historyData } = useChatMessages(selectedChatId);
  const { status, subscribe, send } = useChatSocket();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [pendingMessages, setPendingMessages] = useState<
    Map<string, { tempId: string; body: string }>
  >(new Map());
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadIdRef = useRef<number | null>(null);

  const chat: ChatSummary | undefined = chatsData?.chats?.find(
    (c) => c.id === selectedChatId,
  );
  const displayName = chat?.is_group
    ? (chat?.name ?? "Group")
    : (chat?.other_user?.fullname ?? "Unknown");

  // Keep the peer's name in a ref so the typing handler (registered once per
  // chat) always sees the freshest value.
  const peerNameRef = useRef(displayName);
  peerNameRef.current = displayName;

  // Reset local state when switching chats
  useEffect(() => {
    setMessages([]);
    setPendingMessages(new Map());
    setTypingUser(null);
  }, [selectedChatId]);

  // Tell the server we're now viewing this chat (needed for chats created
  // after the WS connection was established)
  useEffect(() => {
    if (selectedChatId == null) return;
    send({ type: "join_chat", chat_id: selectedChatId });
  }, [selectedChatId, send]);

  // Mark the chat read when opened — clears the unread badge.
  // Guarded by ref so revalidations don't resend.
  useEffect(() => {
    if (selectedChatId == null || !historyData?.messages?.length) return;
    const lastMsg = historyData.messages[historyData.messages.length - 1];
    if (lastReadIdRef.current !== lastMsg.id) {
      lastReadIdRef.current = lastMsg.id;
      send({
        type: "read",
        chat_id: selectedChatId,
        last_read_message_id: lastMsg.id,
      });
    }
  }, [selectedChatId, historyData, send]);

  // Merge history from the REST API with any WS messages that arrived before
  // the history finished loading (dedupe by id).
  useEffect(() => {
    if (!historyData?.messages?.length) return;
    setMessages((prev) => {
      const merged = [...historyData.messages];
      for (const p of prev) {
        if (!merged.some((m) => m.id === p.id)) merged.push(p);
      }
      return merged.sort((a, b) => a.id - b.id);
    });
  }, [historyData]);

  // Subscribe to WS events
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribe("message", (msg) => {
        const m = (msg as { message?: MessageData }).message;
        if (m && m.chat_id === selectedChatId) {
          setMessages((prev) => {
            // Dedupe by id
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
          // Mark read
          send({
            type: "read",
            chat_id: m.chat_id,
            last_read_message_id: m.id,
          });
        }
      }),
    );

    unsubs.push(
      subscribe("ack", (msg) => {
        const ack = msg as { temp_id?: string; message?: MessageData };
        if (ack.temp_id && ack.message) {
          setPendingMessages((prev) => {
            const next = new Map(prev);
            next.delete(ack.temp_id!);
            return next;
          });
          setMessages((prev) => {
            if (prev.some((p) => p.id === ack.message!.id)) return prev;
            return [...prev, ack.message!];
          });
        }
      }),
    );

    unsubs.push(
      subscribe("typing", (msg) => {
        const t = msg as {
          chat_id?: number;
          user_id?: number;
          is_typing?: boolean;
        };
        if (t.chat_id === selectedChatId && t.user_id !== undefined) {
          if (t.is_typing) {
            setTypingUser(peerNameRef.current ?? "Someone");
            // Auto-clear after 3s
            setTimeout(() => setTypingUser(null), 3000);
          } else {
            setTypingUser(null);
          }
        }
      }),
    );

    unsubs.push(
      subscribe("read", (_msg) => {
        // Read receipt handled by polling/last_read_at, just rerender
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [subscribe, send, selectedChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessages]);

  const handleSend = useCallback(
    (body: string) => {
      if (!selectedChatId) return;
      const tempId = crypto.randomUUID();
      setPendingMessages((prev) => {
        const next = new Map(prev);
        next.set(tempId, { tempId, body });
        return next;
      });
      send({ type: "message", chat_id: selectedChatId, body, temp_id: tempId });
    },
    [selectedChatId, send],
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!selectedChatId) return;
      send({ type: "typing", chat_id: selectedChatId, is_typing: isTyping });
    },
    [selectedChatId, send],
  );

  if (!selectedChatId) {
    return <EmptyState type="no-selection" onToggleSidebar={onToggleSidebar} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest relative">
      {/* Connection banner */}
      <ConnectionBanner status={status} />

      {/* Header */}
      <header className="flex justify-between items-center w-full px-lg h-16 border-b border-outline-variant bg-surface-container-lowest shrink-0">
        <div className="flex items-center gap-md">
          {onToggleSidebar && (
            <button
              className="p-2 hover:bg-surface-container-low rounded-full cursor-pointer"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <List className="size-5 text-secondary" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">
            {displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <h1 className="text-body-lg font-bold text-primary leading-tight">
              {displayName}
            </h1>
            {typingUser ? (
              <p className="text-label-sm text-secondary italic leading-label-sm">
                {typingUser} is typing…
              </p>
            ) : (
              <div></div>
            )}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-lg">
          <a className="text-primary font-bold border-b-2 border-primary pb-2 text-label-md leading-label-md cursor-pointer">
            Recent
          </a>
          <a className="text-secondary pb-2 text-label-md hover:text-primary transition-all leading-label-md cursor-pointer">
            Pinned
          </a>
          <a className="text-secondary pb-2 text-label-md hover:text-primary transition-all leading-label-md cursor-pointer">
            Archived
          </a>
        </nav>

        <div className="flex items-center gap-md">
          <button
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
            aria-label="Search"
          >
            <MagnifyingGlass className="size-5 text-secondary" />
          </button>
          <button
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
            aria-label="More options"
          >
            <DotsThreeVertical className="size-5 text-secondary" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <MessageList
        messages={messages}
        pendingMessages={pendingMessages}
        chat={chat}
      />

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={status !== "open"}
      />
    </div>
  );
}
