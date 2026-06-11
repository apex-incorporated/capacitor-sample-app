/**
 * Apex Outfitters — client-side intelligence derivation.
 *
 * Apex's real intelligence layer (Belief Graph, Predictive LTV, audience
 * memberships) lives server-side and is computed from the firehose of
 * events across every visitor for the project. In the test app we
 * don't have access to that compute layer at the per-visitor level —
 * and even if we did, calling a black-box API wouldn't teach adopters
 * anything.
 *
 * Instead this module derives the SAME shapes locally from the event
 * stream the user has fired during this session. The math is
 * transparent so adopters can see exactly which actions moved their
 * predicted LTV up or down — a more honest demo than a server call.
 *
 * Caveat surfaced in the UI: "These numbers are derived locally. In a
 * real merchant integration Apex computes them server-side from
 * cross-platform event history. The shapes are identical; the inputs
 * are richer."
 */

import type { LiveEvent } from "./events";
import type { AuthUser } from "./auth-store";

// ─── Belief ──────────────────────────────────────────────────────────

export interface Belief {
  id: string;
  label: string;
  confidence: number; // 0-1
  /** Short explainer of WHY Apex believes this. */
  rationale: string;
  /** Tone for UI styling. */
  tone: "positive" | "neutral" | "warning";
}

// ─── Predicted LTV ───────────────────────────────────────────────────

export interface LTVFeature {
  label: string;
  /** Signed dollar contribution; positive = adds to LTV, negative = subtracts. */
  contributionUsd: number;
  /** Plain-English explanation of the feature. */
  explanation: string;
}

export interface PredictedLTV {
  totalUsd: number;
  confidence: number; // 0-1
  features: LTVFeature[];
}

// ─── Audience membership ─────────────────────────────────────────────

export interface AudienceMembership {
  id: string;
  label: string;
  /** Why this user is in this audience right now. */
  rationale: string;
}

// ─── Churn risk ──────────────────────────────────────────────────────

export interface ChurnRisk {
  score: number; // 0-1; higher = more risk
  band: "low" | "medium" | "high";
  rationale: string;
}

// ─── Top-level snapshot ──────────────────────────────────────────────

export interface IntelligenceSnapshot {
  beliefs: Belief[];
  ltv: PredictedLTV;
  audiences: AudienceMembership[];
  churn: ChurnRisk;
}

// ─── Pure derivation ─────────────────────────────────────────────────

const NEW_INSTALL_LTV_FLOOR = 24;

export function deriveIntelligence(events: LiveEvent[], user: AuthUser | null): IntelligenceSnapshot {
  const byType = groupByType(events);
  const productViews = byType.product_view?.length ?? 0;
  const addToCart = byType.add_to_cart?.length ?? 0;
  // Read both `in_app_purchase` (canonical mobile) and `purchase`
  // (legacy custom event) so historical session data persists.
  const purchases = [...(byType.in_app_purchase ?? []), ...(byType.purchase ?? [])];
  const checkoutStarts = byType.checkout_started?.length ?? 0;
  const wishlistAdds = byType.add_to_wishlist?.length ?? 0;
  const searches = byType.search?.length ?? 0;
  const deepLinks = byType.deep_link_open?.length ?? 0;
  const sessions = byType.app_open?.length ?? 0;
  const subscriptionStarts = byType.subscription_started?.length ?? 0;

  // ─── LTV — weighted-sum heuristic ─────────────────────────────────
  const ltvFeatures: LTVFeature[] = [];

  // Base "you exist" floor — every install starts with a tiny LTV.
  if (events.length > 0) {
    ltvFeatures.push({
      label: "Active installer",
      contributionUsd: NEW_INSTALL_LTV_FLOOR,
      explanation:
        "Every active install gets a small floor LTV. Replaces the 'I have no data on this person' state with a usable starting estimate.",
    });
  }

  if (user) {
    ltvFeatures.push({
      label: "Signed up + identified",
      contributionUsd: 32,
      explanation: `${user.email} is a known Contact. Apex stitches every prior anonymous visitor event under this identity for LTV math.`,
    });
  }

  if (productViews >= 3) {
    ltvFeatures.push({
      label: `${productViews} product views`,
      contributionUsd: Math.min(productViews * 4, 28),
      explanation: "Browse depth predicts purchase intent. Each view adds roughly $4 in expected LTV, capped at $28.",
    });
  }

  if (addToCart > 0) {
    ltvFeatures.push({
      label: `${addToCart} add-to-cart event${addToCart === 1 ? "" : "s"}`,
      contributionUsd: addToCart * 9,
      explanation: "Cart adds are the strongest pre-purchase intent signal. Each one moves predicted LTV by ~$9.",
    });
  }

  if (purchases.length > 0) {
    const totalRevenue = purchases.reduce((sum, p) => sum + (Number(p.data?.revenueUsd) || 0), 0);
    // Future revenue tends to be ~2.5x first-order revenue in apparel.
    const projected = Math.round(totalRevenue * 2.5);
    ltvFeatures.push({
      label: `${purchases.length} purchase${purchases.length === 1 ? "" : "s"} · $${totalRevenue.toFixed(0)} confirmed`,
      contributionUsd: projected,
      explanation: `Realized revenue is $${totalRevenue.toFixed(0)}. Apex projects future revenue at ~2.5x first-order in apparel cohorts.`,
    });
  }

  if (subscriptionStarts > 0) {
    ltvFeatures.push({
      label: "Subscription active",
      contributionUsd: 120,
      explanation: "MRR compounds. A 12-month subscription at $9.99 projects ~$120 incremental LTV.",
    });
  }

  if (wishlistAdds > 0) {
    ltvFeatures.push({
      label: `${wishlistAdds} wishlist add${wishlistAdds === 1 ? "" : "s"}`,
      contributionUsd: wishlistAdds * 3,
      explanation: "Soft intent signal. Each wishlist add adds ~$3 to predicted LTV.",
    });
  }

  if (deepLinks > 0) {
    ltvFeatures.push({
      label: `${deepLinks} deep-link arrival${deepLinks === 1 ? "" : "s"}`,
      contributionUsd: deepLinks * 6,
      explanation: "Deep-link arrivals attribute the visitor to a campaign or affiliate. Attribution-rich visitors have ~$6 higher LTV than organic on average.",
    });
  }

  // Negative signal: cart abandonments. If they started checkout but
  // didn't purchase, drop LTV.
  const abandonments = Math.max(0, checkoutStarts - purchases.length);
  if (abandonments > 0) {
    ltvFeatures.push({
      label: `${abandonments} checkout abandonment${abandonments === 1 ? "" : "s"}`,
      contributionUsd: abandonments * -8,
      explanation: "Started checkout but didn't complete. Repeated abandonment indicates price sensitivity or hesitation.",
    });
  }

  const totalLTV = Math.max(0, Math.round(ltvFeatures.reduce((sum, f) => sum + f.contributionUsd, 0)));
  const ltvConfidence = Math.min(1, 0.3 + events.length * 0.02);

  // ─── Beliefs ─────────────────────────────────────────────────────
  const beliefs: Belief[] = [];

  if (user && events.length < 5) {
    beliefs.push({
      id: "newly_identified",
      label: "Newly identified user",
      confidence: 0.85,
      rationale: `${user.name} signed up recently. Apex starts the LTV clock + opens an activation window.`,
      tone: "neutral",
    });
  }

  if (productViews >= 5) {
    beliefs.push({
      id: "considering",
      label: "Considering a purchase",
      confidence: Math.min(0.5 + productViews * 0.04, 0.85),
      rationale: `${productViews} product views in this session. Either a comparison shopper or a high-intent buyer.`,
      tone: "positive",
    });
  }

  if (addToCart > 0 && purchases.length === 0) {
    beliefs.push({
      id: "high_intent_unconverted",
      label: "High intent, hasn't purchased",
      confidence: 0.75,
      rationale: "Cart contains items but no purchase yet. Prime audience for a cart-abandonment journey.",
      tone: "warning",
    });
  }

  if (purchases.length >= 1) {
    beliefs.push({
      id: "active_customer",
      label: "Active customer",
      confidence: 0.95,
      rationale: `${purchases.length} confirmed purchase${purchases.length === 1 ? "" : "s"} — moved into the customer lifecycle stage.`,
      tone: "positive",
    });
  }

  if (subscriptionStarts > 0) {
    beliefs.push({
      id: "subscriber",
      label: "Subscriber",
      confidence: 1,
      rationale: "Recurring revenue locked in. Subscribers get separate retention modeling from one-shot buyers.",
      tone: "positive",
    });
  }

  if (deepLinks > 0) {
    beliefs.push({
      id: "campaign_attributed",
      label: "Campaign or affiliate-attributed",
      confidence: 0.8,
      rationale: "Arrived via a deep link. Apex credits the source campaign or affiliate for downstream conversions.",
      tone: "positive",
    });
  }

  if (searches >= 2) {
    beliefs.push({
      id: "explicit_intent",
      label: "Explicit intent searcher",
      confidence: 0.7,
      rationale: `${searches} searches. The user knows what they want — surface conversion CTAs aggressively.`,
      tone: "positive",
    });
  }

  // ─── Churn risk ──────────────────────────────────────────────────
  const churn = deriveChurnRisk({
    sessions,
    purchases: purchases.length,
    addToCart,
    abandonments,
    subscriberWithoutEngagement: subscriptionStarts > 0 && productViews < 2,
  });

  // ─── Audiences ───────────────────────────────────────────────────
  const audiences: AudienceMembership[] = [];

  if (user && events.length < 5) {
    audiences.push({
      id: "aud_new_installers",
      label: "New installers",
      rationale: "Identified user, <5 events this session.",
    });
  }
  if (addToCart > 0 && purchases.length === 0) {
    audiences.push({
      id: "aud_cart_abandoners",
      label: "Cart abandoners",
      rationale: "Items in cart, no purchase yet.",
    });
  }
  if (purchases.length >= 1 && purchases.length < 3) {
    audiences.push({
      id: "aud_first_time_customers",
      label: "First-time customers",
      rationale: "1-2 purchases in lifecycle. Prime for the 'second purchase' journey.",
    });
  }
  if (purchases.length >= 3) {
    audiences.push({
      id: "aud_repeat_buyers",
      label: "Repeat buyers",
      rationale: `${purchases.length}+ purchases. Eligible for VIP tier + early-access drops.`,
    });
  }
  if (wishlistAdds > 0 && addToCart === 0) {
    audiences.push({
      id: "aud_browsing",
      label: "Browsing only",
      rationale: "Wishlist activity but no cart action. Send re-engagement nudges.",
    });
  }
  if (subscriptionStarts > 0) {
    audiences.push({
      id: "aud_plus_subscribers",
      label: "Apex Outfitters Plus subscribers",
      rationale: "Active subscription.",
    });
  }

  return {
    beliefs,
    ltv: { totalUsd: totalLTV, confidence: ltvConfidence, features: ltvFeatures },
    audiences,
    churn,
  };
}

function deriveChurnRisk(opts: {
  sessions: number;
  purchases: number;
  addToCart: number;
  abandonments: number;
  subscriberWithoutEngagement: boolean;
}): ChurnRisk {
  let score = 0.15;
  let rationale = "Baseline: most active users don't churn in the short term.";

  if (opts.subscriberWithoutEngagement) {
    score = 0.62;
    rationale = "Active subscriber but minimal engagement this session — first signal of disengagement.";
  } else if (opts.abandonments >= 2) {
    score = 0.45;
    rationale = `${opts.abandonments} checkout abandonments — price-sensitive or losing interest.`;
  } else if (opts.purchases === 0 && opts.addToCart > 0) {
    score = 0.35;
    rationale = "Cart adds without conversion — friction or hesitation in the checkout flow.";
  } else if (opts.purchases >= 1) {
    score = 0.08;
    rationale = "Active purchaser. Low immediate churn risk; monitor for dormancy.";
  }

  const band: ChurnRisk["band"] = score < 0.2 ? "low" : score < 0.5 ? "medium" : "high";
  return { score, band, rationale };
}

function groupByType(events: LiveEvent[]): Record<string, LiveEvent[]> {
  const out: Record<string, LiveEvent[]> = {};
  for (const ev of events) {
    if (!out[ev.type]) out[ev.type] = [];
    out[ev.type].push(ev);
  }
  return out;
}
