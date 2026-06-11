/**
 * Apex Outfitters — product catalog.
 *
 * Fictional products that live entirely in the app — no backend
 * dependency. Imagery comes from Unsplash (CC0, no auth required).
 * The shape mirrors what a real e-commerce SKU record looks like so
 * the events the app fires (product_view, add_to_cart, purchase) have
 * the field-richness Apex expects.
 */

export type ProductCategory = "outerwear" | "tops" | "accessories" | "footwear" | "homegoods";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  priceUsd: number;
  /** Optional struck-through "compare at" price for sale messaging. */
  compareAtUsd?: number;
  description: string;
  imageUrl: string;
  /** Optional gallery (full image URLs). The product detail screen renders these. */
  galleryUrls?: string[];
  sizes?: string[];
  colors?: string[];
  /** Materials, care, sustainability — short lines for the detail panel. */
  details?: string[];
  /** Feature flag on the home screen "featured" rail. */
  featured?: boolean;
  /** Calls out the product on category cards. */
  badge?: { label: string; tone: "primary" | "warning" | "danger" };
}

// `auto=format` causes Unsplash to serve AVIF on iOS, which WebKit
// struggles with (`makeImagePlus AVIF err=-39` errors in the console).
// Forcing `fm=jpg` is a 10x perf win on image-heavy screens.
const UNSPLASH = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&fm=jpg&fit=crop`;

export const CATALOG: Product[] = [
  {
    id: "ao_founders_tote",
    slug: "founders-tote",
    name: "Founder's Tote",
    brand: "Apex Outfitters",
    category: "accessories",
    priceUsd: 89.0,
    description:
      "The everyday carry. Heavyweight canvas, riveted handles, magnetic interior pocket. Engineered for the daily commute and the occasional founder retreat.",
    imageUrl: UNSPLASH("photo-1547949003-9792a18a2601"),
    galleryUrls: [
      UNSPLASH("photo-1547949003-9792a18a2601"),
      UNSPLASH("photo-1591561954557-26941169b49e"),
    ],
    colors: ["Slate", "Forest", "Canvas"],
    details: [
      "18oz organic cotton canvas",
      "Vegetable-tanned leather handles",
      "Magnetic interior pocket",
      "Handmade in Portugal",
    ],
    featured: true,
    badge: { label: "Bestseller", tone: "primary" },
  },
  {
    id: "ao_journeyman_jacket",
    slug: "journeyman-jacket",
    name: "Journeyman Jacket",
    brand: "Apex Outfitters",
    category: "outerwear",
    priceUsd: 248.0,
    description:
      "A workhorse field coat that gets better with wear. Waxed cotton shell, brass hardware, reinforced shoulder yoke.",
    imageUrl: UNSPLASH("photo-1551028719-00167b16eac5"),
    galleryUrls: [
      UNSPLASH("photo-1551028719-00167b16eac5"),
      UNSPLASH("photo-1543076447-215ad9ba6923"),
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Olive", "Slate", "Sable"],
    details: ["Waxed organic cotton", "Brass YKK hardware", "Made in California"],
    featured: true,
  },
  {
    id: "ao_atlas_tee",
    slug: "atlas-tee",
    name: "Atlas Tee",
    brand: "Apex Outfitters",
    category: "tops",
    priceUsd: 42.0,
    description:
      "A perfect-weight tee in supima cotton. Boxy fit, garment-dyed for that lived-in feel from day one.",
    imageUrl: UNSPLASH("photo-1521572163474-6864f9cf17ab"),
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Bone", "Slate", "Forest"],
    featured: true,
  },
  {
    id: "ao_signal_henley",
    slug: "signal-henley",
    name: "Signal Henley",
    brand: "Apex Outfitters",
    category: "tops",
    priceUsd: 78.0,
    description:
      "Heavyweight slub jersey, three-button placket, raglan sleeves. The henley for cool mornings.",
    imageUrl: UNSPLASH("photo-1620799140408-edc6dcb6d633"),
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Bone", "Charcoal"],
  },
  {
    id: "ao_field_runner",
    slug: "field-runner",
    name: "Field Runner",
    brand: "Apex Outfitters",
    category: "footwear",
    priceUsd: 165.0,
    compareAtUsd: 195.0,
    description:
      "Trail-inspired silhouette with a city-ready last. Suede + ripstop upper, recycled rubber outsole.",
    imageUrl: UNSPLASH("photo-1542291026-7eec264c27ff"),
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: ["Sand", "Slate"],
    badge: { label: "$30 off", tone: "warning" },
  },
  {
    id: "ao_wayfinder_mug",
    slug: "wayfinder-mug",
    name: "Wayfinder Mug",
    brand: "Apex Outfitters",
    category: "homegoods",
    priceUsd: 28.0,
    description:
      "Hand-thrown stoneware. Holds 12oz of whatever gets you started.",
    imageUrl: UNSPLASH("photo-1514228742587-6b1558fcca3d"),
    colors: ["Bone", "Forest"],
  },
  {
    id: "ao_summit_cap",
    slug: "summit-cap",
    name: "Summit Cap",
    brand: "Apex Outfitters",
    category: "accessories",
    priceUsd: 38.0,
    description:
      "Six-panel cap with a soft crown and curved brim. The everyday lid.",
    imageUrl: UNSPLASH("photo-1588850561407-ed78c282e89b"),
    colors: ["Forest", "Slate", "Sand"],
  },
  {
    id: "ao_chambray_overshirt",
    slug: "chambray-overshirt",
    name: "Chambray Overshirt",
    brand: "Apex Outfitters",
    category: "tops",
    priceUsd: 118.0,
    description:
      "A lightweight, indigo-dyed overshirt that earns its place in every season.",
    imageUrl: UNSPLASH("photo-1602810318383-e386cc2a3ccf"),
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Indigo"],
  },
  {
    id: "ao_courier_pack",
    slug: "courier-pack",
    name: "Courier Pack",
    brand: "Apex Outfitters",
    category: "accessories",
    priceUsd: 158.0,
    description:
      "Roll-top backpack engineered for the daily commute. 22L, padded laptop sleeve, weatherproof.",
    imageUrl: UNSPLASH("photo-1622560480605-d83c853bc5c3"),
    colors: ["Slate", "Sand"],
  },
  {
    id: "ao_alpine_socks",
    slug: "alpine-socks",
    name: "Alpine Socks",
    brand: "Apex Outfitters",
    category: "accessories",
    priceUsd: 18.0,
    description:
      "Merino blend, terry-loop sole, ribbed cuff. Two pairs per pack.",
    imageUrl: UNSPLASH("photo-1586350977771-b8c9f4e4f3b8"),
    sizes: ["S", "M", "L"],
    colors: ["Slate", "Sand"],
  },
  {
    id: "ao_terrain_chinos",
    slug: "terrain-chinos",
    name: "Terrain Chinos",
    brand: "Apex Outfitters",
    category: "tops",
    priceUsd: 128.0,
    description:
      "Stretch-twill chinos cut for moving — gusseted crotch, articulated knees, hidden side pocket.",
    imageUrl: UNSPLASH("photo-1624378439575-d8705ad7ae80"),
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Olive", "Stone", "Slate"],
  },
  {
    id: "ao_signal_beanie",
    slug: "signal-beanie",
    name: "Signal Beanie",
    brand: "Apex Outfitters",
    category: "accessories",
    priceUsd: 32.0,
    description:
      "Cuffed merino beanie with a low-profile woven tab. Warm without bulk.",
    imageUrl: UNSPLASH("photo-1576871337632-b9aef4c17ab9"),
    colors: ["Forest", "Charcoal", "Sand"],
  },
];

export function getProduct(slugOrId: string): Product | undefined {
  return CATALOG.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export function listProducts(filter?: { category?: ProductCategory; featured?: boolean }): Product[] {
  return CATALOG.filter((p) => {
    if (filter?.category && p.category !== filter.category) return false;
    if (filter?.featured && !p.featured) return false;
    return true;
  });
}

export const CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: "outerwear", label: "Outerwear" },
  { key: "tops", label: "Tops" },
  { key: "accessories", label: "Accessories" },
  { key: "footwear", label: "Footwear" },
  { key: "homegoods", label: "Home goods" },
];
