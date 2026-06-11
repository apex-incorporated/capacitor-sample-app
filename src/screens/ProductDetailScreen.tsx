import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/utils";
import { getProduct, listProducts } from "@/lib/catalog";
import { addToCart, useCart, getCartItemCount } from "@/lib/cart-store";
import { track } from "@/lib/events";
import { useReferral } from "@/lib/referral";
import { Users } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { fadeUp, listContainer, mediumHaptic, successHaptic } from "@/brand/motion";

export function ProductDetailScreen() {
  const { slug } = useParams();
  const product = slug ? getProduct(slug) : undefined;
  const cart = useCart();
  const referral = useReferral();
  const toast = useToast();

  const isReferredProduct =
    referral && product && referral.destinationProductId === product.slug;

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | undefined>(product?.sizes?.[0]);
  const [color, setColor] = useState<string | undefined>(product?.colors?.[0]);

  const gallery = useMemo(
    () => product?.galleryUrls ?? (product ? [product.imageUrl] : []),
    [product],
  );

  useEffect(() => {
    if (!product) return;
    void track("product_view", {
      // 2026-05-16 — canonical Apex spec field names (snake_case).
      // The canonicalizer quarantines events that lack `product_id` /
      // `value` / `currency` in the canonical shape, which silently
      // breaks downstream journey triggers + commerce metrics. See
      // app/src/lib/core/apex-spec/events.ts for the authoritative
      // field list. Extra fields (productSlug, productName) ride
      // through unchanged for the in-app event log.
      product_id: product.id,
      value: product.priceUsd,
      currency: "USD",
      category: product.category,
      productSlug: product.slug,
      productName: product.name,
    });
  }, [product]);

  if (!product) {
    return (
      <>
        <Header title="Not found" showBack />
        <div className="px-5">
          <Card variant="subtle">
            <CardBody className="py-6 text-center">
              <p className="text-sm text-fg-muted">
                That product doesn&apos;t exist in this catalog.
              </p>
              <Link
                to="/shop"
                className="mt-3 inline-block text-xs font-medium text-primary"
              >
                Back to shop
              </Link>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  const handleAddToCart = () => {
    addToCart({ productId: product.id, quantity: 1, size, color });
    void track("add_to_cart", {
      // 2026-05-16 — canonical Apex spec field names. `product_id` is
      // required for the add_to_cart canonical event; sending
      // `productId` quarantines the event and prevents the cart
      // journey trigger from firing the push notification. Same
      // rationale as product_view above.
      product_id: product.id,
      value: product.priceUsd,
      currency: "USD",
      quantity: 1,
      productName: product.name,
      size,
      color,
    });
    void successHaptic();
    toast.success(
      `${product.name} added`,
      `Cart total: ${getCartItemCount(cart.items) + 1} ${
        getCartItemCount(cart.items) + 1 === 1 ? "item" : "items"
      }`,
    );
  };

  const handleWishlist = () => {
    void mediumHaptic();
    // 2026-05-16 — canonical event name is `add_to_wishlist`
    // (apex-spec/events.ts). `wishlist_add` would be treated as a
    // custom event and miss the audience + commerce dashboards.
    void track("add_to_wishlist", {
      product_id: product.id,
      value: product.priceUsd,
      currency: "USD",
      productName: product.name,
    });
    toast.info("Added to wishlist");
  };

  const related = listProducts({ category: product.category })
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <Header showBack />

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-32"
      >
        {/* ── Image gallery ───────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="space-y-2">
          <div className="aspect-square w-full overflow-hidden bg-surface-sunken">
            <ProductImage
              src={gallery[activeImage]}
              alt={product.name}
              productName={product.name}
              loading="eager"
              className="size-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                    i === activeImage ? "border-primary" : "border-transparent",
                  )}
                >
                  <ProductImage
                    src={url}
                    alt=""
                    productName={product.name}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Partner referral banner (AO-P5) ─────────────────────── */}
        {isReferredProduct && (
          <motion.div variants={fadeUp} className="px-5">
            <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-accent">
                <Users className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary">
                  Referred by {referral.affiliateName}
                </p>
                <p className="mt-0.5 text-[11px] text-fg-muted">
                  Their commission accrues on your purchase. See the chain on Apex Live.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Title, price, description ───────────────────────────── */}
        <motion.div variants={fadeUp} className="space-y-3 px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              {product.brand} · {product.category}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
              {product.name}
            </h1>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-semibold text-fg">
                ${product.priceUsd.toFixed(0)}
              </span>
              {product.compareAtUsd && (
                <span className="text-sm text-fg-subtle line-through">
                  ${product.compareAtUsd.toFixed(0)}
                </span>
              )}
              {product.badge && <Badge variant={product.badge.tone}>{product.badge.label}</Badge>}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-fg-muted">{product.description}</p>
        </motion.div>

        {/* ── Color picker ────────────────────────────────────────── */}
        {product.colors && (
          <motion.div variants={fadeUp} className="space-y-2 px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              Color · <span className="text-fg">{color}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    void mediumHaptic();
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    color === c
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-surface text-fg hover:border-border-strong",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Size picker ─────────────────────────────────────────── */}
        {product.sizes && (
          <motion.div variants={fadeUp} className="space-y-2 px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              Size · <span className="text-fg">{size}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    void mediumHaptic();
                  }}
                  className={cn(
                    "min-w-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    size === s
                      ? "border-primary bg-primary text-on-accent"
                      : "border-border bg-surface text-fg hover:border-border-strong",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Details / materials ─────────────────────────────────── */}
        {product.details && (
          <motion.div variants={fadeUp} className="space-y-2 px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              The details
            </p>
            <ul className="space-y-1.5">
              {product.details.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-fg-muted">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ── You might also like ─────────────────────────────────── */}
        {related.length > 0 && (
          <motion.section variants={fadeUp} className="space-y-3 pt-2">
            <h3 className="px-5 text-base font-semibold tracking-tight text-fg">
              You might also like
            </h3>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {related.map((p) => (
                <div key={p.id} className="w-40 shrink-0">
                  <Link
                    to={`/product/${p.slug}`}
                    className="block aspect-square overflow-hidden rounded-2xl bg-surface-sunken"
                  >
                    <ProductImage
                      src={p.imageUrl}
                      alt={p.name}
                      productName={p.name}
                      className="size-full object-cover"
                    />
                  </Link>
                  <p className="mt-2 text-sm font-medium text-fg">{p.name}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">${p.priceUsd.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </motion.div>

      {/* ── Sticky bottom CTA ──────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      >
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-3">
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-fg hover:bg-surface-sunken"
            aria-label="Add to wishlist"
            onClick={handleWishlist}
          >
            <Heart className="size-5" />
          </button>
          <Button
            fullWidth
            size="lg"
            iconLeft={<ShoppingBag className="size-4" />}
            onClick={handleAddToCart}
          >
            Add to cart · ${product.priceUsd.toFixed(0)}
          </Button>
        </div>
      </div>
    </>
  );
}
