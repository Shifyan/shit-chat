"use client";

import { useRef, useEffect, useMemo } from "react";
import { useMe, type MessageData, type ChatSummary } from "@/service/chat.service";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: MessageData[];
  pendingMessages: Map<string, { tempId: string; body: string }>;
  chat?: ChatSummary;
}

export function MessageList({ messages, pendingMessages, chat }: MessageListProps) {
  const { data: me } = useMe();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);

  // Track if user is scrolled near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isNearBottom.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll only when near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pendingMessages]);

  // Group messages by date for day separators
  const grouped = useMemo(() => {
    const all: Array<{ type: "message"; data: MessageData } | { type: "pending"; data: { tempId: string; body: string } } | { type: "divider"; label: string }> = [];

    let lastDate = "";
    const pending = Array.from(pendingMessages.values());

    // Combine and sort real messages
    messages.forEach((m) => {
      const dateStr = new Date(m.created_at).toLocaleDateString();
      if (dateStr !== lastDate) {
        lastDate = dateStr;
        all.push({ type: "divider", label: formatDayLabel(m.created_at) });
      }
      all.push({ type: "message", data: m });
    });

    // Add pending at the end
    pending.forEach((p) => {
      all.push({ type: "pending", data: p });
    });

    return all;
  }, [messages, pendingMessages]);

  const myId = me?.id;

  return (
    <section
      ref={containerRef}
      className="flex-1 overflow-y-auto p-lg flex flex-col gap-sm"
      aria-live="polite"
    >
      {grouped.map((item, i) => {
        if (item.type === "divider") {
          return (
            <div key={`div-${i}`} className="flex justify-center my-md">
              <span className="text-[11px] font-bold bg-surface-container-low px-3 py-1 rounded-full text-secondary opacity-65 leading-none">
                {item.label}
              </span>
            </div>
          );
        }

        if (item.type === "pending") {
          return (
            <MessageBubble
              key={`pending-${item.data.tempId}`}
              isSent
              body={item.data.body}
              time="Sending…"
              isPending
            />
          );
        }

        const msg = item.data;
        const isSent = msg.sender_id === myId;
        const time = formatTime(msg.created_at);

        return (
          <MessageBubble
            key={`msg-${msg.id}`}
            isSent={isSent}
            body={msg.body}
            time={time}
            isRead={isSent && chat?.other_last_read_at != null && new Date(chat.other_last_read_at) >= new Date(msg.created_at)}
            senderName={chat?.is_group && !isSent ? msg.sender_name : undefined}
          />
        );
      })}

      {grouped.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-label-md text-secondary">No messages yet. Say hello!</p>
        </div>
      )}

      <div ref={messagesEndRef} />
    </section>
  );
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "TODAY";
  if (days === 1) return "YESTERDAY";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
}
