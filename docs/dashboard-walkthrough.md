# Apex Outfitters — dashboard walkthrough

This is the missing piece. Apex Outfitters fires real events into your Apex workspace; here's exactly where each one surfaces so you can verify the integration end-to-end.

Throughout this doc, replace `<HOST>` with your Apex URL (`https://app.apex.inc`, or `http://localhost:3000` for a local dashboard). Replace `<PROJECT_KEY>` with the project key you pasted into Settings → Apex inside the app.

## The 30-second tour

| Open this in the dashboard | Then do this in Apex Outfitters | You should see |
|---|---|---|
| [`/dashboard/debug/events`](#1-live-event-firehose) | Tap any product | A `product_view` row arriving within 1-2 seconds |
| [`/dashboard/contacts`](#2-end-users-as-contacts) | Sign up in the app | A new Contact with the email you used |
| [`/dashboard/mobile`](#3-mobile-attribution-revenue-ltv) | Buy something | Install / revenue / LTV cards update |
| [`/dashboard/partners`](#4-partners-affiliates) | Settings → Test partner referral → tap Ari Demo | Ari shows up as an Affiliate |
| [`/dashboard/mobile/links`](#5-apex-links) | After running `npm run seed` | The `founders-tote` Apex Link is listed |
| [`/dashboard/audiences`](#6-audiences) | Add 2+ items to cart without buying | The user enters the "Cart abandoners" audience |
| [`/dashboard/communications`](#7-communications-back-to-the-app) | Compose an in-app message | It appears in the app's Apex Live → Inbox panel |

Now in detail.

---

## Configure first

Before anything below works, the app has to know which workspace to send events to.

1. Sign up at [app.apex.inc](https://app.apex.inc), or use an existing account.
2. Create a workspace (or use an existing one). Note its project key from the dashboard footer or **Settings → Snippet**.
3. In the Apex Outfitters app, go to **Account → Apex settings**. Paste the project key and your API URL. Tap **Save**.

The app ships unconfigured — events stay local to the in-app event log until you save a project key (or set `VITE_APEX_PROJECT_KEY` in `.env.local` before building).

---

## 1. Live event firehose

**Dashboard URL**: `<HOST>/dashboard/debug/events?projectKey=<PROJECT_KEY>`

This is the most useful page during integration. It's a live SSE feed of every event arriving at `/api/events`. Filters: platform (iOS / Android / web), event type, test-mode on/off.

**What to do in the app:**

| Tap this | Event fired |
|---|---|
| App opens / foregrounds | `app_open` |
| Any tab | `page_view` |
| Any product card | `product_view` |
| **Add to cart** button | `add_to_cart` |
| Cart tab | `cart_view` |
| Heart icon on product | `add_to_wishlist` |
| Sign up | `user_signed_up` |
| Sign in | `user_signed_in` |
| Sign out | `user_signed_out` |
| Pay button on checkout | **`in_app_purchase`** + `affiliate_conversion_recorded` (if a referral is active) |
| **Apex Live → Fire custom event** sheet | Whatever you type |
| Account → Apex Outfitters Plus → trial / subscribe / cancel | `subscription_event` (with `action: trial_started / started / cancelled`) |
| Settings → Test partner referral → tap an affiliate | `deep_link_open` with `affiliateId` + `campaign` |

The sample app exclusively targets sandbox projects (project key prefix `sbx-`). Sandbox is the isolation primitive: every event from this app is automatically excluded from production billing, dashboards, and CRM stitching — there is no separate `testMode` toggle to remember.

---

## 2. End users as Contacts

**Dashboard URL**: `<HOST>/dashboard/contacts?projectKey=<PROJECT_KEY>`

Every signed-in user in Apex Outfitters becomes a Contact in your workspace. The visitor's anonymous events from before sign-up are stitched to that Contact via `visitorId`.

**Walkthrough:**

1. In the app: **Account → Sign up**. Use a real email so it's easy to find.
2. The app fires `user_signed_up` with `{ userId, email, signedUpAt }`.
3. Apex's identity resolver attaches the visitor's prior events (every product view, add-to-cart, etc.) under this Contact.
4. Refresh `/dashboard/contacts`. The new Contact appears.
5. Click into the Contact → you should see the event timeline (page_views, product_views, etc.) under it.

This is the **identity stitching** moment. Pre-signup events aren't lost — they retroactively attach to the Contact when the visitor identifies.

---

## 3. Mobile attribution, revenue, LTV

**Dashboard URL**: `<HOST>/dashboard/mobile?projectKey=<PROJECT_KEY>`

The mobile-specific dashboard. Cards include:

- **Installs** (24h / 30d / all-time)
- **Attribution breakdown**: deterministic / probabilistic / organic / reattribution
- **Campaigns**: per-source spend, CPI, ROAS, revenue, ARPU
- **Retention cohorts**: day-0 / day-1 / day-7 / day-30 retention rates
- **Sessions**: DAU / WAU / MAU / stickiness / avg duration
- **LTV**: average LTV across the install base

**Walkthrough:**

1. Buy something in Apex Outfitters. The Pay button fires `in_app_purchase` with `revenueUsd` + `amount` + `currency: USD` + `transactionId` + `products`.
2. The mobile attribution pipeline matches the purchase to the install attribution record and credits revenue against the campaign / affiliate that drove the install.
3. Refresh `/dashboard/mobile`. Total Revenue + ARPU + LTV cards update.
4. If the purchase happened under an active partner referral, the campaign card for that affiliate shows the credited revenue.

**Caveat**: Apex's attribution waterfall requires an `app_install` event for the deterministic / probabilistic / organic breakdown to fill in. The Apex Capacitor plugin auto-fires `app_install` on first run, so this should just work — but it's a one-shot event tied to the device's first launch.

---

## 4. Partners (affiliates)

**Dashboard URL**: `<HOST>/dashboard/partners?projectKey=<PROJECT_KEY>`

Lists all Affiliate entities — the partners crediting commissions on conversions.

**Walkthrough using the seed script:**

```bash
cd packages/capacitor-sample-app
APEX_API_URL=https://app.apex.inc \
APEX_API_KEY=apex_sk_yourkeyhere \
npm run seed
```

(Generate an API key at `/dashboard/settings/organization/api-keys`.)

The seed script provisions:

- **Ari Demo Affiliate** — 15% revshare, 90-day commission window
- Apex Link **`founders-tote`** owned by Ari — destination is `/product/founders-tote`

Both appear in `/dashboard/partners` (Ari) and `/dashboard/mobile/links` (the founders-tote link).

**Walkthrough end-to-end:**

1. In the app: **Settings → Test partner referral → tap Ari Demo**. The app captures the referral in localStorage + fires `deep_link_open` with `affiliateHandle: ari` + `campaign: founders-tote`.
2. The app navigates to the Founder's Tote product detail screen — note the green "Referred by Ari Demo Affiliate" banner above the product.
3. Tap **Add to cart**, then **Checkout**, then **Pay**.
4. The Pay button fires both `in_app_purchase` AND `affiliate_conversion_recorded` with the frozen commission amount.
5. In `/dashboard/partners`, click into Ari Demo. Their conversion ledger should show this purchase + the credited commission.

This is the **flagship loop**: anonymous click → install → sign-up → purchase → partner credited. Same shape that powers production merchant integrations on Apex Partner Network.

---

## 5. Apex Links

**Dashboard URL**: `<HOST>/dashboard/mobile/links?projectKey=<PROJECT_KEY>`

CRUD over Apex Links — the deep-link primitive behind affiliate URLs, QR codes, SMS campaigns, and Smart Banners. Each link has:

- A unique slug (`founders-tote`)
- A destination URL + optional iOS/Android fallback
- A deep-link path (where the link routes the app to)
- UTM source / medium / campaign
- An owner (affiliate id, journey, or null)

**What you'll see in the app:**

- **Apex Live → Deep links panel** generates a QR code for the demo Apex Link client-side using the brand colors.
- Tapping the QR (in person, with a second phone's camera) hits the redirect, opens the app via Universal Link, and lands on the linked product with the affiliate captured.

For Universal Links to actually open the app, you also need to host an `apple-app-site-association` file at `<your-subdomain>/.well-known/apple-app-site-association`. Apex's production redirector handles this automatically for `*.links.apex.inc` subdomains, deferred for custom domains.

---

## 6. Audiences

**Dashboard URL**: `<HOST>/dashboard/audiences?projectKey=<PROJECT_KEY>`

Audiences are predicate-driven cohorts (e.g. "fired `add_to_cart` 2+ times in the last 7 days without firing `in_app_purchase`"). They're the input to journey triggers + broadcast comms.

**Walkthrough:**

1. The app's **Apex Live → Intelligence panel** shows the audiences the current user *would* be in based on this session's events. It derives them locally so you can see them without dashboard round-trips.
2. To see real audiences keyed to live data: visit `/dashboard/audiences`. Built-in audiences include "New installers", "Cart abandoners", "First-time customers", "Repeat buyers", "Subscribers".
3. Pick an audience → click into it → the member list shows every Contact currently matching its predicate.

---

## 7. Communications back to the app

**Dashboard URL**: `<HOST>/dashboard/communications?projectKey=<PROJECT_KEY>`

This is the round-trip. You compose a message in the dashboard, target an audience, and it lands on the user's phone.

**Walkthrough for push:**

1. In the app: **Account → Apex settings**, enable push notifications (iOS prompts, plugin auto-registers the device token).
2. In the dashboard: **Settings → Mobile apps → Push notifications**, upload your `.p8` (Pattern A: you generate it in your Apple Developer portal).
3. Compose a communication → channel `mobile_push` → audience "Cart abandoners" → broadcast.
4. The push arrives on the device. The plugin's `pushReceived` / `pushClicked` listeners fire; the OS shows the banner.

**Walkthrough for in-app message:**

1. Compose a communication → channel `in_app_push` → broadcast.
2. The app polls `/api/in-app-messages` (or, in a richer integration, receives it via the WebSocket stream). It appears in the **Apex Live → In-app inbox** panel.

The Capacitor plugin's `addListener("pushReceived", ...)` and similar hooks expose these to whatever screen you want.

---

## Common confusion points

### "I fired an event but it doesn't show up in the dashboard."

1. Confirm the project key in the app matches the one in the dashboard URL.
2. Check the API URL in the app (Account → Apex settings). Make sure it's not pointing at localhost.
3. Open Xcode's console; the plugin logs `[apex-capacitor]` with batch send status.
4. Verify the dashboard isn't filtered to a build audience that excludes your device — flip the "Dev / Beta / Production / All" pill in the header to "All" if you're testing on Xcode-debug.

### "I'm seeing my events in `debug/events` but `/dashboard/mobile` doesn't show revenue."

The mobile dashboard requires the canonical mobile event types (`app_install`, `in_app_purchase`, `subscription_event`, etc.). Events like `purchase` (without the `in_app_` prefix) land in the firehose as custom events but don't credit revenue/LTV. This is fixed for `in_app_purchase` in MMP-204 — the app now fires the canonical type.

### "I tapped Test partner referral but the affiliate isn't in `/dashboard/partners`."

You need to run the seed script once to provision Ari Demo + the Apex Link on the server side. The in-app simulator stores referral state locally; the server-side ledger needs the matching Affiliate entity to actually credit commissions.

```bash
APEX_API_URL=https://app.apex.inc \
APEX_API_KEY=apex_sk_yourkeyhere \
npm run seed
```

### "Where do I generate an API key?"

`<HOST>/dashboard/settings/organization/api-keys` → New key. Copy it once — keys are shown only at creation time.

### "The push test sends but nothing appears on my phone."

1. Confirm iOS notifications permission is granted (Settings app → Apex Outfitters → Notifications).
2. Foreground notifications are auto-presented by the plugin since 0.3.5. Earlier versions silently suppressed banners in the foreground; lock your phone to test if you're on an older plugin.
3. If you uploaded a production `.p8` but you're running an Xcode build, your APNs environment is sandbox. Switch the environment in the wizard or generate a sandbox-aware key.

### "How do I clear my visitor / Contact state for a clean test?"

In the app: Settings → Apex → Reset (clears local config back to the default sandbox project). Sign out from Account to detach the Contact.

To wipe server-side: `/dashboard/settings/workspace/danger` → Clear demo data (only clears entities seeded by `seedDemoData`, not your real Contacts).

---

## Spec status

This document represents the intended end-to-end loop. Some surfaces are verified live (debug/events, contacts, mobile, communications); others are partially implemented and called out in the friction log. When you find a gap, log it in `docs/dogfood-friction-log.md` with an F-number and I'll fix it in a follow-up card.

Last updated: 2026-05-10. Tracks MMP-204 walkthrough card.
