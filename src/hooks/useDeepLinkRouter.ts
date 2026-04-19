import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { PluginListenerHandle } from "@capacitor/core";
import { Apex, logEvent } from "@/apex";

/**
 * Wires the Apex plugin's deep-link surfaces into React Router:
 *
 *   1. `getInitialDeepLink()` — the URL the app was opened with on cold
 *      start (Universal Link on iOS, App Link on Android). Fires once.
 *   2. `addListener("deepLink")` — subsequent links while the app is
 *      already running (warm start).
 *
 * Both flows feed into `navigate(path)` so the user lands on the right
 * screen without you writing a bespoke deep-link translator. This is
 * the pattern the docs page recommends.
 */
export function useDeepLinkRouter(): void {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let handle: PluginListenerHandle | null = null;

    const handleUrl = (url: string) => {
      try {
        const u = new URL(url);
        const path = u.pathname + u.search;
        logEvent("Deep link received", { url, path });
        navigate(path || "/");
      } catch {
        // Not a full URL? Treat the raw value as a path fragment.
        if (url.startsWith("/")) navigate(url);
      }
    };

    void Apex.getInitialDeepLink().then((res) => {
      if (!mounted || !res.url) return;
      handleUrl(res.url);
    });

    void Apex.addListener("deepLink", (event) => {
      handleUrl(event.url);
    }).then((h) => {
      handle = h;
    });

    return () => {
      mounted = false;
      void handle?.remove();
    };
  }, [navigate]);
}
