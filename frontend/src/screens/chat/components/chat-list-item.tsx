"use client";

import { UsersThree } from "@phosphor-icons/react";
import type { ChatSummary } from "@/service/chat.service";

interface ChatListItemProps {
  chat: ChatSummary;
  isActive: boolean;
  onClick: () => void;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  const displayName = chat.is_group
    ? chat.name ?? "Group"
    : chat.other_user?.fullname ?? "Unknown";

  const avatarText = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const lastMsgTime = chat.last_message?.created_at ?? null;

  return (
    <div
      className={`relative p-4 flex items-center gap-sm cursor-pointer hover:bg-surface-container-low transition-all ${
        isActive ? "bg-surface-container-low" : ""
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Chat with ${displayName}`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 h-full w-0.5 bg-primary" />
      )}

      {chat.is_group ? (
        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
          <UsersThree className="size-5 text-secondary" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">
          {avatarText}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="text-body-md font-bold text-primary truncate leading-body-md">
            {displayName}
          </h3>
          <span className="text-[10px] text-secondary leading-none shrink-0 ml-sm">
            {timeAgo(lastMsgTime)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-xs">
          <p className="text-label-md text-secondary truncate leading-label-md">
            {chat.last_message?.body ?? "No messages yet"}
          </p>
          {chat.unread_count > 0 && (
            <span className="ml-sm bg-primary text-on-primary text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0 leading-none">
              {chat.unread_count > 99 ? "99+" : chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
