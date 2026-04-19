# Apex Capacitor sample app

A minimal Capacitor + React + Vite app that exercises every public API in [`@apex-inc/capacitor-plugin`](https://github.com/apex-incorporated/capacitor-plugin). Clone it, point it at your Apex project, and see attribution, sessions, deep linking, SKAN, and the offline queue working end-to-end in the iOS Simulator or an Android emulator within five minutes.

**Three screens:**

| Screen | Demonstrates |
|---|---|
| **Home** | `Apex.track()` for custom events · manual session boundaries · live offline-queue inspector · `Apex.flushQueue()` |
| **Products** → detail | `content_view` events · `in_app_purchase` with the typed `purchase` payload · SKAdNetwork conversion-value updates · React Router integration with the plugin's `deepLink` listener |
| **Settings** | Visitor-ID override · iOS ATT prompt · IDFA / GAID inspection · Android Install Referrer · device info · test-mode toggle |

You also get a persistent **Event Log** on Home that tails every Apex call the app made — useful when you don't want to keep Safari Web Inspector open during a demo.

## Quick start

Requires Node 18+. No database, no backend, no Apple/Google developer accounts needed for the first ride.

```bash
git clone https://github.com/apex-incorporated/capacitor-sample-app
cd capacitor-sample-app
npm install
cp .env.example .env.local
```

Edit `.env.local` with your Apex project key (grab it from `/dashboard/settings → Snippet` in your Apex dashboard) and the API URL your dashboard runs on:

```bash
VITE_APEX_PROJECT_KEY=your-project-key-here
VITE_APEX_API_URL=http://localhost:3000
```

Then:

```bash
npm run dev
```

Open `http://localhost:5173` in a browser and click around. The Event Log on Home will show your calls firing. Events land in your Apex debug console at `/dashboard/debug/events` in real time.

## Running in iOS Simulator

Requires Xcode 15+ and macOS.

```bash
npm run ios:add     # one-time: creates ios/ folder
npm run ios:open    # opens Xcode with the project
```

Then hit **Run** in Xcode. The Simulator boots, the sample app opens, and events flow from the iOS WebView to your dashboard.

### Testing deep links from the terminal

```bash
xcrun simctl openurl booted "https://yourproject.links.apex.inc/summer-launch"
```

You'll see `Deep link received` in the Event Log and the app navigates to the corresponding route.

### Testing ATT prompt

The sample app asks only when you tap **Request ATT prompt** on Settings. iOS shows the system dialog; your choice is persisted per-install.

### Testing SKAN

`updateConversionValue` fires automatically when you tap Buy on a product. In a TestFlight build (not Simulator), Apple fires the postback after the attribution window — typically 0-24h after install. You won't see it in Simulator; use TestFlight for the real flow.

## Running in Android emulator

Requires Android Studio and an Android emulator image.

```bash
npm run android:add     # one-time: creates android/ folder
npm run android:open    # opens Android Studio
```

Hit **Run** in Android Studio. The emulator boots, the sample app opens, and events flow through.

### Testing Install Referrer

Real Play Install Referrer only arrives when the app is installed from a Play Store listing (at least Internal Test Track). The sample shows `(unavailable)` in Simulator / local sideload. Once you upload a signed build to Play Internal, an install triggered by a click on `play.google.com/store/apps/details?id=your.app&referrer=utm_source=meta...` yields the referrer string on first launch.

### Testing deep links from the terminal

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://yourproject.links.apex.inc/summer-launch" inc.apex.sample
```

## Project layout

```
src/
├── main.tsx                  # React + Router bootstrap
├── App.tsx                   # Initialises Apex + wires the deep-link router
├── apex.ts                   # Thin SDK wrapper + in-app log bus
├── hooks/
│   ├── useQueueStatus.ts     # Polls Apex.getQueueSize()
│   ├── useVisitorId.ts       # Reads + overrides the visitor ID
│   └── useDeepLinkRouter.ts  # Universal / App Links → React Router
├── components/
│   ├── Layout.tsx            # Header + bottom tab bar
│   ├── StatPill.tsx          # Reusable stat card
│   └── EventLog.tsx          # Live tail of Apex calls
└── screens/
    ├── HomeScreen.tsx
    ├── ProductsScreen.tsx
    ├── ProductDetailScreen.tsx
    └── SettingsScreen.tsx
```

## What's included — API checklist

Every method on the [`ApexCapacitorPlugin`](https://github.com/apex-incorporated/capacitor-plugin/blob/main/src/definitions.ts) interface is demonstrated somewhere in the sample:

- [x] `initialize` — `src/apex.ts`
- [x] `requestTrackingAuthorization` — Settings
- [x] `getTrackingStatus` — Settings
- [x] `getAdvertisingId` — Settings
- [x] `getInstallReferrer` — Settings
- [x] `getVisitorId` — `useVisitorId` hook
- [x] `setVisitorId` — Settings
- [x] `updateConversionValue` — Product detail Buy
- [x] `getInitialDeepLink` — `useDeepLinkRouter` hook
- [x] `getDeviceInfo` — Settings
- [x] `startSession` / `endSession` / `getCurrentSession` — Home
- [x] `track` — every screen
- [x] `getQueueSize` / `flushQueue` — Home
- [x] `setTestMode` — Settings
- [x] `addListener("deepLink")` — `useDeepLinkRouter` hook

## Customising

**Change the app identity** (bundle ID, display name, team ID) before shipping to TestFlight / Play Internal: edit `capacitor.config.ts` and `ios/App/App.xcworkspace` (in Xcode) or `android/app/build.gradle`.

**Test your own deep link host.** By default the sample accepts any URL and routes by pathname. When you set up a real Apex Link subdomain (e.g. `yourproject.links.apex.inc`), register it as an Associated Domain in Xcode and as an Intent Filter in `AndroidManifest.xml` — Apex's [getting-started docs](https://apex.inc/docs/mobile/getting-started) walk you through both.

## Not in this sample (intentionally)

- **Real authentication** — there's one "override visitor ID" input, nothing more. In your real app you'd wire `Apex.setVisitorId(userId)` into your login handler.
- **Real API calls for the product catalog** — hard-coded so the sample runs offline.
- **Payment processing** — the Buy button simulates a purchase so SKAN + revenue events fire, but no card is charged.
- **State management libraries** — `useState` + `useContext` is enough for three screens.

## Getting help

- Docs: https://apex.inc/docs/mobile/getting-started
- Plugin source: https://github.com/apex-incorporated/capacitor-plugin
- Dashboard / debug stream: `/dashboard/debug/events` in your Apex install

## License

Apache-2.0 — same as the plugin and SDK. Fork freely.
