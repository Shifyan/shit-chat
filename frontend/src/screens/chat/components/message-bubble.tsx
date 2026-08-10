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
      {!isSent && senderName && (
        <span className="text-label-sm font-bold text-secondary ml-1">
          {senderName}
        </span>
      )}

      <div
        className={`p-md rounded-xl ${
          isSent
            ? "bg-primary text-on-primary rounded-br-none border border-primary"
            : "bg-surface-container-low text-primary rounded-bl-none"
        } ${isPending ? "opacity-60" : ""}`}
      >
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
