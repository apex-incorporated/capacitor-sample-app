import { StatPill } from "@/components/StatPill";
import { EventLog } from "@/components/EventLog";
import { useQueueStatus } from "@/hooks/useQueueStatus";
import { useVisitorId } from "@/hooks/useVisitorId";
import { Apex, logError, logEvent } from "@/apex";
import { useState } from "react";

/**
 * The Home screen demonstrates the three most common plugin calls:
 *
 *   - Apex.track(...)   — enqueue an arbitrary event
 *   - Apex.startSession / endSession — force the session boundary
 *   - Apex.flushQueue   — flush the offline queue on demand
 *
 * The stats at the top (visitor ID, queue size) update via polling
 * hooks so the numbers always reflect the SDK's real state.
 */
export function HomeScreen() {
  const { status: queue, refresh: refreshQueue } = useQueueStatus();
  const { visitorId } = useVisitorId();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleTrack = async (type: string, data?: Record<string, unknown>) => {
    setBusy(true);
    try {
      await Apex.track({ type, data });
      logEvent(`track(${type})`, data);
      await refreshQueue();
    } catch (err) {
      logError(`track(${type}) failed`, { error: String(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleStartSession = async () => {
    const res = await Apex.startSession();
    setSessionId(res.sessionId);
    logEvent("Session started", { sessionId: res.sessionId });
  };

  const handleEndSession = async () => {
    await Apex.endSession();
    setSessionId(null);
    logEvent("Session ended");
  };

  const handleFlush = async () => {
    const res = await Apex.flushQueue();
    logEvent("Queue flushed", { flushed: res.flushed, remaining: res.remaining });
    await refreshQueue();
  };

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-2xl font-black tracking-tight">Home</h1>
        <p className="text-sm text-apex-muted">
          Track events, inspect the queue, and stream the results into your
          Apex debug console.
        </p>
      </section>

      <section className="flex gap-3">
        <StatPill
          label="Visitor"
          value={visitorId ? visitorId.slice(0, 8) : "…"}
          sub={visitorId ? "persisted locally" : "loading"}
        />
        <StatPill
          label="Queue"
          value={queue ? String(queue.count) : "…"}
          sub={
            queue?.oldestEventAt
              ? `oldest ${relative(queue.oldestEventAt)}`
              : "empty"
          }
        />
      </section>

      <section className="apex-card space-y-3">
        <div className="apex-label">Track a custom event</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="apex-btn-primary"
            disabled={busy}
            onClick={() => handleTrack("custom", { source: "home_button" })}
          >
            Generic custom
          </button>
          <button
            className="apex-btn-ghost"
            disabled={busy}
            onClick={() => handleTrack("feature_used", { feature: "home" })}
          >
            feature_used
          </button>
          <button
            className="apex-btn-ghost"
            disabled={busy}
            onClick={() => handleTrack("tutorial_completed")}
          >
            tutorial_completed
          </button>
          <button
            className="apex-btn-ghost"
            disabled={busy}
            onClick={() => handleTrack("content_view", { contentId: "home-001" })}
          >
            content_view
          </button>
        </div>
      </section>

      <section className="apex-card space-y-3">
        <div className="apex-label">Session control</div>
        <p className="text-[11px] text-apex-muted">
          Sessions auto-start on app open and auto-end after 30 min of
          inactivity. These buttons let you force the boundaries for
          testing.
        </p>
        <div className="flex gap-2">
          <button className="apex-btn-primary" onClick={handleStartSession}>
            Start session
          </button>
          <button className="apex-btn-ghost" onClick={handleEndSession}>
            End session
          </button>
        </div>
        {sessionId && (
          <div className="font-mono text-[11px] text-apex-muted">
            current → {sessionId}
          </div>
        )}
      </section>

      <section className="apex-card space-y-3">
        <div className="apex-label">Offline queue</div>
        <p className="text-[11px] text-apex-muted">
          When the device is offline, events pile up locally. On next
          connection they drain automatically; the button forces an
          immediate drain.
        </p>
        <button className="apex-btn-ghost w-full" onClick={handleFlush}>
          Flush queue now
        </button>
      </section>

      <section className="space-y-1.5">
        <div className="apex-label px-1">Event log</div>
        <EventLog />
      </section>
    </div>
  );
}

function relative(iso: string): string {
  const seconds = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}
