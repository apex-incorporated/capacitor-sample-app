import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { listProducts, CATEGORIES } from "@/lib/catalog";
import { track } from "@/lib/events";
import { listContainer, fadeUp, lightHaptic } from "@/brand/motion";

export function HomeScreen() {
  const featured = listProducts({ featured: true });
  const newArrivals = listProducts().slice(0, 6);

  useEffect(() => {
    void track("page_view", { screen: "home" });
  }, []);

  return (
    <>
      <Header large title="Apex Outfitters" subtitle="Built for the long expedition." />

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* ── Hero / lead featured product ─────────────────────────── */}
        {featured[0] && (
          <motion.div variants={fadeUp} className="px-5">
            <Link
              to={`/product/${featured[0].slug}`}
              onClick={() => void lightHaptic()}
              className="block overflow-hidden rounded-3xl bg-surface-sunken"
            >
              <div className="relative aspect-[16/10]">
                <ProductImage
                  src={featured[0].imageUrl}
                  alt={featured[0].name}
                  productName={featured[0].name}
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                    Featured · {featured[0].category}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    {featured[0].name}
                  </h2>
                  <p className="mt-1 line-clamp-2 max-w-prose text-sm text-white/85">
                    {featured[0].description}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── Featured collection rail ────────────────────────────── */}
        <motion.section variants={fadeUp} className="space-y-3">
          <div className="flex items-center justify-between px-5">
            <h3 className="text-base font-semibold tracking-tight text-fg">
              The essentials
            </h3>
            <Link
              to="/shop"
              onClick={() => void lightHaptic()}
              className="flex items-center gap-0.5 text-xs font-medium text-primary"
            >
              See all <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className="w-44 shrink-0"
              />
            ))}
          </div>
        </motion.section>

        {/* ── Category grid ───────────────────────────────────────── */}
        <motion.section variants={fadeUp} className="space-y-3">
          <h3 className="px-5 text-base font-semibold tracking-tight text-fg">
            Shop by category
          </h3>
          <div className="grid grid-cols-2 gap-3 px-5">
            {CATEGORIES.slice(0, 4).map((cat) => {
              const products = listProducts({ category: cat.key });
              const hero = products[0];
              return (
                <Link
                  key={cat.key}
                  to={`/shop?category=${cat.key}`}
                  onClick={() => void lightHaptic()}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-surface-sunken"
                >
                  {hero && (
                    <ProductImage
                      src={hero.imageUrl}
                      alt=""
                      productName={cat.label}
                      className="absolute inset-0 size-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-base font-semibold text-white">{cat.label}</p>
                    <p className="text-[10px] text-white/75">
                      {products.length} {products.length === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* ── New arrivals grid ───────────────────────────────────── */}
        <motion.section variants={fadeUp} className="space-y-3">
          <h3 className="px-5 text-base font-semibold tracking-tight text-fg">
            New arrivals
          </h3>
          <div className="grid grid-cols-2 gap-3 px-5">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}
