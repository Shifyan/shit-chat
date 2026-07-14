/**
 * Auth Service — shit-chat
 *
 * Mirrors the Go backend contract:
 *   POST /auth/register  body: { fullname, email, password }  → { message }
 *   POST /auth/login     body: { email, password }            → { message }
 *
 * Token is set as an HttpOnly cookie by the server — no manual storage needed.
 */

import { useMutation } from "@/lib/swr";

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Hooks — drop into any component that needs auth
// ---------------------------------------------------------------------------

/**
 * useLogin — triggers POST /login
 *
 * @example
 * const { trigger, isMutating, error } = useLogin();
 * await trigger({ method: "POST", body: { email, password } });
 */
export function useLogin(
  options?: Parameters<typeof useMutation<AuthResponse, LoginRequest>>[1],
) {
  return useMutation<AuthResponse, LoginRequest>("/login", options);
}

/**
 * useRegister — triggers POST /register
 *
 * @example
 * const { trigger, isMutating, error } = useRegister();
 * await trigger({ method: "POST", body: { fullname, email, password } });
 */
export function useRegister(
  options?: Parameters<typeof useMutation<AuthResponse, RegisterRequest>>[1],
) {
  return useMutation<AuthResponse, RegisterRequest>("/register", options);
}

/**
 * useLogout — triggers POST /logout
 *
 * @example
 * const { trigger, isMutating, error } = useLogout();
 * await trigger({ method: "POST" });
 */
export function useLogout(
  options?: Parameters<typeof useMutation<AuthResponse>>[1],
) {
  return useMutation<AuthResponse>("/logout", options);
}
