import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
import { fadeUp, lightHaptic } from "@/brand/motion";
import { ProductImage } from "./ProductImage";
import type { Product } from "@/lib/catalog";

interface ProductCardProps {
  product: Product;
  /** Make the card larger for hero/featured layouts. */
  size?: "default" | "large";
  className?: string;
}

export function ProductCard({ product, size = "default", className }: ProductCardProps) {
  const isLarge = size === "large";
  return (
    <motion.div variants={fadeUp} className={cn("w-full", className)}>
      <Link
        to={`/product/${product.slug}`}
        onClick={() => void lightHaptic()}
        className="group block"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-surface-sunken",
            isLarge ? "aspect-[4/5]" : "aspect-square",
          )}
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            productName={product.name}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-active:scale-[0.98]"
          />
          {product.badge && (
            <div className="absolute left-3 top-3">
              <Badge variant={product.badge.tone}>{product.badge.label}</Badge>
            </div>
          )}
          {product.compareAtUsd && !product.badge && (
            <div className="absolute left-3 top-3">
              <Badge variant="warning">Sale</Badge>
            </div>
          )}
        </div>
        <div className={cn("pt-2.5", isLarge ? "px-1" : "px-0.5")}>
          <p className={cn("font-semibold tracking-tight text-fg", isLarge ? "text-base" : "text-sm")}>
            {product.name}
          </p>
          <p className="mt-0.5 text-[11px] text-fg-muted">{product.brand}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={cn("font-medium text-fg", isLarge ? "text-sm" : "text-xs")}>
              ${product.priceUsd.toFixed(0)}
            </span>
            {product.compareAtUsd && (
              <span className="text-[11px] text-fg-subtle line-through">
                ${product.compareAtUsd.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
