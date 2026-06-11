import { motion } from "framer-motion";
import { Users, Sparkles, Award, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useReferral, clearReferral, getAffiliateByHandle, computeCommission } from "@/lib/referral";
import { useCart, getCartSubtotal } from "@/lib/cart-store";
import { fadeUp } from "@/brand/motion";

/**
 * AO-P5 — Partner referral attribution chain. Shows the active
 * referral, the commission Apex would credit on the current cart,
 * and any conversions already recorded under this referral.
 *
 * The flagship moment. Walks the operator through: "this is the
 * affiliate, this is the campaign, here's the commission Apex will
 * credit when the user converts, here's the AffiliateConversion
 * record that just landed."
 */
export function ReferralPanel() {
  const referral = useReferral();
  const cart = useCart();
  const cartSubtotal = getCartSubtotal(cart.items);

  if (!referral) {
    return (
      <motion.div variants={fadeUp}>
        <Card variant="subtle">
          <CardBody className="flex items-start gap-3 py-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-fg-subtle">
              <Users className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold tracking-tight text-fg">
                No active partner referral
              </h3>
              <p className="mt-1 text-xs text-fg-muted">
                Open <span className="font-medium">Settings → Test partner referral</span> to simulate tapping an affiliate&apos;s Apex Link from outside the app. You&apos;ll see the full attribution chain land here.
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    );
  }

  const affiliate = getAffiliateByHandle(referral.handle);
  const projectedCommission = cartSubtotal > 0 ? computeCommission(cartSubtotal) : null;

  const windowExplanation =
    referral.windowMode === "lifetime"
      ? "Lifetime — every future qualifying purchase credits this affiliate."
      : referral.windowMode === "first_purchase"
        ? "First purchase only — the next qualifying purchase credits this affiliate, then the referral closes."
        : `Time-windowed${referral.expiresAt ? ` — expires ${new Date(referral.expiresAt).toLocaleDateString()}` : ""}.`;

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <Card accent="primary">
        <CardBody className="space-y-3 py-5">
          {/* ── Active referral header ─────────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-accent font-semibold">
              {affiliate?.avatarInitials ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Active partner referral
              </p>
              <h3 className="text-base font-semibold tracking-tight">{referral.affiliateName}</h3>
              <p className="mt-0.5 text-[11px] text-fg-muted">
                Campaign: <span className="font-mono">{referral.campaignSlug}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => clearReferral()}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg-muted hover:bg-border hover:text-fg"
              aria-label="Clear referral"
              title="Clear referral"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-sunken px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Commission rule
              </p>
              <p className="mt-0.5 text-sm font-semibold text-fg">
                {affiliate ? `${(affiliate.commission.percentBps / 100).toFixed(0)}% revshare` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-surface-sunken px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Window
              </p>
              <p className="mt-0.5 text-sm font-semibold text-fg capitalize">
                {referral.windowMode.replace("_", " ")}
              </p>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-fg-muted">{windowExplanation}</p>
        </CardBody>
      </Card>

      {/* ── Projected commission on current cart ──────────────── */}
      {projectedCommission && cart.items.length > 0 && (
        <Card>
          <CardBody className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                If you purchase right now
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-fg">
                {referral.affiliateName} would earn
              </span>
              <span className="text-xl font-semibold tabular-nums text-fg">
                ${projectedCommission.commissionUsd.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-fg-muted">
              {(projectedCommission.percentBps / 100).toFixed(0)}% of $
              {cartSubtotal.toFixed(2)} cart subtotal. Frozen at conversion time —
              future commission-structure changes don&apos;t retroactively shift past payouts.
            </p>
          </CardBody>
        </Card>
      )}

      {/* ── Recorded conversions ───────────────────────────────── */}
      {referral.recordedConversions.length > 0 && (
        <Card>
          <CardBody className="space-y-3 py-4">
            <div className="flex items-center gap-2">
              <Award className="size-3.5 text-success" />
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                Conversions credited to {referral.affiliateName}
              </span>
            </div>
            <ul className="space-y-2">
              {referral.recordedConversions.map((c) => (
                <li
                  key={c.orderId}
                  className="rounded-xl border border-success/20 bg-primary-soft px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-fg">{c.orderId}</span>
                    <span className="font-mono text-sm font-semibold text-fg tabular-nums">
                      +${c.commissionUsd.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-fg-muted">
                    {new Date(c.at).toLocaleString()} · revenue ${c.revenueUsd.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-[11px] leading-relaxed text-fg-muted">
              In a live merchant integration, these conversions surface in your
              dashboard&apos;s Affiliates view + accrue toward {referral.affiliateName}&apos;s next
              Stripe Connect payout.
            </p>
          </CardBody>
        </Card>
      )}

      {/* ── First-touch helper for the simulate path ──────────── */}
      <Card variant="subtle">
        <CardBody className="space-y-1.5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Try the full loop
          </p>
          <p className="text-xs text-fg-muted">
            Add the linked product to your cart, sign up, check out. Watch the
            commission accrue in real time — same data shape that lands in the
            merchant&apos;s Apex dashboard server-side.
          </p>
          {referral.destinationProductId && (
            <Badge variant="primary" className="mt-1">
              Deep-linked to {referral.destinationProductId}
            </Badge>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
