import { motion } from "framer-motion";
import {
  Activity,
  Users,
  Smartphone,
  Link2,
  UserCircle,
  Layers,
  MessageCircle,
  ExternalLink,
  Key,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { useApexConfig } from "@/lib/apex-config";
import { fadeUp } from "@/brand/motion";

/**
 * AO-Dashboard tour — bridges the in-app demo to the dashboard.
 *
 * Every surface inside Apex Outfitters has a dashboard counterpart
 * where the data actually lives. This panel lists each one with a
 * direct deep link to your project so you never have to hunt for
 * the right URL. Surfaces are ordered to mirror the walkthrough
 * doc (`docs/dashboard-walkthrough.md`).
 */
export function DashboardLinksPanel() {
  const config = useApexConfig();
  const base = config.apiUrl.replace(/\/$/, "");
  const pk = encodeURIComponent(config.projectKey);

  const surfaces = [
    {
      icon: Activity,
      title: "Live event firehose",
      hint: "Every event you fire in the app, streamed in real time",
      href: `${base}/dashboard/debug/events?projectKey=${pk}`,
      pillarsTo: ["Every tap"],
    },
    {
      icon: UserCircle,
      title: "Contacts",
      hint: "Signed-up users become Contacts here. Pre-signup events are stitched in.",
      href: `${base}/dashboard/contacts?projectKey=${pk}`,
      pillarsTo: ["Sign up in the app"],
    },
    {
      icon: Smartphone,
      title: "Mobile attribution + LTV",
      hint: "Installs, revenue, retention cohorts, ARPU, LTV — keyed off your in_app_purchase events",
      href: `${base}/dashboard/mobile?projectKey=${pk}`,
      pillarsTo: ["Buy something"],
    },
    {
      icon: Users,
      title: "Partners (affiliates)",
      hint: "Ari Demo + every other affiliate. Run npm run seed first to provision Ari server-side.",
      href: `${base}/dashboard/partners?projectKey=${pk}`,
      pillarsTo: ["Settings → Test partner referral"],
    },
    {
      icon: Link2,
      title: "Apex Links",
      hint: "CRUD the deep-link slugs behind affiliates, QR codes, SMS campaigns",
      href: `${base}/dashboard/mobile/links?projectKey=${pk}`,
      pillarsTo: ["Apex Live → Deep Links panel"],
    },
    {
      icon: Layers,
      title: "Audiences",
      hint: "Predicate cohorts powering journey triggers + broadcasts",
      href: `${base}/dashboard/audiences?projectKey=${pk}`,
      pillarsTo: ["Add to cart, sign up, etc."],
    },
    {
      icon: MessageCircle,
      title: "Communications",
      hint: "Compose push / in-app / email. Sends fan out via multi-channel-dispatch",
      href: `${base}/dashboard/communications?projectKey=${pk}`,
      pillarsTo: ["Apex Live → In-app inbox"],
    },
    {
      icon: Key,
      title: "API keys",
      hint: "Generate apex_sk_ keys for the seed script + SDK callers",
      href: `${base}/dashboard/settings/organization/api-keys`,
      pillarsTo: ["Running npm run seed"],
    },
  ];

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <Card>
        <CardBody className="flex items-start gap-3 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ExternalLink className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight">See it in your dashboard</h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              Every surface inside Apex Outfitters has a dashboard counterpart
              where the data lives. Tap a card to open it.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-2">
        {surfaces.map((s) => (
          <a
            key={s.title}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="transition-colors hover:bg-surface-sunken">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <s.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-fg-muted">{s.hint}</p>
                  {s.pillarsTo[0] && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-fg-subtle">
                      Trigger: {s.pillarsTo[0]}
                    </p>
                  )}
                </div>
                <ExternalLink className="size-3.5 shrink-0 text-fg-subtle" />
              </div>
            </Card>
          </a>
        ))}
      </div>
    </motion.div>
  );
}
