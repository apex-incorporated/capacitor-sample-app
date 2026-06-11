/**
 * Apex Outfitters — motion language.
 *
 * Curves + durations are imported by every animated component so the
 * app has ONE motion personality. Built on the motion-design skill:
 * iOS-native ease-out for entrances, ease-in for exits, spring for
 * tactile interactions.
 */

import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import type { Transition } from "framer-motion";

// ─── Easing ──────────────────────────────────────────────────────────

export const easing = {
  // Standard ease-out for entrances. iOS-native feel.
  out: [0.2, 0.8, 0.2, 1] as const,
  // Quick ease-in for exits — content slides away briskly.
  in: [0.4, 0, 1, 1] as const,
  // Symmetric for state changes.
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

// ─── Durations (seconds) ─────────────────────────────────────────────

export const duration = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
  slower: 0.45,
  presence: 0.6, // splash + onboarding-style hero reveals
} as const;

// ─── Springs — for buttons, sheets, swipe gestures ───────────────────

export const spring = {
  // Snappy spring for taps + button presses.
  snap: { type: "spring", stiffness: 600, damping: 30 } satisfies Transition,
  // Gentle spring for sheet presentations + tab transitions.
  gentle: { type: "spring", stiffness: 280, damping: 28 } satisfies Transition,
  // Heavy spring for big sheets + modals.
  weighty: { type: "spring", stiffness: 180, damping: 26 } satisfies Transition,
} as const;

// ─── Stock variants — pair with Framer Motion's `variants` prop ──────

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.out } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: easing.out } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: duration.base, ease: easing.out } },
};

/** Staggered list entrance — apply on the container with `staggerChildren`. */
export const listContainer = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

// ─── Haptics — every meaningful tap should feel intentional ──────────

/**
 * Light haptic — pair with mid-importance interactions (selecting a
 * filter, switching a tab, ticking a checkbox). Silent on web.
 */
export async function lightHaptic(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // No-op on web / unsupported platforms
  }
}

/**
 * Medium haptic — primary actions (add to cart, send test push,
 * confirm purchase). The "yes, that happened" feedback.
 */
export async function mediumHaptic(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // No-op
  }
}

/**
 * Success haptic — order confirmation, push delivered, conversion
 * recorded. Three-pulse iOS pattern.
 */
export async function successHaptic(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // No-op
  }
}

/**
 * Error haptic — validation failure, send failed, network down.
 */
export async function errorHaptic(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // No-op
  }
}
