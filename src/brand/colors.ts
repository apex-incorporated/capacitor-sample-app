/**
 * Apex Outfitters — brand color tokens.
 *
 * Single source of truth for color. Components should import from here
 * (or use the matching Tailwind tokens) — never hardcode hex values
 * inline.
 *
 * Architecture follows the brand-design-system skill:
 *   - Semantic over decorative
 *   - Restrained palette (2 primary hues + functional colors)
 *   - Light and dark mode designed from the same OKLCH ramp
 */

export const brandColors = {
  // ─── Brand primary — canonical Apex green gradient ───────────────
  // Anchored to the gradient stops in app/public/brand/logo.svg so
  // every surface that adopts a brand color picks from the same ramp.
  primary: {
    50: "#e8f7ef",
    100: "#c5ebd5",
    200: "#9bdcb8",
    300: "#6dd99a",
    400: "#4EC983", // canonical gradient mid — the "lighter" stop
    500: "#009E5F", // canonical gradient base — the "darker" stop
    600: "#00874f",
    700: "#00703f",
    800: "#005932",
    900: "#003f23",
    950: "#0A0F14", // canonical brand base (icon background)
  },

  // ─── Neutral ramp — used for surfaces, text, borders ─────────────
  neutral: {
    0: "oklch(1.00 0 0)", // pure white
    50: "oklch(0.98 0 0)",
    100: "oklch(0.96 0 0)",
    200: "oklch(0.92 0 0)",
    300: "oklch(0.86 0 0)",
    400: "oklch(0.72 0 0)",
    500: "oklch(0.55 0 0)",
    600: "oklch(0.42 0 0)",
    700: "oklch(0.32 0 0)",
    800: "oklch(0.22 0 0)",
    900: "oklch(0.14 0 0)",
    950: "oklch(0.08 0 0)",
    1000: "oklch(0.04 0 0)", // near-black, matches app icon background
  },

  // ─── Functional ──────────────────────────────────────────────────
  success: "oklch(0.72 0.19 155)",
  warning: "oklch(0.80 0.16 85)",
  danger: "oklch(0.65 0.22 25)",
  info: "oklch(0.65 0.18 240)",
} as const;

/**
 * Semantic tokens — what components actually consume. These resolve
 * differently in light/dark mode via CSS variables defined in
 * `index.css`. Keep the named slots small (this is the entire
 * interface a component should care about); the OKLCH ramps above
 * are implementation detail.
 */
export const semanticColors = {
  // Surfaces
  background: "var(--color-bg)",
  surface: "var(--color-surface)",
  surfaceElevated: "var(--color-surface-elevated)",
  surfaceSunken: "var(--color-surface-sunken)",

  // Text
  foreground: "var(--color-fg)",
  foregroundMuted: "var(--color-fg-muted)",
  foregroundSubtle: "var(--color-fg-subtle)",
  foregroundOnAccent: "var(--color-fg-on-accent)",

  // Borders
  border: "var(--color-border)",
  borderSubtle: "var(--color-border-subtle)",
  borderStrong: "var(--color-border-strong)",

  // Brand
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  primaryActive: "var(--color-primary-active)",
  primarySoft: "var(--color-primary-soft)",

  // Functional
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
} as const;
