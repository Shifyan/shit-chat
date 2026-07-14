"use client";
/**
 * SWR utilities for shit-chat
 * - fetcher: authenticated GET via cookie (token)
 * - mutationFetcher: POST/PUT/PATCH/DELETE with JSON body
 * - useFetch: typed SWR wrapper for GET requests
 * - useMutation: typed wrapper for write operations
 * - swrConfig: global SWR provider config (use in layout.tsx)
 */

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";

// ---------------------------------------------------------------------------
// Base URL — reads from env, falls back to localhost
// ---------------------------------------------------------------------------
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// ---------------------------------------------------------------------------
// Error type — carries HTTP status for conditional handling
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Core fetcher — attaches credentials (cookie) automatically
// ---------------------------------------------------------------------------
export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include", // sends token cookie
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      body?.message ?? body?.error ?? res.statusText ?? "Request failed";
    throw new ApiError(msg, res.status);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Mutation fetcher factory — used by useSWRMutation
// arg = { method, body }
// ---------------------------------------------------------------------------
type MutationArg<B = unknown> = {
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: B;
};

export async function mutationFetcher<T, B = unknown>(
  path: string,
  { arg }: { arg: MutationArg<B> },
): Promise<T> {
  const { method = "POST", body } = arg;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    // Backend may use `error` or `message` field
    const msg =
      errBody?.message ?? errBody?.error ?? res.statusText ?? "Request failed";
    throw new ApiError(msg, res.status);
  }

  // 204 No Content — return null
  if (res.status === 204) return null as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// useFetch — typed GET hook
//
// Usage:
//   const { data, error, isLoading } = useFetch<User[]>("/users");
//   const { data } = useFetch<Message[]>(`/chats/${id}/messages`, { refreshInterval: 3000 });
//   Pass null as key to skip fetching (conditional fetch).
// ---------------------------------------------------------------------------
export function useFetch<T>(
  path: string | null,
  options?: SWRConfiguration<T, ApiError>,
): SWRResponse<T, ApiError> {
  return useSWR<T, ApiError>(path, fetcher, {
    revalidateOnFocus: false,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// useMutation — typed write hook
//
// Usage:
//   const { trigger, isMutating } = useMutation<LoginResponse, LoginBody>("/auth/login");
//   await trigger({ method: "POST", body: { email, password } });
//
//   const { trigger } = useMutation<void>(`/messages/${id}`);
//   await trigger({ method: "DELETE" });
// ---------------------------------------------------------------------------
export function useMutation<T, B = unknown>(
  path: string,
  options?: SWRMutationConfiguration<T, ApiError, string, MutationArg<B>>,
) {
  return useSWRMutation<T, ApiError, string, MutationArg<B>>(
    path,
    mutationFetcher<T, B>,
    options,
  );
}

// ---------------------------------------------------------------------------
// swrConfig — global SWR Provider config
//
// Usage in app/layout.tsx (or any client root):
//   import { SWRConfig } from "swr";
//   import { swrConfig } from "@/lib/swr";
//   <SWRConfig value={swrConfig}>{children}</SWRConfig>
// ---------------------------------------------------------------------------
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  // ⚠️  Do NOT add onError 401 redirect here.
  // SWRConfig.onError fires for useSWRMutation too.
  // A 401 from login/register would trigger a redirect and swallow the error
  // before the component catch block can display a message.
  // Handle 401 redirect per useFetch call via the onError option:
  //   useFetch("/protected", { onError: (e) => e.status === 401 && router.push("/login") })
};
