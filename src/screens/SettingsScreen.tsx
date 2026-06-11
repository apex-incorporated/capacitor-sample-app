import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Key,
  Globe,
  ExternalLink,
  RefreshCcw,
  Smartphone,
  Users,
  Send,
  Bell,
  Hammer,
} from "lucide-react";
import type {
  PushPermissionStatus,
  ReleaseChannel,
  ReleaseChannelSource,
} from "@apex-inc/capacitor-plugin";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Apex, logError, logEvent, subscribePushToken } from "@/apex";
import {
  useApexConfig,
  updateApexConfig,
  resetApexConfig,
  DEFAULT_PROJECT_KEY,
  DEFAULT_API_URL,
} from "@/lib/apex-config";
import { DEMO_AFFILIATES, simulateAffiliateClick, useReferral, clearReferral } from "@/lib/referral";
import { track } from "@/lib/events";
import { listContainer, fadeUp, lightHaptic, successHaptic } from "@/brand/motion";

// MMP-061 — local copies of the channel label helpers. The app-side
// helpers live at `app/src/lib/mobile/release-channel.ts` but the sample
// app is a separate package — we duplicate the labels here rather than
// add a dependency. Keep these in sync with the canonical helpers.
function releaseChannelLabel(rc: ReleaseChannel | null): string {
  switch (rc) {
    case "xcode-debug":
      return "Xcode";
    case "testflight":
      return "TestFlight";
    case "app-store":
      return "App Store";
    case "play-internal":
      return "Play Internal";
    case "play-production":
      return "Play Store";
    case "sideloaded":
      return "Sideloaded";
    case "unknown":
    default:
      return "Unknown";
  }
}

function audienceBucketLabel(rc: ReleaseChannel | null): string {
  if (rc === "xcode-debug" || rc === "sideloaded") return "Dev";
  if (rc === "testflight" || rc === "play-internal") return "Beta";
  if (rc === "app-store" || rc === "play-production") return "Production";
  return "Unknown";
}

/**
 * Settings — Pattern A onboarding surface.
 *
 * Adopters paste their Apex project key + API URL here. No project
 * key is baked in — until one is saved (or supplied via
 * VITE_APEX_PROJECT_KEY at build time) events stay local.
 *
 * The friction documented here feeds `docs/dogfood-friction-log.md`.
 * If anything below feels clunky to you, log it — that's the spec
 * for the future Pattern C auto-provisioner.
 */
export function SettingsScreen() {
  const config = useApexConfig();
  const referral = useReferral();
  const navigate = useNavigate();
  const toast = useToast();

  const [projectKey, setProjectKey] = useState(config.projectKey);
  const [apiUrl, setApiUrl] = useState(config.apiUrl);

  const hasUnsaved =
    projectKey !== config.projectKey || apiUrl !== config.apiUrl;

  // ── Push notifications (MMP-177) ──────────────────────────────
  // Permission state is reflected back via plugin listeners so the
  // UI can show the registration outcome without polling. The
  // plugin auto-POSTs the APNs token to /api/mobile/push-token on
  // success, so the dashboard's "test push" step in the setup
  // wizard finds a registered device immediately.
  const [pushPermission, setPushPermission] = useState<PushPermissionStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  // MMP-061 — release channel + source from the native SDK. Surfaces
  // here as the "Build" badge so engineers dogfooding the sample app
  // never wonder which side of the Dev/Beta/Production line they're on.
  const [releaseChannel, setReleaseChannel] = useState<ReleaseChannel | null>(null);
  const [releaseChannelSource, setReleaseChannelSource] = useState<ReleaseChannelSource | null>(null);

  useEffect(() => {
    let alive = true;
    void Apex.getDeviceInfo().then((info) => {
      if (!alive) return;
      setReleaseChannel((info.releaseChannel ?? null) as ReleaseChannel | null);
      setReleaseChannelSource((info.releaseChannelSource ?? null) as ReleaseChannelSource | null);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    // Subscribe to the global token cache in `apex.ts`. This replays
    // the most recent token immediately on mount — so if `Apex.initialize`'s
    // silent re-register fired BEFORE this screen mounted, we still
    // show the token. If no token has arrived yet, the listener fires
    // with `null` and then again when the OS hands one over.
    const unsubscribe = subscribePushToken((token) => {
      setPushToken(token);
      if (token) {
        // Permission MUST be granted for iOS to issue a token. Without
        // this we'd render "Enable push" even though the OS has already
        // said yes.
        setPushPermission((prev) => prev ?? "granted");
      }
    });
    return unsubscribe;
  }, []);

  const handleEnablePush = async () => {
    setPushBusy(true);
    try {
      const result = await Apex.registerForPushNotifications();
      setPushPermission(result.permission);
      if (result.token) setPushToken(result.token);
      logEvent("Push registration", {
        permission: result.permission,
        hasToken: result.token !== null,
      });
      if (result.permission === "granted" && result.token) {
        toast.success(
          "Push notifications enabled",
          "Token sent to Apex — visible on the dashboard's mobile sensor.",
        );
      } else if (result.permission === "denied") {
        toast.error(
          "Notification permission denied",
          "Open iOS Settings → Notifications to change.",
        );
      }
    } catch (err) {
      logError("registerForPushNotifications failed", { error: String(err) });
      toast.error("Push registration failed", String(err));
    } finally {
      setPushBusy(false);
    }
  };

  const handleSave = () => {
    updateApexConfig({ projectKey: projectKey.trim(), apiUrl: apiUrl.trim() });
    toast.success("Apex config saved", "Restart the app for changes to take full effect.");
  };

  const handleReset = () => {
    resetApexConfig();
    setProjectKey(DEFAULT_PROJECT_KEY);
    setApiUrl(DEFAULT_API_URL);
    toast.info("Apex config cleared");
  };

  return (
    <>
      <Header large title="Settings" subtitle="Wire this app to your Apex workspace." />

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 px-5"
      >
        {/* ── Pattern A: project key + API URL ─────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Key className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle>Apex connection</CardTitle>
                  <CardDescription>
                    Paste your Apex project key + API URL to wire this app to
                    your workspace.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <TextField
                id="project-key"
                label="Project key"
                hint="Grab from your Apex dashboard at Settings → Snippet."
                placeholder="prj_..."
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                iconLeft={<Key className="size-4" />}
                monospace
              />
              <TextField
                id="api-url"
                label="API URL"
                hint="Your Apex deployment. Staging or production."
                placeholder="https://app.apex.inc"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                iconLeft={<Globe className="size-4" />}
                monospace
              />
              <div className="flex items-center gap-2 pt-1">
                <Button onClick={handleSave} disabled={!hasUnsaved}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  iconLeft={<RefreshCcw className="size-3.5" />}
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* ── Build badge (MMP-061) ─────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Hammer className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>Build</CardTitle>
                    {releaseChannel && (
                      <Badge
                        variant={
                          // Dev → neutral, Beta → success (visible), Production →
                          // primary. Mirrors the dashboard pill colour conventions
                          // so engineers learn the visual language once and it
                          // transfers everywhere.
                          releaseChannel === "testflight" || releaseChannel === "play-internal"
                            ? "success"
                            : releaseChannel === "app-store" || releaseChannel === "play-production"
                              ? "neutral"
                              : "neutral"
                        }
                      >
                        {releaseChannelLabel(releaseChannel)}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Apex auto-detected this build's source from{" "}
                    {releaseChannelSource === "override"
                      ? "your Gradle override"
                      : "the OS"}
                    . Events fired from this build land in the{" "}
                    <span className="font-medium">
                      {audienceBucketLabel(releaseChannel)}
                    </span>{" "}
                    audience on your dashboard.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/*
          2026-05-15 — The "Test mode" card used to live here. It was
          removed once sandbox projects became the recommended path:
          a sandbox project key (`sbx-…`) already isolates events from
          production billing + dashboards, and stacking `testMode: true`
          on top routed every event to `TESTEVT#`, which the server's
          identity + contact pipeline intentionally skips. The result
          was a documented footgun — empty Contacts, empty User
          Explorer, empty Identity Coverage. The SDK still accepts
          `testMode` for non-sandbox adopters; the sample app no
          longer surfaces the toggle.
        */}

        {/* ── Push notifications (MMP-177) ──────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>Push notifications</CardTitle>
                    {pushPermission && (
                      <Badge
                        variant={
                          pushPermission === "granted"
                            ? "success"
                            : pushPermission === "denied"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {pushPermission}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Prompt iOS for permission and register an APNs device
                    token. The plugin auto-POSTs the token to{" "}
                    <span className="font-mono text-[11px]">
                      /api/mobile/push-token
                    </span>{" "}
                    so it shows up on your Apex dashboard&apos;s mobile sensor
                    and the test-push step in the setup wizard finds it.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                fullWidth
                variant={pushToken ? "secondary" : "primary"}
                loading={pushBusy}
                onClick={handleEnablePush}
                disabled={pushPermission === "granted" && pushToken !== null}
                iconLeft={<Bell className="size-4" />}
              >
                {pushToken
                  ? "Token registered with Apex"
                  : "Enable push notifications"}
              </Button>
              {pushToken && (
                <div className="rounded-xl bg-surface-sunken px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                    APNs device token
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-fg-subtle">
                    {pushToken}
                  </p>
                </div>
              )}
              <p className="text-[10px] text-fg-subtle">
                iOS only. Android (FCM) lands in a follow-up plugin release.
              </p>
            </CardBody>
          </Card>
        </motion.div>

        {/* ── Test partner referral (AO-P5 FLAGSHIP) ───────────── */}
        <motion.div variants={fadeUp}>
          <Card accent="primary">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle>Test partner referral</CardTitle>
                  <CardDescription>
                    Simulate tapping an affiliate&apos;s Apex Link from outside the app.
                    The full attribution chain appears on the Apex Live tab.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              {referral && (
                <div className="rounded-xl bg-primary-soft px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Active referral
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-fg">
                    {referral.affiliateName} · {referral.campaignSlug}
                  </p>
                </div>
              )}
              {Object.values(DEMO_AFFILIATES).map((affiliate) => (
                <button
                  key={affiliate.id}
                  type="button"
                  onClick={() => {
                    void lightHaptic();
                    const captured = simulateAffiliateClick(affiliate.handle, "founders-tote");
                    if (captured) {
                      void track("deep_link_open", {
                        url: `https://apex-outfitters.links.apex.inc/founders-tote?ref=${affiliate.handle}&campaign=founders-tote`,
                        path: "/product/founders-tote",
                        affiliateId: captured.id,
                        affiliateHandle: captured.handle,
                        campaign: "founders-tote",
                        simulated: true,
                      });
                      void successHaptic();
                      toast.success(
                        `Tapped ${affiliate.name}'s link`,
                        "Heading to the linked product",
                      );
                      navigate("/product/founders-tote");
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-accent text-xs font-semibold">
                    {affiliate.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-fg">
                        {affiliate.name}
                      </p>
                      <Badge>
                        {(affiliate.commission.percentBps / 100).toFixed(0)}% revshare
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-fg-muted">
                      {affiliate.description}
                    </p>
                  </div>
                  <Send className="size-3.5 shrink-0 text-fg-subtle" />
                </button>
              ))}
              {referral && (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    clearReferral();
                    toast.info("Referral cleared");
                  }}
                  className="text-danger hover:bg-danger/10"
                >
                  Clear active referral
                </Button>
              )}
            </CardBody>
          </Card>
        </motion.div>

        {/* ── About Apex Outfitters ─────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card variant="subtle">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Smartphone className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle>About this app</CardTitle>
                  <CardDescription>
                    Apex Outfitters is an open-source reference app demonstrating
                    a real Apex integration. Every event you see fire here lands
                    in your Apex dashboard.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <a
                href="https://github.com/apex-incorporated/capacitor-sample-app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                View source on GitHub
                <ExternalLink className="size-3" />
              </a>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
