/**
 * Apex Outfitters — partner referral capture + commission math.
 *
 * THE flagship demo. When a deep link with an affiliate ref arrives,
 * we capture the affiliate identity, the campaign, and a referral
 * window. Every subsequent event tagged with the affiliate context.
 * On purchase, commission accrues + a synthetic
 * `affiliate_conversion_recorded` event fires.
 *
 * Mirrors Apex's actual data model:
 *   - ApexLink owns the slug + campaign + UTM
 *   - Affiliate owns the commission structure
 *   - AffiliateConversion records the credited purchase + frozen
 *     commission at time of conversion
 *   - CommissionWindow: first_purchase / time_window / lifetime
 *
 * The seed script (scripts/seed-apex-outfitters-demo.ts) provisions
 * these same entities in your Apex workspace so the demo is
 * double-verifiable: in-app + dashboard side-by-side.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "apex_outfitters.referral_v1";

// ─── Demo affiliate roster ───────────────────────────────────────────

export interface DemoAffiliate {
  id: string;
  handle: string;
  name: string;
  description: string;
  avatarInitials: string;
  commission: {
    type: "revshare";
    percentBps: number; // basis points — 1500 = 15%
  };
  window: {
    mode: "first_purchase" | "time_window" | "lifetime";
    days?: number;
  };
}

export const DEMO_AFFILIATES: Record<string, DemoAffiliate> = {
  ari: {
    id: "aff_ari_demo",
    handle: "ari",
    name: "Ari Demo Affiliate",
    description: "Apex partner network member. Tech-niche reviewer with 1.2M reach.",
    avatarInitials: "AD",
    commission: { type: "revshare", percentBps: 1500 }, // 15%
    window: { mode: "time_window", days: 90 },
  },
  podcaster: {
    id: "aff_podcast_demo",
    handle: "podcaster",
    name: "Podcast Demo",
    description: "Audio partner. 30% first-purchase commission, demo only.",
    avatarInitials: "PD",
    commission: { type: "revshare", percentBps: 3000 },
    window: { mode: "first_purchase" },
  },
};

export function getAffiliateByHandle(handle: string): DemoAffiliate | undefined {
  return DEMO_AFFILIATES[handle.toLowerCase()];
}

// ─── Active referral ─────────────────────────────────────────────────

export interface ActiveReferral {
  affiliateId: string;
  handle: string;
  affiliateName: string;
  /** Slug of the Apex Link that captured the click. */
  campaignSlug: string;
  /** Optional product the link points at — shown in the attribution panel. */
  destinationProductId?: string;
  /** When the click happened. */
  capturedAt: string;
  /** When the attribution window expires (ISO). */
  expiresAt: string | null;
  /** Window mode mirroring Affiliate.commissionWindow. */
  windowMode: DemoAffiliate["window"]["mode"];
  /** True once a conversion has been credited under this referral. */
  consumed: boolean;
  /** Confirmed payouts attributed to this referral so far (this device). */
  recordedConversions: Array<{
    at: string;
    revenueUsd: number;
    commissionUsd: number;
    orderId: string;
  }>;
}

let cached: ActiveReferral | null | undefined;
const listeners = new Set<(state: ActiveReferral | null) => void>();

function read(): ActiveReferral | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveReferral;
  } catch {
    return null;
  }
}

function write(state: ActiveReferral | null): void {
  if (typeof window === "undefined") return;
  try {
    if (state) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silent fail
  }
}

function get(): ActiveReferral | null {
  if (cached !== undefined) return cached;
  cached = read();
  return cached;
}

function set(state: ActiveReferral | null): void {
  cached = state;
  write(state);
  for (const fn of listeners) fn(state);
}

// ─── Capture + math ──────────────────────────────────────────────────

/**
 * Parse `?ref=ari&campaign=founders-tote` from a deep-link URL and
 * capture the referral. Returns the affiliate if captured.
 */
export function captureReferralFromUrl(url: string): DemoAffiliate | null {
  try {
    const u = new URL(url);
    const handle = u.searchParams.get("ref");
    if (!handle) return null;
    const affiliate = getAffiliateByHandle(handle);
    if (!affiliate) return null;

    const campaign = u.searchParams.get("campaign") ?? u.pathname.replace(/^\//, "") ?? "general";
    const destProductMatch = u.pathname.match(/^\/product\/([^/]+)$/);
    const destinationProductId = destProductMatch ? destProductMatch[1] : undefined;

    const capturedAt = new Date();
    const windowDays = affiliate.window.mode === "time_window" ? affiliate.window.days ?? 30 : null;
    const expiresAt =
      affiliate.window.mode === "time_window"
        ? new Date(capturedAt.getTime() + (windowDays ?? 30) * 86400 * 1000).toISOString()
        : null;

    set({
      affiliateId: affiliate.id,
      handle: affiliate.handle,
      affiliateName: affiliate.name,
      campaignSlug: campaign,
      destinationProductId,
      capturedAt: capturedAt.toISOString(),
      expiresAt,
      windowMode: affiliate.window.mode,
      consumed: false,
      recordedConversions: [],
    });
    return affiliate;
  } catch {
    return null;
  }
}

/**
 * Returns the active referral if it's still within the attribution
 * window. Lifetime mode never expires; first_purchase mode is active
 * until a conversion is credited.
 */
export function getActiveReferral(): ActiveReferral | null {
  const r = get();
  if (!r) return null;
  if (r.windowMode === "first_purchase" && r.consumed) return null;
  if (r.expiresAt && new Date(r.expiresAt) < new Date()) return null;
  return r;
}

export function clearReferral(): void {
  set(null);
}

/**
 * Compute commission for a given revenue amount under the active
 * referral. Returns null when no active referral or window expired.
 */
export function computeCommission(revenueUsd: number): { affiliate: DemoAffiliate; commissionUsd: number; percentBps: number } | null {
  const referral = getActiveReferral();
  if (!referral) return null;
  const affiliate = getAffiliateByHandle(referral.handle);
  if (!affiliate) return null;
  const commissionUsd = Math.round((revenueUsd * affiliate.commission.percentBps) / 10000 * 100) / 100;
  return { affiliate, commissionUsd, percentBps: affiliate.commission.percentBps };
}

/**
 * Record a conversion against the active referral. Returns the
 * computed commission, or null if no active referral applied.
 */
export function recordConversion(opts: {
  revenueUsd: number;
  orderId: string;
}): { affiliate: DemoAffiliate; commissionUsd: number } | null {
  const referral = getActiveReferral();
  if (!referral) return null;
  const calc = computeCommission(opts.revenueUsd);
  if (!calc) return null;

  const updated: ActiveReferral = {
    ...referral,
    consumed: true,
    recordedConversions: [
      ...referral.recordedConversions,
      {
        at: new Date().toISOString(),
        revenueUsd: opts.revenueUsd,
        commissionUsd: calc.commissionUsd,
        orderId: opts.orderId,
      },
    ],
  };
  set(updated);
  return { affiliate: calc.affiliate, commissionUsd: calc.commissionUsd };
}

// ─── React hook ──────────────────────────────────────────────────────

export function useReferral(): ActiveReferral | null {
  const [state, setState] = useState<ActiveReferral | null>(() => get());
  useEffect(() => {
    const listener = (s: ActiveReferral | null) => setState(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

// ─── Demo helper — simulates tapping an affiliate link from outside ──

/**
 * Constructs a demo Apex Link URL and captures it. Used by the
 * Settings → Test partner referral button.
 */
export function simulateAffiliateClick(handle: string, productSlug?: string): DemoAffiliate | null {
  const affiliate = getAffiliateByHandle(handle);
  if (!affiliate) return null;
  const slug = productSlug ?? "founders-tote";
  const fakeUrl = `https://apex-outfitters.links.apex.inc/${slug}?ref=${handle}&campaign=${slug}`;
  return captureReferralFromUrl(fakeUrl);
}
