import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useCart, getCartSubtotal, clearCart } from "@/lib/cart-store";
import { track } from "@/lib/events";
import { recordConversion, useReferral } from "@/lib/referral";
import { cn } from "@/components/ui/utils";
import { fadeUp, listContainer, mediumHaptic, successHaptic } from "@/brand/motion";

type PaymentMethod = "apple_pay" | "card";

export function CheckoutScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const cart = useCart();
  const referral = useReferral();
  const subtotal = getCartSubtotal(cart.items);
  const shipping = subtotal > 100 ? 0 : 8;
  const tax = Math.round(subtotal * 0.0875 * 100) / 100;
  const total = subtotal + shipping + tax;

  const [name, setName] = useState("Founder Test");
  const [email, setEmail] = useState("founder@example.com");
  const [address, setAddress] = useState("100 Apex Way");
  const [city, setCity] = useState("San Francisco");
  const [zip, setZip] = useState("94103");
  const [method, setMethod] = useState<PaymentMethod>("apple_pay");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (cart.items.length === 0 && !success) {
    navigate("/cart");
    return null;
  }

  const handleSubmit = async () => {
    void mediumHaptic();
    setSubmitting(true);
    // Simulate a real checkout — a deliberate ~1.2s pause is the
    // right UX beat for "processing payment" without feeling slow.
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSuccess(true);
    void successHaptic();

    // Fire the conversion event. `in_app_purchase` is the canonical
    // mobile event type Apex's attribution waterfall + LTV model + the
    // /dashboard/mobile revenue card all look for. Firing it as
    // `purchase` (custom) would land in the firehose but never feed
    // the revenue dashboards.
    //
    // 2026-05-16 — canonical Apex spec field names. The spec requires
    // `order_id` + `value` + `currency`; `transaction_id` and `items`
    // are optional but recommended. We keep the original `revenueUsd` / `amount` /
    // `transactionId` / `products` aliases alongside the canonical
    // fields so the existing in-app event log + any dashboards that
    // historically read the legacy fields keep working — but the
    // canonical keys are what the canonicalizer + journey triggers
    // consume.
    const orderId = `AO-${Math.floor(1000 + Math.random() * 9000)}`;
    // Journey Exit Semantics — emit the canonical cart-clearing
    // event so the server-side rollup writer zeroes out
    // `Contact.cart` immediately. `in_app_purchase` below carries
    // the revenue + attribution payload (and also acts as the
    // canonical cart-clearing event), but firing both is the
    // belt-and-suspenders pattern: it lets workspaces that haven't
    // yet wired `in_app_purchase` as a journey trigger still
    // benefit from the cart-state clear.
    void track("checkout_completed", {
      order_id: orderId,
      orderId,
      totalCents: Math.round(total * 100),
      currency: "USD",
    });
    void track("in_app_purchase", {
      order_id: orderId,
      value: total,
      currency: "USD",
      transaction_id: orderId,
      items: cart.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      })),
      revenueUsd: total,
      subtotalUsd: subtotal,
      shippingUsd: shipping,
      taxUsd: tax,
      amount: total,
      itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
      paymentMethod: method,
      orderId,
      transactionId: orderId,
      products: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      })),
      // Stamp the partner referral inline on the purchase event — this
      // is the exact field shape Apex's attribution waterfall keys off
      // server-side to credit the AffiliateConversion record.
      ...(referral
        ? {
            affiliateId: referral.affiliateId,
            affiliateHandle: referral.handle,
            campaignSlug: referral.campaignSlug,
          }
        : {}),
    });

    // AO-P5 — record the partner conversion locally + fire the synthetic
    // affiliate_conversion_recorded event for the Apex Live panel.
    if (referral) {
      const credit = recordConversion({ revenueUsd: subtotal, orderId });
      if (credit) {
        void track("affiliate_conversion_recorded", {
          affiliateId: credit.affiliate.id,
          affiliateHandle: credit.affiliate.handle,
          orderId,
          revenueUsd: subtotal,
          commissionUsd: credit.commissionUsd,
          commissionType: credit.affiliate.commission.type,
          percentBps: credit.affiliate.commission.percentBps,
        });
      }
    }

    clearCart();
    toast.success("Order placed", `Total: $${total.toFixed(2)}`);
  };

  if (success) {
    return (
      <>
        <Header />
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center px-5 pt-12 text-center"
        >
          <motion.div variants={fadeUp} className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary-soft">
            <CheckCircle2 className="size-8 text-success" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-2xl font-semibold tracking-tight text-fg">
            Order placed
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-1 text-sm text-fg-muted">
            Confirmation coming to {email}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 w-full max-w-sm">
            <Card variant="subtle">
              <CardBody className="space-y-1 py-5 text-left">
                <Row label="Order" value="#AO-1042" />
                <Row label="Total" value={`$${total.toFixed(2)}`} />
                <Row label="Ship to" value={`${address}, ${city} ${zip}`} />
              </CardBody>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-6 flex w-full max-w-sm flex-col gap-2">
            <Button onClick={() => navigate("/")} fullWidth>
              Back to home
            </Button>
            <Button variant="ghost" onClick={() => navigate("/apex-live")} fullWidth>
              See the events on Apex Live
            </Button>
          </motion.div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <Header showBack title="Checkout" />

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 px-5 pb-40"
      >
        {/* ── Contact + shipping ─────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardBody className="space-y-3 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                Ship to
              </p>
              <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="grid grid-cols-[2fr_1fr] gap-3">
                <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <TextField label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* ── Payment method ─────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardBody className="space-y-3 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                Payment
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <PaymentChoice
                  active={method === "apple_pay"}
                  onClick={() => setMethod("apple_pay")}
                  label={
                    <span className="flex items-center gap-2 text-base font-semibold">
                      <ApplePayMark />
                    </span>
                  }
                  hint="Tap to pay via simulated Apple Pay sheet (AO-P13 lands real sandbox integration)"
                />
                <PaymentChoice
                  active={method === "card"}
                  onClick={() => setMethod("card")}
                  label={
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="size-4" />
                      Credit card
                    </span>
                  }
                  hint="Simulated — no card data is collected"
                />
              </div>
              <Badge variant="warning" className="mt-1 w-fit">
                Simulated checkout
              </Badge>
            </CardBody>
          </Card>
        </motion.div>

        {/* ── Order summary ──────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card variant="subtle">
            <CardBody className="space-y-1.5 py-5">
              <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`} />
              <Row label="Tax" value={`$${tax.toFixed(2)}`} />
              <div className="mt-1 border-t border-border-subtle pt-2">
                <Row label="Total" value={`$${total.toFixed(2)}`} bold />
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Sticky pay CTA ─────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      >
        <div className="mx-auto max-w-md px-5 py-3">
          <Button
            fullWidth
            size="lg"
            loading={submitting}
            iconLeft={
              submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : method === "apple_pay" ? (
                <ApplePayMark dark />
              ) : (
                <CreditCard className="size-4" />
              )
            }
            onClick={handleSubmit}
            className={method === "apple_pay" ? "bg-black text-white hover:bg-black/90 active:bg-black" : undefined}
            haptic="none"
          >
            {submitting
              ? "Processing..."
              : method === "apple_pay"
                ? `Pay · $${total.toFixed(2)}`
                : `Place order · $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </>
  );
}

function PaymentChoice({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-colors",
        active
          ? "border-primary bg-primary-soft"
          : "border-border bg-surface hover:border-border-strong",
      )}
    >
      {label}
      <span className="text-[11px] text-fg-muted">{hint}</span>
    </button>
  );
}

function ApplePayMark({ dark }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold",
        dark ? "text-white" : "text-fg",
      )}
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
        <path d="M11.124 8.532c-.013-1.343 1.096-1.995 1.146-2.026-.626-.913-1.596-1.038-1.94-1.052-.822-.084-1.611.484-2.027.484-.422 0-1.063-.472-1.748-.459-.9.013-1.732.522-2.193 1.327-.935 1.622-.238 4.025.673 5.34.446.648.978 1.376 1.677 1.351.673-.026.93-.434 1.74-.434.81 0 1.046.434 1.755.421.726-.013 1.184-.66 1.626-1.31.512-.756.722-1.49.735-1.529-.016-.007-1.41-.541-1.444-2.113zm-1.346-3.881c.365-.452.612-1.075.545-1.703-.526.021-1.16.354-1.534.798-.336.402-.629 1.039-.551 1.66.585.045 1.176-.297 1.54-.755z" />
      </svg>
      Pay
    </span>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "text-sm font-semibold text-fg" : "text-xs text-fg-muted"}>{label}</span>
      <span
        className={bold ? "text-base font-semibold text-fg tabular-nums" : "text-sm text-fg tabular-nums"}
      >
        {value}
      </span>
    </div>
  );
}
