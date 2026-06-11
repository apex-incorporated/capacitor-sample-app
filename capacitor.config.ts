import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Apex sample app.
 *
 * Change `appId` + `appName` + the server URL before shipping a real build.
 * These defaults work for local development against a dashboard running at
 * http://localhost:3000.
 */
const config: CapacitorConfig = {
  appId: "inc.apex.outfitters",
  appName: "Apex Outfitters",
  webDir: "dist",
  server: {
    // During `npm run dev`, set `APEX_DEV_URL` in `.env.local` to your
    // laptop's LAN IP so a real device / emulator can reach the Vite dev
    // server (e.g. `http://192.168.1.12:5173`). Leave unset for production
    // builds — they serve from the bundled `dist/` folder.
    url: process.env.APEX_DEV_URL || undefined,
    cleartext: true,
  },
  ios: {
    // Must match your Apple bundle ID and Team ID when you build for real
    // devices. `npm run ios:open` opens Xcode where you configure these.
    contentInset: "always",
    // Disable the WKWebView's outer UIScrollView. Without this, iOS keeps
    // a scroll-pan gesture recognizer attached to the WebView even though
    // body has `overflow: hidden` and we never actually scroll at the
    // viewport level (the inner `<main>` is the only scroll container).
    // That recognizer competes with every touch, and when iOS can't
    // resolve "scroll vs tap" in time it logs `Gesture: System gesture
    // gate timed out` and silently drops the touch — which manifests as
    // tab taps that have to be repeated 2-3 times. Disabling the outer
    // scroll removes the recognizer competition entirely.
    scrollEnabled: false,
  },
  android: {
    // Android App Links require the signing cert SHA-256 and a matching
    // `assetlinks.json` file on your Apex Link subdomain. See README.
    allowMixedContent: true,
  },
};

export default config;
