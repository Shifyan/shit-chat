"use client";

import { Paperclip, Smiley, PaperPlaneRight } from "@phosphor-icons/react";
import { useState, useRef, useCallback } from "react";

interface MessageComposerProps {
  onSend: (body: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function MessageComposer({ onSend, onTyping, disabled }: MessageComposerProps) {
  const [value, setValue] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue("");
      onTyping?.(false);
    },
    [value, onSend, onTyping, disabled],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);

      // Throttle typing to every 2s
      const now = Date.now();
      if (now - lastTypingSent.current > 2000) {
        lastTypingSent.current = now;
        onTyping?.(e.target.value.length > 0);
      }

      // Clear typing after 3s of no typing
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        onTyping?.(false);
      }, 3000);
    },
    [onTyping],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit],
  );

  return (
    <footer className="px-lg pb-lg pt-sm bg-surface-container-lowest border-t border-outline-variant shrink-0">
      <form
        onSubmit={handleSubmit}
        className="max-w-container-max mx-auto relative flex items-center gap-md"
      >
        <button
          type="button"
          className="p-2 text-secondary hover:text-primary transition-colors cursor-pointer"
          aria-label="Attach file"
        >
          <Paperclip className="size-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-body-md focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none resize-none max-h-[120px] min-h-[44px]"
            placeholder={disabled ? "Reconnecting…" : "Type a message..."}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Message input"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-sm">
            <button
              type="button"
              className="text-secondary hover:text-primary cursor-pointer"
              aria-label="Add emoji"
            >
              <Smiley className="size-5" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="bg-primary text-on-primary w-10 h-10 rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          <PaperPlaneRight className="size-5" />
        </button>
      </form>
    </footer>
  );
}
