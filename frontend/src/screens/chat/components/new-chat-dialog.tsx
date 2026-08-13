"use client";

import { useState, useEffect, useRef } from "react";
import { X, MagnifyingGlass, Check } from "@phosphor-icons/react";
import { useSearchUsers, useCreateChat } from "@/service/chat.service";
import { toast } from "sonner";

interface NewChatDialogProps {
  onClose: () => void;
  onChatCreated: (chatId: number) => void;
}

export function NewChatDialog({ onClose, onChatCreated }: NewChatDialogProps) {
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const { data: usersData, isLoading } = useSearchUsers(debouncedQuery);
  const { trigger: createChat, isMutating } = useCreateChat();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleCreateDirect = async (userId: number) => {
    try {
      const res = await createChat({ method: "POST", body: { user_id: userId } });
      onChatCreated(res.chat.id);
    } catch {
      toast.error("Failed to create chat");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    try {
      const res = await createChat({
        method: "POST",
        body: { name: groupName.trim(), member_ids: selected },
      });
      onChatCreated(res.chat.id);
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Failed to create group");
    }
  };

  const toggleMember = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const users = usersData?.users ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-default shadow-xl w-full max-w-[400px] mx-md p-lg space-y-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-lg font-semibold text-primary leading-headline-lg">
            New Chat
          </h2>
          <button
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5 text-secondary" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-surface-container-low rounded-default p-1 text-label-md font-medium">
          {(["direct", "group"] as const).map((m) => (
            <button
              key={m}
              className={`flex-1 py-1.5 rounded-sm transition-colors cursor-pointer ${
                mode === m
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-secondary"
              }`}
              onClick={() => setMode(m)}
            >
              {m === "direct" ? "Direct" : "Group"}
            </button>
          ))}
        </div>

        {/* Group name */}
        {mode === "group" && (
          <input
            className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-default text-body-md focus:outline-none focus:border-primary transition-colors"
            placeholder="Group name…"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            aria-label="Group name"
          />
        )}

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-secondary" />
          <input
            ref={inputRef}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-default text-body-md focus:outline-none focus:border-primary transition-colors"
            placeholder="Search users by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users"
          />
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto space-y-sm">
          {isLoading && (
            <p className="text-label-md text-secondary text-center py-md">
              Searching…
            </p>
          )}

          {!isLoading && query.length < 2 && (
            <p className="text-label-md text-secondary text-center py-md">
              Type at least 2 characters to search
            </p>
          )}

          {!isLoading && query.length >= 2 && users.length === 0 && (
            <p className="text-label-md text-secondary text-center py-md">
              No users found
            </p>
          )}

          {users.map((user) => {
            const isSelected = selected.includes(user.id);
            return (
              <button
                key={user.id}
                className="w-full flex items-center gap-md p-sm hover:bg-surface-container-low rounded-default transition-colors cursor-pointer disabled:opacity-50"
                onClick={() =>
                  mode === "group" ? toggleMember(user.id) : handleCreateDirect(user.id)
                }
                disabled={isMutating}
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shrink-0">
                  {user.fullname
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-body-md font-bold text-primary truncate leading-body-md">
                    {user.fullname}
                  </p>
                  <p className="text-label-md text-secondary truncate leading-label-md">
                    {user.email}
                  </p>
                </div>
                {mode === "group" && (
                  <div
                    className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-on-primary"
                        : "border-outline text-transparent"
                    }`}
                  >
                    <Check className="size-3" weight="bold" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Group create button */}
        {mode === "group" && (
          <button
            className="w-full py-2 bg-primary text-on-primary font-label-md font-medium rounded-default flex items-center justify-center gap-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreateGroup}
            disabled={isMutating || !groupName.trim() || selected.length === 0}
          >
            {isMutating
              ? "Creating…"
              : `Create group (${selected.length} member${selected.length === 1 ? "" : "s"})`}
          </button>
        )}
      </div>
    </div>
  );
}
