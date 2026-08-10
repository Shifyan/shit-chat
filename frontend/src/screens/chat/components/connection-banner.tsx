"use client";

import type { WsStatus } from "@/lib/ws";

interface ConnectionBannerProps {
  status: WsStatus;
}

export function ConnectionBanner({ status }: ConnectionBannerProps) {
  if (status === "open" || status === "closed") return null;

  const isReconnecting = status === "reconnecting" || status === "connecting";

  return (
    <div
      className={`w-full py-2 px-lg text-center text-label-sm font-semibold ${
        isReconnecting
          ? "bg-surface-container-high text-secondary animate-pulse"
          : "bg-error-container text-on-error-container"
      }`}
    >
      {isReconnecting
        ? "Reconnecting…"
        : "Connection lost"}
    </div>
  );
}
