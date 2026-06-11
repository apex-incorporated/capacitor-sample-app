import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Radio,
  Send,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Plus,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useApexConfig } from "@/lib/apex-config";
import { useLiveEvents, getEventExplainer, track, type LiveEvent } from "@/lib/events";
import { IntelligencePanel } from "@/components/apex-live/IntelligencePanel";
import { ReferralPanel } from "@/components/apex-live/ReferralPanel";
import { DeepLinkPanel } from "@/components/apex-live/DeepLinkPanel";
import { ExperimentPanel } from "@/components/apex-live/ExperimentPanel";
import { InAppInboxPanel } from "@/components/apex-live/InAppInboxPanel";
import { DashboardLinksPanel } from "@/components/apex-live/DashboardLinksPanel";
import { fadeUp, listContainer, spring } from "@/brand/motion";

export function ApexLiveScreen() {
  const config = useApexConfig();
  const events = useLiveEvents();
  const toast = useToast();
  const [customOpen, setCustomOpen] = useState(false);
  const [customType, setCustomType] = useState("paywall_viewed");
  const [customData, setCustomData] = useState(`{"surface": "subscription_upsell"}`);
  const [expanded, setExpanded] = useState<string | null>(null);

  const dashboardLink = useMemo(() => {
    const base = config.apiUrl.replace(/\/$/, "");
    return `${base}/dashboard/debug/events?projectKey=${encodeURIComponent(config.projectKey)}`;
  }, [config]);

  const handleFireCustom = async () => {
    let parsed: Record<string, unknown> | undefined;
    if (customData.trim()) {
      try {
        parsed = JSON.parse(customData) as Record<string, unknown>;
      } catch {
        toast.error("That data isn't valid JSON");
        return;
      }
    }
    await track(customType.trim() || "custom", parsed);
    toast.success(`Fired ${customType.trim()}`, "Check the stream below.");
    setCustomOpen(false);
  };

  return (
    <>
      <Header
        large
        title="Apex Live"
        subtitle="Every event you fire here is real."
        actions={
          <Badge variant="success" size="md">
            <Radio className="size-3" />
            Live
          </Badge>
        }
      />

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 px-5 pb-8"
      >
        {/* ── Connection summary ─────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardBody className="space-y-2 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-success">
                  <span className="size-1.5 animate-pulse rounded-full bg-success" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Streaming to Apex
                  </span>
                </div>
                <a
                  href={dashboardLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open in dashboard <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="space-y-0.5 text-sm">
                <div>
                  Project:{" "}
                  <span className="font-mono text-[12px]">{config.projectKey}</span>
                </div>
                <div className="text-fg-muted">
                  API: <span className="font-mono text-[12px]">{config.apiUrl}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* ── Dashboard tour (MMP-204) ───────────────────────────── */}
        <DashboardLinksPanel />

        {/* ── Partner referral chain (AO-P5 FLAGSHIP) ────────────── */}
        <ReferralPanel />

        {/* ── Intelligence panel (AO-P4) ─────────────────────────── */}
        <IntelligencePanel />

        {/* ── In-app inbox (AO-P10) ──────────────────────────────── */}
        <InAppInboxPanel />

        {/* ── Live experiment (AO-P9) ────────────────────────────── */}
        <ExperimentPanel />

        {/* ── Deep links surfaces (AO-P7) ────────────────────────── */}
        <DeepLinkPanel />

        {/* ── Fire custom event CTA ──────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card accent="primary">
            <CardBody className="flex flex-wrap items-start gap-4 py-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold tracking-tight">
                  Fire a custom event
                </h3>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Apex accepts any event type — extend the vocabulary as you go.
                  Custom events feed audiences + journey triggers identically to native ones.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setCustomOpen(true)}
                iconLeft={<Plus className="size-3.5" />}
              >
                Fire
              </Button>
            </CardBody>
          </Card>
        </motion.div>

        {/* ── Live stream ────────────────────────────────────────── */}
        <motion.section variants={fadeUp} className="space-y-3 pt-2">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                Live event stream
              </h3>
              <p className="text-xs text-fg-muted">
                Most recent first. Tap any event to see what it means.
              </p>
            </div>
            <Badge variant="primary">{events.length}</Badge>
          </div>

          {events.length === 0 ? (
            <Card variant="subtle">
              <CardBody className="py-10 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-sunken text-fg-subtle">
                  <Zap className="size-5" />
                </div>
                <p className="mt-3 text-sm font-medium text-fg">No events yet</p>
                <p className="mt-1 text-xs text-fg-muted">
                  Browse the shop, add to cart, or fire a custom event above. Every
                  interaction shows up here in real time.
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    expanded={expanded === ev.id}
                    onToggle={() => setExpanded((cur) => (cur === ev.id ? null : ev.id))}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      </motion.div>

      {/* ── Custom event sheet ────────────────────────────────────── */}
      <Sheet
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Fire a custom event"
        description="Anything Apex receives gets stored, audience-able, and journey-triggerable. Try paywall_viewed, video_played, referral_invited."
      >
        <div className="space-y-4">
          <TextField
            label="Event type"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="paywall_viewed"
            monospace
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">
              Data (JSON, optional)
            </label>
            <textarea
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              className="h-32 w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs text-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder='{"key": "value"}'
              spellCheck={false}
            />
            <p className="mt-1 text-[11px] text-fg-subtle">
              Leave empty for an event with no payload.
            </p>
          </div>
          <Button onClick={handleFireCustom} fullWidth size="lg" iconLeft={<Send className="size-4" />}>
            Fire event
          </Button>
        </div>
      </Sheet>
    </>
  );
}

// ─── Event card ──────────────────────────────────────────────────────

function EventCard({
  event,
  expanded,
  onToggle,
}: {
  event: LiveEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const explainer = getEventExplainer(event.type);
  const timeAgo = useTimeAgo(event.at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={spring.snap}
    >
      <Card>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-3 px-4 py-3 text-left"
        >
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
            <Zap className="size-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[13px] font-medium text-fg">
                {event.type}
              </span>
              <span className="text-[10px] text-fg-subtle">{timeAgo}</span>
            </div>
            {event.data && Object.keys(event.data).length > 0 && (
              <p className="mt-0.5 truncate font-mono text-[10px] text-fg-muted">
                {summarizeData(event.data)}
              </p>
            )}
          </div>
          {explainer ? (
            expanded ? (
              <ChevronUp className="size-3.5 shrink-0 text-fg-subtle" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0 text-fg-subtle" />
            )
          ) : null}
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-border-subtle px-4 py-3">
                {explainer && (
                  <>
                    <ExpanderRow label="What this means" body={explainer.what} />
                    <ExpanderRow label="Why Apex cares" body={explainer.why} />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                        Powers
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {explainer.powers.map((p) => (
                          <Badge key={p} variant="primary">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {event.data && Object.keys(event.data).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                      Payload
                    </p>
                    <pre className="mt-1.5 max-h-48 overflow-auto rounded-lg bg-surface-sunken p-2.5 font-mono text-[10px] text-fg">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function ExpanderRow({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg">{body}</p>
    </div>
  );
}

function summarizeData(data: Record<string, unknown>): string {
  const keys = Object.keys(data);
  if (keys.length === 0) return "";
  return keys
    .slice(0, 3)
    .map((k) => {
      const v = data[k];
      if (typeof v === "object") return `${k}: …`;
      return `${k}: ${String(v).slice(0, 24)}`;
    })
    .join(" · ");
}

function useTimeAgo(iso: string): string {
  const [, force] = useState(0);
  const date = useMemo(() => new Date(iso), [iso]);
  // Keep "X s ago" labels fresh on a 5s tick.
  useMemo(() => {
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.round((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}
