import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { CATEGORIES, listProducts, type ProductCategory } from "@/lib/catalog";
import { track } from "@/lib/events";
import { cn } from "@/components/ui/utils";
import { listContainer, fadeUp, lightHaptic } from "@/brand/motion";

type Filter = "all" | ProductCategory;

export function ShopScreen() {
  const [params, setParams] = useSearchParams();
  const initial = (params.get("category") as Filter) ?? "all";
  const [filter, setFilter] = useState<Filter>(initial);

  const products = useMemo(() => {
    if (filter === "all") return listProducts();
    return listProducts({ category: filter });
  }, [filter]);

  useEffect(() => {
    void track("page_view", { screen: "shop", category: filter });
  }, [filter]);

  const setActive = (next: Filter) => {
    void lightHaptic();
    setFilter(next);
    if (next === "all") {
      params.delete("category");
    } else {
      params.set("category", next);
    }
    setParams(params, { replace: true });
  };

  return (
    <>
      <Header large title="Shop" subtitle={`${products.length} pieces`} />

      {/* ── Filter chips ─────────────────────────────────────────── */}
      <div className="overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {(
            [
              { key: "all" as Filter, label: "All" },
              ...CATEGORIES.map((c) => ({ key: c.key as Filter, label: c.label })),
            ] as const
          ).map((chip) => {
            const isActive = filter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setActive(chip.key)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-on-accent"
                    : "border-border bg-surface text-fg-muted hover:text-fg",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 px-5"
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={fadeUp}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
