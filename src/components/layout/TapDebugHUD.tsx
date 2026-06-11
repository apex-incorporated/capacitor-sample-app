import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * On-screen tap event log. Renders a compact, semi-transparent
 * overlay in the top-right that records the most recent
 * pointer/touch/click/nav events fired anywhere in the app. Use it
 * when iOS Simulator + Safari Web Inspector setup is overkill —
 * this works inside the Capacitor WebView with no remote tooling.
 *
 * Activation: ON by default while we're diagnosing the iOS tap
 * issue. Disable with `?debug=off` (persists across reloads via
 * localStorage), re-enable with `?debug=tap`. Once the bug is
 * fixed, default this to off and ship.
 *
 * Usage from the rest of the app: import `tapDebug.log(...)` and
 * call it from interaction handlers. The HUD subscribes to a tiny
 * pub/sub channel so logging is decoupled from rendering.
 */

const STORAGE_KEY = "apex_outfitters.debug_tap";
const MAX_ENTRIES = 14;

export interface TapDebugEntry {
  id: number;
  at: number; // performance.now() ms
  kind: "pointerdown" | "pointerup" | "click" | "navigate" | "info";
  target: string;
  detail?: string;
}

type Listener = (entries: TapDebugEntry[]) => void;

let nextId = 0;
const buffer: TapDebugEntry[] = [];
const listeners = new Set<Listener>();

function emit(entry: Omit<TapDebugEntry, "id" | "at">): void {
  const full: TapDebugEntry = {
    ...entry,
    id: ++nextId,
    at: typeof performance !== "undefined" ? performance.now() : Date.now(),
  };
  buffer.unshift(full);
  if (buffer.length > MAX_ENTRIES) buffer.length = MAX_ENTRIES;
  for (const fn of listeners) fn([...buffer]);
}

/**
 * Public log API. True no-op when nothing is subscribed (HUD
 * disabled) — call sites pay zero cost. When the HUD is enabled
 * the cost is one object literal + array shift per call.
 */
export const tapDebug = {
  log(
    kind: TapDebugEntry["kind"],
    target: string,
    detail?: string,
  ): void {
    if (listeners.size === 0) return;
    emit({ kind, target, detail });
  },
};

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.location.search.includes("debug=tap")) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      return true;
    }
    if (window.location.search.includes("debug=off")) {
      window.localStorage.setItem(STORAGE_KEY, "0");
      return false;
    }
    // Default OFF. The HUD itself adds JS-thread work per tap (the
    // pub/sub dispatch + setState + framer-motion AnimatePresence
    // for each entry), which on iOS WKWebView contributes to the
    // very thread-blocking we were trying to diagnose with it. Opt
    // in explicitly with `?debug=tap` when needed.
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const KIND_COLOR: Record<TapDebugEntry["kind"], string> = {
  pointerdown: "#22c55e",
  pointerup: "#84cc16",
  click: "#3b82f6",
  navigate: "#a855f7",
  info: "#94a3b8",
};

export function TapDebugHUD() {
  const [enabled] = useState(isEnabled);
  const [entries, setEntries] = useState<TapDebugEntry[]>(() => [...buffer]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const listener: Listener = (next) => setEntries(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [enabled]);

  // While debugging, outline every tab-button tap target so you can
  // see (a) exactly where each button accepts touches and (b) where
  // the iOS home-indicator gesture zone overlaps. Outlines vanish
  // when the HUD is disabled. Injected via a <style> tag instead of
  // a Tailwind class because the tab buttons don't import this file.
  useEffect(() => {
    if (!enabled) return;
    const style = document.createElement("style");
    style.textContent = `
      [role="tablist"] [role="tab"] {
        outline: 1px dashed rgba(34, 197, 94, 0.5);
        outline-offset: -1px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [enabled]);

  // Document-level capture listeners. ALWAYS log (no filtering) so
  // we can distinguish four cases when diagnosing missed taps:
  //
  //  1. doc:touch + doc:pointer + tab pointerdown      → tap fully delivered
  //  2. doc:touch + doc:pointer + (no tab pointerdown) → button handler broken
  //  3. doc:touch + (no doc:pointer)                   → iOS sending touch
  //                                                       but not pointer events
  //  4. (nothing logged at all)                        → iOS WKWebView consumed
  //                                                       the touch before the
  //                                                       page got it (gesture
  //                                                       recognizer, scroll
  //                                                       momentum, etc.)
  useEffect(() => {
    if (!enabled) return;
    const targetLabel = (t: EventTarget | null): string => {
      if (!(t instanceof Element)) return "?";
      const onTab = !!t.closest("nav button");
      const tag = t.tagName.toLowerCase();
      return onTab ? `tab:${tag}` : `doc:${tag}`;
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0] ?? e.changedTouches[0];
      tapDebug.log(
        "info",
        targetLabel(e.target),
        `touchstart x${e.touches.length}${
          t ? ` @${Math.round(t.clientX)},${Math.round(t.clientY)}` : ""
        }`,
      );
    };
    const onDown = (e: PointerEvent) => {
      tapDebug.log(
        "pointerdown",
        targetLabel(e.target),
        `${e.pointerType} doc`,
      );
    };
    const onClick = (e: MouseEvent) => {
      tapDebug.log("click", targetLabel(e.target), "doc");
    };
    document.addEventListener("touchstart", onTouch, true);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("touchstart", onTouch, true);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [enabled]);

  if (!enabled) return null;

  const newestAt = entries[0]?.at ?? 0;

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top) + 8px)",
        right: 8,
        zIndex: 100,
        maxWidth: 220,
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: 10,
        lineHeight: 1.3,
        background: "rgba(10, 15, 20, 0.92)",
        color: "#fff",
        borderRadius: 10,
        padding: collapsed ? "6px 8px" : "8px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      <div
        onPointerDown={(e) => {
          e.preventDefault();
          setCollapsed((c) => !c);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          fontWeight: 600,
          opacity: 0.85,
          cursor: "pointer",
        }}
      >
        <span>tap-debug · {entries.length}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>
          {collapsed ? "▸" : "▾"}
        </span>
      </div>
      {!collapsed && (
        <div style={{ marginTop: 6, display: "grid", gap: 2 }}>
          <AnimatePresence initial={false}>
            {entries.map((e) => {
              const dt = newestAt - e.at;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: 4,
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ color: KIND_COLOR[e.kind] }}>{e.kind}</span>
                  <span style={{ opacity: 0.95 }}>
                    {e.target}
                    {e.detail ? ` · ${e.detail}` : ""}
                  </span>
                  <span style={{ opacity: 0.55 }}>
                    {dt === 0 ? "now" : `-${Math.round(dt)}ms`}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
