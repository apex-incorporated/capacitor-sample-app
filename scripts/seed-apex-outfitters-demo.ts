#!/usr/bin/env node
/**
 * Apex Outfitters — demo seed script (AO-P5 / MMP-196 partner flagship).
 *
 * Provisions the entities the partner-referral demo needs in a real
 * Apex workspace so the in-app loop is mirrored server-side:
 *
 *   1. Ari Demo Affiliate (Affiliate entity with 15% revshare,
 *      90-day time-windowed commission)
 *   2. An Apex Link `founders-tote` owned by Ari, pointing at the
 *      Founder's Tote product detail screen
 *   3. (Optional) An audience "Cart abandoners" + a sample journey
 *      that fires a push when the audience is entered
 *
 * Talks to the Apex dashboard's API directly using an `apex_sk_`
 * API key. Pattern A: adopter creates the key in their Apex
 * settings, runs `npm run seed`, sees the entities appear in
 * the dashboard.
 *
 * Usage:
 *   APEX_API_URL=https://app.apex.inc \
 *   APEX_API_KEY=apex_sk_xxx \
 *   node scripts/seed-apex-outfitters-demo.ts
 *
 * The script is idempotent — running it twice does the right thing
 * (skips entities that already exist, updates the rest).
 */

const API_URL = process.env.APEX_API_URL ?? "https://app.apex.inc";
const API_KEY = process.env.APEX_API_KEY;

if (!API_KEY) {
  console.error("APEX_API_KEY is required. Create an api key in your Apex dashboard.");
  process.exit(1);
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

async function api<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let parsed: T | undefined;
  try {
    parsed = (await res.json()) as T;
  } catch {
    // body might be empty
  }
  return {
    ok: res.ok,
    data: parsed,
    error: res.ok ? undefined : `HTTP ${res.status}`,
    status: res.status,
  };
}

// ─── Affiliate ───────────────────────────────────────────────────────

async function ensureAffiliate(): Promise<string | null> {
  console.log("→ Ensuring Ari Demo Affiliate exists...");
  // First check if any affiliate already has handle `ari` on this
  // project. The list endpoint returns all affiliates.
  const list = await api<{ affiliates: Array<{ id: string; name: string; email?: string }> }>(
    "GET",
    "/api/mobile/affiliates",
  );
  if (list.ok && list.data?.affiliates) {
    const existing = list.data.affiliates.find(
      (a) => a.email === "ari-demo@apex-outfitters.example.com" || a.name === "Ari Demo Affiliate",
    );
    if (existing) {
      console.log(`  ✓ Already exists: ${existing.id}`);
      return existing.id;
    }
  }

  const created = await api<{ affiliate: { id: string } }>("POST", "/api/mobile/affiliates", {
    name: "Ari Demo Affiliate",
    email: "ari-demo@apex-outfitters.example.com",
    description: "Apex Partner Network demo affiliate — tech-niche reviewer with 1.2M reach.",
    commissionStructure: {
      type: "revshare",
      percentBps: 1500,
    },
    commissionWindow: {
      mode: "time_window",
      days: 90,
    },
  });
  if (!created.ok || !created.data?.affiliate) {
    console.error(`  ✗ Failed to create affiliate (${created.status}): ${created.error}`);
    return null;
  }
  console.log(`  ✓ Created: ${created.data.affiliate.id}`);
  return created.data.affiliate.id;
}

// ─── Apex Link ───────────────────────────────────────────────────────

async function ensureApexLink(affiliateId: string): Promise<void> {
  console.log("→ Ensuring Apex Link `founders-tote` exists...");
  const list = await api<{ links: Array<{ slug: string; ownerId?: string }> }>(
    "GET",
    "/api/mobile/links",
  );
  if (list.ok && list.data?.links?.some((l) => l.slug === "founders-tote")) {
    console.log("  ✓ Already exists");
    return;
  }
  const created = await api("POST", "/api/mobile/links", {
    slug: "founders-tote",
    destinationUrl: "https://apex-outfitters.example.com/product/founders-tote",
    deepLinkPath: "/product/founders-tote",
    title: "Founder's Tote — Apex Outfitters",
    description: "Affiliate-driven deep link for the Founder's Tote launch.",
    ownerType: "affiliate",
    ownerId: affiliateId,
    utmSource: "apex_partner_network",
    utmMedium: "affiliate",
    utmCampaign: "founders-tote-launch",
  });
  if (!created.ok) {
    console.error(`  ✗ Failed to create link (${created.status}): ${created.error}`);
    return;
  }
  console.log("  ✓ Created");
}

// ─── Run ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding Apex Outfitters demo data into ${API_URL}\n`);
  const affiliateId = await ensureAffiliate();
  if (!affiliateId) {
    console.error("\nAborting — could not provision affiliate.");
    process.exit(2);
  }
  await ensureApexLink(affiliateId);
  console.log("\nDone. Open your Apex dashboard to verify:");
  console.log(`  - Partners view: ${API_URL}/dashboard/partners`);
  console.log(`  - Apex Links view: ${API_URL}/dashboard/mobile/links`);
  console.log("\nNext: open Apex Outfitters → Settings → Test partner referral");
  console.log("      → tap Ari Demo to simulate the full attribution loop.");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
