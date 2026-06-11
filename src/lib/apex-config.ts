/**
 * Apex Outfitters — project key + API URL config.
 *
 * Pattern A onboarding: adopters paste their own project key into
 * the Settings → Apex screen. We persist locally to localStorage so
 * subsequent launches use their values. There is no baked-in default
 * project key — until one is configured (via Settings → Apex or a
 * `VITE_APEX_PROJECT_KEY` in `.env.local`) the app runs in local-only
 * mode and `initApex()` skips SDK initialization.
 *
 * Read once on app boot; written via `updateApexConfig`. Components
 * that need the latest values subscribe via `useApexConfig`.
 *
 * 2026-05-15 — `testMode` removed.
 * The sample app exclusively targets sandbox projects (`sbx-…` keys).
 * Sandbox already provides every guarantee `testMode` was meant to
 * provide: events excluded from billing, hidden from production
 * dashboards, no risk of polluting a real CRM. Doubling up was a
 * documented footgun — `testMode: true` on a sandbox key routed every
 * event to `TESTEVT#` rows, which the server-side identity, contact,
 * and visitor pipelines intentionally skip. The result: an empty
 * Contacts page, empty User Explorer, empty Identity Coverage. The
 * SDK still accepts `testMode` for non-sandbox adopters (CI, QA on a
 * production project), but the sample app no longer exposes it.
 */

import { useEffect, useState } from "react";

// Bumped to v2 in the 2026-05-15 cleanup. Bumping the key drops any
// persisted `testMode: true` value on first launch — operators
// upgrading the sample app no longer have to manually flip the toggle
// off, the toggle simply no longer exists and the stored value goes
// with it.
const STORAGE_KEY = "apex_outfitters.apex_config_v2";
const LEGACY_STORAGE_KEY = "apex_outfitters.apex_config_v1";

const DEFAULT_PROJECT_KEY = import.meta.env.VITE_APEX_PROJECT_KEY ?? "";
const DEFAULT_API_URL =
  import.meta.env.VITE_APEX_API_URL ?? "https://app.apex.inc";

export interface ApexConfig {
  projectKey: string;
  apiUrl: string;
}

const DEFAULT_CONFIG: ApexConfig = {
  projectKey: DEFAULT_PROJECT_KEY,
  apiUrl: DEFAULT_API_URL,
};

type Listener = (config: ApexConfig) => void;
const listeners = new Set<Listener>();

let cached: ApexConfig | null = null;

function readFromStorage(): ApexConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    // One-shot migration: drop the v1 row on first read. Its `testMode`
    // field is no longer part of the config surface; copy the keys we
    // still care about over to v2 so adopters don't have to re-paste
    // their project key after the upgrade.
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && !window.localStorage.getItem(STORAGE_KEY)) {
      try {
        const parsed = JSON.parse(legacy) as Partial<{
          projectKey: string;
          apiUrl: string;
        }>;
        const migrated: ApexConfig = {
          projectKey: parsed.projectKey ?? DEFAULT_CONFIG.projectKey,
          apiUrl: parsed.apiUrl ?? DEFAULT_CONFIG.apiUrl,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } catch {
        // Malformed v1 — fall through to defaults below.
      }
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* localStorage blocked */
      }
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ApexConfig>;
    return {
      projectKey: parsed.projectKey ?? DEFAULT_CONFIG.projectKey,
      apiUrl: parsed.apiUrl ?? DEFAULT_CONFIG.apiUrl,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeToStorage(config: ApexConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Quota / private-mode — silently ignore; in-memory still works.
  }
}

export function getApexConfig(): ApexConfig {
  if (cached) return cached;
  cached = readFromStorage();
  return cached;
}

export function updateApexConfig(patch: Partial<ApexConfig>): ApexConfig {
  const next = { ...getApexConfig(), ...patch };
  cached = next;
  writeToStorage(next);
  for (const fn of listeners) fn(next);
  return next;
}

export function resetApexConfig(): ApexConfig {
  return updateApexConfig(DEFAULT_CONFIG);
}

/**
 * React hook — re-renders when config changes (via `updateApexConfig`).
 * Subscribers within this app share the same in-memory cache, so a
 * change in Settings re-renders the Apex Live panel + every other
 * surface that depends on the config.
 */
export function useApexConfig(): ApexConfig {
  const [config, setConfig] = useState<ApexConfig>(getApexConfig);
  useEffect(() => {
    const listener: Listener = (next) => setConfig(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return config;
}

export { DEFAULT_PROJECT_KEY, DEFAULT_API_URL };
