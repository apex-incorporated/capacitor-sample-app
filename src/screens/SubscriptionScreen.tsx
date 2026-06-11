import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Truck,
  Star,
  Lock,
  Check,
  Crown,
  Hourglass,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  useSubscription,
  startTrial,
  startPaid,
  cancelSubscription,
  PLUS_PRICE_USD,
  PLUS_TRIAL_DAYS,
  PLUS_PRODUCT_ID,
} from "@/lib/subscription-store";
import { track } from "@/lib/events";
import { useExperimentVariant } from "@/components/apex-live/ExperimentPanel";
import { listContainer, fadeUp, mediumHaptic, successHaptic } from "@/brand/motion";

const PERKS = [
  {
    icon: Truck,
    title: "Free shipping",
    body: "Every order, every product, no minimum. Saves $8 per order on average.",
  },
  {
    icon: Star,
    title: "Early access drops",
    body: "Subscribers see new collections 48 hours before everyone else.",
  },
  {
    icon: Lock,
    title: "Members-only releases",
    body: "Limited-run products that never hit the public shop.",
  },
  {
    icon: Crown,
    title: "20% off accessories",
    body: "Stack with seasonal promotions on everything in Accessories + Home.",
  },
];

export function SubscriptionScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const sub = useSubscription();
  const variant = useExperimentVariant();

  useEffect(() => {
    void track("page_view", { screen: "subscription", experiment_paywall_layout: variant });
  }, [variant]);

  const handleStartTrial = () => {
    void mediumHaptic();
    const next = startTrial();
    void track("subscription_event", {
      action: "trial_started",
      productId: PLUS_PRODUCT_ID,
      currency: "USD",
      priceUsd: PLUS_PRICE_USD,
      trialDays: PLUS_TRIAL_DAYS,
      trialEndsAt: next.trialEndsAt,
    });
    void track("subscription_started", {
      productId: PLUS_PRODUCT_ID,
      isTrial: true,
    });
    void successHaptic();
    toast.success(
      "Trial started",
      `${PLUS_TRIAL_DAYS} days free. After that, $${PLUS_PRICE_USD}/mo.`,
    );
  };

  const handleStartPaid = () => {
    void mediumHaptic();
    const next = startPaid();
    void track("subscription_event", {
      action: "started",
      productId: PLUS_PRODUCT_ID,
      currency: "USD",
      priceUsd: PLUS_PRICE_USD,
      nextRenewalAt: next.nextRenewalAt,
    });
    void track("subscription_started", {
      productId: PLUS_PRODUCT_ID,
      isTrial: false,
    });
    void successHaptic();
    toast.success("Welcome to Plus", `Renews ${new Date(next.nextRenewalAt!).toLocaleDateString()}`);
  };

  const handleCancel = () => {
    void mediumHaptic();
    cancelSubscription();
    void track("subscription_event", {
      action: "cancelled",
      productId: PLUS_PRODUCT_ID,
    });
    void track("subscription_cancelled", { productId: PLUS_PRODUCT_ID });
    toast.info("Subscription cancelled", "You'll keep Plus benefits until the period ends.");
  };

  const isSubscriber = sub.status === "active" || sub.status === "trialing";

  return (
    <>
      <Header showBack title="Apex Outfitters Plus" />

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 px-5 pb-12"
      >
        {/* ── Hero ──────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-soft" />
              <div className="relative px-5 py-7">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-on-accent shadow-glow">
                  <Crown className="size-6" />
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  Apex Outfitters Plus
                </h1>
                {variant === "variant_b" ? (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-fg">
                      Save 20% on accessories + free shipping forever.
                    </p>
                    <p className="text-xs text-fg-muted">
                      ${PLUS_PRICE_USD}/mo · cancel anytime · ride the moat.
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-fg-muted">
                    Free shipping, early access, members-only drops. ${PLUS_PRICE_USD}/mo.
                  </p>
                )}
                {isSubscriber && (
                  <Badge variant="success" size="md" className="mt-3">
                    {sub.status === "trialing" ? "Trial active" : "Active"}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Current status (if subscribed) ────────────────────── */}
        {isSubscriber && (
          <motion.div variants={fadeUp}>
            <Card variant="subtle">
              <CardBody className="space-y-2 py-4">
                {sub.status === "trialing" && sub.trialEndsAt && (
                  <div className="flex items-start gap-2 text-sm text-fg">
                    <Hourglass className="mt-0.5 size-4 text-warning" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        Trial ends {new Date(sub.trialEndsAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-fg-muted">
                        After that, ${PLUS_PRICE_USD}/mo automatically.
                      </p>
                    </div>
                  </div>
                )}
                {sub.status === "active" && sub.nextRenewalAt && (
                  <div className="flex items-start gap-2 text-sm text-fg">
                    <Check className="mt-0.5 size-4 text-success" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        Next renewal {new Date(sub.nextRenewalAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-fg-muted">
                        ${PLUS_PRICE_USD} will be charged. Cancel anytime.
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* ── Perks ─────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="space-y-2">
          {PERKS.map((perk) => (
            <Card key={perk.title}>
              <CardBody className="flex items-start gap-3 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <perk.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">{perk.title}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">{perk.body}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </motion.div>

        {/* ── CTA stack ─────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="space-y-2 pt-2">
          {!isSubscriber && (
            <>
              <Button
                fullWidth
                size="lg"
                iconLeft={<Sparkles className="size-4" />}
                onClick={handleStartTrial}
              >
                Start {PLUS_TRIAL_DAYS}-day free trial
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={handleStartPaid}
              >
                Subscribe now · ${PLUS_PRICE_USD}/mo
              </Button>
              <p className="pt-1 text-center text-[11px] text-fg-muted">
                Apex tracks <span className="font-mono">subscription_event</span> through the
                full lifecycle — see it in real time on Apex Live.
              </p>
            </>
          )}
          {isSubscriber && (
            <Button
              fullWidth
              variant="ghost"
              iconLeft={<XCircle className="size-4" />}
              onClick={handleCancel}
              className="text-danger hover:bg-danger/10"
            >
              Cancel subscription
            </Button>
          )}
        </motion.div>

        {/* ── Plus-status post-cancel ──────────────────────────── */}
        {sub.status === "cancelled" && (
          <motion.div variants={fadeUp}>
            <Card variant="subtle">
              <CardBody className="py-4">
                <p className="text-sm text-fg">
                  Cancelled {sub.cancelledAt && new Date(sub.cancelledAt).toLocaleDateString()}.
                  You can resubscribe anytime — your Plus benefits resume immediately.
                </p>
                <Button
                  className="mt-3"
                  variant="secondary"
                  size="sm"
                  onClick={handleStartPaid}
                >
                  Resubscribe
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <Button variant="ghost" fullWidth onClick={() => navigate("/apex-live")}>
            See the events on Apex Live
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
}
