import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Apex sample app.
 *
 * Change `appId` + `appName` + the server URL before shipping a real build.
 * These defaults work for local development against a dashboard running at
 * http://localhost:3000.
 */
const config: CapacitorConfig = {
  appId: "inc.apex.sample",
  appName: "Apex Sample",
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
  },
  android: {
    // Android App Links require the signing cert SHA-256 and a matching
    // `assetlinks.json` file on your Apex Link subdomain. See README.
    allowMixedContent: true,
  },
};

export default config;
