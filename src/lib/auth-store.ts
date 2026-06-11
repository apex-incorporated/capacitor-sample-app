/**
 * Apex Outfitters — mock auth.
 *
 * Open-source security: zero real auth backend. "Sign in" generates a
 * stable mock user identifier locally + persists to localStorage. The
 * realistic scenario this simulates: a customer signs into a merchant
 * app (Apex Outfitters) — entirely separate from the merchant's own
 * Apex dashboard auth. Apex observes the end-user via events, no
 * coupling to Apex's Cognito pool needed.
 *
 * Sign in / Sign up screens fire `user_signed_in` / `user_signed_up`
 * via the events helper so Apex sees them naturally.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "apex_outfitters.auth_v1";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** ISO timestamp; useful for the LTV display in AO-P4. */
  signedUpAt: string;
}

export interface AuthState {
  user: AuthUser | null;
}

const EMPTY: AuthState = { user: null };

let cached: AuthState | null = null;
const listeners = new Set<(state: AuthState) => void>();

function read(): AuthState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return JSON.parse(raw) as AuthState;
  } catch {
    return EMPTY;
  }
}

function write(state: AuthState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent fail
  }
}

function get(): AuthState {
  if (cached) return cached;
  cached = read();
  return cached;
}

function set(state: AuthState): void {
  cached = state;
  write(state);
  for (const fn of listeners) fn(state);
}

// ─── Public API ─────────────────────────────────────────────────────

export function getAuth(): AuthState {
  return get();
}

export function signIn(email: string, name?: string): AuthUser {
  const existing = get().user;
  // If signing in with the same email as last time, keep the existing
  // user id so cross-session events stitch correctly. Otherwise mint
  // a new one.
  const user: AuthUser =
    existing && existing.email === email
      ? existing
      : {
          id: `usr_${cryptoRandom()}`,
          email,
          name: name ?? deriveName(email),
          signedUpAt: existing?.signedUpAt ?? new Date().toISOString(),
        };
  set({ user });
  return user;
}

export function signUp(email: string, name: string): AuthUser {
  const user: AuthUser = {
    id: `usr_${cryptoRandom()}`,
    email,
    name,
    signedUpAt: new Date().toISOString(),
  };
  set({ user });
  return user;
}

export function signOut(): void {
  set(EMPTY);
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(get);
  useEffect(() => {
    const listener = (s: AuthState) => setState(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

// ─── Helpers ────────────────────────────────────────────────────────

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

function deriveName(email: string): string {
  const [local] = email.split("@");
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
