import { motion } from "framer-motion";
import {
  TrendingUp,
  Brain,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
import { useLiveEvents } from "@/lib/events";
import { useAuth } from "@/lib/auth-store";
import {
  deriveIntelligence,
  type Belief,
  type LTVFeature,
  type AudienceMembership,
  type ChurnRisk,
} from "@/lib/intelligence";
import { fadeUp } from "@/brand/motion";

/**
 * Apex Live → Intelligence section. Shows the user's current beliefs,
 * predicted LTV with SHAP-style breakdown, audience memberships, and
 * churn risk — all derived live from the local event stream.
 *
 * The honest-about-derivation note matters: adopters need to know
 * Apex's real intelligence is server-side cross-platform; this is a
 * client-side facsimile sharing the same shapes.
 */
export function IntelligencePanel() {
  const events = useLiveEvents();
  const { user } = useAuth();
  const intelligence = deriveIntelligence(events, user);

  if (events.length === 0) {
    return (
      <motion.div variants={fadeUp}>
        <Card variant="subtle">
          <CardBody className="py-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-sunken text-fg-subtle">
              <Brain className="size-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-fg">No intelligence yet</p>
            <p className="mt-1 text-xs text-fg-muted">
              Apex needs at least one event to start forming beliefs. Tap around the shop and the panel fills in.
            </p>
          </CardBody>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      {/* ── Header explainer ───────────────────────────────────── */}
      <Card>
        <CardBody className="flex items-start gap-3 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Brain className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight">User intelligence</h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              Beliefs, predicted LTV, audience memberships, churn risk — derived live from this session&apos;s events. In a real merchant integration Apex computes these server-side from cross-platform history.
            </p>
          </div>
        </CardBody>
      </Card>

      <PredictedLTVCard ltv={intelligence.ltv} />
      <ChurnRiskCard churn={intelligence.churn} />
      <BeliefsCard beliefs={intelligence.beliefs} />
      <AudienceCard audiences={intelligence.audiences} />
    </motion.div>
  );
}

// ─── LTV ─────────────────────────────────────────────────────────────

function PredictedLTVCard({ ltv }: { ltv: { totalUsd: number; confidence: number; features: LTVFeature[] } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <TrendingUp className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Predicted LTV
            </span>
            <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">
              ${ltv.totalUsd.toFixed(0)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-muted">
            <span>Confidence: {(ltv.confidence * 100).toFixed(0)}%</span>
            <span>·</span>
            <span>{ltv.features.length} signals contributing</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="size-4 text-fg-subtle" /> : <ChevronDown className="size-4 text-fg-subtle" />}
      </button>
      {expanded && (
        <div className="border-t border-border-subtle px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            SHAP-style breakdown
          </p>
          <ul className="space-y-2">
            {ltv.features.map((f, i) => (
              <li key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-fg">{f.label}</span>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      f.contributionUsd > 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {f.contributionUsd > 0 ? "+" : ""}${Math.abs(f.contributionUsd).toFixed(0)}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-fg-muted">{f.explanation}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-surface-sunken px-2.5 py-2 text-[10px] text-fg-muted">
            <Info className="mt-0.5 size-3 shrink-0" />
            <span>
              Transparency by design. Apex&apos;s real-world model uses gradient-boosted regression on richer cross-platform features — the inputs differ, the SHAP-style explanation surface is the same.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Churn ───────────────────────────────────────────────────────────

function ChurnRiskCard({ churn }: { churn: ChurnRisk }) {
  const tone = churn.band === "low" ? "success" : churn.band === "medium" ? "warning" : "danger";
  const Icon = churn.band === "low" ? CheckCircle2 : AlertTriangle;
  return (
    <Card>
      <CardBody className="flex items-start gap-3 py-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            tone === "success" && "bg-primary-soft text-success",
            tone === "warning" && "bg-warning/10 text-warning",
            tone === "danger" && "bg-danger/10 text-danger",
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Churn risk
            </span>
            <Badge variant={tone}>{churn.band}</Badge>
          </div>
          <div className="mt-0.5 text-sm font-medium text-fg">
            {(churn.score * 100).toFixed(0)}%
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">{churn.rationale}</p>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Beliefs ─────────────────────────────────────────────────────────

function BeliefsCard({ beliefs }: { beliefs: Belief[] }) {
  if (beliefs.length === 0) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-fg-subtle">
            <Brain className="size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Beliefs
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Apex hasn&apos;t formed beliefs yet. Browse and interact for a few minutes.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardBody className="space-y-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Brain className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              What Apex believes
            </p>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              {beliefs.length} belief{beliefs.length === 1 ? "" : "s"} with confidence ratings
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {beliefs.map((b) => (
            <li
              key={b.id}
              className={cn(
                "rounded-xl border px-3 py-2.5",
                b.tone === "positive" && "border-primary/30 bg-primary-soft",
                b.tone === "warning" && "border-warning/30 bg-warning/10",
                b.tone === "neutral" && "border-border bg-surface-sunken",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-fg">{b.label}</span>
                <span className="font-mono text-[10px] text-fg-muted">
                  {(b.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">{b.rationale}</p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

// ─── Audience memberships ────────────────────────────────────────────

function AudienceCard({ audiences }: { audiences: AudienceMembership[] }) {
  if (audiences.length === 0) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-fg-subtle">
            <Users className="size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Audiences
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              No audiences yet — sign up to enter the &quot;new installers&quot; cohort.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardBody className="space-y-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Users className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              You&apos;re in {audiences.length} audience{audiences.length === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              Each audience can trigger a journey, get a push, or feed an experiment.
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {audiences.map((a) => (
            <li key={a.id} className="rounded-xl bg-surface-sunken px-3 py-2">
              <p className="text-xs font-semibold text-fg">{a.label}</p>
              <p className="mt-0.5 text-[11px] text-fg-muted">{a.rationale}</p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
