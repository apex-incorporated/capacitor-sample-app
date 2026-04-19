# Contributing

This repo is a **reference sample app** — the goal is to stay small, readable, and directly exercised by every release of `@apex-inc/capacitor-plugin`.

## Scope

Changes that fit here:

- New plugin APIs that need a visible UI surface
- Small UX polish on existing screens (loading states, errors, copy)
- Framework upgrades (Capacitor, Vite, React)
- Docs improvements in the README

Changes that do **not** fit here:

- Adding a second screen for a feature that's already demonstrated elsewhere
- Complex state management (Redux, Zustand) — this app uses `useState` on purpose
- Business logic — real backends, real auth, real payment processing
- A styling system beyond Tailwind

If you want to prove out something meatier (a full Capacitor + Apex e-commerce app, for example), that's great — it just belongs in its own repo.

## Running locally

```bash
git clone https://github.com/apex-incorporated/capacitor-sample-app
cd capacitor-sample-app
npm install
cp .env.example .env.local
# edit .env.local with your project key + API URL
npm run dev
```

## Before opening a PR

```bash
npm run typecheck
npm run build
```

Both should pass clean. Keep the dependency footprint tight — every package you add is a package every reader has to understand.

## Licence

Apache-2.0. By contributing you agree your work ships under the same licence.
