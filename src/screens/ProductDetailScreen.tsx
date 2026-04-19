import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PRODUCTS } from "./ProductsScreen";
import { Apex, logError, logEvent } from "@/apex";

/**
 * Product detail — doubles as the deep-link destination for
 * `/products/:id`. If you tap an Apex Link configured to land here,
 * `useDeepLinkRouter` calls `navigate("/products/mug")` and this
 * screen renders.
 *
 * On mount we fire `content_view`; the Buy button fires
 * `in_app_purchase` with the typed `purchase` payload the plugin
 * expects (see `ApexEvent.purchase` in `@apex-inc/capacitor-plugin`).
 */
export function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const product = PRODUCTS.find((p) => p.id === id);
  const [purchased, setPurchased] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!product) return;
    void Apex.track({
      type: "content_view",
      data: { productId: product.id, productTitle: product.title },
    }).then(() => logEvent("content_view", { productId: product.id }));
  }, [product]);

  if (!product) {
    return (
      <div className="apex-card">
        <div className="text-sm">Product not found.</div>
        <Link
          to="/products"
          className="mt-2 block text-[12px] text-apex-muted underline"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const handleBuy = async () => {
    setBusy(true);
    try {
      await Apex.track({
        type: "in_app_purchase",
        purchase: {
          productId: product.id,
          amount: product.price,
          currency: "USD",
          transactionId: `sample_${Date.now()}`,
        },
      });
      logEvent("in_app_purchase", {
        productId: product.id,
        amount: product.price,
      });

      // SKAN 4.0 conversion-value update — no-op on Android, useful on
      // iOS to signal "this user is likely a paying customer." Coarse
      // value lets Apple bucket the install without revealing the
      // exact dollar amount.
      await Apex.updateConversionValue({ fineValue: 10, coarseValue: "high" }).catch(
        (err) => logError("updateConversionValue failed (Android no-op)", { error: String(err) }),
      );

      setPurchased(true);
    } catch (err) {
      logError("Buy failed", { error: String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section>
        <Link to="/products" className="text-[11px] text-apex-muted">
          ← Back
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {product.title}
        </h1>
        <p className="text-sm text-apex-muted">{product.blurb}</p>
        <div className="mt-2 font-mono text-lg font-semibold">
          ${product.price}
        </div>
      </section>

      <section className="apex-card space-y-2">
        {!purchased ? (
          <button
            className="apex-btn-primary w-full"
            disabled={busy}
            onClick={handleBuy}
          >
            {busy ? "Processing…" : `Buy for $${product.price}`}
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-emerald-600">
              Thanks! Purchase recorded.
            </div>
            <div className="text-[11px] text-apex-muted">
              We just fired <code>in_app_purchase</code> + updated the
              SKAN conversion value. Check the Event Log on Home to
              confirm.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
