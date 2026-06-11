import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { fadeUp, listContainer, lightHaptic } from "@/brand/motion";
import {
  useCart,
  updateQuantity,
  removeFromCart,
  getCartSubtotal,
  getCartItemCount,
} from "@/lib/cart-store";
import { getProduct } from "@/lib/catalog";
import { track } from "@/lib/events";
import { ProductImage } from "@/components/product/ProductImage";

export function CartScreen() {
  const navigate = useNavigate();
  const cart = useCart();
  const subtotal = getCartSubtotal(cart.items);
  const itemCount = getCartItemCount(cart.items);

  useEffect(() => {
    void track("cart_view", {
      itemCount,
      subtotalUsd: subtotal,
    });
    // Journey Exit Semantics — cart_snapshot anchor. Fires the
    // canonical snapshot every time the cart screen mounts so the
    // server-side rollup writer has a known-good reconciliation
    // point. This heals any drift caused by missed add/remove
    // deltas (offline, app crash mid-event, race conditions).
    void track("cart_snapshot", {
      lines: cart.items.map((item) => {
        const product = getProduct(item.productId);
        return {
          sku: item.productId,
          qty: item.quantity,
          priceCents: product
            ? Math.round(product.priceUsd * 100)
            : undefined,
          currency: "USD",
          name: product?.name,
          stableLineId: `${item.productId}:${item.size ?? ""}:${item.color ?? ""}`,
        };
      }),
      currency: "USD",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToCheckout = () => {
    void track("checkout_started", {
      itemCount,
      subtotalUsd: subtotal,
      totalUsd: total,
    });
    navigate("/checkout");
  };
  const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 8 : 0;
  const tax = Math.round(subtotal * 0.0875 * 100) / 100;
  const total = subtotal + shipping + tax;

  if (cart.items.length === 0) {
    return (
      <>
        <Header showBack title="Your cart" />
        <div className="px-5 pt-4">
          <Card variant="subtle">
            <CardBody className="space-y-3 py-10 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-fg-subtle">
                <ShoppingBag className="size-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-fg">
                  Cart's empty
                </h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Tap something on the shop and it'll land here.
                </p>
              </div>
              <Button onClick={() => navigate("/shop")} className="mx-auto">
                Browse shop
              </Button>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showBack title="Your cart" subtitle={`${itemCount} ${itemCount === 1 ? "item" : "items"}`} />

      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3 px-5 pb-40">
        {cart.items.map((item) => {
          const product = getProduct(item.productId);
          if (!product) return null;
          return (
            <motion.div key={`${item.productId}-${item.size}-${item.color}`} variants={fadeUp}>
              <Card>
                <div className="flex gap-3 p-3">
                  <Link to={`/product/${product.slug}`} className="shrink-0">
                    <div className="size-20 overflow-hidden rounded-xl bg-surface-sunken">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        productName={product.name}
                        className="size-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/product/${product.slug}`} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{product.name}</p>
                        <p className="mt-0.5 text-[11px] text-fg-muted">
                          {[item.color, item.size].filter(Boolean).join(" · ") || product.brand}
                        </p>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.productId, item.size, item.color);
                          void track("remove_from_cart", {
                            // 2026-05-16 — canonical Apex spec
                            // field names (snake_case). Same fix
                            // as product_view + add_to_cart in
                            // ProductDetailScreen.tsx — the
                            // canonicalizer quarantines events
                            // that lack `product_id` so this
                            // wasn't reaching audience or funnel
                            // dashboards.
                            product_id: item.productId,
                            quantity: item.quantity,
                            size: item.size,
                            color: item.color,
                          });
                          void lightHaptic();
                        }}
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-sunken hover:text-danger"
                        aria-label="Remove"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center rounded-lg border border-border bg-surface">
                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.productId, item.size, item.color, item.quantity - 1);
                            void lightHaptic();
                          }}
                          className="flex size-8 items-center justify-center text-fg-muted hover:text-fg"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.productId, item.size, item.color, item.quantity + 1);
                            void lightHaptic();
                          }}
                          className="flex size-8 items-center justify-center text-fg-muted hover:text-fg"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-fg">
                        ${(product.priceUsd * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* ── Totals ─────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card variant="subtle">
            <CardBody className="space-y-1.5 py-5">
              <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`} />
              <Row label="Tax" value={`$${tax.toFixed(2)}`} />
              <div className="border-t border-border-subtle pt-2 mt-1">
                <Row label="Total" value={`$${total.toFixed(2)}`} bold />
              </div>
              {subtotal > 0 && subtotal < 100 && (
                <p className="pt-1 text-[11px] text-fg-muted">
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping.
                </p>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Sticky checkout CTA ────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      >
        <div className="mx-auto max-w-md px-5 py-3">
          <Button
            fullWidth
            size="lg"
            iconRight={<ChevronRight className="size-4" />}
            onClick={goToCheckout}
          >
            Checkout · ${total.toFixed(2)}
          </Button>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "text-sm font-semibold text-fg" : "text-xs text-fg-muted"}>
        {label}
      </span>
      <span className={bold ? "text-base font-semibold text-fg tabular-nums" : "text-sm text-fg tabular-nums"}>
        {value}
      </span>
    </div>
  );
}
