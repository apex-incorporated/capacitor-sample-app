import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { HomeScreen } from "@/screens/HomeScreen";
import { ProductsScreen } from "@/screens/ProductsScreen";
import { ProductDetailScreen } from "@/screens/ProductDetailScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { initApex } from "@/apex";
import { useDeepLinkRouter } from "@/hooks/useDeepLinkRouter";

export default function App() {
  // Single place where the plugin is initialised. Once this resolves,
  // every screen can call into `Apex.*` safely.
  useEffect(() => {
    void initApex();
  }, []);

  // Deep links (Universal Links on iOS, App Links on Android) are the
  // reason most mobile SDKs exist — we route them through React Router
  // so the sample feels like a "real" app.
  useDeepLinkRouter();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeScreen />} />
        <Route path="/products" element={<ProductsScreen />} />
        <Route path="/products/:id" element={<ProductDetailScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
    </Routes>
  );
}
