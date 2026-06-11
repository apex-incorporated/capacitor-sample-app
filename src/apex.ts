/**
 * Apex SDK wrapper for the sample app.
 *
 * One place to import + initialise `@apex-inc/capacitor-plugin`, plus a
 * small `logEvent` helper that every screen uses to record what we did so
 * the in-app Event Log stays accurate.
 *
 * The wrapper is deliberately a thin veneer — everywhere in this app you
 * can also call the plugin's methods directly. The point of keeping a
 * single `apex.ts` module is discoverability, not abstraction.
 */

import { Apex } from "@apex-inc/capacitor-plugin";
import { getApexConfig } from "./lib/apex-config";
import { markApexReady } from "./lib/events";

type LogKind = "info" | "event" | "error";

export interface LogEntry {
  id: string;
  at: string;
  kind: LogKind;
  message: string;
  data?: Record<string, unknown>;
}

type Listener = (entries: LogEntry[]) => void;

const MAX_ENTRIES = 50;
const entries: LogEntry[] = [];
const listeners = new Set<Listener>();

function push(entry: Omit<LogEntry, "id" | "at">) {
  const next: LogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  entries.unshift(next);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  for (const l of listeners) l([...entries]);
}

/** Subscribe to the in-app log. Returns an unsubscribe fn. */
export function subscribeLog(listener: Listener): () => void {
  listener([...entries]);
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Log a human-readable event the UI can display. */
export function logEvent(message: string, data?: Record<string, unknown>) {
  push({ kind: "event", message, data });
}

export function logInfo(message: string, data?: Record<string, unknown>) {
  push({ kind: "info", message, data });
}

export function logError(message: string, data?: Record<string, unknown>) {
  push({ kind: "error", message, data });
}

/**
 * Initialise the plugin. Safe to call multiple times — the plugin
 * ignores repeated initialise calls.
 *
 * Reads project key + API URL from the live config in `apex-config.ts`
 * (Pattern A onboarding). There is no default project key — until the
 * adopter pastes one in Settings → Apex (or sets VITE_APEX_PROJECT_KEY
 * in .env.local), initialization is skipped and events stay local.
 *
 * 2026-05-15 — `testMode` is no longer threaded through. The sample
 * app exclusively targets sandbox projects; sandbox is the isolation
 * primitive. See `apex-config.ts` for the full rationale.
 */
export async function initApex(): Promise<void> {
  const config = getApexConfig();
  if (!config.projectKey) {
    logInfo(
      "Apex not configured — paste your project key in Settings → Apex connection. Events stay local until then.",
    );
    return;
  }
  try {
    await Apex.initialize({
      projectKey: config.projectKey,
      apiUrl: config.apiUrl,
      debug: true,
    });
    // Signal `track()` to drain its pre-init buffer + accept further
    // events synchronously. Without this, the first events fired
    // before initialize resolves are silently dropped.
    markApexReady();
    logInfo(
      `Apex initialised (project: ${config.projectKey}, api: ${config.apiUrl})`,
    );
  } catch (err) {
    logError("Apex.initialize failed", { error: String(err) });
  }
}

/**
 * Phase 2-sample — wrap `Apex.identify()` with the same in-app
 * logging hook the rest of the sample-app uses for events. Screens
 * call this immediately on signup / signin so the visitor->Contact
 * link is verified BEFORE the subsequent `track("user_signed_up")`
 * fires. The track event then trips the server-side quarantine-mode
 * auto-stitch path (Phase 2-quarantine) but finds an already-verified
 * Contact for this visitor and is a no-op promotion.
 *
 * Failure handling: we log + continue. Identify is best-effort from
 * the sample-app's perspective — the track call still fires + lands
 * a quarantined Contact that the merchant can promote later via the
 * dashboard's verify-pill flow.
 */
export async function identifyUser(opts: {
  email: string;
  userId?: string;
  traits?: Record<string, unknown>;
}): Promise<void> {
  try {
    await Apex.identify({
      email: opts.email,
      userId: opts.userId,
      traits: opts.traits,
    });
    logEvent("Apex.identify ✓", { email: opts.email, userId: opts.userId });
  } catch (err) {
    logError("Apex.identify failed", { error: String(err) });
  }
}

// ── Push token cache ────────────────────────────────────────────────
//
// The plugin's `Apex.initialize()` silently re-registers for remote
// notifications when iOS has already granted permission, then fires
// `pushTokenReceived` once the device token arrives. That event can
// arrive BEFORE any screen has mounted — which means the SettingsScreen's
// own `pushTokenReceived` listener (subscribed in a useEffect) misses
// the event and shows "no token" until the user manually taps "Enable
// push". Cache it here at module scope + replay on subscribe so the UI
// is in sync regardless of mount order.
let cachedPushToken: string | null = null;
const tokenListeners = new Set<(token: string | null) => void>();

void Apex.addListener("pushTokenReceived", (event) => {
  const changed = cachedPushToken !== event.token;
  cachedPushToken = event.token;
  if (changed) {
    logEvent("Push token received", {
      token: event.token,
      platform: event.platform,
    });
  }
  for (const fn of tokenListeners) fn(event.token);
}).catch((err) => {
  logError("Failed to wire pushTokenReceived listener", { error: String(err) });
});

/** Read the most recent APNs token the plugin has surfaced, or null. */
export function getCachedPushToken(): string | null {
  return cachedPushToken;
}

// ── Push tap: engagement report + deep-link routing ─────────────────
//
// When the user taps a notification, the plugin fires `pushClicked` with
// the payload's custom `data` (which carries `url`, `messageId`, and the
// signed `apexToken` Apex baked in at send time). This handler does the
// two things every Apex-powered app should do on a tap:
//
//   1. Report the open to the trusted ingest endpoint
//      (`POST /api/track/push-event`) so any journey engagement branch
//      ("Did they open it?") resumes down the opened path. The signed
//      token is the authenticity proof — no token, no report.
//   2. Route the user to `data.url` (a web URL or an app deep-link path).
//
// Adopters copy this pattern, mapping `data.url` to their own router.
void Apex.addListener("pushClicked", (event) => {
  const data = (event?.data ?? {}) as Record<string, unknown>;
  const token = typeof data.apexToken === "string" ? data.apexToken : undefined;
  const url = typeof data.url === "string" ? data.url : undefined;
  logEvent("Push clicked", { url, reported: !!token });

  if (token) {
    const apiUrl = getApexConfig().apiUrl.replace(/\/+$/, "");
    void fetch(`${apiUrl}/api/track/push-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "opened" }),
    }).catch((err) =>
      logError("push-event report failed", { error: String(err) }),
    );
  }

  if (url) {
    try {
      if (/^https?:\/\//i.test(url)) {
        window.location.href = url;
      } else {
        // App deep-link path (e.g. "products/iphone-17-pro-max").
        window.location.hash = url.startsWith("#")
          ? url
          : `#/${url.replace(/^\/+/, "")}`;
      }
    } catch {
      /* ignore routing failure */
    }
  }
}).catch((err) => {
  logError("Failed to wire pushClicked listener", { error: String(err) });
});

/**
 * Subscribe to token changes. The listener is called immediately with
 * the current cached value (which may be null) and again whenever the
 * plugin fires `pushTokenReceived`. Returns an unsubscribe fn.
 */
export function subscribePushToken(
  listener: (token: string | null) => void,
): () => void {
  listener(cachedPushToken);
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

/** Re-export the plugin singleton so screens can call it directly. */
export { Apex };
