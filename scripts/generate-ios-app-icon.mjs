#!/usr/bin/env node
/**
 * Renders the canonical Apex chevron mark to a 1024×1024 PNG in the
 * iOS Asset Catalog. Required because iOS app icons live in
 * `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — a separate
 * pipeline from the web bundle. The web bundle gets the SVG via
 * src/brand/assets/app-icon.svg; this script handles the OS-side
 * home-screen icon.
 *
 * iOS app icons cannot have alpha at the corners (Apple rejects
 * submissions with transparency), and iOS applies its own corner
 * mask, so this script emits a fully-opaque square version of the
 * canonical logo (no rounded corners on the source rect).
 *
 * Usage:
 *   node scripts/generate-ios-app-icon.mjs
 *
 * Re-run whenever app/public/brand/logo.svg changes.
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const targetPath = join(
  __dirname,
  "..",
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "AppIcon.appiconset",
  "AppIcon-512@2x.png",
);

// Inline the canonical logo path. We can't read app/public/brand/logo.svg
// directly because it has rx=64 (rounded corners) which would render a
// transparency band that Apple App Review rejects. iOS auto-applies
// the corner mask at display time.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0A0F14"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#009E5F"/>
      <stop offset="50%" stop-color="#4EC983"/>
      <stop offset="100%" stop-color="#009E5F"/>
    </linearGradient>
  </defs>
  <path d="M256 96 L408 400 L352 400 L256 208 L160 400 L104 400 Z" fill="url(#g)"/>
</svg>`;

const info = await sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .flatten({ background: "#0A0F14" })
  .png()
  .toFile(targetPath);

console.log(`✔ Wrote ${targetPath}`);
console.log(`  ${info.width}×${info.height} · ${info.size} bytes`);
console.log("\nRebuild in Xcode (Product → Clean Build Folder, then Run) to see the new icon.");

// Silence unused-import warning under strict tooling.
void repoRoot;
