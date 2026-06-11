import { type ReactNode } from "react";
import { TabBar } from "./TabBar";
import { TapDebugHUD } from "./TapDebugHUD";

interface LayoutProps {
  children: ReactNode;
}

/**
 * App-level layout.
 *
 * Locks the viewport with `fixed inset-0` so iOS WebView rubber-band
 * scroll can't pull the TabBar around. The `<main>` is the actual
 * scroll container — content overflows there, not on the body. Safe
 * areas are handled in two places: `<main>` gets the top inset so
 * page headers clear the dynamic island; the TabBar handles its own
 * bottom inset for the home indicator.
 *
 * Tab-bar clearance (`pb-20`) leaves room above the bar for content;
 * individual screens that need a sticky bottom-CTA add their own
 * `pb-32`-ish padding because their CTA sits above the TabBar.
 *
 * IMPORTANT: do NOT add a route-level `motion.main key={pathname}`
 * with `variants={fadeUp}` here, even though it looks pretty in the
 * browser. The original implementation did exactly that — every tab
 * tap re-mounted the whole screen tree AND ran a 200ms opacity+y
 * tween on the wrapper. iOS WKWebView defers / drops touch events
 * while it's doing that layout+paint pass, so subsequent tab taps
 * felt like they didn't register and the user had to tap 2-3 times.
 * The `ios-touch.mdc` rule documents this pattern explicitly:
 * "AnimatePresence on a route-level wrapper can cause animation
 * jank when navigating. Apply animations to inner content, not to
 * the outer page wrapper." Individual screens are free to animate
 * THEIR content; the layout wrapper stays static.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background text-fg">
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-20"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          // Note: `-webkit-overflow-scrolling: touch` is deprecated since
          // iOS 13 and conflicts with WKWebView's gesture system on iOS
          // 17+ — leaving it unset uses the modern, native CSS overflow
          // behavior. `overscroll-contain` keeps rubber-band scroll from
          // bubbling up to the (now disabled) outer WKWebView scroll.
        }}
      >
        {children}
      </main>
      {/*
       * Status-bar cover. Capacitor's iOS WebView extends behind the
       * status bar (the `viewport-fit=cover` viewport meta + iOS's
       * default behavior). The `<main>` above gets a top padding of
       * `env(safe-area-inset-top)` so the FIRST view of any screen
       * sits below the status bar, but as soon as the user scrolls,
       * content scrolls UP past that padding and visually shows
       * through behind the time / battery / signal indicators.
       *
       * `setOverlaysWebView({ overlay: false })` in @capacitor/status-bar
       * is documented as a no-op on iOS, so the only fix is a fixed
       * opaque overlay sized to the safe-area-inset-top. Same color as
       * the app background so it's invisible until something tries to
       * scroll behind it.
       */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-background"
        style={{ height: "env(safe-area-inset-top)" }}
      />
      <TabBar />
      <TapDebugHUD />
    </div>
  );
}
