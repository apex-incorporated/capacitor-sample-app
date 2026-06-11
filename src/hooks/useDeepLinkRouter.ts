import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { PluginListenerHandle } from "@capacitor/core";
import { Apex, logEvent } from "@/apex";
import { track } from "@/lib/events";
import { captureReferralFromUrl } from "@/lib/referral";

/**
 * Wires the Apex plugin's deep-link surfaces into React Router.
 *
 * Previously this hook depended on `navigate` from useNavigate(), and
 * in some Capacitor + Vite + react-router-dom 6 configurations
 * `useNavigate` returned a fresh identity on every render. That made
 * the effect re-run after every tab change, attaching + immediately
 * detaching the native `deepLink` listener via 3 bridge calls per tap
 * (`getInitialDeepLink + addListener + removeListener`). On iOS that
 * round-trip is expensive enough to make the whole app feel laggy.
 *
 * Fix: empty dep array (effect runs exactly once on App mount + once
 * on unmount), navigate captured in a ref so re-renders pick up the
 * latest function without retriggering the effect.
 */
export function useDeepLinkRouter(): void {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  // Keep the ref pointed at the current navigate without making it a
  // dependency of the effect.
  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    let mounted = true;
    let handle: PluginListenerHandle | null = null;

    const handleUrl = (url: string) => {
      try {
        const u = new URL(url);
        const path = u.pathname + u.search;
        logEvent("Deep link received", { url, path });

        // AO-P5 — capture partner referral if the link carries `?ref=`.
        // The active referral lives in referral.ts and gates commission
        // crediting at checkout time.
        const captured = captureReferralFromUrl(url);
        if (captured) {
          void track("deep_link_open", {
            url,
            path,
            affiliateId: captured.id,
            affiliateHandle: captured.handle,
            campaign: u.searchParams.get("campaign") ?? undefined,
          });
        } else {
          void track("deep_link_open", { url, path });
        }
        navigateRef.current(path || "/");
      } catch {
        if (url.startsWith("/")) {
          void track("deep_link_open", { url, path: url });
          navigateRef.current(url);
        }
      }
    };

    // initApex() runs in App.tsx's useEffect in parallel with this hook.
    // The native plugin rejects pre-init calls with "Plugin not
    // initialized" — gracefully swallow that since it's a benign
    // startup race, not a real failure. We retry the initial-link
    // check once on next tick which is plenty for init to have
    // completed.
    const tryInitialLink = () =>
      Apex.getInitialDeepLink()
        .then((res) => {
          if (!mounted || !res.url) return;
          handleUrl(res.url);
        })
        .catch(() => {
          // Swallow — most likely "Plugin not initialized" race.
        });

    void tryInitialLink();
    const retryTimer = setTimeout(() => {
      if (mounted) void tryInitialLink();
    }, 250);

    void Apex.addListener("deepLink", (event) => {
      handleUrl(event.url);
    })
      .then((h) => {
        handle = h;
      })
      .catch(() => {
        // Same race — listener attaches once init lands. Swallow.
      });

    return () => {
      mounted = false;
      clearTimeout(retryTimer);
      void handle?.remove();
    };
    // Empty deps — this effect must run exactly once. navigate is read
    // via navigateRef so we always call the latest version without
    // forcing the effect to re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
