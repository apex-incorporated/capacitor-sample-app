import { Link } from "react-router-dom";

/**
 * A trivial product catalog used to demonstrate:
 *
 *   - Routing to a detail screen (`/products/:id`) which doubles as
 *     the deep-link destination in `useDeepLinkRouter`
 *   - Firing `content_view` + `add_to_cart` style events from app UI
 *
 * No backend — the products are hard-coded so you can see the full
 * flow without setting up an API.
 */
export const PRODUCTS = [
  {
    id: "tee",
    title: "Apex Tee",
    price: 25,
    blurb: "100% cotton. The sample-app sample product.",
  },
  {
    id: "mug",
    title: "Apex Mug",
    price: 15,
    blurb: "Ceramic mug. 11oz. Dishwasher safe.",
  },
  {
    id: "sticker-pack",
    title: "Sticker pack",
    price: 5,
    blurb: "Five vinyl stickers. Weatherproof.",
  },
] as const;

export function ProductsScreen() {
  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-2xl font-black tracking-tight">Products</h1>
        <p className="text-sm text-apex-muted">
          Tap a product to view it (and fire a <code>content_view</code>{" "}
          event). The detail page has a Buy button that emits a full
          revenue event.
        </p>
      </section>

      <ul className="space-y-2">
        {PRODUCTS.map((p) => (
          <li key={p.id}>
            <Link
              to={`/products/${p.id}`}
              className="apex-card flex items-center justify-between gap-3 transition-colors hover:bg-black/[0.02]"
            >
              <div>
                <div className="text-sm font-semibold">{p.title}</div>
                <div className="text-[11px] text-apex-muted">{p.blurb}</div>
              </div>
              <div className="font-mono text-sm font-semibold">${p.price}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
