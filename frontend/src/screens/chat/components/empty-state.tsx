"use client";

import { Chat } from "@phosphor-icons/react";

interface EmptyStateProps {
  type: "no-selection" | "no-chats";
}

export function EmptyState({ type }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-xl text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-md">
        <Chat className="size-8 text-secondary" />
      </div>
      {type === "no-selection" ? (
        <>
          <h2 className="text-headline-lg font-semibold text-primary mb-sm leading-headline-lg">
            No conversation selected
          </h2>
          <p className="text-body-md text-secondary max-w-xs leading-body-md">
            Choose a conversation from the sidebar or start a new one to begin chatting.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-headline-lg font-semibold text-primary mb-sm leading-headline-lg">
            No conversations yet
          </h2>
          <p className="text-body-md text-secondary max-w-xs leading-body-md">
            Click &ldquo;Add Chat&rdquo; to start a conversation with someone.
          </p>
        </>
      )}
    </div>
  );
}
