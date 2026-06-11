# Apex Outfitters — dogfood friction log

Living document. Every time you (or I, watching the build) hit a paper
cut during setup or use, log it below. This becomes the spec for the
future Pattern C "Try Apex Outfitters" auto-provisioner.

The pattern is intentional: Pattern A's manual setup IS the diagnostic.
Pain experienced here = work eliminated by Pattern C later.

## Format

Each entry:

- **What happened**: the exact moment + click sequence
- **Why it sucked**: the surface-level annoyance
- **Real cause**: the deeper UX gap (often different from the
  surface annoyance)
- **Pattern C fix**: what auto-provisioning would do instead
- **Severity**: blocker / friction / paper-cut

---

## Seeded by Claude (AO-P1) — 2026-05-10

These are gaps I noticed while building the foundation. Add yours
underneath when you dogfood.

### F6 — Native iOS events never reached the server [RESOLVED in MMP-205]

- **What happened**: First real iPhone build, opened `/dashboard/debug/events`, watched it say "Connecting…" and stay at 0 events forever despite tapping all over the app. Same thing every operator on Apex Capacitor would experience on first dogfood.
- **Why it sucked**: Apex's debugging promise is "fire an event, see it in 1-2s." First-run experience was the opposite — fire everything, see nothing, no error.
- **Real cause**: The plugin's native iOS `track()` method enqueued events to a disk-backed queue, but `flushQueue()` was a literal no-op with a comment saying "Flush is handled by the JS side through the same offline queue protocol." That was wrong — the JS-side BatchSender reads its own queue (IndexedDB / in-memory), not the native one. Net effect: every event fired from the iOS native app was stranded on disk forever and never POSTed to `/api/events`. Web preview worked fine because the web fallback in `web.ts` uses the JS BatchSender end-to-end.
- **Fix shipped (MMP-205, plugin 0.3.6)**: Implemented `NativeBatchSender.swift` — a Swift port of the JS BatchSender. POSTs `{ projectKey, events: [...] }` to `${apiBaseUrl}/api/events` with exponential backoff (3 attempts, 1s base) on 5xx + network errors. Non-retryable 4xx surfaces but doesn't drop. Concurrency-gated via a serial DispatchQueue. Wired into `initialize()` (immediate flush + 30s periodic timer + foreground observer), `track()` (kick flush after each enqueue), and `flushQueue()` (now an actual flush, not a no-op). Also stamps `testMode: true` + `platform: "ios"` + `timestamp` on every event payload so the dashboard's filters work.
- **Severity** (was): blocker for any dashboard verification on a real device. (now): fixed in 0.3.6 + sample app dep bumped.
- **Lesson**: A no-op with a wrong comment is worse than an unimplemented method. The compiler would have flagged a stub that said `fatalError("not implemented")`; a comment saying "JS handles it" guaranteed nobody ever revisited it. Plugin features without an end-to-end integration test pass are tagged as untested in the README from now on.

### F1 — App icon doesn't reach iOS without `cap sync` [RESOLVED in MMP-202]

- **What happened**: Built to iPhone, home-screen icon was still the default Capacitor blue X. The brand `app-icon.svg` only flowed to the in-app splash (web bundle); iOS reads its home-screen icon from `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.
- **Why it sucked**: Two separate icon pipelines. The brand mark in the splash didn't match the icon iOS shows on the home screen.
- **Real cause**: iOS Asset Catalogs predate web bundling; Capacitor doesn't auto-bridge them.
- **Fix shipped (MMP-202)**: `scripts/generate-ios-app-icon.mjs` renders the canonical Apex chevron to a 1024×1024 opaque PNG and drops it into `AppIcon.appiconset/`. Wired into `ios:sync` + `ios:add` so every developer's iOS bundle gets the brand icon automatically. Sharp added as devDep. After this fix, the only manual step for adopters is **Product → Clean Build Folder → Run** in Xcode once after a sync; Xcode caches the previous icon aggressively.
- **Severity** (was): paper-cut. (now): solved automatically on every sync.

### F2 — Settings → Apex changes need an app restart for testMode to apply

- **What happened**: Flip test mode in Settings → Apex. Subsequent
  events fire but the in-memory plugin still has the old testMode
  flag because `Apex.initialize` was only called once on boot.
- **Why it sucked**: The badge in Settings says "On" but the actual
  send path hasn't picked up the change.
- **Real cause**: `Apex.initialize` is one-shot; `Apex.setTestMode`
  exists but my Settings UI doesn't call it.
- **Resolution (2026-05-15)**: Retired together with F3 — see F3 for
  the full write-up. The testMode toggle was removed from the
  sample app once sandbox project keys became the recommended
  isolation primitive.
- **Severity**: friction (resolved)

### F3 — No way to learn what the testMode tag actually does without leaving the app

- **What happened**: Adopter enables test mode. UI says "Tag every
  event with is_test=1." Adopter wonders: "where does that show up?
  what does it mean for my analytics?"
- **Why it sucked**: The implication is "events go somewhere
  separate" but there's no link to "see your test events" inside the
  dashboard.
- **Real cause**: The dashboard has `/dashboard/debug/events` with a
  test-mode filter, but the mobile app doesn't link there directly.
- **Resolution (2026-05-15)**: F2 + F3 retired together by removing
  the testMode toggle from the sample app entirely. Sandbox project
  keys (`sbx-…`) already provide every guarantee testMode was meant
  to provide (excluded from billing, hidden from production
  dashboards, no CRM pollution). Stacking testMode on top of a
  sandbox key was actively harmful — `TESTEVT#` rows skip the
  identity, contact, and visitor pipelines, which broke Contacts,
  User Explorer, and Identity Coverage. The SDK still accepts the
  flag for non-sandbox adopters (production-build-on-employee-device
  QA case), but the sample app no longer surfaces it.
- **Severity**: paper-cut (resolved)

### F5 — AI generated a new brand mark instead of using the canonical one

- **What happened**: AO-P1 shipped with a generated "A" monogram icon that I (Claude) created via image generation. Apex already has a canonical brand mark (`app/public/brand/logo.svg` — chevron / peak glyph with the `#009E5F → #4EC983` gradient on `#0A0F14`).
- **Why it sucked**: Fractured the brand. The sample app's icon didn't match the marketing site or dashboard favicon. Wasted image-generation resources too.
- **Real cause**: I should have grepped for `**/{logo,icon,brand}*.svg` before generating anything. The canonical asset was already in the repo two directories away.
- **Fix shipped**: MMP-201 swapped to `app/public/brand/logo.svg`, anchored design tokens to the brand hexes (`#009E5F`, `#4EC983`, `#0A0F14`), and fixed the web companion to inline the same chevron path.
- **Lesson for future AI runs**: **Brand assets always come from the source of truth in `app/public/brand/` and `app/public/favicon.svg`.** Never generate new brand assets. If a use case truly needs a new variant (e.g. a different aspect ratio), that's a design conversation with Chris, not an AI generation.
- **Severity**: friction (would have been blocker for any public-facing distribution)

### F4 — Splash duration is fixed regardless of plugin init speed

- **What happened**: Splash shows for `minMs` (default 800ms) then
  fades out. If `Apex.initialize` is slow (cold connection to APNs
  / the Apex API), the home screen might render before init
  completes, and the first event fired races init.
- **Why it sucked**: Possible (rare) lost first events.
- **Real cause**: No promise gating between `initApex()` and the
  splash fade.
- **Pattern C fix**: Splash waits for `await initApex()` to resolve
  OR `minMs`, whichever is longer. Actually this isn't a Pattern C
  fix — it's just a P1 bug. Logging as future polish.
- **Severity**: paper-cut

---

## Add yours below

Each entry should be a 30-second write-up. Don't over-engineer; the
point is to capture the moment of friction while it's fresh.
