/**
 * Apex Outfitters — type ramp.
 *
 * Default font is Inter (loaded via Google Fonts in index.html) with
 * SF Pro as a system fallback so iOS builds get the native feel
 * automatically. Monospace is JetBrains Mono for the Apex Live event
 * panel + token previews.
 */

export const typography = {
  family: {
    sans: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },

  // Tailwind text-* scale. Maps 1:1 to the brand-design-system skill.
  size: {
    xs: ["12px", "16px"],
    sm: ["14px", "20px"],
    base: ["16px", "24px"],
    lg: ["18px", "28px"],
    xl: ["20px", "28px"],
    "2xl": ["24px", "32px"],
    "3xl": ["30px", "36px"],
    "4xl": ["36px", "40px"],
    "5xl": ["48px", "48px"],
    "6xl": ["60px", "60px"],
  },

  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Tracking — tight for headings, normal for body, loose for caps
  // metadata. Per brand-design-system: editorial-style tracking only
  // for type larger than 24px.
  tracking: {
    tighter: "-0.02em",
    tight: "-0.01em",
    normal: "0em",
    wide: "0.02em",
    wider: "0.05em",
  },
} as const;
