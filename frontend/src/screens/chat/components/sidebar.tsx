"use client";

import {
  Chat,
  AddressBook,
  Gear,
  Question,
  PlusCircle,
  SignOut,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMe, useChats, type ChatSummary } from "@/service/chat.service";
import { useChatSocket } from "@/lib/ws";
import { useLogout } from "@/service/auth.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSWRConfig } from "swr";
import { ChatListItem } from "./chat-list-item";
import { useEffect, useState } from "react";
import { NewChatDialog } from "./new-chat-dialog";

interface SidebarProps {
  selectedChatId: number | null;
  onSelectChat: (id: number) => void;
  onMobileClose?: () => void;
}

export function Sidebar({ selectedChatId, onSelectChat, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: chatsData, isLoading, error, mutate } = useChats();
  const { trigger: logout } = useLogout();
  const { status: wsStatus, disconnect } = useChatSocket();
  const { mutate: globalMutate } = useSWRConfig();
  const [showNewChat, setShowNewChat] = useState(false);

  // Listen for WS events that should refresh the chat list.
  // Registered in useEffect so handlers are cleaned up between renders.
  const { subscribe } = useChatSocket();
  useEffect(() => {
    const unsubMessage = subscribe("message", () => mutate());
    const unsubRead = subscribe("read", () => mutate());
    const unsubChatCreated = subscribe("chat_created", () => mutate());
    return () => {
      unsubMessage();
      unsubRead();
      unsubChatCreated();
    };
  }, [subscribe, mutate]);

  const handleLogout = async () => {
    try {
      await logout({ method: "POST" });
    } catch {
      // Even if the request fails, clear local state
    }
    // Disconnect WebSocket and clear SWR cache
    disconnect();
    globalMutate(() => true, undefined, { revalidate: false });
    router.push("/login");
  };

  const handleChatSelect = (id: number) => {
    onSelectChat(id);
    onMobileClose?.();
  };

  const initials = me
    ? me.fullname
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const chats: ChatSummary[] = chatsData?.chats ?? [];

  return (
    <aside className="flex flex-col h-full bg-surface-container-lowest border-r border-outline-variant">
      {/* Header */}
      <div className="p-lg">
        <div className="flex items-center justify-between mb-sm">
          <div className="text-headline-lg font-bold text-primary leading-headline-lg">
            Messages
          </div>
          <ThemeToggle />
        </div>
        <div className="text-label-md font-medium text-secondary leading-label-md">
          {wsStatus === "open" ? "Connected" : wsStatus === "connecting" || wsStatus === "reconnecting" ? "Connecting…" : "Offline"}
        </div>
        <button
          className="mt-lg w-full py-2 bg-primary text-on-primary font-label-md font-medium rounded-default flex items-center justify-center gap-sm hover:opacity-90 transition-opacity cursor-pointer"
          onClick={() => setShowNewChat(true)}
        >
          <PlusCircle className="size-5" />
          Add Chat
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-xs space-y-md">
        <div className="space-y-sm">
          <a className="text-primary font-bold border-l-2 border-primary pl-4 py-2 flex items-center gap-sm bg-surface-container-low transition-colors duration-200 cursor-pointer">
            <Chat className="size-5" />
            <span className="text-label-md font-medium leading-label-md">Chats</span>
          </a>
          <a className="text-secondary pl-4 py-2 flex items-center gap-sm hover:bg-surface-container-low transition-colors duration-200 cursor-pointer">
            <AddressBook className="size-5" />
            <span className="text-label-md font-medium leading-label-md">Contacts</span>
          </a>
          <Link
            href="/settings"
            className="text-secondary pl-4 py-2 flex items-center gap-sm hover:bg-surface-container-low transition-colors duration-200 cursor-pointer"
          >
            <Gear className="size-5" />
            <span className="text-label-md font-medium leading-label-md">Settings</span>
          </Link>
        </div>

        {/* Chat list */}
        <div className="space-y-sm">
          <div className="px-md">
            <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
              Recent Conversations
            </span>
          </div>

          {isLoading && (
            <div className="space-y-sm p-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-sm p-sm animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low" />
                  <div className="flex-1 space-y-xs">
                    <div className="h-3 bg-surface-container-low rounded w-2/3" />
                    <div className="h-2 bg-surface-container-low rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-md text-center">
              <p className="text-label-md text-error mb-sm">Failed to load chats</p>
              <button
                className="text-label-md font-bold text-primary underline cursor-pointer"
                onClick={() => mutate()}
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && chats.length === 0 && (
            <div className="p-md text-center">
              <p className="text-label-md text-secondary">No conversations yet</p>
              <button
                className="mt-sm text-label-md font-bold text-primary cursor-pointer"
                onClick={() => setShowNewChat(true)}
              >
                Start a new chat
              </button>
            </div>
          )}

          {!isLoading && chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === selectedChatId}
              onClick={() => handleChatSelect(chat.id)}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-md border-t border-outline-variant space-y-sm">
        <a className="text-secondary pl-4 py-2 flex items-center gap-sm hover:bg-surface-container-low transition-colors duration-200 cursor-pointer">
          <Question className="size-5" />
          <span className="text-label-md font-medium leading-label-md">Help</span>
        </a>
        <div className="flex items-center justify-between pl-4">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">
              {initials}
            </div>
            <span className="text-label-md font-bold leading-label-md text-primary truncate max-w-[120px]">
              {me?.fullname ?? "Loading…"}
            </span>
          </div>
          <button
            className="p-2 hover:bg-surface-container-low rounded-default transition-colors cursor-pointer text-secondary hover:text-error"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <SignOut className="size-4" />
          </button>
        </div>
      </div>

      {showNewChat && (
        <NewChatDialog
          onClose={() => setShowNewChat(false)}
          onChatCreated={(chatId) => {
            setShowNewChat(false);
            handleChatSelect(chatId);
          }}
        />
      )}
    </aside>
  );
}
