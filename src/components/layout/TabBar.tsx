import { startTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, User, Radio, ShoppingCart } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { lightHaptic } from "@/brand/motion";
import { useCart, getCartItemCount } from "@/lib/cart-store";
import { tapDebug } from "./TapDebugHUD";

// One event handler — `onClick`. Earlier iterations stacked
// `onTouchStart` + `onPointerDown` + `onPointerUp` + `onClick` all on
// the same button (with `preventDefault()` on pointerdown for iOS
// "fast-click" semantics). The rest of the app uses the shared
// `Button` component which has only `onClick` and works flawlessly
// on iOS — and the user reported the TabBar specifically was the
// only flaky surface in the app. Matching the working pattern is
// the right move; the multi-handler stack we had was generating
// extra bookkeeping per touch that no other surface does.

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/shop", label: "Shop", icon: ShoppingBag, end: false },
  { to: "/cart", label: "Cart", icon: ShoppingCart, end: false, kind: "cart" as const },
  { to: "/account", label: "Account", icon: User, end: false },
  { to: "/apex-live", label: "Live", icon: Radio, end: false },
] as const;

function isTabActive(pathname: string, to: string, end: boolean): boolean {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

/**
 * iOS-style bottom tab bar. Fully opaque (no backdrop-blur) so the
 * content scrolling underneath never bleeds through. Safe-area
 * inset is applied below the icons so the home-indicator clearance
 * doesn't eat into the tap area.
 *
 * Tap reliability — match the rest of the app. Earlier iterations
 * stacked `onTouchStart` + `onPointerDown` + `onPointerUp` +
 * `onClick` per tab button, with `e.preventDefault()` on
 * pointerdown to suppress the synthetic-click chain — a
 * "fast-click" pattern intended to skip iOS's click delay. But the
 * user reported that the rest of the app's buttons (which use the
 * shared `Button` component with just `onClick`) worked perfectly
 * while ONLY the TabBar dropped taps. Lesson: iOS WKWebView's
 * touch-delivery is reliable when you use it the same way the
 * rest of the app does. Plain `<button onClick={…}>` it is.
 *
 * Other things that helped get here, in case future regressions:
 *   - capacitor.config.ts: `ios.scrollEnabled: false`
 *   - AppDelegate.swift: disable WebView's outer-scrollView gesture
 *     recognizers + call `webView.becomeFirstResponder()` (Cap 7
 *     fix #7753 backported)
 *   - Container is a `<div role="tablist">`, NOT a `<nav>` with
 *     `touch-action: none` (which iOS WebKit treats as "this
 *     entire region is non-interactive" for hit-testing).
 *   - No framer-motion in this file. CSS handles the active
 *     indicator opacity and the active-press scale.
 *   - `goTo()` wraps `navigate()` in `startTransition` so the new
 *     screen's render doesn't synchronously block the JS thread.
 */
export function TabBar() {
  const cart = useCart();
  const cartCount = getCartItemCount(cart.items);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goTo = (to: string) => {
    void lightHaptic();
    if (pathname === to) return;
    tapDebug.log("navigate", to, "click");
    // startTransition marks the route change as a non-urgent update.
    // React 18 will yield to higher-priority work (next touch, etc.)
    // while rendering the new screen, so the next tap can land on
    // the JS thread before the new screen's mount work finishes.
    startTransition(() => {
      navigate(to);
    });
  };

  return (
    // Plain `<div role="tablist">` — was previously a `<nav>` with
    // `touch-action: none`, but iOS WKWebView's hit-tester treats
    // `touch-action: none` on a parent as "this whole region is
    // non-interactive" instead of just "no default touch gestures
    // here." Symptom: the rest of the app worked perfectly while
    // ONLY the tab bar dropped taps intermittently. Removed the
    // `touch-action: none` and dropped the `<ul><li>` wrapper too
    // (the buttons are already keyboard-accessible via tablist
    // role + aria attributes; the list semantics added DOM depth
    // for iOS to walk during hit-testing without buying us
    // anything).
    <div
      role="tablist"
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-md grid-cols-5 border-t border-border bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const isActive = isTabActive(pathname, tab.to, tab.end);
        return (
            <button
              key={tab.to}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              onClick={() => goTo(tab.to)}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className={cn(
                // `w-full h-full` so each button fills its grid cell.
                // Without this, the button collapses to the width of
                // its widest child (~50px for "Apex Live" at text-xs)
                // and the icons line up too tightly together.
                // `min-h-[64px]` matches Apple's HIG ~49pt tab-bar
                // content height with a little breathing room.
                "relative flex h-full w-full min-h-[64px] flex-col items-center justify-center gap-1 bg-transparent select-none outline-none",
                // Color transition only — no transform. The previous
                // `active:scale-[0.92]` was visually clipping the
                // label text on iOS during tap, which read as "the
                // text disappears." iOS native tab bars don't scale
                // either; they just dim opacity.
                "transition-colors duration-100 ease-out",
                "active:opacity-60 focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive ? "text-primary" : "text-fg-muted",
              )}
            >
              {/*
               * Active indicator — plain <span> with CSS opacity
               * transition. Was previously a `motion.span` with
               * `layoutId="tab-active-indicator"` for the
               * shared-element slide between buttons, but that
               * animation runs an RAF callback on the JS thread
               * every frame for ~300ms after each tap, which
               * blocks subsequent touch handlers on iOS WKWebView.
               * The cross-fade reads similarly without claiming
               * the JS thread.
               */}
              <span
                aria-hidden
                className={cn(
                  // Indicator stays pointer-events-none — it's purely
                  // decorative and we don't want the absolutely-
                  // positioned thin line to capture taps.
                  "pointer-events-none absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-full bg-primary",
                  "transition-opacity duration-150 ease-out",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              {/*
               * Icon slot — fixed 20×20 box where the svg is positioned
               * absolutely (`inset-0`) so its Y is purely CSS, never a
               * function of the badge's flex behavior. (See history:
               * the cart icon kept drifting a few pixels up vs its
               * peers when this was a flex container; pulling the svg
               * out of flow entirely killed the drift.)
               *
               * Cart badge — CSS-only scale animation via Tailwind's
               * scale + transition. Was previously an AnimatePresence
               * + motion.span with a spring transition; the spring
               * runs RAF callbacks on the JS thread every frame
               * during mount/unmount.
               */}
              {/*
               * Icon + label spans WITHOUT pointer-events-none. On
               * iOS WKWebView, `pointer-events: none` on a child of
               * a button creates a "hole" in the touch hit-test
               * rather than letting the tap bubble to the parent —
               * symptom: tapping the text label doesn't navigate.
               * Letting events fire on the spans is fine because
               * the click bubbles to the button's onClick handler,
               * and we don't have any per-span handlers to confuse.
               */}
              <span className="relative block size-6">
                <tab.icon className="absolute inset-0 size-6" strokeWidth={isActive ? 2.25 : 2} />
                {"kind" in tab && tab.kind === "cart" && cartCount > 0 && (
                  <span
                    className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-on-accent"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-[11px] font-medium leading-tight">
                {tab.label}
              </span>
            </button>
        );
      })}
    </div>
  );
}
