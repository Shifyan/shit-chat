"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/service/chat.service";
import { Sidebar } from "./components/sidebar";
import { ChatPane } from "./components/chat-pane";

export default function ChatScreen() {
  const router = useRouter();
  const { data: me, isLoading: meLoading, error: meError } = useMe();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth gate
  useEffect(() => {
    if (meError && !meLoading) {
      router.push("/login");
    }
  }, [meError, meLoading, router]);

  // Load last selected chat from localStorage
  useEffect(() => {
    if (me) {
      const saved = localStorage.getItem(`selectedChat_${me.id}`);
      if (saved) {
        setSelectedChatId(parseInt(saved, 10));
      }
    }
  }, [me]);

  const handleSelectChat = (id: number) => {
    setSelectedChatId(id);
    if (me) {
      localStorage.setItem(`selectedChat_${me.id}`, String(id));
    }
  };

  if (meLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-surface-container-low animate-pulse" />
          <div className="h-4 w-32 bg-surface-container-low rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-container-lowest selection:bg-primary selection:text-on-primary">
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:block w-72 h-full shrink-0">
        <Sidebar
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Mobile sidebar — overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 h-full animate-[slideIn_0.2s_ease-out]">
            <Sidebar
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main pane */}
      <ChatPane
        selectedChatId={selectedChatId}
        onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
      />
    </div>
  );
}
