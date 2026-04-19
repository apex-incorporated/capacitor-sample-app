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
 */
export async function initApex(): Promise<void> {
  const projectKey = import.meta.env.VITE_APEX_PROJECT_KEY || "sample";
  const apiUrl = import.meta.env.VITE_APEX_API_URL || "http://localhost:3000";
  try {
    await Apex.initialize({
      projectKey,
      apiUrl,
      testMode: true,
      debug: true,
    });
    logInfo(`Apex initialised (project: ${projectKey}, api: ${apiUrl})`);
  } catch (err) {
    logError("Apex.initialize failed", { error: String(err) });
  }
}

/** Re-export the plugin singleton so screens can call it directly. */
export { Apex };
