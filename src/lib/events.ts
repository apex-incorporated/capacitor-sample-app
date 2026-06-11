/**
 * Apex Outfitters — event helpers.
 *
 * Wrap `Apex.track` so every send (a) goes to Apex over the wire AND
 * (b) lands in a local event stream the "Apex Live" tab subscribes
 * to. The local stream is for UX — adopters see events appear in
 * real time without leaving the app. The Apex Live screen also
 * deep-links to `/dashboard/debug/events?projectKey=<key>` so they
 * can verify server-side.
 *
 * Each event type also has a "what this means" explainer that the
 * panel renders alongside the event card — the educational layer
 * that makes this app a teaching tool, not just a harness.
 */

import { useEffect, useState } from "react";
import { Apex } from "@apex-inc/capacitor-plugin";
import { logEvent } from "@/apex";

// ─── Pre-init buffering ─────────────────────────────────────────────
//
// The native plugin rejects `track()` calls with "Plugin not
// initialized" if they fire before `Apex.initialize()` has resolved.
// React's mount order means the first `track("page_view")` and
// `track("app_open")` calls can race the initialize promise. Without
// buffering, the first 1-2 events of every cold start are silently
// dropped.
//
// We hold tracks in this in-memory buffer until `markApexReady()` is
// called by the app's init helper, then drain the buffer into the
// native plugin. Subsequent tracks pass straight through.

let apexReady = false;
const preInitBuffer: Array<{ type: string; data?: Record<string, unknown> }> = [];

/** Called by `initApex()` once `Apex.initialize()` resolves. */
export function markApexReady(): void {
  if (apexReady) return;
  apexReady = true;
  const queued = preInitBuffer.splice(0);
  for (const ev of queued) {
    Apex.track({ type: ev.type, data: ev.data }).catch(() => undefined);
  }
}

/** Apex Outfitters event vocabulary — narrowed for in-app helpers. */
export type ApexEventType =
  | "page_view"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_view"
  | "checkout_started"
  | "checkout_completed"
  | "in_app_purchase"
  | "add_to_wishlist"
  | "user_signed_up"
  | "user_signed_in"
  | "user_signed_out"
  | "subscription_started"
  | "subscription_cancelled"
  | "app_open"
  | "app_background"
  | "deep_link_open"
  | "custom";

export interface LiveEvent {
  id: string;
  at: string;
  type: ApexEventType | string;
  data?: Record<string, unknown>;
}

type Listener = (events: LiveEvent[]) => void;

const MAX_EVENTS = 100;
const events: LiveEvent[] = [];
const listeners = new Set<Listener>();

function emit(event: LiveEvent): void {
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  for (const fn of listeners) fn([...events]);
}

/**
 * Fire an Apex event AND push it onto the local Apex Live stream.
 *
 * The wire call (`Apex.track`) is fire-and-forget — failures don't
 * block the UI. The local stream always records the attempt so the
 * panel reflects what the app intended to send, even if the network
 * is down.
 */
export async function track(
  type: ApexEventType | string,
  data?: Record<string, unknown>,
): Promise<void> {
  const ev: LiveEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    type,
    data,
  };
  emit(ev);
  logEvent(`Apex.track("${type}")`, data);

  // Pre-init: buffer locally so events fired between React mount and
  // Apex.initialize() resolution aren't dropped. The native plugin
  // would otherwise reject the call with "Plugin not initialized".
  if (!apexReady) {
    preInitBuffer.push({ type, data });
    return;
  }

  try {
    await Apex.track({ type, data });
  } catch {
    // Plugin error after init — keep the local stream entry; user
    // sees the event in Apex Live even if the send failed.
  }
}

/** React hook — re-renders when new events stream in. */
export function useLiveEvents(): LiveEvent[] {
  const [state, setState] = useState<LiveEvent[]>(() => [...events]);
  useEffect(() => {
    const listener: Listener = (next) => setState(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

/** Subscribe to the stream as a plain callback (non-React). */
export function subscribeToEvents(fn: Listener): () => void {
  fn([...events]);
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── Educational explainers ──────────────────────────────────────────

export interface EventExplainer {
  what: string;
  /** How Apex measures or uses this event downstream. */
  why: string;
  /** What intelligence this event powers across Apex's systems. */
  powers: string[];
}

export const EVENT_EXPLAINERS: Record<string, EventExplainer> = {
  page_view: {
    what: "The visitor entered a screen.",
    why: "Apex builds a session-level navigation graph from page_view events. Combined with timestamps, this powers the user-journey timeline you'll see in the dashboard.",
    powers: ["Session analytics", "Funnel analysis", "User-journey timeline"],
  },
  product_view: {
    what: "A product detail screen was opened.",
    why: "Pre-purchase intent signal. Apex weighs product_view-to-purchase conversion when training its predictive LTV model and when building 'browsed but didn't buy' audiences for retargeting.",
    powers: ["Predictive LTV", "Retargeting audiences", "Product affinity scoring"],
  },
  add_to_cart: {
    what: "A product was added to the cart.",
    why: "Strong purchase intent. This is the standard trigger for cart-abandonment automations + audience inclusion in 'high intent shoppers' cohorts.",
    powers: ["Cart abandonment journey", "High-intent audience", "Conversion funnel"],
  },
  cart_view: {
    what: "The cart screen was opened.",
    why: "Mid-funnel signal — the user is considering checkout. Combined with `add_to_cart` it tells Apex how often shoppers second-guess their cart before checking out.",
    powers: ["Funnel analysis", "Hesitation detection"],
  },
  checkout_started: {
    what: "The user proceeded from cart to checkout.",
    why: "The clearest pre-purchase signal short of `purchase` itself. Apex uses checkout_started → purchase conversion rate as a primary funnel KPI.",
    powers: ["Checkout funnel", "Abandonment journey trigger"],
  },
  in_app_purchase: {
    what: "A purchase completed inside the app with revenue attached.",
    why: "The canonical mobile conversion event. Apex's /dashboard/mobile revenue card, LTV model, and attribution waterfall all key off `in_app_purchase`. Credits any active affiliate referral, fires CAPI/Offline Conversions, and updates the user's cohort retention bucket.",
    powers: [
      "Attribution waterfall",
      "Affiliate commission",
      "LTV calculation",
      "Meta CAPI / Google Offline Conversions",
      "Revenue cohort retention",
    ],
  },
  user_signed_up: {
    what: "A new visitor became a signed-in user.",
    why: "Marks the identity-stitch moment. Apex links every prior anonymous visitor event under this user, joins them to a Contact record, and starts the LTV clock.",
    powers: ["Identity stitching", "Activation cohort", "LTV start date"],
  },
  user_signed_in: {
    what: "An existing user signed in.",
    why: "Reattaches this device's anonymous visitor to a known Contact. Subsequent events feed that Contact's LTV + retention cohorts.",
    powers: ["Cross-device identity", "Returning-user cohort"],
  },
  user_signed_out: {
    what: "The user signed out.",
    why: "Switches the device back to anonymous. New visitor events are unattached until the next sign-in.",
    powers: ["Session boundary"],
  },
  add_to_wishlist: {
    what: "The user saved a product for later.",
    why: "Soft intent signal. Apex includes add_to_wishlist in audience composition for 'considering' cohorts and product-affinity scoring.",
    powers: ["Affinity scoring", "Consideration audience"],
  },
  search: {
    what: "A search query was submitted.",
    why: "Reveals the user's explicit intent. Apex aggregates search terms by frequency for the product analytics dashboard + uses term-to-purchase patterns in personalization.",
    powers: ["Search analytics", "Personalization signal"],
  },
  app_open: {
    what: "The app moved to foreground (cold or warm start).",
    why: "The session anchor. session_start fires immediately after if 30+ minutes elapsed since the last activity. Reattribution + reengagement events derive from this.",
    powers: ["Session boundary", "Reengagement", "DAU/MAU"],
  },
  deep_link_open: {
    what: "The app was opened by a deep link (Universal Link, App Link, push tap).",
    why: "The first signal of an inbound attribution. Apex resolves the link to a campaign or affiliate and credits the active session.",
    powers: ["Attribution waterfall", "Affiliate referral", "Campaign performance"],
  },
  subscription_started: {
    what: "A subscription tier was activated (paid or trial).",
    why: "Subscription revenue compounds — Apex treats subscription_started as a high-value conversion event for LTV, ROAS, and cohort retention.",
    powers: ["MRR cohort", "Predictive LTV", "Trial-to-paid attribution"],
  },
  subscription_cancelled: {
    what: "An active subscription was cancelled.",
    why: "Churn signal. Apex weighs cancellation timing relative to install + activation events when training churn-risk predictions.",
    powers: ["Churn cohort", "Churn-risk model"],
  },
  custom: {
    what: "A custom event you defined.",
    why: "Apex accepts any event type — extend the vocabulary as you go. Custom events feed audiences + journey triggers identically to the native types.",
    powers: ["Custom audiences", "Custom journey triggers"],
  },
  in_app_message_received: {
    what: "An in-app message was delivered to the running app.",
    why: "Apex's in_app_push channel queues a contextual overlay message — distinct from OS pushes. Receipt fires immediately on delivery; the `seen` event fires when the user actually views it.",
    powers: ["In-app message analytics", "Audience-targeted messaging", "Onboarding journeys"],
  },
  in_app_message_seen: {
    what: "The user saw an in-app message.",
    why: "Apex tracks impression separately from delivery so dashboards can compute view rate, dismiss rate, and click-through rate independently.",
    powers: ["Message performance", "Audience activation", "A/B test of in-app variants"],
  },
  subscription_event: {
    what: "A lifecycle event on a subscription (trial_started/started/renewed/cancelled).",
    why: "Apex models subscriptions as a separate revenue stream with its own retention curve. Trial-to-paid conversion, churn timing, and MRR all derive from subscription_event timing.",
    powers: ["MRR cohort", "Trial conversion analytics", "Churn risk model"],
  },
  affiliate_conversion_recorded: {
    what: "An affiliate referral was credited on a purchase.",
    why: "Closes the partner-network attribution loop. Apex matches the purchase to the visitor's active referral, computes the commission from the affiliate's structure, freezes the dollar amount at conversion time, and increments the affiliate's payable balance.",
    powers: [
      "Affiliate commission ledger",
      "Stripe Connect payout queue",
      "Partner dashboard reporting",
      "Apex Partner Network analytics",
    ],
  },
};

/** Get the explainer for an event type, falling back gracefully. */
export function getEventExplainer(type: string): EventExplainer | null {
  return EVENT_EXPLAINERS[type] ?? null;
}
