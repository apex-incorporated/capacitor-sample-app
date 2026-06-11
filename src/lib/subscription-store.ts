/**
 * Apex Outfitters Plus — subscription tier state.
 *
 * Demonstrates Apex's `subscription_event` lifecycle:
 *   - trial_started → 7-day free trial
 *   - trial_converted → first paid month
 *   - started → direct paid signup (no trial)
 *   - renewed → simulated month rollover
 *   - cancelled → user opted out
 *
 * AO-P13 will swap the mock for real StoreKit Configuration when
 * Apple Pay sandbox lands. Until then the lifecycle math runs locally
 * so the events fire with realistic timing.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "apex_outfitters.subscription_v1";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "cancelled";

export interface SubscriptionState {
  status: SubscriptionStatus;
  startedAt?: string;
  trialEndsAt?: string;
  nextRenewalAt?: string;
  cancelledAt?: string;
  /** Lifetime renewal count (for events.renewed cadence simulation). */
  renewalCount: number;
}

const EMPTY: SubscriptionState = {
  status: "none",
  renewalCount: 0,
};

export const PLUS_PRICE_USD = 9.99;
export const PLUS_TRIAL_DAYS = 7;
export const PLUS_PRODUCT_ID = "ao_plus_monthly";

let cached: SubscriptionState | null = null;
const listeners = new Set<(state: SubscriptionState) => void>();

function read(): SubscriptionState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return JSON.parse(raw) as SubscriptionState;
  } catch {
    return EMPTY;
  }
}

function write(state: SubscriptionState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent fail
  }
}

function get(): SubscriptionState {
  if (cached) return cached;
  cached = read();
  return cached;
}

function set(state: SubscriptionState): void {
  cached = state;
  write(state);
  for (const fn of listeners) fn(state);
}

// ─── Public API ─────────────────────────────────────────────────────

export function getSubscription(): SubscriptionState {
  return get();
}

export function startTrial(): SubscriptionState {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + PLUS_TRIAL_DAYS * 86400 * 1000);
  const next: SubscriptionState = {
    status: "trialing",
    startedAt: now.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    nextRenewalAt: trialEndsAt.toISOString(),
    renewalCount: 0,
  };
  set(next);
  return next;
}

export function startPaid(): SubscriptionState {
  const now = new Date();
  const nextRenewal = new Date(now);
  nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  const next: SubscriptionState = {
    status: "active",
    startedAt: now.toISOString(),
    nextRenewalAt: nextRenewal.toISOString(),
    renewalCount: 0,
  };
  set(next);
  return next;
}

export function convertTrial(): SubscriptionState {
  const current = get();
  const now = new Date();
  const nextRenewal = new Date(now);
  nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  const next: SubscriptionState = {
    ...current,
    status: "active",
    startedAt: current.startedAt ?? now.toISOString(),
    nextRenewalAt: nextRenewal.toISOString(),
    renewalCount: 0,
  };
  set(next);
  return next;
}

export function cancelSubscription(): SubscriptionState {
  const current = get();
  const next: SubscriptionState = {
    ...current,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
  };
  set(next);
  return next;
}

export function isSubscriberActive(): boolean {
  const s = get();
  return s.status === "active" || s.status === "trialing";
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(get);
  useEffect(() => {
    const listener = (s: SubscriptionState) => setState(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}
