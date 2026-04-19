import { useEffect, useState } from "react";
import { Apex, logError, logEvent } from "@/apex";
import { useVisitorId } from "@/hooks/useVisitorId";
import type { AttStatus, DeviceInfo } from "@apex-inc/capacitor-plugin";

/**
 * Everything that's tangential to the core "track an event" flow —
 * identity overrides, iOS ATT prompt, IDFA/GAID inspection, install
 * referrer (Android), device info, test-mode toggle.
 */
export function SettingsScreen() {
  const { visitorId, setVisitorId } = useVisitorId();
  const [visitorInput, setVisitorInput] = useState("");
  const [attStatus, setAttStatus] = useState<AttStatus | null>(null);
  const [adId, setAdId] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [testMode, setTestMode] = useState(true);

  useEffect(() => {
    void Apex.getTrackingStatus().then((r) => setAttStatus(r.status));
    void Apex.getDeviceInfo().then((d) => setDevice(d));
    void Apex.getInstallReferrer().then((r) => setReferrer(r.referrer));
  }, []);

  const handleRequestAtt = async () => {
    try {
      const r = await Apex.requestTrackingAuthorization();
      setAttStatus(r.status);
      logEvent("ATT prompt result", { status: r.status });
    } catch (err) {
      logError("requestTrackingAuthorization failed", { error: String(err) });
    }
  };

  const handleGetAdId = async () => {
    const r = await Apex.getAdvertisingId();
    setAdId(r.id);
    logEvent("Got advertising ID", { fallback: r.fallback });
  };

  const handleSetVisitor = async () => {
    if (!visitorInput.trim()) return;
    await setVisitorId(visitorInput.trim());
    logEvent("Visitor ID overridden", { visitorId: visitorInput.trim() });
    setVisitorInput("");
  };

  const handleTestModeToggle = async () => {
    const next = !testMode;
    await Apex.setTestMode({ enabled: next });
    setTestMode(next);
    logEvent("Test mode", { enabled: next });
  };

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className="text-sm text-apex-muted">
          Inspect identifiers + device metadata. Toggle test mode without
          rebuilding.
        </p>
      </section>

      {/* ── Visitor identity ─────────────────────────────────────── */}
      <section className="apex-card space-y-2">
        <div className="apex-label">Visitor ID</div>
        <div className="font-mono text-[11px] text-apex-muted">
          current → {visitorId ?? "(not loaded)"}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-apex-amber focus:outline-none focus:ring-1 focus:ring-apex-amber"
            placeholder="override (e.g. user_42)"
            value={visitorInput}
            onChange={(e) => setVisitorInput(e.target.value)}
          />
          <button className="apex-btn-primary" onClick={handleSetVisitor}>
            Set
          </button>
        </div>
      </section>

      {/* ── iOS App Tracking Transparency ────────────────────────── */}
      <section className="apex-card space-y-2">
        <div className="apex-label">App Tracking Transparency (iOS)</div>
        <div className="text-[11px] text-apex-muted">
          status →{" "}
          <span className="font-mono">{attStatus ?? "unknown"}</span>
        </div>
        <button
          className="apex-btn-ghost w-full"
          onClick={handleRequestAtt}
          disabled={attStatus === "authorized" || attStatus === "denied"}
        >
          Request ATT prompt
        </button>
        <p className="text-[10px] text-apex-muted">
          The prompt only appears once per install. After that, the user
          changes their choice in iOS Settings.
        </p>
      </section>

      {/* ── Advertising ID ────────────────────────────────────────── */}
      <section className="apex-card space-y-2">
        <div className="apex-label">Advertising ID (IDFA / GAID)</div>
        <button className="apex-btn-ghost w-full" onClick={handleGetAdId}>
          Fetch
        </button>
        {adId !== null && (
          <div className="font-mono text-[11px] text-apex-muted">
            {adId || "(empty — LAT enabled or ATT denied)"}
          </div>
        )}
      </section>

      {/* ── Install referrer (Android) ───────────────────────────── */}
      <section className="apex-card space-y-1">
        <div className="apex-label">Install referrer (Android)</div>
        <div className="font-mono text-[11px] text-apex-muted">
          {referrer ?? "(unavailable — iOS or no referrer set)"}
        </div>
      </section>

      {/* ── Device info ──────────────────────────────────────────── */}
      <section className="apex-card space-y-1">
        <div className="apex-label">Device</div>
        {device ? (
          <ul className="space-y-0.5 text-[11px] text-apex-muted">
            <li>
              platform → <span className="font-mono">{device.platform}</span>
            </li>
            <li>
              os → <span className="font-mono">{device.osVersion}</span>
            </li>
            <li>
              model → <span className="font-mono">{device.model}</span>
            </li>
            <li>
              bundleId → <span className="font-mono">{device.bundleId}</span>
            </li>
            <li>
              app → <span className="font-mono">{device.appVersion}</span>
            </li>
          </ul>
        ) : (
          <div className="text-[11px] text-apex-muted">loading…</div>
        )}
      </section>

      {/* ── Test mode ─────────────────────────────────────────────── */}
      <section className="apex-card space-y-2">
        <div className="apex-label">Test mode</div>
        <p className="text-[11px] text-apex-muted">
          When enabled, every event is tagged <code>testMode: true</code> and
          routed to the server&apos;s TESTEVT# store — excluded from your
          production analytics.
        </p>
        <button className="apex-btn-ghost w-full" onClick={handleTestModeToggle}>
          {testMode ? "Disable test mode" : "Enable test mode"}
        </button>
      </section>
    </div>
  );
}
