"use client";

import { Chat, List } from "@phosphor-icons/react";

interface EmptyStateProps {
  type: "no-selection" | "no-chats";
  onToggleSidebar?: () => void;
}

export function EmptyState({ type, onToggleSidebar }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-xl text-center relative">
      {onToggleSidebar && (
        <button
          className="absolute top-4 left-4 p-2 hover:bg-surface-container-low rounded-full cursor-pointer"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <List className="size-5 text-secondary" />
        </button>
      )}
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-default ">
        <Chat weight="fill" className="text-on-primary size-6" />
      </div>
      <h1 className="text-[24px] font-bold text-primary tracking-tight my-2">
        SHIT CHAT
      </h1>

      {type === "no-selection" ? (
        <div className="flex flex-col">
          <h2 className="text-headline-lg font-semibold text-primary mb-sm leading-headline-lg">
            No conversation selected
          </h2>
          <p className="text-body-md text-secondary  leading-body-md">
            Choose a conversation from the sidebar or start a new one to begin
            chatting.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <h2 className="text-headline-lg font-semibold text-primary mb-sm leading-headline-lg">
            No conversations yet
          </h2>
          <p className="text-body-md text-secondary  leading-body-md">
            Click &ldquo;Add Chat&rdquo; to start a conversation with someone.
          </p>
        </div>
      )}
    </div>
  );
}
