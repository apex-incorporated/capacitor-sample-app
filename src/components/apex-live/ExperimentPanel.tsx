import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, ArrowLeftRight, TrendingUp, Info } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
import { fadeUp } from "@/brand/motion";

/**
 * AO-P9 — Demo experiment panel.
 *
 * A running experiment on the Subscription tier offer screen:
 * paywall layout (control = horizontal pricing card, variant_b =
 * vertical pricing with 'save 20%' callout).
 *
 * In production, `Apex.getVariant({ experimentId })` would return
 * the assignment + payload + eligibility from the server. Here we
 * simulate the assignment locally + persist it so the experience
 * stays consistent across screen visits. Operators can manually
 * flip variants from this panel for screenshots / verification.
 */

const STORAGE_KEY = "apex_outfitters.experiment_paywall_v1";

interface ExperimentAssignment {
  variant: "control" | "variant_b";
  assignedAt: string;
}

function getAssignment(): ExperimentAssignment {
  if (typeof window === "undefined") {
    return { variant: "control", assignedAt: new Date().toISOString() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ExperimentAssignment;
  } catch {
    // fallthrough
  }
  // Bucket on first read — 50/50.
  const variant: ExperimentAssignment["variant"] = Math.random() < 0.5 ? "control" : "variant_b";
  const assignment: ExperimentAssignment = { variant, assignedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignment));
  } catch {
    // best effort
  }
  return assignment;
}

function setAssignment(variant: ExperimentAssignment["variant"]): void {
  const next: ExperimentAssignment = { variant, assignedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best effort
  }
}

export function ExperimentPanel() {
  const [variant, setVariant] = useState<ExperimentAssignment["variant"]>("control");

  useEffect(() => {
    setVariant(getAssignment().variant);
  }, []);

  const flip = () => {
    const next = variant === "control" ? "variant_b" : "control";
    setAssignment(next);
    setVariant(next);
  };

  // Simulated stats — these mirror what /api/experiments/<id>/assign
  // would return alongside the variant payload in production.
  const stats = {
    control: { installs: 247, conversionPct: 4.2 },
    variant_b: { installs: 251, conversionPct: 6.8 },
  };
  const probBetter = 0.89; // posterior probability variant_b > control

  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardBody className="space-y-3 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FlaskConical className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold tracking-tight">Live experiment</h3>
              <p className="mt-0.5 text-[11px] text-fg-muted">
                exp_paywall_layout · Subscription tier offer screen
              </p>
            </div>
            <Badge variant="primary">{variant}</Badge>
          </div>

          {/* ── Stats ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5",
                variant === "control" ? "border-primary/40 bg-primary-soft" : "border-border bg-surface-sunken",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Control
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-fg">
                {stats.control.conversionPct}%
              </p>
              <p className="text-[10px] text-fg-subtle">
                {stats.control.installs} installs
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5",
                variant === "variant_b" ? "border-primary/40 bg-primary-soft" : "border-border bg-surface-sunken",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Variant B
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-fg">
                {stats.variant_b.conversionPct}%
              </p>
              <p className="text-[10px] text-fg-subtle">
                {stats.variant_b.installs} installs
              </p>
            </div>
          </div>

          {/* ── Posterior ──────────────────────────────────────── */}
          <div className="flex items-center gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-[11px] text-fg-muted">
            <TrendingUp className="size-3.5 text-success" />
            <span>
              Variant B is better with{" "}
              <span className="font-semibold text-fg">{(probBetter * 100).toFixed(0)}%</span> probability
              (Thompson-sampling posterior)
            </span>
          </div>

          {/* ── Operator override ──────────────────────────────── */}
          <Button
            size="sm"
            variant="secondary"
            fullWidth
            iconLeft={<ArrowLeftRight className="size-3.5" />}
            onClick={flip}
          >
            Flip to {variant === "control" ? "variant B" : "control"} for testing
          </Button>

          <div className="flex items-start gap-1.5 rounded-lg bg-surface-sunken px-2.5 py-2 text-[10px] text-fg-muted">
            <Info className="mt-0.5 size-3 shrink-0" />
            <span>
              In production, Apex.getVariant() returns the server-side assignment + the
              variant payload (e.g. paywall layout config). Apex&apos;s Thompson sampler
              gradually shifts traffic toward the winning variant.
            </span>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

export function useExperimentVariant(): "control" | "variant_b" {
  const [variant, setVariant] = useState<"control" | "variant_b">("control");
  useEffect(() => {
    setVariant(getAssignment().variant);
  }, []);
  return variant;
}
