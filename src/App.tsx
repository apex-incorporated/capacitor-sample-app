import { useEffect, useState } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Layout } from "@/components/layout/Layout";
import { Splash } from "@/components/layout/Splash";
import { ToastProvider } from "@/components/ui/Toast";
import { HomeScreen } from "@/screens/HomeScreen";
import { ShopScreen } from "@/screens/ShopScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { ApexLiveScreen } from "@/screens/ApexLiveScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { ProductDetailScreen } from "@/screens/ProductDetailScreen";
import { CartScreen } from "@/screens/CartScreen";
import { CheckoutScreen } from "@/screens/CheckoutScreen";
import { SignInScreen } from "@/screens/SignInScreen";
import { SignUpScreen } from "@/screens/SignUpScreen";
import { SubscriptionScreen } from "@/screens/SubscriptionScreen";
import { track } from "@/lib/events";
import { initApex } from "@/apex";
import { useDeepLinkRouter } from "@/hooks/useDeepLinkRouter";

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Initialise the Apex plugin once on app boot. Project key + API
    // URL come from `apex-config.ts`; until the adopter configures a
    // key in Settings → Apex, init is skipped and events stay local.
    void initApex().then(() => {
      // Fire app_open immediately after init so the first session has
      // an entry point. session_start is auto-fired by the plugin.
      void track("app_open", { source: "cold_start" });
    });

    // iOS status bar — keep it readable on the light surfaces.
    StatusBar.setStyle({ style: Style.Default }).catch(() => undefined);

    // Foreground/background lifecycle events.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void track("app_open", { source: "foreground" });
      } else {
        void track("app_background");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useDeepLinkRouter();

  return (
    <ToastProvider>
      {!splashDone && <Splash onComplete={() => setSplashDone(true)} />}
      <Routes>
        <Route element={<ShellRoute />}>
          <Route index element={<HomeScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/product/:slug" element={<ProductDetailScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/account" element={<AccountScreen />} />
          <Route path="/apex-live" element={<ApexLiveScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/sign-in" element={<SignInScreen />} />
          <Route path="/sign-up" element={<SignUpScreen />} />
          <Route path="/subscription" element={<SubscriptionScreen />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

/**
 * Wraps router-driven page renders in the app shell (tab bar +
 * safe-area-aware content). React Router's `<Outlet>` plugs into the
 * `<Layout>` children slot.
 */
function ShellRoute() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
