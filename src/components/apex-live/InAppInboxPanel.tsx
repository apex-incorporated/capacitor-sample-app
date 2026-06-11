import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/utils";
import { useApexConfig } from "@/lib/apex-config";
import { track } from "@/lib/events";
import { fadeUp } from "@/brand/motion";

/**
 * AO-P10 — In-app message inbox.
 *
 * Demonstrates Apex's in_app_push channel — overlay messages
 * displayed inside the running app, distinct from OS-level pushes.
 *
 * In production, the plugin's `addListener("inAppMessage", ...)`
 * hook (or a polling endpoint) delivers messages triggered by the
 * dashboard's Communications module. For the demo we seed two
 * sample messages locally + provide a "trigger one from your
 * dashboard" instruction.
 */

interface InAppMessage {
  id: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  receivedAt: string;
  seen: boolean;
  variant?: "promotion" | "lifecycle" | "support";
}

const DEMO_MESSAGES: InAppMessage[] = [
  {
    id: "msg_welcome",
    title: "Welcome to Apex Outfitters",
    body: "Apex's in-app message channel delivers contextual nudges without an OS push. This message was triggered by your audience entering 'New installers'.",
    ctaLabel: "Shop the essentials",
    ctaUrl: "/shop",
    receivedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    seen: false,
    variant: "lifecycle",
  },
  {
    id: "msg_plus_promo",
    title: "Try Apex Outfitters Plus free",
    body: "7 days of free shipping + early access. After that, $9.99/mo. Cancel anytime.",
    ctaLabel: "Start trial",
    ctaUrl: "/subscription",
    receivedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    seen: false,
    variant: "promotion",
  },
];

export function InAppInboxPanel() {
  const [messages, setMessages] = useState<InAppMessage[]>(DEMO_MESSAGES);
  const config = useApexConfig();
  const toast = useToast();

  const composerLink = `${config.apiUrl.replace(/\/$/, "")}/dashboard/communications`;

  const dismiss = (id: string) => {
    setMessages((cur) => cur.filter((m) => m.id !== id));
  };

  const markSeen = (msg: InAppMessage) => {
    if (msg.seen) return;
    setMessages((cur) =>
      cur.map((m) => (m.id === msg.id ? { ...m, seen: true } : m)),
    );
    void track("in_app_message_seen", { messageId: msg.id, variant: msg.variant });
  };

  const triggerDemo = () => {
    const next: InAppMessage = {
      id: `msg_demo_${Date.now()}`,
      title: "Heads up — you're in the cart-abandonment audience",
      body: "Apex auto-built this message after seeing 2+ cart events without a purchase. In production it'd come from your Communications composer.",
      ctaLabel: "Finish checkout",
      ctaUrl: "/cart",
      receivedAt: new Date().toISOString(),
      seen: false,
      variant: "lifecycle",
    };
    setMessages((cur) => [next, ...cur]);
    void track("in_app_message_received", {
      messageId: next.id,
      variant: next.variant,
      simulated: true,
    });
    toast.success("In-app message queued", "Real one would arrive via the Apex plugin.");
  };

  const unseen = messages.filter((m) => !m.seen).length;

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <Card>
        <CardBody className="flex items-start gap-3 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <MessageCircle className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight">In-app messages</h3>
              {unseen > 0 && <Badge variant="primary">{unseen} unread</Badge>}
            </div>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              Apex&apos;s in_app_push channel. Server-triggered overlay messages, distinct from OS pushes.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* ── Demo messages ──────────────────────────────────────── */}
      {messages.length === 0 ? (
        <Card variant="subtle">
          <CardBody className="py-6 text-center">
            <p className="text-xs text-fg-muted">No messages right now.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <button
              key={msg.id}
              type="button"
              onClick={() => markSeen(msg)}
              className="block w-full text-left"
            >
              <Card>
                <CardBody className="space-y-2 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "size-1.5 rounded-full",
                          msg.seen ? "bg-fg-subtle" : "bg-primary animate-pulse",
                        )}
                      />
                      <p className="text-sm font-semibold text-fg">{msg.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(msg.id);
                      }}
                      className="flex size-6 items-center justify-center rounded text-fg-subtle hover:bg-surface-sunken hover:text-danger"
                      aria-label="Dismiss"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                  <p className="text-xs text-fg-muted">{msg.body}</p>
                  {msg.ctaLabel && msg.ctaUrl && (
                    <a
                      href={msg.ctaUrl}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      {msg.ctaLabel} →
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-fg-subtle">
                    {msg.variant && <Badge>{msg.variant}</Badge>}
                    <span>{new Date(msg.receivedAt).toLocaleTimeString()}</span>
                  </div>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* ── Trigger demo ───────────────────────────────────────── */}
      <Card variant="subtle">
        <CardBody className="space-y-2 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Trigger one from your dashboard
            </span>
          </div>
          <p className="text-xs text-fg-muted">
            Compose a communication with channel <span className="font-mono">in_app_push</span>, send to your audience, watch it land here in seconds.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={composerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-sunken"
            >
              Open composer <ExternalLink className="size-3" />
            </a>
            <Button size="sm" variant="ghost" onClick={triggerDemo}>
              Simulate one
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
