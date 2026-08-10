"use client";

/**
 * WebSocket singleton for the chat application.
 *
 * Usage:
 *   const { status, send, subscribe, connectedAt } = useChatSocket();
 *
 *   useEffect(() => {
 *     const unsub = subscribe("message", (msg) => addMessage(msg.message));
 *     return unsub;
 *   }, [subscribe]);
 *
 *   send({ type: "message", chat_id: 1, body: "hello", temp_id: "abc" });
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WsStatus = "connecting" | "open" | "reconnecting" | "closed";

export interface WsInboundMessage {
  type: "message" | "ack" | "typing" | "read" | "presence" | "pong" | "error" | "chat_created";
  [key: string]: unknown;
}

export interface WsOutboundMessage {
  type: "message" | "typing" | "read" | "join_chat" | "ping";
  chat_id?: number;
  temp_id?: string;
  body?: string;
  is_typing?: boolean;
  last_read_message_id?: number;
}

type MessageHandler = (msg: WsInboundMessage) => void;

// ---------------------------------------------------------------------------
// WS URL
// ---------------------------------------------------------------------------

function wsURL(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
  const url = new URL(api);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = url.pathname.replace(/\/?$/, "") + "/ws";
  return url.toString();
}

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30000;
let outboundQueue: string[] = [];

let status: WsStatus = "closed";
let connectedAt: number | null = null;
const handlers = new Map<string, Set<MessageHandler>>();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function setStatus(s: WsStatus) {
  if (status !== s) {
    status = s;
    updateSnapshot();
  }
}

function clearReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function drainQueue() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const q = outboundQueue;
    outboundQueue = [];
    q.forEach((msg) => {
      socket?.send(msg);
    });
  }
}

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  clearReconnect();
  setStatus("connecting");

  try {
    socket = new WebSocket(wsURL());
  } catch {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    connectedAt = Date.now();
    setStatus("open");
    reconnectDelay = 1000;
    drainQueue();
  };

  socket.onclose = () => {
    setStatus("closed");
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = () => {
    // onclose will fire after this
  };

  socket.onmessage = (event) => {
    try {
      const msg: WsInboundMessage = JSON.parse(event.data);
      const typeHandlers = handlers.get(msg.type);
      if (typeHandlers) {
        typeHandlers.forEach((fn) => fn(msg));
      }
    } catch {
      // Ignore parse errors
    }
  };
}

function scheduleReconnect() {
  clearReconnect();
  setStatus("reconnecting");
  reconnectTimer = setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    connect();
  }, reconnectDelay);
}

function disconnect() {
  clearReconnect();
  if (socket) {
    socket.onclose = null; // prevent reconnect
    socket.close();
    socket = null;
  }
  connectedAt = null;
  setStatus("closed");
  reconnectDelay = 1000;
  outboundQueue = [];
}

function send(msg: WsOutboundMessage) {
  const data = JSON.stringify(msg);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(data);
  } else {
    outboundQueue.push(data);
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      connect();
    }
  }
}

function subscribe(type: string, handler: MessageHandler): () => void {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type)!.add(handler);

  return () => {
    handlers.get(type)?.delete(handler);
    if (handlers.get(type)?.size === 0) {
      handlers.delete(type);
    }
  };
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

// Cached snapshot — must return the SAME object reference until state changes,
// otherwise useSyncExternalStore loops infinitely.
interface StoreSnapshot {
  status: WsStatus;
  connectedAt: number | null;
}

let cachedSnapshot: StoreSnapshot = { status, connectedAt };

function updateSnapshot() {
  const next: StoreSnapshot = { status, connectedAt };
  if (
    next.status !== cachedSnapshot.status ||
    next.connectedAt !== cachedSnapshot.connectedAt
  ) {
    cachedSnapshot = next;
    notifyListeners();
  }
}

function snapshot(): StoreSnapshot {
  return cachedSnapshot;
}

function subscribeToStore(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useChatSocket() {
  // Track status + connectedAt via useSyncExternalStore to trigger re-renders
  const store = useSyncExternalStore(subscribeToStore, snapshot);

  // Auto-connect on first use
  useEffect(() => {
    if (status === "closed") {
      connect();
    }
    return () => {
      // Don't disconnect on unmount — other components may still use the socket
    };
  }, []);

  const sub = useCallback(
    (type: string, handler: MessageHandler) => subscribe(type, handler),
    [],
  );

  return {
    status: store.status as WsStatus,
    send,
    subscribe: sub,
    connectedAt: store.connectedAt,
    disconnect,
    connect,
  };
}
