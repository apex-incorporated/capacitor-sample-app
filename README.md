# Apex Outfitters

A polished, open-source reference app for [Apex](https://apex.inc) — a fictional Apex-branded e-commerce store that demonstrates a real Apex integration end-to-end on iOS.

> **What this is**: a first-class mobile app you can clone, point at your Apex workspace, and use to test every feature Apex offers. Built with Capacitor 6 + React 18 + Vite + Tailwind, with Apex's official Capacitor plugin (`@apex-inc/capacitor-plugin@^2.1.0`).
>
> **What this isn't**: the future Apex companion app (separate product). This app stays open-source and TestFlight-only; it exists so adopters can dogfood Apex in a real-feeling app, and so we (the Apex team) can dogfood ourselves.

## What you'll experience

| Feature | Where it lives in the app |
|---|---|
| Native events (`app_open`, `page_view`, `purchase`, ...) | Every tap fires the right Apex event |
| Apex Live event panel | "Apex Live" tab — streams every event with a "What this means" explainer |
| Partner referral attribution end-to-end | Tap an affiliate link → install → sign up → purchase → see commission credit |
| Belief graph + Predictive LTV | Apex Live → user intelligence panel |
| Mobile experiments (`Apex.getVariant`) | Paywall layout A/B test on the subscription tier offer screen |
| Subscriptions (`subscription_event`) | Apex Outfitters Plus tier with trial → conversion flow |
| Smart Banner + cross-platform identity | Web companion at `apex-outfitters.example.com` |
| QR-driven deep links | Settings → "Test a deep link via QR" |
| Apple Pay (sandbox) | Checkout → Pay with Apple Pay (requires your Apple Dev portal setup) |

## Quick start

```bash
git clone https://github.com/apex-incorporated/capacitor-sample-app
cd capacitor-sample-app
npm install
```

### Run in browser (web preview)

```bash
npm run dev
```

Open `http://localhost:5173`. You'll see the splash, then the home screen. Browser preview is great for fast UI iteration but doesn't exercise the iOS-specific features (push notifications, ATT prompt, SKAN, Universal Links).

### Run on a real iPhone (full experience)

Required: Xcode 15+, CocoaPods (`brew install cocoapods`), a physical iPhone, an Apple Developer team (free or paid).

```bash
npm run ios:add        # one-time: generates ios/ folder + brand icon
npm run ios:open       # builds web, syncs, refreshes brand icon, opens Xcode
```

The Apex brand icon is regenerated automatically on every `ios:sync` (which `ios:open` calls) — you never have to touch `Assets.xcassets/AppIcon.appiconset/`. If you want to regenerate it standalone, `npm run icons:ios`.

After the first run on a real device or simulator, Xcode caches the icon aggressively. If the home-screen icon still looks stale after a build, run **Product → Clean Build Folder** in Xcode and rebuild.

In Xcode:

1. **Signing & Capabilities** → set your **Team** to your Apple Dev team
2. The default Bundle Identifier is `inc.apex.outfitters`. **You must change this** to a bundle ID registered in YOUR Apple Dev team's portal.
3. Plug in your iPhone, pick it as the destination, hit ▶ Run.
4. On the iPhone: trust the developer cert via Settings → General → VPN & Device Management on first run.

## Configure Apex (Pattern A)

The app ships unconfigured — no project key is baked in, and events stay local to the in-app event log until you wire up your workspace:

1. Sign up at https://apex.inc (or use an existing account)
2. Create a new workspace (recommended) or use an existing one
3. Open the dashboard → Settings → Snippet → copy your project key (`prj_...`)
4. In the Apex Outfitters app: Account tab → Apex settings → paste your project key + your API URL
5. Tap Save

Events fired in the app now land in your Apex dashboard. Visit `/dashboard/debug/events?projectKey=<your-key>` to see the live event stream.

## How to actually use this — the dashboard walkthrough

The most useful doc in this repo is [`docs/dashboard-walkthrough.md`](./docs/dashboard-walkthrough.md). It maps every feature in the app to its dashboard URL — "tap this here, see this there" — and is the right starting point if you're not sure what Apex Outfitters is supposed to demonstrate.

A summary of where everything surfaces:

| In the app | In the dashboard |
|---|---|
| Any event you fire | `/dashboard/debug/events` (live SSE feed) |
| Sign up | `/dashboard/contacts` (new Contact, prior events stitched) |
| Buy something | `/dashboard/mobile` (revenue, LTV, retention) |
| Settings → Test partner referral | `/dashboard/partners` (after `npm run seed`) |
| Apex Live → Deep links panel | `/dashboard/mobile/links` |
| Apex Live → Intelligence panel | `/dashboard/audiences` |
| Apex Live → In-app inbox | composed at `/dashboard/communications` |

The app itself surfaces this inside **Apex Live → "See it in your dashboard"** — each card opens the right URL with your project key pre-filled.

## What "Pattern A" means

This app deliberately keeps Apex setup manual. We could auto-provision everything from a "Try Apex Outfitters" button in your dashboard (and we plan to — that's "Pattern C"), but going through the manual setup teaches you exactly how Apex integrates into a real app. Every paper cut you experience during setup is logged in `docs/dogfood-friction-log.md` so the future auto-provisioner eliminates it.

## What's in the app today

### Phase 1 — Brand system + design tokens + app shell ✅

- Apex green primary palette with light/dark mode
- Inter + JetBrains Mono typography
- 4 bottom tabs: **Home / Shop / Account / Apex Live**
- Splash screen
- Settings → Apex (Pattern A onboarding)
- Toast notifications with haptics
- Design primitives: `Button`, `Card`, `Sheet`, `TextField`, `Badge`, `Toast`, `Skeleton`

### Phase 2-10 — coming after the brand foundation

Highlights from the roadmap:

- **AO-P2**: 12-20 fictional products, real catalog, simulated checkout
- **AO-P3**: Every native Apex event wired + Apex Live debug panel
- **AO-P4**: Belief graph + predictive LTV visualization
- **AO-P5 (FLAGSHIP)**: Partner referral end-to-end loop
- **AO-P6**: Apex Outfitters Plus subscription tier
- **AO-P9**: Live A/B experiment via `Apex.getVariant()`
- **AO-P10**: In-app message inbox

## Push notifications

The Apex Capacitor plugin's push notifications are documented in the [plugin repo](https://github.com/apex-incorporated/capacitor-plugin#push-notifications-ios). When you enable push in Account → Settings, the plugin auto-registers the device token with your Apex project. Use the dashboard's Push Notifications setup wizard to upload your `.p8` and send a test push.

## Source layout

```
src/
├── App.tsx              # Router + provider stack + splash
├── apex.ts              # SDK wrapper + event log bus
├── brand/               # Design tokens (colors, type, motion) + icon
├── components/
│   ├── ui/              # Button, Card, Sheet, TextField, Badge, Toast, Skeleton
│   └── layout/          # Layout, TabBar, Header, Splash
├── hooks/               # useVisitorId, useDeepLinkRouter, useQueueStatus
├── lib/
│   └── apex-config.ts   # Pattern A project-key + API-URL config (localStorage-backed)
└── screens/
    ├── HomeScreen.tsx
    ├── ShopScreen.tsx
    ├── AccountScreen.tsx
    ├── ApexLiveScreen.tsx
    └── SettingsScreen.tsx
```

## License

Apache-2.0. Same as Apex's plugin + SDK. Fork freely.

## Getting help

- Apex docs: https://apex.inc/docs
- Capacitor plugin: https://github.com/apex-incorporated/capacitor-plugin
- Issues: https://github.com/apex-incorporated/capacitor-sample-app/issues
