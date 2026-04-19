import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// The web build is what Capacitor bundles into the iOS/Android native shell.
// Output goes to `dist/`, which `capacitor.config.ts` points to via `webDir`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    // When running `npm run dev` on a laptop and sideloading the Capacitor
    // build to a device, the device hits your laptop on port 5173. Host 0.0.0.0
    // exposes the dev server on every interface.
    host: true,
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
