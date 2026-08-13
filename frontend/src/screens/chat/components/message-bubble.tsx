"use client";

import { CheckCircle } from "@phosphor-icons/react";

interface MessageBubbleProps {
  isSent: boolean;
  body: string;
  time: string;
  isRead?: boolean;
  isPending?: boolean;
  senderName?: string;
}

// Deterministic per-member accent color for group chats.
// Same name → same color on every client.
const MEMBER_COLORS = [
  "text-sky-600 dark:text-sky-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-violet-600 dark:text-violet-400",
  "text-amber-600 dark:text-amber-400",
  "text-rose-600 dark:text-rose-400",
  "text-teal-600 dark:text-teal-400",
  "text-indigo-600 dark:text-indigo-400",
  "text-orange-600 dark:text-orange-400",
];

function memberColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}

export function MessageBubble({
  isSent,
  body,
  time,
  isRead,
  isPending,
  senderName,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-md max-w-[80%] mt-1.5 ${
        isSent ? "self-end flex-col items-end gap-xs" : "items-end"
      }`}
    >
      <div
        className={`p-md rounded-xl ${
          isSent
            ? "bg-primary text-on-primary rounded-br-none border border-primary"
            : "bg-surface-container-low text-primary rounded-bl-none"
        } ${isPending ? "opacity-60" : ""}`}
      >
        {!isSent && senderName && (
          <span
            className={`block text-label-sm font-bold mb-xs ${memberColor(senderName)}`}
          >
            {senderName}
          </span>
        )}
        <p className="text-body-md leading-body-md md:whitespace-pre-wrap break-words">
          {body}
        </p>
        <span
          className={`text-[10px] mt-1 block leading-none ${
            isSent ? "text-on-primary/60 text-right" : "text-secondary"
          }`}
        >
          {time}
        </span>
      </div>

      {isSent && isRead && !isPending && (
        <div className="flex items-center gap-1 text-[10px] text-secondary mt-1 leading-none font-semibold">
          <span>Read</span>
          <CheckCircle weight="fill" className="size-3" />
        </div>
      )}
    </div>
  );
}
